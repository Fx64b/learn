'use server'

import * as dbUtils from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { DeckType } from '@/types'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

export async function createDeck(formData: FormData) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: 'Not authenticated' }
        }

        const titel = formData.get('titel') as string
        const beschreibung = formData.get('beschreibung') as string
        const kategorie = formData.get('kategorie') as string
        const aktivBisStr = formData.get('aktivBis') as string | null

        const aktivBis = aktivBisStr ? new Date(aktivBisStr) : null

        const id = await dbUtils.createDeck({
            titel,
            beschreibung,
            kategorie,
            aktivBis, // Add the new field
            userId: session.user.id,
        })

        revalidatePath('/')
        return { success: true, id }
    } catch (error) {
        console.error('Fehler beim Erstellen des Decks:', error)
        return { success: false, error: 'Fehler beim Erstellen des Decks' }
    }
}

export async function getAllDecks(): Promise<DeckType[]> {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return []
        }

        return await dbUtils.getAllDecks(session.user.id)
    } catch (error) {
        console.error('Fehler beim Laden der Decks:', error)
        return []
    }
}

export async function updateDeck(formData: FormData) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: 'Not authenticated' }
        }

        const id = formData.get('id') as string
        const titel = formData.get('titel') as string
        const beschreibung = formData.get('beschreibung') as string
        const kategorie = formData.get('kategorie') as string
        const aktivBisStr = formData.get('aktivBis') as string | null

        const aktivBis = aktivBisStr ? new Date(aktivBisStr) : null

        const existingDeck = await dbUtils.getDeckById(id, session.user.id)
        if (!existingDeck) {
            return { success: false, error: 'Deck not found or not authorized' }
        }

        await dbUtils.updateDeck({
            id,
            titel,
            beschreibung,
            kategorie,
            aktivBis,
        })

        revalidatePath('/')
        revalidatePath(`/deck/${id}/edit`)
        return { success: true }
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Decks:', error)
        return { success: false, error: 'Fehler beim Aktualisieren des Decks' }
    }
}
