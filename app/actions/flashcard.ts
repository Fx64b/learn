'use server'

import * as dbUtils from '@/db/utils'
import { authOptions } from '@/lib/auth'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

export async function createFlashcard(formData: FormData) {
    try {
        const deckId = formData.get('deckId') as string
        const vorderseite = formData.get('vorderseite') as string
        const rückseite = formData.get('rückseite') as string
        const istPrüfungsrelevant =
            formData.get('istPrüfungsrelevant') === 'true'

        const id = await dbUtils.createFlashcard({
            deckId,
            vorderseite,
            rückseite,
            istPrüfungsrelevant,
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
        // Parse the JSON array
        const cards = JSON.parse(data.cardsJson)

        if (!Array.isArray(cards)) {
            return { success: false, error: 'JSON muss ein Array sein' }
        }

        const results = []

        for (const card of cards) {
            if (!card.vorderseite || !card.rückseite) {
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
                rückseite: card.rückseite,
                istPrüfungsrelevant: card.istPrüfungsrelevant ?? true,
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
        return await dbUtils.getFlashcardsByDeckId(deckId)
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
    rückseite: string
    istPrüfungsrelevant: boolean
}) {
    try {
        const flashcard = await dbUtils.getFlashcardById(data.id)
        if (!flashcard) {
            return { success: false, error: 'Karte nicht gefunden' }
        }

        await dbUtils.updateFlashcard({
            id: data.id,
            vorderseite: data.vorderseite,
            rückseite: data.rückseite,
            istPrüfungsrelevant: data.istPrüfungsrelevant,
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
