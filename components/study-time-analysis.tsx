'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StudyTimeAnalysisProps {
    rawData: Array<{
        startTime: number;
        sessions: number;
        cardsTotal: number;
        avgCards: number;
    }>;
}

export function StudyTimeAnalysis({
                                      rawData,
                                  }: StudyTimeAnalysisProps) {
    const data = useMemo(() => {
        const hourlyMap = new Map<number, { sessions: number; cardsTotal: number; avgCards: number; totalSessions: number; totalCards: number }>();

        rawData.forEach(item => {
            const localDate = new Date(item.startTime * 1000);
            const localHour = localDate.getHours();

            const current = hourlyMap.get(localHour) || { sessions: 0, cardsTotal: 0, avgCards: 0, totalSessions: 0, totalCards: 0 };

            current.sessions += item.sessions;
            current.cardsTotal += item.cardsTotal;
            current.totalSessions += item.sessions;
            current.totalCards += item.cardsTotal;
            current.avgCards = current.totalCards / current.totalSessions;

            hourlyMap.set(localHour, current);
        });

        // Erstelle vollständiges 24-Stunden-Array
        return Array.from({ length: 24 }, (_, hour) => {
            const found = hourlyMap.get(hour);
            return {
                hour,
                sessions: found?.sessions || 0,
                cardsTotal: found?.cardsTotal || 0,
                avgCards: found?.avgCards || 0,
            };
        });
    }, [rawData]);

    const mostProductiveLocalHour = useMemo(() => {
        if (data.length === 0) return null;

        const maxHour = data.reduce((max, current) =>
                current.avgCards > max.avgCards ? current : max,
            { hour: 0, avgCards: 0 }
        );

        return maxHour.avgCards > 0 ? maxHour : null;
    }, [data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Lernzeiten-Analyse</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 || data.every(hour => hour.cardsTotal === 0) ? (
                    <div className="text-muted-foreground text-sm">
                        <p>Noch keine Lernsessions durchgeführt.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative h-8">
                            <div className="grid grid-cols-24 gap-0.5">
                                {data.map((hour) => (
                                    <div
                                        key={hour.hour}
                                        className="relative h-full"
                                        title={`${hour.hour}:00 - ${hour.cardsTotal} Karten in ${hour.sessions} Sessions`}
                                    >
                                        <div
                                            className="bg-primary/20 hover:bg-primary/30 absolute bottom-0 w-full rounded-t-sm transition-colors"
                                            style={{
                                                height: `${
                                                    hour.cardsTotal > 0
                                                        ? (hour.cardsTotal /
                                                            Math.max(
                                                                ...data.map(
                                                                    (d) =>
                                                                        d.cardsTotal ||
                                                                        1
                                                                )
                                                            )) *
                                                        100
                                                        : 0
                                                }%`,
                                                minHeight:
                                                    hour.cardsTotal > 0
                                                        ? '2px'
                                                        : '0px',
                                            }}
                                        />
                                        {hour.hour % 6 === 0 && (
                                            <div className="text-muted-foreground absolute -bottom-6 text-xs">
                                                {hour.hour}:00
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {mostProductiveLocalHour && (
                            <div className="text-sm">
                                <p className="text-muted-foreground">
                                    Deine produktivste Lernzeit ist um{' '}
                                    {mostProductiveLocalHour.hour}:00 Uhr mit
                                    durchschnittlich{' '}
                                    {mostProductiveLocalHour.avgCards.toFixed(1)}{' '}
                                    Karten pro Session.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}