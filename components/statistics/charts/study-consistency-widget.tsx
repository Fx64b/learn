'use client'

import { useMemo } from 'react'

import { useTranslations } from 'next-intl'
import { Calendar, Flame, Clock } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StudyConsistencyProps {
    data: Array<{
        date: string
        cardsReviewed: number
        correctPercentage: number
    }>
    streak: number
}

export function StudyConsistencyWidget({ data, streak }: StudyConsistencyProps) {
    const t = useTranslations('statistics.consistency')

    const consistencyData = useMemo(() => {
        if (data.length === 0) return { 
            activeDays: 0, 
            consistency: 0, 
            longestGap: 0, 
            weeklyPattern: [],
            totalDays: 0
        }

        const activeDays = data.filter(day => day.cardsReviewed > 0)
        const totalDays = 7 // Last 7 days
        const consistency = (activeDays.length / totalDays) * 100

        // Calculate longest gap between study sessions
        let longestGap = 0
        let currentGap = 0
        
        for (const day of data) {
            if (day.cardsReviewed > 0) {
                currentGap = 0
            } else {
                currentGap++
                longestGap = Math.max(longestGap, currentGap)
            }
        }

        // Create weekly pattern visualization
        const weeklyPattern = data.map(day => ({
            date: day.date,
            active: day.cardsReviewed > 0,
            cards: day.cardsReviewed
        }))

        return { 
            activeDays: activeDays.length, 
            consistency, 
            longestGap, 
            weeklyPattern,
            totalDays
        }
    }, [data])

    const getConsistencyLevel = (consistency: number) => {
        if (consistency >= 85) return { label: t('excellent'), color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' }
        if (consistency >= 60) return { label: t('good'), color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' }
        if (consistency >= 40) return { label: t('fair'), color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' }
        return { label: t('needsImprovement'), color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' }
    }

    const consistencyLevel = getConsistencyLevel(consistencyData.consistency)

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    {t('title')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="text-muted-foreground text-sm">
                        <p>{t('noData')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Weekly pattern visualization */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">{t('weeklyPattern')}</p>
                            <div className="flex gap-1">
                                {consistencyData.weeklyPattern.map((day, index) => {
                                    const date = new Date(day.date)
                                    const dayName = date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)
                                    
                                    return (
                                        <div key={index} className="flex flex-col items-center gap-1">
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                                                    day.active 
                                                        ? 'bg-green-500 text-white shadow-sm' 
                                                        : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
                                                }`}
                                                title={`${day.date}: ${day.cards} cards`}
                                            >
                                                {day.active ? '✓' : dayName}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {dayName}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Consistency metrics */}
                        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    <div className="text-lg font-bold text-orange-600">
                                        {streak}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('currentStreak')}
                                </p>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">
                                    {consistencyData.activeDays}/{consistencyData.totalDays}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('activeDays')}
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">
                                    {consistencyData.consistency.toFixed(0)}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('consistency')}
                                </p>
                            </div>
                        </div>

                        {/* Consistency badge */}
                        <div className={`p-2 rounded-lg ${consistencyLevel.bgColor}`}>
                            <p className={`text-sm font-medium ${consistencyLevel.color} text-center`}>
                                {consistencyLevel.label}
                            </p>
                        </div>

                        {/* Gap warning */}
                        {consistencyData.longestGap > 2 && (
                            <div className="text-sm text-muted-foreground">
                                <Clock className="inline h-4 w-4 mr-1" />
                                {t('longestGap', { days: consistencyData.longestGap })}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}