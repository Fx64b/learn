'use server'

import * as dbUtils from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

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
        const vorderseite = formData.get('vorderseite') as string
        const rueckseite = formData.get('rueckseite') as string
        const istPruefungsrelevant =
            formData.get('istPruefungsrelevant') === 'true'

        const id = await dbUtils.createFlashcard({
            deckId,
            vorderseite,
            rueckseite,
            istPruefungsrelevant,
        })

        revalidatePath(`/lernen/${deckId}`)
        return { success: true, id }
    } catch (error) {
        console.error('Fehler beim Erstellen der Flashcard:', error)
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
            `user:${session.user.id}:bulk-create`
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
            if (!card.vorderseite || !card.rueckseite) {
                results.push({
                    success: false,
                    error: t('missingFields'),
                    vorderseite: card.vorderseite,
                })
                continue
            }

            const id = await dbUtils.createFlashcard({
                deckId: data.deckId,
                vorderseite: card.vorderseite,
                rueckseite: card.rueckseite,
                istPruefungsrelevant: card.istPruefungsrelevant ?? true,
            })

            results.push({ success: true, id })
        }

        revalidatePath(`/deck/${data.deckId}/edit`)
        revalidatePath(`/lernen/${data.deckId}`)

        return { success: true, results }
    } catch (error) {
        console.error('Fehler beim Erstellen der Karten:', error)
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

        return await dbUtils.getFlashcardsByDeckId(deckId, session.user.id)
    } catch (error) {
        console.error('Fehler beim Laden der Flashcards:', error)
        return []
    }
}

export async function reviewCard(flashcardId: string, bewertung: number) {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck.cards')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const result = await dbUtils.reviewCard({
            flashcardId,
            userId: session.user.id,
            bewertung,
        })

        revalidatePath(`/lernen/${flashcardId.split('-')[0]}`)
        return { success: true, ...result }
    } catch (error) {
        console.error('Fehler beim Bewerten der Karte:', error)
        return { success: false, error: t('reviewError') }
    }
}

export async function updateFlashcard(data: {
    id: string
    vorderseite: string
    rueckseite: string
    istPruefungsrelevant: boolean
}) {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck.cards')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
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
            vorderseite: data.vorderseite,
            rueckseite: data.rueckseite,
            istPruefungsrelevant: data.istPruefungsrelevant,
        })

        revalidatePath(`/deck/${flashcard.deckId}/edit`)
        revalidatePath(`/lernen/${flashcard.deckId}`)

        return { success: true }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Karte:', error)
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

        const flashcard = await dbUtils.getFlashcardById(id)
        if (!flashcard) {
            return { success: false, error: t('notFound') }
        }

        const deckId = flashcard.deckId
        await dbUtils.deleteFlashcard(id)

        revalidatePath(`/deck/${deckId}/edit`)
        revalidatePath(`/lernen/${deckId}`)

        return { success: true }
    } catch (error) {
        console.error('Fehler beim Löschen der Karte:', error)
        return { success: false, error: t('deleteError') }
    }
}
