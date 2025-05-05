import { getDeckById } from '@/db/utils'
import { ArrowLeft, Info } from 'lucide-react'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getDueCardsForDeck } from '@/app/actions/deck'

import { Button } from '@/components/ui/button'

import LernModusClient from './lern-modus-client'

export default async function LernSeite({
    params,
}: {
    params: Promise<{ kategorie: string }>
}) {
    const { kategorie } = await params

    const deck = await getDeckById(kategorie)
    if (!deck) {
        notFound()
    }

    // Get only due cards instead of all cards
    const flashcards = await getDueCardsForDeck(kategorie)

    return (
        <div className="container mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:py-8">
            <header className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            aria-label="Zurück zur Übersicht"
                        >
                            <Link href="/">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-xl font-bold sm:text-2xl">
                            {deck.titel}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                            <Info className="mr-1 h-4 w-4" />
                            Hilfe
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 flex-col">
                <LernModusClient
                    deckId={deck.id}
                    deckTitel={deck.titel}
                    flashcards={flashcards}
                />
            </main>
        </div>
    )
}
