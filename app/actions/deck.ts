'use server'

import * as dbUtils from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { DeckType } from '@/types'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'

export async function createDeck(formData: FormData) {
    const t = await getTranslations('deck.create')
    const authT = await getTranslations('auth')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:deck-create`,
            'deckMutation'
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: authT('ratelimitExceeded'),
            }
        }

        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const category = formData.get('category') as string
        const activeUntilStr = formData.get('activeUntil') as string | null

        const activeUntil = activeUntilStr ? new Date(activeUntilStr) : null

        const id = await dbUtils.createDeck({
            title,
            description,
            category,
            activeUntil,
            userId: session.user.id,
        })

        revalidatePath('/')
        return { success: true, id }
    } catch (error) {
        console.error('Error creating deck:', error)
        return { success: false, error: t('error') }
    }
}

export async function getAllDecks(): Promise<DeckType[]> {
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

        return await dbUtils.getAllDecks(session.user.id)
    } catch (error) {
        console.error('Error loading decks:', error)
        return []
    }
}

export async function updateDeck(formData: FormData) {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:deck-update`,
            'deckMutation'
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: authT('ratelimitExceeded'),
            }
        }

        const id = formData.get('id') as string
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const category = formData.get('category') as string
        const activeUntilStr = formData.get('activeUntil') as string | null

        const activeUntil = activeUntilStr ? new Date(activeUntilStr) : null

        const existingDeck = await dbUtils.getDeckById(id, session.user.id)
        if (!existingDeck) {
            return { success: false, error: t('edit.notFound') }
        }

        await dbUtils.updateDeck({
            id,
            title,
            description,
            category,
            activeUntil,
        })

        revalidatePath('/')
        revalidatePath(`/deck/${id}/edit`)
        return { success: true }
    } catch (error) {
        console.error('Error updating deck:', error)
        return { success: false, error: t('edit.error') }
    }
}

export async function resetDeckProgress(deckId: string) {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:deck-reset`,
            'deckMutation'
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: authT('ratelimitExceeded'),
            }
        }

        const existingDeck = await dbUtils.getDeckById(deckId, session.user.id)
        if (!existingDeck) {
            return { success: false, error: t('edit.notFound') }
        }

        await dbUtils.resetDeckProgress(session?.user?.id, deckId)

        revalidatePath('/')
        revalidatePath(`/deck/${deckId}/edit`)
        return { success: true }
    } catch (error) {
        console.error('Error resetting deck progress:', error)
        return {
            success: false,
            error: t('edit.dangerZone.resetProgress.error'),
        }
    }
}

export async function deleteDeck(deckId: string) {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:deck-delete`,
            'deckMutation'
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: authT('ratelimitExceeded'),
            }
        }

        const existingDeck = await dbUtils.getDeckById(deckId, session.user.id)
        if (!existingDeck) {
            return { success: false, error: t('edit.notFound') }
        }

        await dbUtils.deleteDeck(session.user.id, deckId)

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Error deleting deck:', error)
        return { success: false, error: t('edit.dangerZone.deleteDeck.error') }
    }
}
