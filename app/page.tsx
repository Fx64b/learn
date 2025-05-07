// app/page.tsx (modified version)
'use server'

import { getDueCards, getFlashcardsByDeckId } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { Plus } from 'lucide-react'

import { getServerSession } from 'next-auth'
import Link from 'next/link'

import { getAllDecks } from '@/app/actions/deck'
import { getLearningProgress } from '@/app/actions/progress'

import { SimpleProgressDashboard } from '@/components/simple-progress-dashboard'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

// app/page.tsx (modified version)

// app/page.tsx (modified version)

// app/page.tsx (modified version)

// app/page.tsx (modified version)

// app/page.tsx (modified version)

// app/page.tsx (modified version)

// app/page.tsx (modified version)

// app/page.tsx (modified version)

// app/page.tsx (modified version)

// app/page.tsx (modified version)

// app/page.tsx (modified version)

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

    return (
        <main className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
            <div className="mb-10">
                <h1 className="mb-2 text-3xl font-bold">Flashcard App</h1>
                <p className="text-muted-foreground">
                    Eine einfache Flashcard-App mit spaced repetition.
                </p>
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
                    {deckStats.map(({ deck, totalCards, dueCards }) => (
                        <Card
                            key={deck.id}
                            className="transition-shadow hover:shadow-md"
                        >
                            <CardHeader className="pb-2">
                                <CardTitle>{deck.titel}</CardTitle>
                                <CardDescription>
                                    {deck.beschreibung}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="space-y-1">
                                    <p className="text-sm">
                                        <b>{totalCards}</b> Karten insgesamt
                                    </p>
                                    <p className="text-sm">
                                        <b>{dueCards}</b> Karten zu wiederholen
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-8 md:gap-2">
                                <Link
                                    href={`/learn/${deck.id}`}
                                    className="flex-1"
                                >
                                    <Button className="w-full" size="sm">
                                        Lernen
                                    </Button>
                                </Link>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/deck/${deck.id}/edit`}>
                                        Bearbeiten
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    )
}
