'use client'

import { ProgressData } from '@/types'

import { StudyTimeAnalysis } from '@/components/statistics/charts/study-time-analysis'
import { SimpleProgressDashboard } from '@/components/statistics/simple-progress-dashboard'

interface ProgressDashboardProps {
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
                front: string
                back: string
                deckId: string
                isExamRelevant: boolean
                difficultyLevel: number
                createdAt: Date
            }
            review: {
                id: string
                flashcardId: string
                userId: string
                reviewedAt: Date
                rating: number
                easeFactor: number
                interval: number
                nextReview: Date
            } | null
        }>
        timeOfDay: {
            rawData: Array<{
                startTime: number
                sessions: number
                cardsTotal: number
                avgCards: number
            }>
        }
    }
}

export function ProgressDashboard({ data }: ProgressDashboardProps) {
    return (
        <div className="space-y-6">
            <SimpleProgressDashboard data={data} />
            <StudyTimeAnalysis rawData={data.timeOfDay.rawData} />
        </div>
    )
}
