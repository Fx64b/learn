'use client'

import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProgressData {
    date: string
    cardsReviewed: number
    correctPercentage: number
}

interface LearningProgressChartProps {
    data: ProgressData[]
}

export function LearningProgressChart({ data }: LearningProgressChartProps) {
    const chartData = useMemo(() => {
        return data.slice(-7) // Show last 7 days
    }, [data])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Lernfortschritt der letzten 7 Tage</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                    {chartData.map((day, index) => (
                        <div key={index} className="text-center">
                            <div
                                className="bg-primary/10 relative mb-2 h-32 rounded"
                                style={{
                                    backgroundColor: `hsl(var(--primary) / ${day.correctPercentage / 100})`,
                                }}
                            >
                                <div
                                    className="bg-primary absolute bottom-0 w-full rounded"
                                    style={{
                                        height: `${(day.cardsReviewed / 20) * 100}%`,
                                        maxHeight: '100%',
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
    )
}
