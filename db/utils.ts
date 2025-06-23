import { calculateNextReview } from '@/lib/srs'
import { and, desc, eq, gte, inArray, isNull, or, sql } from 'drizzle-orm'
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
    title: string
    description?: string
    category: string
    activeUntil?: Date | null
    userId: string
}) {
    const id = nanoid()
    await db.insert(decks).values({
        id,
        title: data.title,
        description: data.description,
        category: data.category,
        activeUntil: data.activeUntil,
        userId: data.userId,
        createdAt: new Date(),
    })
    return id
}

export async function updateDeck(data: {
    id: string
    title: string
    description?: string
    category: string
    activeUntil?: Date | null
}) {
    await db
        .update(decks)
        .set({
            title: data.title,
            description: data.description,
            category: data.category,
            activeUntil: data.activeUntil,
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
    front: string
    back: string
    isExamRelevant?: boolean
}) {
    const id = nanoid()
    await db.insert(flashcards).values({
        id,
        deckId: data.deckId,
        front: data.front,
        back: data.back,
        isExamRelevant: data.isExamRelevant || false,
        difficultyLevel: 0,
        createdAt: new Date(),
    })
    return id
}

export async function getDueCards(userId: string) {
    const now = new Date()

    const cardsWithLatestReview = await db
        .select({
            flashcard: flashcards,
            review: cardReviews,
            deckTitle: decks.title,
            reviewedAt: cardReviews.reviewedAt,
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
                or(isNull(decks.activeUntil), gte(decks.activeUntil, now))
            )
        )
        .orderBy(desc(cardReviews.reviewedAt))

    const latestReviewsByCard = new Map<
        string,
        (typeof cardsWithLatestReview)[0]
    >()

    for (const record of cardsWithLatestReview) {
        const cardId = record.flashcard.id
        if (!latestReviewsByCard.has(cardId)) {
            latestReviewsByCard.set(cardId, record)
        }
    }

    const dueCards = Array.from(latestReviewsByCard.values()).filter(
        (record) => {
            // New cards (never reviewed)
            if (!record.review || !record.review.id) {
                return true
            }

            return record.review.nextReview && record.review.nextReview <= now
        }
    )

    const sortedDueCards = dueCards.map((record) => {
        const isNew = !record.review || !record.review.id
        let daysOverdue = 0

        if (record.review && record.review.nextReview) {
            const overdueDays = Math.floor(
                (now.getTime() - record.review.nextReview.getTime()) /
                    (1000 * 60 * 60 * 24)
            )
            daysOverdue = Math.max(0, overdueDays)
        }

        return {
            flashcard: record.flashcard,
            review: record.review,
            deckTitle: record.deckTitle,
            isNew,
            daysOverdue,
            metadata: {
                isNew,
                daysOverdue,
                priorityScore:
                    daysOverdue > 7
                        ? 3 // Severely overdue
                        : daysOverdue > 0
                          ? 2 // Overdue
                          : isNew
                            ? 1 // New cards
                            : 0, // Just due
            },
        }
    })

    // Sort by priority
    sortedDueCards.sort((a, b) => {
        // First by priority score (higher first)
        if (a.metadata.priorityScore !== b.metadata.priorityScore) {
            return b.metadata.priorityScore - a.metadata.priorityScore
        }

        // Then by days overdue (more overdue first)
        if (a.daysOverdue !== b.daysOverdue) {
            return b.daysOverdue - a.daysOverdue
        }

        // Then by deck title
        if (a.deckTitle !== b.deckTitle) {
            return a.deckTitle.localeCompare(b.deckTitle)
        }

        // Finally by creation date (newer first)
        return b.flashcard.createdAt.getTime() - a.flashcard.createdAt.getTime()
    })

    return sortedDueCards
}

export async function reviewCard(data: {
    flashcardId: string
    userId: string
    rating: number
}) {
    if (data.rating < 1 || data.rating > 4) {
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
        .orderBy(desc(cardReviews.reviewedAt))
        .limit(1)

    const previousReview = previousReviews[0]

    // In case of data inconsistencies, apply fallback logic
    let prevInterval = 0
    let prevEaseFactor = 2.5 // Default ease factor

    if (previousReview) {
        prevInterval = Math.max(0, previousReview.interval || 0)

        // Ensure ease factor is within reasonable bounds (1.3-4.0)
        if (previousReview.easeFactor) {
            const storedEaseFactor = previousReview.easeFactor / 100
            prevEaseFactor = Math.min(4.0, Math.max(1.3, storedEaseFactor))
        }
    }

    const { nextInterval, newEaseFactor } = calculateNextReview(
        data.rating as 1 | 2 | 3 | 4,
        prevInterval,
        prevEaseFactor
    )

    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval)

    const now = new Date()
    let resultId

    const reviewData = {
        reviewedAt: now,
        rating: data.rating,
        easeFactor: Math.round(newEaseFactor * 100),
        interval: nextInterval,
        nextReview: nextReviewDate,
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
                reviewedAt: now,
                rating: data.rating,
                easeFactor: Math.round(newEaseFactor * 100),
                interval: nextInterval,
            })

            await tx
                .update(flashcards)
                .set({
                    difficultyLevel: Math.floor(5 - newEaseFactor),
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
    front: string
    back: string
    isExamRelevant: boolean
}) {
    await db
        .update(flashcards)
        .set({
            front: data.front,
            back: data.back,
            isExamRelevant: data.isExamRelevant,
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
                or(
                    isNull(decks.activeUntil),
                    sql`${decks.activeUntil} IS NULL OR datetime(${decks.activeUntil} / 1000, 'unixepoch') >= date('now')`
                )
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
                or(
                    isNull(decks.activeUntil),
                    sql`${decks.activeUntil} IS NULL OR datetime(${decks.activeUntil} / 1000, 'unixepoch') >= date('now')`
                )
            )
        )
        .orderBy(desc(cardReviews.reviewedAt))

    return cards
        .filter((card) => {
            if (!card.review) return false
            return card.review.easeFactor < 250
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
                    .delete(reviewEvents)
                    .where(
                        and(
                            eq(reviewEvents.userId, userId),
                            inArray(reviewEvents.flashcardId, flashcardIds)
                        )
                    )

                await tx
                    .delete(cardReviews)
                    .where(
                        and(
                            eq(cardReviews.userId, userId),
                            inArray(cardReviews.flashcardId, flashcardIds)
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
