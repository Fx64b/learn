'use client'

import { useMemo } from 'react'

import { useTranslations } from 'next-intl'
import { TrendingUp, Award } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LearningVelocityProps {
    data: Array<{
        date: string
        cardsReviewed: number
        correctPercentage: number
    }>
}

export function LearningVelocityChart({ data }: LearningVelocityProps) {
    const t = useTranslations('statistics.velocityChart')

    const velocityData = useMemo(() => {
        if (data.length === 0) return { trend: 0, improvement: 0, currentAccuracy: 0, bestAccuracy: 0 }

        // Only consider days with activity
        const activeDays = data.filter(day => day.cardsReviewed > 0)
        
        if (activeDays.length === 0) return { trend: 0, improvement: 0, currentAccuracy: 0, bestAccuracy: 0 }

        const currentAccuracy = activeDays[activeDays.length - 1]?.correctPercentage || 0
        const bestAccuracy = Math.max(...activeDays.map(day => day.correctPercentage))
        
        // Calculate trend (simple linear regression slope)
        let trend = 0
        if (activeDays.length >= 2) {
            const n = activeDays.length
            const sumX = activeDays.reduce((sum, _, index) => sum + index, 0)
            const sumY = activeDays.reduce((sum, day) => sum + day.correctPercentage, 0)
            const sumXY = activeDays.reduce((sum, day, index) => sum + index * day.correctPercentage, 0)
            const sumX2 = activeDays.reduce((sum, _, index) => sum + index * index, 0)
            
            trend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
        }

        // Calculate improvement from first to last day
        const improvement = activeDays.length >= 2 
            ? activeDays[activeDays.length - 1].correctPercentage - activeDays[0].correctPercentage
            : 0

        return { trend, improvement, currentAccuracy, bestAccuracy }
    }, [data])

    const getTrendLabel = (trend: number) => {
        if (trend > 1) return { label: t('strongImprovement'), color: 'text-green-600', icon: '📈' }
        if (trend > 0.2) return { label: t('improving'), color: 'text-green-500', icon: '📊' }
        if (trend > -0.2) return { label: t('stable'), color: 'text-blue-500', icon: '➡️' }
        if (trend > -1) return { label: t('declining'), color: 'text-yellow-500', icon: '📉' }
        return { label: t('needsAttention'), color: 'text-red-500', icon: '⚠️' }
    }

    const trendInfo = getTrendLabel(velocityData.trend)

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    {t('title')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 || data.every(day => day.cardsReviewed === 0) ? (
                    <div className="text-muted-foreground text-sm">
                        <p>{t('noData')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {velocityData.currentAccuracy}%
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t('currentAccuracy')}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                                <div className="flex items-center justify-center gap-1">
                                    <Award className="h-4 w-4 text-green-600" />
                                    <div className="text-2xl font-bold text-green-600">
                                        {velocityData.bestAccuracy}%
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t('bestAccuracy')}
                                </p>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{trendInfo.icon}</span>
                                <span className={`font-medium ${trendInfo.color}`}>
                                    {trendInfo.label}
                                </span>
                            </div>
                            
                            {velocityData.improvement !== 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {velocityData.improvement > 0 ? t('improvedBy') : t('decreasedBy')} {' '}
                                    <span className={`font-medium ${velocityData.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {Math.abs(velocityData.improvement).toFixed(1)}%
                                    </span>
                                    {' '}{t('sinceStart')}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}