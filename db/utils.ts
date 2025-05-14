import { calculateNextReview } from '@/lib/srs'
import { and, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { db } from './index'
import {
    cardReviews,
    decks,
    flashcards,
    reviewEvents,
    studySessions,
} from './schema'

export async function getAllDecks(userId: string) {
    return await db.select().from(decks).where(eq(decks.userId, userId))
}

export async function getDeckById(id: string, userId?: string) {
    const conditions = [eq(decks.id, id)]

    if (userId) {
        conditions.push(eq(decks.userId, userId))
    }

    const results = await db
        .select()
        .from(decks)
        .where(and(...conditions))

    return results[0]
}

export async function createDeck(data: {
    titel: string
    beschreibung?: string
    kategorie: string
    aktivBis?: Date | null
    userId: string
}) {
    const id = nanoid()
    await db.insert(decks).values({
        id,
        titel: data.titel,
        beschreibung: data.beschreibung,
        kategorie: data.kategorie,
        aktivBis: data.aktivBis,
        userId: data.userId,
        erstelltAm: new Date(),
    })
    return id
}

export async function updateDeck(data: {
    id: string
    titel: string
    beschreibung?: string
    kategorie: string
    aktivBis?: Date | null
}) {
    await db
        .update(decks)
        .set({
            titel: data.titel,
            beschreibung: data.beschreibung,
            kategorie: data.kategorie,
            aktivBis: data.aktivBis,
        })
        .where(eq(decks.id, data.id))
}

export async function getFlashcardsByDeckId(deckId: string, userId?: string) {
    if (userId) {
        const deck = await getDeckById(deckId, userId)
        if (!deck) {
            throw new Error('Deck not found or unauthorized')
        }
    }

    return await db
        .select()
        .from(flashcards)
        .where(eq(flashcards.deckId, deckId))
}

export async function getFlashcardById(id: string) {
    const results = await db
        .select()
        .from(flashcards)
        .where(eq(flashcards.id, id))
    return results[0]
}

export async function createFlashcard(data: {
    deckId: string
    vorderseite: string
    rueckseite: string
    istPruefungsrelevant?: boolean
}) {
    const id = nanoid()
    await db.insert(flashcards).values({
        id,
        deckId: data.deckId,
        vorderseite: data.vorderseite,
        rueckseite: data.rueckseite,
        istPruefungsrelevant: data.istPruefungsrelevant || false,
        schwierigkeitsgrad: 0,
        erstelltAm: new Date(),
    })
    return id
}

export async function getDueCards(userId: string) {
    const now = new Date()

    const latestReviews = db
        .select({
            flashcardId: cardReviews.flashcardId,
            reviewId: cardReviews.id,
            latestReviewDate: sql<Date>`MAX(${cardReviews.bewertetAm})`.as(
                'latestReviewDate'
            ),
        })
        .from(cardReviews)
        .where(eq(cardReviews.userId, userId))
        .groupBy(cardReviews.flashcardId)
        .as('latestReviews')

    const cardsWithReviews = await db
        .select({
            flashcard: flashcards,
            review: cardReviews,
            deckTitel: decks.titel,
            isNew: sql<boolean>`CASE WHEN ${cardReviews.id} IS NULL THEN TRUE ELSE FALSE END`.as(
                'isNew'
            ),
            daysOverdue: sql<number>`CASE 
                WHEN ${cardReviews.naechsteWiederholung} IS NULL THEN 0
                ELSE CAST((julianday(datetime('now')) - julianday(datetime(${cardReviews.naechsteWiederholung} / 1000, 'unixepoch'))) AS INTEGER)
                END`.as('daysOverdue'),
        })
        .from(flashcards)
        .innerJoin(decks, eq(flashcards.deckId, decks.id))
        .leftJoin(latestReviews, eq(flashcards.id, latestReviews.flashcardId))
        .leftJoin(
            cardReviews,
            and(
                eq(cardReviews.id, latestReviews.reviewId),
                eq(cardReviews.userId, userId)
            )
        )
        .where(
            and(
                eq(decks.userId, userId),
                or(
                    isNull(cardReviews.id),
                    lte(cardReviews.naechsteWiederholung, now)
                ),
                or(isNull(decks.aktivBis), gte(decks.aktivBis, now))
            )
        )
        // Order by priority: overdue first (most overdue at top), then new cards, then by deck title
        .orderBy(
            desc(sql`daysOverdue`),
            desc(sql`isNew`),
            decks.titel,
            desc(flashcards.erstelltAm)
        )

    return cardsWithReviews.map((card) => ({
        ...card,
        metadata: {
            isNew: card.isNew,
            daysOverdue: card.daysOverdue,
            priorityScore:
                card.daysOverdue > 7
                    ? 3 // Severely overdue
                    : card.daysOverdue > 0
                      ? 2 // Overdue
                      : card.isNew
                        ? 1
                        : 0, // New cards have priority over just-due cards
        },
    }))
}

export async function reviewCard(data: {
    flashcardId: string
    userId: string
    bewertung: number
}) {
    if (data.bewertung < 1 || data.bewertung > 4) {
        throw new Error('Invalid rating: must be between 1 and 4')
    }

    const previousReviews = await db
        .select()
        .from(cardReviews)
        .where(
            and(
                eq(cardReviews.flashcardId, data.flashcardId),
                eq(cardReviews.userId, data.userId)
            )
        )
        .orderBy(desc(cardReviews.bewertetAm))
        .limit(1)

    const previousReview = previousReviews[0]

    // In case of data inconsistencies, apply fallback logic
    let prevInterval = 0
    let prevEaseFaktor = 2.5 // Default ease factor

    if (previousReview) {
        prevInterval = Math.max(0, previousReview.intervall || 0)

        // Ensure ease factor is within reasonable bounds (1.3-4.0)
        if (previousReview.easeFaktor) {
            const storedEaseFactor = previousReview.easeFaktor / 100
            prevEaseFaktor = Math.min(4.0, Math.max(1.3, storedEaseFactor))
        }
    }

    const { nextInterval, newEaseFactor } = calculateNextReview(
        data.bewertung as 1 | 2 | 3 | 4,
        prevInterval,
        prevEaseFaktor
    )

    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval)

    const now = new Date()
    let resultId

    const reviewData = {
        bewertetAm: now,
        bewertung: data.bewertung,
        easeFaktor: Math.round(newEaseFactor * 100),
        intervall: nextInterval,
        naechsteWiederholung: nextReviewDate,
    }

    try {
        await db.transaction(async (tx) => {
            // Update the card's current review state
            if (previousReview && previousReview.id) {
                await tx
                    .update(cardReviews)
                    .set(reviewData)
                    .where(eq(cardReviews.id, previousReview.id))

                resultId = previousReview.id
            } else {
                const id = nanoid()
                await tx.insert(cardReviews).values({
                    id,
                    flashcardId: data.flashcardId,
                    userId: data.userId,
                    ...reviewData,
                })

                resultId = id
            }

            // Always create a new review event for statistical purposes
            // This is not an optimal approach, but it ensures we have a record of every review
            const eventId = nanoid()
            await tx.insert(reviewEvents).values({
                id: eventId,
                flashcardId: data.flashcardId,
                userId: data.userId,
                bewertetAm: now,
                bewertung: data.bewertung,
                easeFaktor: Math.round(newEaseFactor * 100),
                intervall: nextInterval,
            })

            await tx
                .update(flashcards)
                .set({
                    schwierigkeitsgrad: Math.floor(5 - newEaseFactor),
                })
                .where(eq(flashcards.id, data.flashcardId))
        })

        return {
            id: resultId,
            nextReviewDate,
            nextInterval,
            easeFactor: newEaseFactor,
        }
    } catch (error) {
        console.error('Error updating review:', error)
        throw new Error('Failed to update card review')
    }
}

