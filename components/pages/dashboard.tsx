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

import { DeckCard } from '@/components/flashcards/deck-card'
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
        ({ deck }) => !deck.activeUntil || isDateCurrent(deck.activeUntil)
    )
    const pastDecks = deckStats.filter(
        ({ deck }) => deck.activeUntil && isDatePast(deck.activeUntil)
    )

    return (
        <div className="px-4 py-6 sm:py-10">
            {/* Welcome Section - More concise */}
            <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold">
                    {t('dashboard.title')}
                </h1>
                <p className="text-muted-foreground">
                    {t('dashboard.subtitle')}
                </p>
            </div>

            {/* Quick Learning Actions - PRIORITY 1 */}
            <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    {t('dashboard.quickLearning.title')}
                </h2>
                <div className="bg-card rounded-lg border p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Cards Due Today */}
                        <div className="text-center">
                            <div className="text-3xl font-bold text-orange-500">
                                {allDueCards.length}
                            </div>
                            <p className="text-muted-foreground text-sm">
                                {t('dashboard.quickLearning.cardsDue')}
                            </p>
                            {allDueCards.length > 0 && (
                                <Link href="/learn/due" className="mt-2 block">
                                    <Button size="sm" className="w-full">
                                        {t('dashboard.quickLearning.reviewNow')}
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Active Decks Count */}
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-500">
                                {currentDecks.length}
                            </div>
                            <p className="text-muted-foreground text-sm">
                                {t('dashboard.quickLearning.activeDecks')}
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/learn/all">
                                    {t('dashboard.categories.reviewAll')}
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/deck/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('dashboard.categories.newDeck')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Decks - PRIORITY 2 */}
            <div className="mb-8">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-0">
                    <h2 className="text-xl font-semibold">
                        {t('dashboard.categories.title')}
                    </h2>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/learn/difficult">
                            {t('dashboard.categories.practiceDifficult')}
                        </Link>
                    </Button>
                </div>

                {currentDecks.length > 0 ? (
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
                ) : (
                    <div className="bg-card rounded-lg border p-8 text-center">
                        <p className="text-muted-foreground mb-4">
                            {t('dashboard.categories.noDecks')}
                        </p>
                        <Button asChild>
                            <Link href="/deck/create">
                                <Plus className="mr-2 h-4 w-4" />
                                {t('dashboard.categories.createFirst')}
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Statistics Overview - PRIORITY 3 (Compact) */}
            <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-medium">
                        {t('dashboard.statistics.overview')}
                    </h2>
                    <Link href="/profile">
                        <Button variant="ghost" size="sm">
                            {t('dashboard.statistics.viewDetails')}
                        </Button>
                    </Link>
                </div>
                <div className="bg-card rounded-lg border p-4">
                    {progressData ? (
                        <SimpleProgressDashboard data={progressData} />
                    ) : (
                        <div className="text-muted-foreground py-4 text-center">
                            <p>{t('dashboard.statistics.loginPrompt')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Beta Warning - Moved to bottom, smaller */}
            <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm">{t('dashboard.betaWarning.title')}</AlertTitle>
                <AlertDescription className="text-xs">
                    {t('dashboard.betaWarning.description')}
                </AlertDescription>
            </Alert>

            {/* Completed Goals - Keep at bottom */}
            {pastDecks.length > 0 && (
                <div className="mb-6">
                    <div className="mt-8 mb-8">
                        <Separator />
                    </div>

                    <div className="mb-4">
                        <h2 className="text-lg font-medium">
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
