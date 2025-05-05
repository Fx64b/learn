'use server'

import { db } from '@/db'
import { cardReviews, flashcards } from '@/db/schema'
import { authOptions } from '@/lib/auth'
import { and, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'

import { getServerSession } from 'next-auth'

import { getTimeOfDayAnalysis } from '@/app/actions/study-session'

export async function getLearningProgress() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return null

    const userId = session.user.id

    // Get progress data for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyProgress = await db
        .select({
            date: sql<string>`DATE(${cardReviews.bewertetAm}, 'unixepoch', 'localtime')`.as(
                'date'
            ),
            cardsReviewed: sql<number>`COUNT(*)`.as('cardsReviewed'),
            correctPercentage:
                sql<number>`CAST(SUM(CASE WHEN ${cardReviews.bewertung} >= 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS INTEGER)`.as(
                    'correctPercentage'
                ),
        })
        .from(cardReviews)
        .where(
            and(
                eq(cardReviews.userId, userId),
                gte(cardReviews.bewertetAm, thirtyDaysAgo)
            )
        )
        .groupBy(sql`DATE(${cardReviews.bewertetAm}, 'unixepoch', 'localtime')`)
        .orderBy(sql`DATE(${cardReviews.bewertetAm}, 'unixepoch', 'localtime')`)

    // Overall stats
    const totalReviews = await db
        .select({
            count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(cardReviews)
        .where(eq(cardReviews.userId, userId))

    const totalCorrect = await db
        .select({
            count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(cardReviews)
        .where(
            and(eq(cardReviews.userId, userId), gte(cardReviews.bewertung, 3))
        )

    // Study streak calculation
    const streak = await calculateStreak(userId)

    // Cards by difficulty distribution
    const cardsByDifficulty = await db
        .select({
            difficultyCategory: sql<number>`
                CASE 
                WHEN t.ease_faktor >= 265 THEN 4
                WHEN t.ease_faktor >= 250 THEN 3
                WHEN t.ease_faktor >= 235 THEN 2
                ELSE 1
                END`.as('difficultyCategory'),
            count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(
            sql`(
                    SELECT
                        cr.flashcard_id,
                        cr.ease_faktor,
                        cr.bewertung,
                        ROW_NUMBER() OVER (PARTITION BY cr.flashcard_id ORDER BY cr.bewertet_am DESC) as rn
                    FROM card_reviews cr
                    WHERE cr.user_id = ${userId}
                ) t`
        )
        .where(sql`t.rn = 1`)
        .groupBy(sql`difficultyCategory`)
        .orderBy(sql`difficultyCategory DESC`)

    const now = new Date()
    const needsReview = await db
        .select({
            flashcard: flashcards,
            review: cardReviews,
        })
        .from(flashcards)
        .leftJoin(
            cardReviews,
            and(
                eq(flashcards.id, cardReviews.flashcardId),
                eq(cardReviews.userId, userId)
            )
        )
        .where(
            or(
                isNull(cardReviews.nächsteWiederholung),
                lte(cardReviews.nächsteWiederholung, now)
            )
        )

    const timeOfDayData = await getTimeOfDayAnalysis()

    return {
        dailyProgress,
        totalReviews: totalReviews[0]?.count || 0,
        totalCorrect: totalCorrect[0]?.count || 0,
        streak,
        cardsByDifficulty,
        needsReview,
        timeOfDay: timeOfDayData.success
            ? {
                rawData: timeOfDayData.rawData,
            }
            : {
                rawData: [],
            },
    }
}

async function calculateStreak(userId: string): Promise<number> {
    const reviewDates = await db
        .select({
            date: sql<string>`DATE(${cardReviews.bewertetAm}, 'unixepoch', 'localtime')`.as(
                'date'
            ),
        })
        .from(cardReviews)
        .where(eq(cardReviews.userId, userId))
        .groupBy(sql`DATE(${cardReviews.bewertetAm}, 'unixepoch', 'localtime')`)
        .orderBy(
            desc(sql`DATE(${cardReviews.bewertetAm}, 'unixepoch', 'localtime')`)
        )

    if (reviewDates.length === 0) return 0

    const today = new Date()

    let streak = 0
    const currentDate = new Date(today)

    for (let i = 0; i < reviewDates.length; i++) {
        const dateStr = currentDate.toISOString().split('T')[0]

        if (reviewDates[i].date === dateStr) {
            streak++
            currentDate.setDate(currentDate.getDate() - 1)
        } else {
            break
        }
    }

    return streak
}
