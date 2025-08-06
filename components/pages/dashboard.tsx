'use server'

import { getDueCards, getFlashcardsByDeckId } from '@/db/utils'
import { isDateCurrent, isDatePast } from '@/lib/date'
import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    Clock,
    Plus,
    TrendingUp,
} from 'lucide-react'

import type React from 'react'

import { Session } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { getAllDecks } from '@/app/actions/deck'
import { getLearningProgress } from '@/app/actions/progress'

import { DeckCard } from '@/components/flashcards/deck-card'
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

    // Calculate key metrics
    const totalDueCards = allDueCards.length
    const successRate =
        progressData && progressData.totalReviews > 0
            ? Math.round(
                  (progressData.totalCorrect / progressData.totalReviews) * 100
              )
            : 0
    const currentStreak = progressData?.streak || 0

    return (
        <div className="bg-background min-h-screen">
            {/* Header Section */}
            <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {t('dashboard.title')}
                            </h1>
                            <p className="text-muted-foreground">
                                {t('dashboard.subtitle')}
                            </p>
                        </div>

                        {/* Quick Stats - Compact and Essential Only */}
                        {session && progressData && (
                            <div className="flex flex-wrap justify-between md:justify-start gap-6">
                                <div className="text-center">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4 text-orange-500" />
                                        <span className="text-2xl font-bold">
                                            {totalDueCards}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        {t('dashboard.statistics.dueToday')}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                        <span className="text-2xl font-bold">
                                            {successRate}%
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        {t('dashboard.statistics.successRate')}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        <span className="text-2xl font-bold">
                                            {currentStreak}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        {t('dashboard.statistics.dayStreak')}
                                    </p>
                                </div>
                                <Button className={"ml-auto md:ml-0"} variant="ghost" asChild>
                                    <Link
                                        href="/profile?tab=stats"
                                        className="flex items-center gap-1"
                                    >
                                        {t(
                                            'dashboard.statistics.detailedStats'
                                        )}
                                        <ArrowRight />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Beta Warning */}
                <Alert className="mb-8 max-w-2xl">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertTitle>{t('dashboard.betaWarning.title')}</AlertTitle>
                    <AlertDescription>
                        {t('dashboard.betaWarning.description')}
                    </AlertDescription>
                </Alert>

                {/* Quick Actions */}
                <div className="mb-8 flex flex-wrap gap-3">
                    {totalDueCards > 0 && (
                        <Button size="lg" asChild className="shadow-sm w-full sm:w-auto">
                            <Link href="/learn/due">
                                <Clock className="mr-2 h-4 w-4" />
                                {t('dashboard.quickActions.reviewCards', {
                                    count: totalDueCards,
                                })}
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                        <Link href="/learn/all">
                            {t('dashboard.categories.reviewAll')}
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                        <Link href="/learn/difficult">
                            {t('dashboard.categories.practiceDifficult')}
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild className="mt-2 mx-auto sm:mx-0 sm:mt-0">
                        <Link href="/deck/create">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('dashboard.categories.newDeck')}
                        </Link>
                    </Button>
                </div>

                {/* Main Content - Deck Cards */}
                <div className="space-y-8">
                    <div>
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                {t('dashboard.categories.title')}
                            </h2>
                        </div>

                        {currentDecks.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {currentDecks.map(
                                    ({ deck, totalCards, dueCards }) => (
                                        <DeckCard
                                            key={deck.id}
                                            deck={deck}
                                            totalCards={totalCards}
                                            dueCards={dueCards}
                                        />
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed">
                                <div className="text-center">
                                    <h3 className="text-lg font-medium">
                                        {t('dashboard.quickActions.noDecksYet')}
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        {t(
                                            'dashboard.quickActions.createFirstDeck'
                                        )}
                                    </p>
                                    <Button asChild>
                                        <Link href="/deck/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            {t(
                                                'dashboard.quickActions.createFirstDeckButton'
                                            )}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Completed Goals Section */}
                    {pastDecks.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold">
                                        {t('dashboard.completedGoals.title')}
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        {t(
                                            'dashboard.completedGoals.description'
                                        )}
                                    </p>
                                </div>
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {pastDecks.map(
                                        ({ deck, totalCards, dueCards }) => (
                                            <DeckCard
                                                key={deck.id}
                                                deck={deck}
                                                totalCards={totalCards}
                                                dueCards={dueCards}
                                                isPastDue={true}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
