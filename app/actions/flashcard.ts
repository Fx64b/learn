'use server'

import * as dbUtils from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { deleteImages, imagesOf } from '@/lib/blob'
import { parseImport, parseItemRow, toItemRow } from '@/lib/items'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'

type Failure = { success: false; error: string }

/** Authenticates, rate limits and checks that the deck belongs to the user. */
async function authorizeDeck(
    deckId: string,
    limit: 'cardMutation' | 'bulkCreate'
): Promise<{ userId: string } | Failure> {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck.cards')
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return { success: false, error: authT('notAuthenticated') }
    }
    const rate = await checkRateLimit(`user:${session.user.id}:${limit}`, limit)
    if (!rate.success) {
        return {
            success: false,
            error:
                limit === 'bulkCreate'
                    ? authT('bulkRatelimitExceeded')
                    : authT('ratelimitExceeded'),
        }
    }
    const deck =
        typeof deckId === 'string' &&
        (await dbUtils.getDeckById(deckId, session.user.id))
    if (!deck) return { success: false, error: t('unauthorized') }
    return { userId: session.user.id }
}

/** Loads an item and checks that its deck belongs to the user. */
async function authorizeItem(id: string) {
    const t = await getTranslations('deck.cards')
    const item = typeof id === 'string' && (await dbUtils.getFlashcardById(id))
    if (!item) return { success: false as const, error: t('notFound') }
    const auth = await authorizeDeck(item.deckId, 'cardMutation')
    if (!('userId' in auth)) return auth
    return { item }
}

function revalidateDeck(deckId: string) {
    revalidatePath(`/deck/${deckId}`)
    revalidatePath(`/deck/${deckId}/edit`)
}

/** Creates one item of any type (see lib/items/schema.ts). */
export async function createItem(data: { deckId: string; item: unknown }) {
    const t = await getTranslations('deck.cards')
    try {
        const auth = await authorizeDeck(data.deckId, 'cardMutation')
        if (!('userId' in auth)) return auth

        const row = toItemRow(data.item)
        if (!row.success) return { success: false, error: row.error }

        const [id] = await dbUtils.createItems(data.deckId, [row.data])
        revalidateDeck(data.deckId)
        return { success: true, id }
    } catch (error) {
        console.error('Error creating item:', error)
        return { success: false, error: t('createError') }
    }
}

/**
 * Creates items from a JSON import (array of items or classic
 * `{ front, back }` cards). Invalid entries are skipped and reported.
 */
export async function createItemsFromJson(data: {
    deckId: string
    json: string
}) {
    const t = await getTranslations('deck.cards')
    try {
        const auth = await authorizeDeck(data.deckId, 'bulkCreate')
        if (!('userId' in auth)) return auth

        const parsed = parseImport(data.json)
        if ('error' in parsed) {
            return { success: false, error: t(parsed.error) }
        }
        const ids = await dbUtils.createItems(data.deckId, parsed.rows)
        revalidateDeck(data.deckId)
        return {
            success: true,
            created: ids.length,
            errors: parsed.errors,
            types: parsed.rows.map((r) => r.type),
        }
    } catch (error) {
        console.error('Error importing items:', error)
        return { success: false, error: t('bulkCreateError') }
    }
}

export async function getFlashcardsByDeckId(deckId: string) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return []
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:data-retrieval`,
            'dataRetrieval'
        )

        if (!rateLimitResult.success) {
            return []
        }

        return await dbUtils.getFlashcardsByDeckId(deckId, session.user.id)
    } catch (error) {
        console.error('Error loading flashcards:', error)
        return []
    }
}

export async function updateItem(data: { id: string; item: unknown }) {
    const t = await getTranslations('deck.cards')
    try {
        const auth = await authorizeItem(data.id)
        if (!('item' in auth)) return auth

        const row = toItemRow(data.item)
        if (!row.success) return { success: false, error: row.error }

        await dbUtils.updateItem(data.id, row.data)

        // Remove images that the new version no longer uses.
        const before = imagesOf(parseItemRow(auth.item))
        const after = new Set(
            imagesOf(parseItemRow({ ...auth.item, ...row.data, id: data.id }))
        )
        await deleteImages(before.filter((url) => !after.has(url)))

        revalidateDeck(auth.item.deckId)
        return { success: true }
    } catch (error) {
        console.error('Error updating item:', error)
        return { success: false, error: t('updateError') }
    }
}

export async function deleteFlashcard(id: string) {
    const t = await getTranslations('deck.cards')
    try {
        const auth = await authorizeItem(id)
        if (!('item' in auth)) return auth

        await dbUtils.deleteItem(id)
        await deleteImages(imagesOf(parseItemRow(auth.item)))

        revalidateDeck(auth.item.deckId)
        return { success: true }
    } catch (error) {
        console.error('Error deleting card:', error)
        return { success: false, error: t('deleteError') }
    }
}
