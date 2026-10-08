'use server'

import { authOptions } from '@/lib/auth'
import { parseItemRow, toExportItem } from '@/lib/items'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

import { getServerSession } from 'next-auth'

import { getFlashcardsByDeckId } from '@/app/actions/flashcard'

export async function getExportableFlashcards(deckId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return []
    }

    const rateLimitResult = await checkRateLimit(
        `user:${session.user.id}:export`,
        'export'
    )

    if (!rateLimitResult.success) {
        return []
    }

    const flashcards = await getFlashcardsByDeckId(deckId)

    // Basic cards export as { front, back }; other types add type and content.
    return flashcards.map((card) => toExportItem(parseItemRow(card)))
}
