'use server'

import { getFlashcardsByDeckId } from '@/app/actions/flashcard'

export async function getExportableFlashcards(deckId: string) {
    const flashcards = await getFlashcardsByDeckId(deckId)

    return flashcards.map((card) => ({
        vorderseite: card.vorderseite,
        rueckseite: card.rueckseite,
    }))
}
