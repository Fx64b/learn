'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StudyTimeAnalysisProps {
    data: Array<{
        hour: number
        sessions: number
        cardsTotal: number
        avgCards: number
    }>
    mostProductiveHour: {
        hour: number
        avgCards: number
    } | null
}

export function StudyTimeAnalysis({
    data,
    mostProductiveHour,
}: StudyTimeAnalysisProps) {
    console.log('StudyTimeAnalysis - data:', data)
    console.log('StudyTimeAnalysis - mostProductiveHour:', mostProductiveHour)
    console.log('Data length:', data.length)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Lernzeiten-Analyse</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
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
                        {mostProductiveHour && (
                            <div className="text-sm">
                                <p className="text-muted-foreground">
                                    Deine produktivste Lernzeit ist{' '}
                                    {mostProductiveHour.hour}:00 Uhr mit
                                    durchschnittlich{' '}
                                    {mostProductiveHour.avgCards.toFixed(1)}{' '}
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
