'use client'

import { ProgressData } from '@/types'
import { Calendar, Clock, TrendingUp } from 'lucide-react'

import Link from 'next/link'

import { StudyTimeAnalysis } from '@/components/study-time-analysis'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { LearningProgressChart } from './learning-progress-chart'

interface ProgressDashboardProps {
    data: {
        dailyProgress: ProgressData[];
        totalReviews: number;
        totalCorrect: number;
        streak: number;
        cardsByDifficulty: Array<{
            difficultyCategory: number;
            count: number;
        }>;
        needsReview: Array<{
            flashcard: {
                id: string;
                vorderseite: string;
                rückseite: string;
                deckId: string;
                istPrüfungsrelevant: boolean;
                schwierigkeitsgrad: number;
                erstelltAm: Date;
            };
            review: {
                id: string;
                flashcardId: string;
                userId: string;
                bewertetAm: Date;
                bewertung: number;
                easeFaktor: number;
                intervall: number;
                nächsteWiederholung: Date;
            } | null;
        }>;
        timeOfDay: {
            rawData: Array<{
                startTime: number;
                sessions: number;
                cardsTotal: number;
                avgCards: number;
            }>;
        };
    };
}

export function ProgressDashboard({ data }: ProgressDashboardProps) {
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
            {/* Overview Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Gesamte Wiederholungen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.totalReviews}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {data.totalCorrect} richtig beantwortet
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

            {/* Learning Progress Chart */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <LearningProgressChart data={data.dailyProgress} />

                <Card>
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

            <StudyTimeAnalysis
                rawData={data.timeOfDay.rawData}
            />
        </div>
    )
}
