import { getDeckReviewStates } from '@/db/learn'
import { isDateCurrent, isDatePast } from '@/lib/date'
import {
    type MasteryCounts,
    type ReviewState,
    countMastery,
    isDue,
} from '@/lib/learn'
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Flame,
    Play,
    Plus,
    Sparkles,
    Target,
    Zap,
} from 'lucide-react'

import type { Session } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { getAllDecks } from '@/app/actions/deck'
import { getGamificationSummary } from '@/app/actions/learn'

import { DeckCard } from '@/components/flashcards/deck-card'
import { GoalRing } from '@/components/gamification/goal-ring'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface DashboardProps {
    session: Session
}

interface DeckStats {
    total: number
    due: number
    mastery: MasteryCounts
}

export default async function Dashboard({ session }: DashboardProps) {
    const t = await getTranslations()
    const [decks, states, summary] = await Promise.all([
        getAllDecks(),
        getDeckReviewStates(session.user.id),
        getGamificationSummary(),
    ])

    // One query for all decks instead of one per deck.
    const now = new Date()
    const reviewsByDeck = new Map<string, (ReviewState | null)[]>()
    for (const row of states) {
        const review: ReviewState | null =
            row.nextReview && row.rating !== null
                ? {
                      rating: row.rating,
                      interval: row.interval ?? 0,
                      easeFactor: (row.easeFactor ?? 250) / 100,
                      nextReview: row.nextReview,
                  }
                : null
        const list = reviewsByDeck.get(row.deckId) ?? []
        list.push(review)
        reviewsByDeck.set(row.deckId, list)
    }
    const statsFor = (deckId: string): DeckStats => {
        const reviews = reviewsByDeck.get(deckId) ?? []
        return {
            total: reviews.length,
            due: reviews.filter((r) => r && isDue(r, now)).length,
            mastery: countMastery(reviews),
        }
    }

    const currentDecks = decks.filter(
        (deck) => !deck.activeUntil || isDateCurrent(deck.activeUntil)
    )
    const pastDecks = decks.filter(
        (deck) => deck.activeUntil && isDatePast(deck.activeUntil)
    )
    const activeStats = currentDecks.map((d) => statsFor(d.id))
    const totalDue = activeStats.reduce((sum, s) => sum + s.due, 0)
    const totalNew = activeStats.reduce((sum, s) => sum + s.mastery.new, 0)
    const goalReached = summary ? summary.todayXp >= summary.dailyGoalXp : false

    return (
        <div className="space-y-8 px-4 py-6 sm:py-8">
            <section className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="flex flex-col justify-between gap-4 rounded-2xl border-2 border-b-4 border-emerald-500 p-5">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {session.user.name
                                ? t('dashboard.hero.greetingName', {
                                      name: session.user.name,
                                  })
                                : t('dashboard.hero.greeting')}
                        </h1>
                        <p className="text-muted-foreground">
                            {totalDue > 0
                                ? t('dashboard.hero.due', { count: totalDue })
                                : totalNew > 0
                                  ? t('dashboard.hero.new', {
                                        count: totalNew,
                                    })
                                  : t('dashboard.hero.caughtUp')}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(totalDue > 0 || totalNew > 0) && (
                            <Button
                                size="lg"
                                asChild
                                className="bg-emerald-500 font-bold text-white hover:bg-emerald-500/90"
                            >
                                <Link href="/learn/due">
                                    <Play className="fill-current" />
                                    {t('dashboard.hero.continue')}
                                </Link>
                            </Button>
                        )}
                        <Button size="lg" variant="outline" asChild>
                            <Link href="/learn/difficult">
                                <Sparkles />
                                {t('dashboard.categories.practiceDifficult')}
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href="/deck/create">
                                <Plus />
                                {t('dashboard.categories.newDeck')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {summary && (
                    <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:gap-2">
                        <div className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
                            <GoalRing
                                value={summary.todayXp}
                                goal={summary.dailyGoalXp}
                                size={40}
                            >
                                {goalReached ? (
                                    <CheckCircle2 className="size-5 text-emerald-500" />
                                ) : (
                                    <Target className="text-muted-foreground size-4" />
                                )}
                            </GoalRing>
                            <div className="min-w-0">
                                <p className="font-bold tabular-nums">
                                    {summary.todayXp}/{summary.dailyGoalXp}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {t('dashboard.stats.dailyGoal')}
                                </p>
                            </div>
                        </div>
                        <div className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
                            <Flame
                                className={
                                    summary.streak > 0 && !summary.streakAtRisk
                                        ? 'size-8 fill-orange-400 text-orange-500'
                                        : 'text-muted-foreground size-8'
                                }
                            />
                            <div className="min-w-0">
                                <p className="font-bold tabular-nums">
                                    {summary.streak}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {summary.streakAtRisk
                                        ? t('dashboard.stats.streakAtRisk')
                                        : t('dashboard.statistics.dayStreak')}
                                </p>
                            </div>
                        </div>
                        <div className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
                            <Zap className="size-8 shrink-0 fill-amber-400 text-amber-500" />
                            <div className="min-w-0">
                                <p className="font-bold tabular-nums">
                                    {summary.totalXp}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {t('dashboard.stats.totalXp')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <div className="flex justify-end">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/profile?tab=stats">
                        <BarChart3 />
                        {t('dashboard.statistics.detailedStats')}
                        <ArrowRight />
                    </Link>
                </Button>
            </div>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">
                    {t('dashboard.categories.title')}
                </h2>
                {currentDecks.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {currentDecks.map((deck) => {
                            const s = statsFor(deck.id)
                            return (
                                <DeckCard
                                    key={deck.id}
                                    deck={deck}
                                    totalCards={s.total}
                                    dueCards={s.due}
                                    mastery={s.mastery}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center">
                        <h3 className="text-lg font-medium">
                            {t('dashboard.quickActions.noDecksYet')}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {t('dashboard.quickActions.createFirstDeck')}
                        </p>
                        <Button asChild>
                            <Link href="/deck/create">
                                <Plus />
                                {t(
                                    'dashboard.quickActions.createFirstDeckButton'
                                )}
                            </Link>
                        </Button>
                    </div>
                )}
            </section>

            {pastDecks.length > 0 && (
                <>
                    <Separator />
                    <section className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold">
                                {t('dashboard.completedGoals.title')}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {t('dashboard.completedGoals.description')}
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {pastDecks.map((deck) => {
                                const s = statsFor(deck.id)
                                return (
                                    <DeckCard
                                        key={deck.id}
                                        deck={deck}
                                        totalCards={s.total}
                                        dueCards={s.due}
                                        mastery={s.mastery}
                                        isPastDue
                                    />
                                )
                            })}
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}
