'use server'

import * as dbUtils from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

export async function createFlashcard(formData: FormData) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: 'Not authenticated' }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:create-card`
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
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
        return { success: false, error: 'Fehler beim Erstellen der Flashcard' }
    }
}

export async function createFlashcardsFromJson(data: {
    deckId: string
    cardsJson: string
}) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: 'Not authenticated' }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:bulk-create`
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: 'Zu viele Bulk-Anfragen. Bitte warten Sie.',
            }
        }

        const cards = JSON.parse(data.cardsJson)

        if (!Array.isArray(cards)) {
            return { success: false, error: 'JSON muss ein Array sein' }
        }

        const results = []

        for (const card of cards) {
            if (!card.vorderseite || !card.rueckseite) {
                results.push({
                    success: false,
                    error: 'Karte mit fehlenden Feldern übersprungen',
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
            error: 'Ungültiges JSON oder Fehler beim Erstellen',
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
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: 'Not authenticated' }
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
        return { success: false, error: 'Fehler beim Bewerten der Karte' }
    }
}

export async function updateFlashcard(data: {
    id: string
    vorderseite: string
    rueckseite: string
    istPruefungsrelevant: boolean
}) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: 'Not authenticated' }
        }

        const flashcard = await dbUtils.getFlashcardById(data.id)
        if (!flashcard) {
            return { success: false, error: 'Karte nicht gefunden' }
        }

        const deck = await dbUtils.getDeckById(
            flashcard.deckId,
            session.user.id
        )
        if (!deck) {
            return { success: false, error: 'Unauthorized' }
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
        return { success: false, error: 'Fehler beim Aktualisieren der Karte' }
    }
}

export async function deleteFlashcard(id: string) {
    try {
        const flashcard = await dbUtils.getFlashcardById(id)
        if (!flashcard) {
            return { success: false, error: 'Karte nicht gefunden' }
        }

        const deckId = flashcard.deckId
        await dbUtils.deleteFlashcard(id)

        revalidatePath(`/deck/${deckId}/edit`)
        revalidatePath(`/lernen/${deckId}`)

        return { success: true }
    } catch (error) {
        console.error('Fehler beim Löschen der Karte:', error)
        return { success: false, error: 'Fehler beim Löschen der Karte' }
    }
}
