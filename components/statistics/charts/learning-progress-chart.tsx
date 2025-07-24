'use client'

import { useMemo } from 'react'

import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

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
    const t = useTranslations('statistics.progressChart')
    const locale = useLocale()

    const chartData = useMemo(() => {
        // Create array of last 7 days
        const today = new Date()
        const last7Days = []

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]

            // Find data for this date or create empty entry
            const existingData = data.find((d) => d.date === dateStr)

            last7Days.push({
                date: dateStr,
                cardsReviewed: existingData?.cardsReviewed || 0,
                correctPercentage: existingData?.correctPercentage || 0,
            })
        }

        return last7Days
    }, [data])

    const stats = useMemo(() => {
        if (chartData.length === 0)
            return { totalCards: 0, avgCards: 0, bestDay: null, avgAccuracy: 0 }

        const totalCards = chartData.reduce(
            (sum, day) => sum + day.cardsReviewed,
            0
        )
        
        // Only count days where learning actually happened
        const activeDays = chartData.filter(day => day.cardsReviewed > 0).length
        const avgCards = activeDays > 0 ? totalCards / activeDays : 0

        const bestDay = chartData.reduce(
            (best, current) =>
                current.cardsReviewed > best.cardsReviewed ? current : best,
            chartData[0]
        )

        // Only calculate accuracy for days with activity
        const activeDaysData = chartData.filter(day => day.cardsReviewed > 0)
        const avgAccuracy = activeDaysData.length > 0 
            ? activeDaysData.reduce((sum, day) => sum + day.correctPercentage, 0) / activeDaysData.length
            : 0

        return { totalCards, avgCards, bestDay, avgAccuracy }
    }, [chartData])

    const maxCards = useMemo(() => {
        if (chartData.length === 0) return 1
        const max = Math.max(...chartData.map((d) => d.cardsReviewed || 0))
        return max > 0 ? max : 1
    }, [chartData])

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="text-muted-foreground text-sm">
                        <p>{t('noActivity')}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="h-52">
                            <div className="grid h-full grid-cols-7 gap-2">
                                {chartData.map((day, index) => {
                                    const height =
                                        day.cardsReviewed > 0
                                            ? Math.max(
                                                  5,
                                                  (day.cardsReviewed /
                                                      maxCards) *
                                                      100
                                              )
                                            : 0

                                    const displayDate = new Date(day.date)
                                    const dayName =
                                        displayDate.toLocaleDateString(locale, {
                                            weekday: 'short',
                                        })
                                    const dayNum = displayDate.getDate()
                                    const month = String(
                                        displayDate.getMonth() + 1
                                    ).padStart(2, '0')

                                    return (
                                        <div
                                            key={index}
                                            className="flex flex-col items-center"
                                        >
                                            <div className="relative flex h-40 w-full flex-col justify-end">
                                                <div
                                                    className="absolute inset-0 rounded opacity-20"
                                                    style={{
                                                        background: `linear-gradient(to top,
                                                            hsl(var(--primary)/${day.correctPercentage / 100}) 0%,
                                                            hsl(var(--primary)/${day.correctPercentage / 200}) 100%)`,
                                                    }}
                                                />

                                                <div
                                                    className="bg-primary/80 hover:bg-primary group relative w-full rounded-t transition-colors"
                                                    style={{
                                                        height: `${height}%`,
                                                        minHeight:
                                                            day.cardsReviewed >
                                                            0
                                                                ? '5px'
                                                                : '0',
                                                    }}
                                                >
                                                    <div className="bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform rounded p-2 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                                                        <div className="font-medium">
                                                            {displayDate.toLocaleDateString(
                                                                locale,
                                                                {
                                                                    weekday:
                                                                        'long',
                                                                }
                                                            )}
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span>
                                                                {t('cards')}
                                                            </span>
                                                            <span className="font-medium">
                                                                {
                                                                    day.cardsReviewed
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span>
                                                                {t(
                                                                    'successRate'
                                                                )}
                                                            </span>
                                                            <span className="font-medium">
                                                                {
                                                                    day.correctPercentage
                                                                }
                                                                %
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-2 text-center">
                                                <div className="text-sm font-medium">
                                                    {dayName}
                                                </div>
                                                <div className="text-muted-foreground text-xs">
                                                    {dayNum}.{month}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t pt-2 md:grid-cols-3 md:gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold">
                                    {stats.totalCards}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                    {t('cardsTotal')}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">
                                    {stats.avgCards.toFixed(1)}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                    {t('cardsPerDay')}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">
                                    {stats.bestDay &&
                                        new Date(
                                            stats.bestDay.date
                                        ).toLocaleDateString(locale, {
                                            weekday: 'short',
                                        })}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                    {t('bestDay')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
