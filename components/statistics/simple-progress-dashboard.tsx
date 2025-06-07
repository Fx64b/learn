'use client'

import { ProgressData } from '@/types'
import { Calendar, Clock, TrendingUp } from 'lucide-react'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { LearningProgressChart } from '@/components/statistics/charts/learning-progress-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SimpleProgressDashboardProps {
    data: {
        dailyProgress: ProgressData[]
        totalReviews: number
        totalCorrect: number
        streak: number
        cardsByDifficulty: Array<{
            difficultyCategory: number
            count: number
        }>
        needsReview: Array<{
            flashcard: {
                id: string
                vorderseite: string
                rueckseite: string
                deckId: string
                istPruefungsrelevant: boolean
                schwierigkeitsgrad: number
                erstelltAm: Date
            }
            review: {
                id: string
                flashcardId: string
                userId: string
                bewertetAm: Date
                bewertung: number
                easeFaktor: number
                intervall: number
                naechsteWiederholung: Date
            } | null
        }>
    }
}

export function SimpleProgressDashboard({
    data,
}: SimpleProgressDashboardProps) {
    const t = useTranslations('statistics.dashboard')

    const last7DaysData = data.dailyProgress.slice(-7)

    const cardsLearned7Days = last7DaysData.reduce(
        (total, day) => total + day.cardsReviewed,
        0
    )

    const successRate =
        data.totalReviews > 0
            ? Math.round((data.totalCorrect / data.totalReviews) * 100)
            : 0

    const difficultyLabels: Record<number, string> = {
        1: t('difficulty.again'),
        2: t('difficulty.hard'),
        3: t('difficulty.good'),
        4: t('difficulty.easy'),
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('last7Days')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {cardsLearned7Days}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {t('cardsReviewed')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('successRate')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <div className="text-2xl font-bold">
                                {successRate}%
                            </div>
                            <TrendingUp className="ml-2 h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {t('percentCorrect')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('learningStreak')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <div className="text-2xl font-bold">
                                {data.streak}
                            </div>
                            <Calendar className="ml-2 h-4 w-4 text-blue-500" />
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {data.streak === 1 ? t('day') : t('days')}{' '}
                            {t('inARow')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('toReview')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <div className="text-2xl font-bold">
                                {data.needsReview.length}
                            </div>
                            <Clock className="ml-2 h-4 w-4 text-orange-500" />
                        </div>
                        <p className="text-muted-foreground mb-2 text-xs">
                            {t('cardsForToday')}
                        </p>
                        {data.needsReview.length > 0 && (
                            <Link href="/learn/due">
                                <Button size="sm" variant="outline">
                                    {t('reviewNow')}
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex w-full flex-col gap-4 md:flex-row">
                <LearningProgressChart data={last7DaysData} />

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>{t('cardsByDifficulty')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.cardsByDifficulty.map((item) => (
                                <div
                                    key={item.difficultyCategory}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-sm font-medium">
                                        {difficultyLabels[
                                            item.difficultyCategory
                                        ] || `Level ${item.difficultyCategory}`}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-secondary h-2 w-32 overflow-hidden rounded-full">
                                            <div
                                                className={`h-full ${
                                                    item.difficultyCategory ===
                                                    1
                                                        ? 'bg-red-500'
                                                        : item.difficultyCategory ===
                                                            2
                                                          ? 'bg-yellow-500'
                                                          : item.difficultyCategory ===
                                                              3
                                                            ? 'bg-blue-500'
                                                            : 'bg-green-500'
                                                }`}
                                                style={{
                                                    width: `${
                                                        data.cardsByDifficulty
                                                            .length > 0
                                                            ? (item.count /
                                                                  Math.max(
                                                                      ...data.cardsByDifficulty.map(
                                                                          (d) =>
                                                                              d.count
                                                                      )
                                                                  )) *
                                                              100
                                                            : 0
                                                    }%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-muted-foreground w-8 text-right text-sm">
                                            {item.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
