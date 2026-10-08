import type { ItemRowValues } from '@/lib/items'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { db } from './index'
import {
    cardReviews,
    deckRecords,
    decks,
    flashcards,
    reviewEvents,
    studySessions,
    subscriptions,
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

/** Prompts of a deck's items, newest first. The caller checks ownership. */
export async function getDeckItemFronts(deckId: string): Promise<string[]> {
    const rows = await db
        .select({ front: flashcards.front })
        .from(flashcards)
        .where(eq(flashcards.deckId, deckId))
        .orderBy(desc(flashcards.createdAt))
    return rows.map((row) => row.front)
}

export async function getFlashcardById(id: string) {
    const results = await db
        .select()
        .from(flashcards)
        .where(eq(flashcards.id, id))
    return results[0]
}

export async function createItems(deckId: string, rows: ItemRowValues[]) {
    if (!rows.length) return []
    const now = new Date()
    const values = rows.map((row) => ({
        id: nanoid(),
        deckId,
        type: row.type,
        front: row.front,
        back: row.back,
        content: row.content,
        isExamRelevant: true,
        difficultyLevel: 0,
        createdAt: now,
    }))
    await db.insert(flashcards).values(values)
    return values.map((v) => v.id)
}

export async function updateItem(id: string, row: ItemRowValues) {
    await db
        .update(flashcards)
        .set({
            type: row.type,
            front: row.front,
            back: row.back,
            content: row.content,
        })
        .where(eq(flashcards.id, id))
}

/** Deletes an item together with its review state and history. */
export async function deleteItem(id: string) {
    await db.transaction(async (tx) => {
        await tx.delete(reviewEvents).where(eq(reviewEvents.flashcardId, id))
        await tx.delete(cardReviews).where(eq(cardReviews.flashcardId, id))
        await tx.delete(flashcards).where(eq(flashcards.id, id))
    })
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

            await tx.delete(deckRecords).where(eq(deckRecords.deckId, deckId))

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

export async function getUserSubscription(userId: string) {
    if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID provided')
    }

    try {
        const subscription = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .limit(1)

        return subscription[0] || null
    } catch (error) {
        console.error('Error fetching user subscription from db utils:', error)
        throw error
    }
}
