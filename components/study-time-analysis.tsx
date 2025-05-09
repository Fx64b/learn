'use client'

import { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StudyTimeAnalysisProps {
    rawData: Array<{
        startTime: number
        sessions: number
        cardsTotal: number
        avgCards: number
    }>
}

export function StudyTimeAnalysis({ rawData }: StudyTimeAnalysisProps) {
    const data = useMemo(() => {
        const hourlyMap = new Map<
        number,
        {
            sessions: number
            cardsTotal: number
            avgCards: number
            totalSessions: number
            totalCards: number
        }
        >()

        rawData.forEach((item) => {
            const localDate = new Date(item.startTime * 1000)
            const localHour = localDate.getHours()

            const current = hourlyMap.get(localHour) || {
                sessions: 0,
                cardsTotal: 0,
                avgCards: 0,
                totalSessions: 0,
                totalCards: 0,
            }

            current.sessions += item.sessions
            current.cardsTotal += item.cardsTotal
            current.totalSessions += item.sessions
            current.totalCards += item.cardsTotal
            current.avgCards = current.totalCards / current.totalSessions

            hourlyMap.set(localHour, current)
        })

        // Create complete 24-hour array
        return Array.from({ length: 24 }, (_, hour) => {
            const found = hourlyMap.get(hour)
            return {
                hour,
                sessions: found?.sessions || 0,
                cardsTotal: found?.cardsTotal || 0,
                avgCards: found?.avgCards || 0,
            }
        })
    }, [rawData])

    const mostProductiveLocalHour = useMemo(() => {
        if (data.length === 0) return null

        const maxHour = data.reduce(
            (max, current) => (current.avgCards > max.avgCards ? current : max),
            { hour: 0, avgCards: 0 }
        )

        return maxHour.avgCards > 0 ? maxHour : null
    }, [data])

    // Max card value for scaling
    const maxCards = useMemo(() => {
        if (data.length === 0) return 1
        const max = Math.max(...data.map(d => d.cardsTotal || 0))
        return max > 0 ? max : 1
    }, [data])

    // Active hours (with data) for better visualization
    const activeHours = useMemo(() => {
        return data.filter(h => h.cardsTotal > 0).length
    }, [data])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between">
                    Lernzeiten-Analyse <Badge variant="outline">Beta</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ||
                data.every((hour) => hour.cardsTotal === 0) ? (
                    <div className="text-muted-foreground text-sm">
                        <p>Noch keine Lernsessions durchgeführt.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="pb-8">
                            <div className="grid grid-cols-24 gap-1 h-40">
                                {data.map((hour) => {
                                    const height = hour.cardsTotal > 0
                                        ? Math.max(5, (hour.cardsTotal / maxCards) * 100)
                                        : 0

                                    return (
                                        <div
                                            key={hour.hour}
                                            className="relative h-full flex flex-col justify-end"
                                        >
                                            {/* Bar */}
                                            <div
                                                className={`bg-primary hover:bg-primary/80 rounded-t-sm transition-colors w-full tooltip-trigger group`}
                                                style={{
                                                    height: `${height}%`,
                                                    minHeight: hour.cardsTotal > 0 ? '5px' : '0',
                                                }}
                                            >
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
                                                    {hour.hour}:00 - {hour.cardsTotal} Karten
                                                </div>
                                            </div>

                                            {/* Hour label */}
                                            {(hour.hour % 6 === 0 ||
                                                (activeHours < 8 && hour.cardsTotal > 0)) && (
                                                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-muted-foreground text-xs">
                                                    {hour.hour}:00
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Legend and statistics */}
                        <div className="flex flex-col gap-2">
                            {mostProductiveLocalHour && (
                                <div className="text-sm">
                                    <p className="text-muted-foreground">
                                        <span className="font-medium text-foreground">Produktivste Zeit:</span> {' '}
                                        {mostProductiveLocalHour.hour}:00 Uhr mit
                                        durchschnittlich{' '}
                                        {mostProductiveLocalHour.avgCards.toFixed(1)}{' '}
                                        Karten pro Session.
                                    </p>
                                </div>
                            )}

                            <div className="text-sm">
                                <p className="text-muted-foreground">
                                    <span className="font-medium text-foreground">Gesamtkarten:</span> {' '}
                                    {data.reduce((sum, hour) => sum + hour.cardsTotal, 0)} Karten über alle Zeiten.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}