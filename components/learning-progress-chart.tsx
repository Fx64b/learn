'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo } from 'react'

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
                                className="bg-primary/10 h-32 mb-2 relative rounded"
                                style={{
                                    backgroundColor: `hsl(var(--primary) / ${day.correctPercentage / 100})`
                                }}
                            >
                                <div
                                    className="bg-primary absolute bottom-0 w-full rounded"
                                    style={{
                                        height: `${(day.cardsReviewed / 20) * 100}%`,
                                        maxHeight: '100%'
                                    }}
                                />
                            </div>
                            <div className="text-sm font-medium">
                                {new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short' })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {day.cardsReviewed} Karten
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                    <span>Weniger geübt</span>
                    <span>Mehr geübt</span>
                </div>
            </CardContent>
        </Card>
    )
}