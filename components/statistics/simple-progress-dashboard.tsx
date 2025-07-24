'use client'

import { ProgressData } from '@/types'
import { Calendar, Clock, TrendingUp } from 'lucide-react'

import { useMemo } from 'react'

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
                front: string
                back: string
                deckId: string
                isExamRelevant: boolean
                difficultyLevel: number
                createdAt: Date
            }
            review: {
                id: string
                flashcardId: string
                userId: string
                reviewedAt: Date
                rating: number
                easeFactor: number
                interval: number
                nextReview: Date
            } | null
        }>
    }
}

export function SimpleProgressDashboard({
    data,
}: SimpleProgressDashboardProps) {
    const t = useTranslations('statistics.dashboard')

    const last7DaysData = useMemo(() => {
        // Create array of last 7 days
        const today = new Date()
        const last7Days = []

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]

            // Find data for this date or create empty entry
            const existingData = data.dailyProgress.find(
                (d) => d.date === dateStr
            )

            last7Days.push({
                date: dateStr,
                cardsReviewed: existingData?.cardsReviewed || 0,
                correctPercentage: existingData?.correctPercentage || 0,
            })
        }

        return last7Days
    }, [data.dailyProgress])

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
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            {t('last7Days')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {cardsLearned7Days}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {t('cardsReviewed')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            {t('successRate')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-green-600">
                                {successRate}%
                            </div>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {t('percentCorrect')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            {t('learningStreak')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-blue-600">
                                {data.streak}
                            </div>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {data.streak === 1 ? t('day') : t('days')}{' '}
                            {t('inARow')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            {t('toReview')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-orange-600">
                                {data.needsReview.length}
                            </div>
                        </div>
                        <p className="text-muted-foreground mb-2 text-xs">
                            {t('cardsForToday')}
                        </p>
                        {data.needsReview.length > 0 && (
                            <Link href="/learn/due">
                                <Button size="sm" variant="outline" className="hover:bg-orange-50">
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
                        {data.cardsByDifficulty.length === 0 ? (
                            <div className="text-muted-foreground text-sm">
                                <p>{t('noCardsData')}</p>
                            </div>
                        ) : (
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
