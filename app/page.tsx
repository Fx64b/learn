'use server'

import { getDueCards, getFlashcardsByDeckId } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import {AlertTriangle, Plus} from 'lucide-react'

import { getServerSession } from 'next-auth'
import Link from 'next/link'

import { getAllDecks } from '@/app/actions/deck'
import { getLearningProgress } from '@/app/actions/progress'

import { DeckCard } from '@/components/deck-card'
import { SimpleProgressDashboard } from '@/components/statistics/simple-progress-dashboard'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import type React from "react";

export default async function Home() {
    const session = await getServerSession(authOptions)
    const decks = await getAllDecks()

    const progressData = session ? await getLearningProgress() : null

    const deckStats = await Promise.all(
        decks.map(async (deck) => {
            const totalCards = await getFlashcardsByDeckId(deck.id)

            const dueCards = session ? await getDueCards(session?.user.id) : []
            const deckDueCards = dueCards.filter(
                (card) => card.flashcard.deckId === deck.id
            )

            return {
                deck,
                totalCards: totalCards.length,
                dueCards: deckDueCards.length,
            }
        })
    )

    const currentDate = new Date()
    const currentDecks = deckStats.filter(
        ({ deck }) => !deck.aktivBis || new Date(deck.aktivBis) >= currentDate
    )
    const pastDecks = deckStats.filter(
        ({ deck }) => deck.aktivBis && new Date(deck.aktivBis) < currentDate
    )

    return (
        <main className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
            <div className="mb-10">
                <h1 className="mb-2 text-3xl font-bold">Flashcard App</h1>
                <p className="text-muted-foreground">
                    Eine einfache Flashcard-App mit spaced repetition.
                </p>
                <Alert className="my-4 w-full md:w-2/3">
                    <AlertTriangle className="h-5! w-5! text-amber-500!" />
                    <AlertTitle>Achtung!</AlertTitle>
                    <AlertDescription>
                        Diese App ist noch in der Entwicklungsphase. Es kann gut sein, dass Daten verloren gehen oder nicht korrekt angezeigt werden. Bitte benutze die App nur zu Testzwecken und nicht für wichtige Daten.
                    </AlertDescription>
                </Alert>
            </div>

            <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Lernstatistik</h2>
                    <Link href="/profile">
                        <Button variant="ghost" size="sm">
                            Mein Profil
                        </Button>
                    </Link>
                </div>
                <div className="bg-card rounded-lg border p-4">
                    {progressData ? (
                        <SimpleProgressDashboard data={progressData} />
                    ) : (
                        <div className="text-muted-foreground py-8 text-center">
                            <p>
                                Bitte melde dich an, um deine Lernstatistiken zu
                                sehen.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-0">
                    <h2 className="text-xl font-semibold">Lernkategorien</h2>
                    <div className="flex flex-wrap justify-center gap-2 md:justify-end">
                        <Button variant="outline" size="default" asChild>
                            <Link href="/deck/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Neues Deck
                            </Link>
                        </Button>
                        <Button variant="outline" size="default" asChild>
                            <Link href="/learn/all">
                                Alle Karten wiederholen
                            </Link>
                        </Button>
                        <Button variant="outline" size="default" asChild>
                            <Link href="/learn/difficult">
                                Schwierige Karten üben
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {currentDecks.map(({ deck, totalCards, dueCards }) => (
                        <DeckCard
                            key={deck.id}
                            deck={deck}
                            totalCards={totalCards}
                            dueCards={dueCards}
                        />
                    ))}
                </div>
            </div>

            {pastDecks.length > 0 && (
                <div className="mb-6">
                    <div className="mt-8 mb-8">
                        <Separator />
                    </div>

                    <div className="mb-4">
                        <h2 className="text-xl font-semibold">
                            Abgeschlossene Lernziele
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Diese Decks haben ihr Lernzieldatum bereits erreicht
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {pastDecks.map(({ deck, totalCards, dueCards }) => (
                            <DeckCard
                                key={deck.id}
                                deck={deck}
                                totalCards={totalCards}
                                dueCards={dueCards}
                                isPastDue={true}
                            />
                        ))}
                    </div>
                </div>
            )}
        </main>
    )
}
