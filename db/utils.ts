import { calculateNextReview } from '@/lib/srs'
import { and, eq, isNull, lte, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { db } from './index'
import { cardReviews, decks, flashcards } from './schema'

// Deck-Funktionen
export async function getAllDecks() {
    return await db.select().from(decks)
}

export async function getDeckById(id: string) {
    const results = await db.select().from(decks).where(eq(decks.id, id))
    return results[0]
}

export async function createDeck(data: {
    titel: string
    beschreibung?: string
    kategorie: string
    userId: string
}) {
    const id = nanoid()
    await db.insert(decks).values({
        id,
        titel: data.titel,
        beschreibung: data.beschreibung,
        kategorie: data.kategorie,
        userId: data.userId,
        erstelltAm: new Date(),
    })
    return id
}

// Flashcard-Funktionen
export async function getFlashcardsByDeckId(deckId: string) {
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
    rückseite: string
    istPrüfungsrelevant?: boolean
}) {
    const id = nanoid()
    await db.insert(flashcards).values({
        id,
        deckId: data.deckId,
        vorderseite: data.vorderseite,
        rückseite: data.rückseite,
        istPrüfungsrelevant: data.istPrüfungsrelevant || false,
        schwierigkeitsgrad: 0,
        erstelltAm: new Date(),
    })
    return id
}

// Review-Funktionen
export async function getDueCards(userId: string) {
    const now = new Date()

    // Hier holen wir uns:
    // 1. Alle Karten, die für eine Wiederholung fällig sind
    // 2. Alle Karten, die noch nie wiederholt wurden

    const dueCards = await db
        .select({
            flashcard: flashcards,
            review: cardReviews,
        })
        .from(flashcards)
        .leftJoin(
            cardReviews,
            and(
                eq(flashcards.id, cardReviews.flashcardId),
                eq(cardReviews.userId, userId)
            )
        )
        .where(
            or(
                isNull(cardReviews.nächsteWiederholung),
                lte(cardReviews.nächsteWiederholung, now)
            )
        )

    return dueCards
}

export async function reviewCard(data: {
    flashcardId: string
    userId: string
    bewertung: number // 1-4
}) {
    // Vorherige Wiederholung finden (falls vorhanden)
    const previousReviews = await db
        .select()
        .from(cardReviews)
        .where(
            and(
                eq(cardReviews.flashcardId, data.flashcardId),
                eq(cardReviews.userId, data.userId)
            )
        )
        .orderBy(cardReviews.bewertetAm, 'desc')
        .limit(1)

    const previousReview = previousReviews[0]

    // SRS-Berechnung
    const prevInterval = previousReview?.intervall || 0
    const prevEaseFaktor = previousReview?.easeFaktor || 250

    const { nextInterval, newEaseFactor } = calculateNextReview(
        data.bewertung as 1 | 2 | 3 | 4,
        prevInterval,
        prevEaseFaktor / 100 // Skalieren zu Dezimalzahl
    )

    // Nächstes Wiederholungsdatum berechnen
    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval)

    // Neue Wiederholung speichern
    const id = nanoid()
    await db.insert(cardReviews).values({
        id,
        flashcardId: data.flashcardId,
        userId: data.userId,
        bewertetAm: new Date(),
        bewertung: data.bewertung,
        easeFaktor: Math.round(newEaseFactor * 100), // Skaliert zu Integer
        intervall: nextInterval,
        nächsteWiederholung: nextReviewDate,
    })

    return {
        id,
        nextReviewDate,
        nextInterval,
    }
}

export async function updateFlashcard(data: {
    id: string
    vorderseite: string
    rückseite: string
    istPrüfungsrelevant: boolean
}) {
    await db
        .update(flashcards)
        .set({
            vorderseite: data.vorderseite,
            rückseite: data.rückseite,
            istPrüfungsrelevant: data.istPrüfungsrelevant,
        })
        .where(eq(flashcards.id, data.id))
}

export async function deleteFlashcard(id: string) {
    await db.delete(flashcards).where(eq(flashcards.id, id))
}
