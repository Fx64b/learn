'use server'

import * as dbUtils from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'

export async function createFlashcard(formData: FormData) {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck.cards')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:create-card`
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: authT('ratelimitExceeded'),
            }
        }

        const deckId = formData.get('deckId') as string
        const front = formData.get('front') as string
        const back = formData.get('back') as string
        const isExamRelevant = formData.get('isExamRelevant') === 'true'

        const id = await dbUtils.createFlashcard({
            deckId,
            front,
            back,
            isExamRelevant,
        })

        revalidatePath(`/learn/${deckId}`)
        return { success: true, id }
    } catch (error) {
        console.error('Error creating flashcard:', error)
        return { success: false, error: t('createError') }
    }
}

export async function createFlashcardsFromJson(data: {
    deckId: string
    cardsJson: string
}) {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck.cards')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:bulk-create`,
            'bulkCreate'
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: authT('bulkRatelimitExceeded'),
            }
        }

        const cards = JSON.parse(data.cardsJson)

        if (!Array.isArray(cards)) {
            return { success: false, error: t('invalidJsonArray') }
        }

        const results = []

        for (const card of cards) {
            if (!card.front || !card.back) {
                results.push({
                    success: false,
                    error: t('missingFields'),
                    front: card.front,
                })
                continue
            }

            const id = await dbUtils.createFlashcard({
                deckId: data.deckId,
                front: card.front,
                back: card.back,
                isExamRelevant: card.isExamRelevant ?? true,
            })

            results.push({ success: true, id })
        }

        revalidatePath(`/deck/${data.deckId}/edit`)
        revalidatePath(`/learn/${data.deckId}`)

        return { success: true, results }
    } catch (error) {
        console.error('Error creating cards:', error)
        return {
            success: false,
            error: t('bulkCreateError'),
        }
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

export async function reviewCard(flashcardId: string, rating: number) {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck.cards')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:review`,
            'studyReview'
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: authT('ratelimitExceeded'),
            }
        }

        const result = await dbUtils.reviewCard({
            flashcardId,
            userId: session.user.id,
            rating,
        })

        revalidatePath(`/learn/${flashcardId.split('-')[0]}`)
        return { success: true, ...result }
    } catch (error) {
        console.error('Error reviewing card:', error)
        return { success: false, error: t('reviewError') }
    }
}

export async function updateFlashcard(data: {
    id: string
    front: string
    back: string
    isExamRelevant: boolean
}) {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck.cards')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:card-update`,
            'cardMutation'
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: authT('ratelimitExceeded'),
            }
        }

        const flashcard = await dbUtils.getFlashcardById(data.id)
        if (!flashcard) {
            return { success: false, error: t('notFound') }
        }

        const deck = await dbUtils.getDeckById(
            flashcard.deckId,
            session.user.id
        )
        if (!deck) {
            return { success: false, error: t('unauthorized') }
        }

        await dbUtils.updateFlashcard({
            id: data.id,
            front: data.front,
            back: data.back,
            isExamRelevant: data.isExamRelevant,
        })

        revalidatePath(`/deck/${flashcard.deckId}/edit`)
        revalidatePath(`/learn/${flashcard.deckId}`)

        return { success: true }
    } catch (error) {
        console.error('Error updating card:', error)
        return { success: false, error: t('updateError') }
    }
}

export async function deleteFlashcard(id: string) {
    const t = await getTranslations('deck.cards')
    const authT = await getTranslations('auth')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:card-delete`,
            'cardMutation'
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: authT('ratelimitExceeded'),
            }
        }

        const flashcard = await dbUtils.getFlashcardById(id)
        if (!flashcard) {
            return { success: false, error: t('notFound') }
        }

        const deckId = flashcard.deckId
        await dbUtils.deleteFlashcard(id)

        revalidatePath(`/deck/${deckId}/edit`)
        revalidatePath(`/learn/${deckId}`)

        return { success: true }
    } catch (error) {
        console.error('Error deleting card:', error)
        return { success: false, error: t('deleteError') }
    }
}
