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

        const id = await dbUtils.createDeck({
            titel,
            beschreibung,
            kategorie,
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
