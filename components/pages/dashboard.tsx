'use server'

import { getDueCards, getFlashcardsByDeckId } from '@/db/utils'
import { isDateCurrent, isDatePast } from '@/lib/date'
import { AlertTriangle, Plus } from 'lucide-react'

import type React from 'react'

import { Session } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { getAllDecks } from '@/app/actions/deck'
import { getLearningProgress } from '@/app/actions/progress'

import { DeckCard } from '@/components/deck-card'
import { SimpleProgressDashboard } from '@/components/statistics/simple-progress-dashboard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface DashboardProps {
    session?: Session
}

export default async function Dashboard({ session }: DashboardProps) {
    const t = await getTranslations()
    const decks = await getAllDecks()

    const progressData = session ? await getLearningProgress() : null

    const allDueCards = session ? await getDueCards(session?.user.id) : []

    const deckStats = await Promise.all(
        decks.map(async (deck) => {
            const totalCards = await getFlashcardsByDeckId(deck.id)

            const deckDueCards = allDueCards.filter(
                (card) => card.flashcard.deckId === deck.id
            )

            return {
                deck,
                totalCards: totalCards.length,
                dueCards: deckDueCards.length,
            }
        })
    )

    const currentDecks = deckStats.filter(
        ({ deck }) => !deck.aktivBis || isDateCurrent(deck.aktivBis)
    )
    const pastDecks = deckStats.filter(
        ({ deck }) => deck.aktivBis && isDatePast(deck.aktivBis)
    )

    return (
        <div className="px-4 py-6 sm:py-10">
            <div className="mb-10">
                <h1 className="mb-2 text-3xl font-bold">
                    {t('dashboard.title')}
                </h1>
                <p className="text-muted-foreground">
                    {t('dashboard.subtitle')}
                </p>
                <Alert className="my-4 w-full md:w-2/3">
                    <AlertTriangle className="h-5! w-5! text-amber-500!" />
                    <AlertTitle>{t('dashboard.betaWarning.title')}</AlertTitle>
                    <AlertDescription>
                        {t('dashboard.betaWarning.description')}
                    </AlertDescription>
                </Alert>
            </div>

            <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        {t('dashboard.statistics.title')}
                    </h2>
                    <Link href="/profile">
                        <Button variant="ghost" size="sm">
                            {t('dashboard.statistics.myProfile')}
                        </Button>
                    </Link>
                </div>
                <div className="bg-card rounded-lg border p-4">
                    {progressData ? (
                        <SimpleProgressDashboard data={progressData} />
                    ) : (
                        <div className="text-muted-foreground py-8 text-center">
                            <p>{t('dashboard.statistics.loginPrompt')}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-0">
                    <h2 className="text-xl font-semibold">
                        {t('dashboard.categories.title')}
                    </h2>
                    <div className="flex flex-wrap justify-center gap-2 md:justify-end">
                        <Button variant="outline" size="default" asChild>
                            <Link href="/deck/create">
                                <Plus className="mr-2 h-4 w-4" />
                                {t('dashboard.categories.newDeck')}
                            </Link>
                        </Button>
                        <Button variant="outline" size="default" asChild>
                            <Link href="/learn/all">
                                {t('dashboard.categories.reviewAll')}
                            </Link>
                        </Button>
                        <Button variant="outline" size="default" asChild>
                            <Link href="/learn/difficult">
                                {t('dashboard.categories.practiceDifficult')}
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
                            {t('dashboard.completedGoals.title')}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            {t('dashboard.completedGoals.description')}
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
        </div>
    )
}
