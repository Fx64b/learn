import { getDeckById } from '@/db/utils'

import Link from 'next/link'

import { getFlashcardsByDeckId } from '@/app/actions/flashcard'

import { CreateCardForm } from '@/components/create-card-form'
import { Button } from '@/components/ui/button'

import CardList from './card-list'

export default async function EditDeckPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const deck = await getDeckById(id)
    const flashcards = await getFlashcardsByDeckId(id)

    if (!deck) {
        return <div>Deck nicht gefunden</div>
    }

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold">{deck.titel}</h1>
                <Button variant="outline" asChild>
                    <Link href="/">Zurück</Link>
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div>
                    <h2 className="mb-4 text-lg font-semibold">
                        Karten erstellen
                    </h2>
                    <CreateCardForm deckId={deck.id} />
                </div>

                <div>
                    <h2 className="mb-4 text-lg font-semibold">
                        Alle Karten ({flashcards.length})
                    </h2>
                    <CardList flashcards={flashcards} />
                </div>
            </div>
        </div>
    )
}
