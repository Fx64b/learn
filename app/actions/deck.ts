'use server'

import * as dbUtils from '@/db/utils'
import { authOptions } from '@/lib/auth'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

export async function getDueCardsForDeck(deckId: string) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return []

        const allDueCards = await dbUtils.getDueCards(session.user.id)
        return allDueCards
            .filter((card) => card.flashcard.deckId === deckId)
            .map((card) => card.flashcard)
    } catch (error) {
        console.error('Fehler beim Laden der fälligen Karten:', error)
        return []
    }
}

export async function createDeck(formData: FormData) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: 'Not authenticated' }
        }

        const titel = formData.get('titel') as string
        const beschreibung = formData.get('beschreibung') as string
        const kategorie = formData.get('kategorie') as string

        const id = await dbUtils.createDeck({
            titel,
            beschreibung,
            kategorie,
            userId: session.user.id, // Use session user ID
        })

        revalidatePath('/')
        return { success: true, id }
    } catch (error) {
        console.error('Fehler beim Erstellen des Decks:', error)
        return { success: false, error: 'Fehler beim Erstellen des Decks' }
    }
}

export async function getAllDecks() {
    try {
        return await dbUtils.getAllDecks()
    } catch (error) {
        console.error('Fehler beim Laden der Decks:', error)
        return []
    }
}
