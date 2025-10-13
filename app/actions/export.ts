'use server'

import { getFlashcardsByDeckId } from '@/app/actions/flashcard'

export async function getExportableFlashcards(deckId: string) {
    const flashcards = await getFlashcardsByDeckId(deckId)

    return flashcards.map((card) => ({
        front: card.front,
        back: card.back,
    }))
}
