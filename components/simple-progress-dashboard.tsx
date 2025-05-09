'use client'

import { ProgressData } from '@/types'
import { Calendar, Clock, TrendingUp } from 'lucide-react'

import Link from 'next/link'

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
                rückseite: string
                deckId: string
                istPrüfungsrelevant: boolean
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
                nächsteWiederholung: Date
            } | null
        }>
    }
}

export function SimpleProgressDashboard({
    data,
}: SimpleProgressDashboardProps) {
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
        1: 'Wieder',
        2: 'Schwer',
        3: 'Gut',
        4: 'Einfach',
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Letzte 7 Tage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {cardsLearned7Days}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Karten wiederholt
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Erfolgsquote
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
                            Prozentual richtig
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Lern-Streak
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
                            {data.streak === 1 ? 'Tag' : 'Tage'} in Folge
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Zu wiederholen
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
                            Karten für heute
                        </p>
                        {data.needsReview.length > 0 && (
                            <Link href="/learn/due">
                                <Button size="sm" variant="outline">
                                    Jetzt lernen
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex w-full flex-col gap-4 md:flex-row">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Aktivität letzte 7 Tage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-2">
                            {last7DaysData.map((day, index) => (
                                <div key={index} className="text-center">
                                    <div
                                        className="bg-primary/10 relative mb-2 h-24 rounded"
                                        style={{
                                            backgroundColor: `hsl(var(--primary) / ${day.correctPercentage / 100})`,
                                        }}
                                    >
                                        <div
                                            className="bg-primary absolute bottom-0 w-full rounded"
                                            style={{
                                                height: `${(day.cardsReviewed / Math.max(...last7DaysData.map((d) => d.cardsReviewed || 1))) * 100}%`,
                                                minHeight:
                                                    day.cardsReviewed > 0
                                                        ? '2px'
                                                        : '0px',
                                            }}
                                        />
                                    </div>
                                    <div className="text-sm font-medium">
                                        {new Date(day.date).toLocaleDateString(
                                            'de-DE',
                                            { weekday: 'short' }
                                        )}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {day.cardsReviewed} Karten
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Karten nach Schwierigkeit</CardTitle>
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