export async function updateFlashcard(data: {
    id: string
    vorderseite: string
    rueckseite: string
    istPruefungsrelevant: boolean
}) {
    await db
        .update(flashcards)
        .set({
            vorderseite: data.vorderseite,
            rueckseite: data.rueckseite,
            istPruefungsrelevant: data.istPruefungsrelevant,
        })
        .where(eq(flashcards.id, data.id))
}

export async function deleteFlashcard(id: string) {
    await db.delete(flashcards).where(eq(flashcards.id, id))
}

export async function getAllFlashcards(userId: string) {
    const now = new Date()

    return await db
        .select()
        .from(flashcards)
        .innerJoin(decks, eq(flashcards.deckId, decks.id))
        .where(
            and(
                eq(decks.userId, userId),
                or(isNull(decks.aktivBis), gte(decks.aktivBis, now))
            )
        )
}

export async function getDifficultCards(userId: string) {
    const now = new Date()

    const cards = await db
        .select({
            flashcard: flashcards,
            review: cardReviews,
        })
        .from(flashcards)
        .innerJoin(decks, eq(flashcards.deckId, decks.id))
        .leftJoin(
            cardReviews,
            and(
                eq(flashcards.id, cardReviews.flashcardId),
                eq(cardReviews.userId, userId)
            )
        )
        .where(
            and(
                eq(decks.userId, userId),
                or(isNull(decks.aktivBis), gte(decks.aktivBis, now))
            )
        )
        .orderBy(desc(cardReviews.bewertetAm))

    return cards
        .filter((card) => {
            if (!card.review) return false
            return card.review.easeFaktor < 250
        })
        .map((card) => card.flashcard)
}

export async function resetDeckProgress(userId: string, deckId: string) {
    await db.delete(cardReviews).where(
        and(
            eq(cardReviews.userId, userId),
            sql`${cardReviews.flashcardId} IN (
                    SELECT ${flashcards.id} FROM ${flashcards} 
                    WHERE ${flashcards.deckId} = ${deckId}
                )`
        )
    )
}

export async function deleteDeck(userId: string, deckId: string) {
    try {
        await db.transaction(async (tx) => {
            const deckFlashcards = await tx
                .select({ id: flashcards.id })
                .from(flashcards)
                .where(eq(flashcards.deckId, deckId))

            const flashcardIds = deckFlashcards.map((card) => card.id)

            if (flashcardIds.length > 0) {
                await tx
                    .delete(cardReviews)
                    .where(
                        and(
                            eq(cardReviews.userId, userId),
                            sql`${cardReviews.flashcardId} IN (${sql.join(flashcardIds)})`
                        )
                    )

                await tx
                    .delete(reviewEvents)
                    .where(
                        and(
                            eq(reviewEvents.userId, userId),
                            sql`${reviewEvents.flashcardId} IN (${sql.join(flashcardIds)})`
                        )
                    )
            }

            await tx
                .delete(studySessions)
                .where(
                    and(
                        eq(studySessions.deckId, deckId),
                        eq(studySessions.userId, userId)
                    )
                )

            await tx.delete(flashcards).where(eq(flashcards.deckId, deckId))

            await tx
                .delete(decks)
                .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
        })

        return { success: true }
    } catch (error) {
        console.error('Error deleting deck and related data:', error)
        throw new Error('Failed to delete deck and related content')
    }
}
