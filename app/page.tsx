import { getDueCards, getFlashcardsByDeckId } from '@/db/utils'

import { authOptions } from './api/auth/[...nextauth]/route'
import { getServerSession } from 'next-auth'
import Link from 'next/link'

import { getAllDecks } from '@/app/actions/deck'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {Plus} from "lucide-react";

export default async function Home() {
    const session = await getServerSession(authOptions)
    const decks = await getAllDecks()

    // Get actual card counts and due status for the user
    const deckStats = await Promise.all(
        decks.map(async (deck) => {
            // Count total cards
            const totalCards = await getFlashcardsByDeckId(deck.id)

            // Get due cards for this deck
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
                <h1 className="mb-2 text-3xl font-bold">Allgemeinbildung</h1>
                <p className="text-muted-foreground">
                    Lernkarten für die Abschlussprüfung
                </p>
            </div>

            <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Lernkategorien</h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/deck/create">
                                <Plus className="h-4 w-4 mr-2" />
                                Neues Deck
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                            Alle Karten wiederholen
                        </Button>
                        <Button variant="outline" size="sm">
                            Schwierige Karten üben
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
                                        {totalCards} Karten insgesamt
                                    </p>
                                    <p className="text-sm">
                                        {dueCards} Karten zu wiederholen
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Link
                                    href={`/lernen/${deck.id}`}
                                    className="flex-1"
                                >
                                    <Button className="w-full" size="sm">
                                        Lernen starten
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

            {/* Statistics section - updated with real data */}
            <div className="mt-10">
                <h2 className="mb-4 text-xl font-semibold">Lernstatistik</h2>
                <div className="bg-card rounded-lg border p-4">
                    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="bg-primary/10 rounded p-3 text-center">
                            <p className="text-2xl font-bold">
                                {deckStats.reduce(
                                    (acc, curr) => acc + curr.totalCards,
                                    0
                                )}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                Karten insgesamt
                            </p>
                        </div>
                        <div className="rounded bg-blue-500/10 p-3 text-center">
                            <p className="text-2xl font-bold">--</p>
                            <p className="text-muted-foreground text-xs">
                                Gelernte Karten
                            </p>
                        </div>
                        <div className="rounded bg-yellow-500/10 p-3 text-center">
                            <p className="text-2xl font-bold">
                                {deckStats.reduce(
                                    (acc, curr) => acc + curr.dueCards,
                                    0
                                )}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                Für heute fällig
                            </p>
                        </div>
                        <div className="rounded bg-green-500/10 p-3 text-center">
                            <p className="text-2xl font-bold">--%</p>
                            <p className="text-muted-foreground text-xs">
                                Lernfortschritt
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
