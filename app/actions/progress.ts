'use server'

import { db } from '@/db'
import { cardReviews, decks, flashcards, reviewEvents } from '@/db/schema'
import { authOptions } from '@/lib/auth'
import { and, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'

import { getServerSession } from 'next-auth'

import { getTimeOfDayAnalysis } from '@/app/actions/study-session'

export async function getLearningProgress() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return null

    const userId = session.user.id
    const now = new Date()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyProgress = await db
        .select({
            date: sql<string>`DATE(${reviewEvents.bewertetAm}, 'unixepoch', 'localtime')`.as(
                'date'
            ),
            cardsReviewed: sql<number>`COUNT(*)`.as('cardsReviewed'),
            correctPercentage:
                sql<number>`CAST(SUM(CASE WHEN ${reviewEvents.bewertung} >= 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS INTEGER)`.as(
                    'correctPercentage'
                ),
        })
        .from(reviewEvents)
        .where(
            and(
                eq(reviewEvents.userId, userId),
                gte(reviewEvents.bewertetAm, thirtyDaysAgo)
            )
        )
        .groupBy(
            sql`DATE(${reviewEvents.bewertetAm}, 'unixepoch', 'localtime')`
        )
        .orderBy(
            sql`DATE(${reviewEvents.bewertetAm}, 'unixepoch', 'localtime')`
        )

    const totalReviews = await db
        .select({
            count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(reviewEvents)
        .where(eq(reviewEvents.userId, userId))

    const totalCorrect = await db
        .select({
            count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(reviewEvents)
        .where(
            and(eq(reviewEvents.userId, userId), gte(reviewEvents.bewertung, 3))
        )

    const streak = await calculateStreak(userId)

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

    const needsReview = await db
        .select({
            flashcard: flashcards,
            review: cardReviews,
        })
        .from(flashcards)
        .innerJoin(decks, eq(flashcards.deckId, decks.id))
        .leftJoin(
            cardReviews,
            and(
                eq(flashcards.id, cardReviews.flashcardId),
                eq(cardReviews.userId, userId)
            )
        )
        .where(
            and(
                eq(decks.userId, userId),
                or(
                    isNull(cardReviews.naechsteWiederholung),
                    lte(cardReviews.naechsteWiederholung, now)
                ),
                or(isNull(decks.aktivBis), gte(decks.aktivBis, now))
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
        timeOfDay: {
            rawData: timeOfDayData.rawData || [],
        },
    }
}

async function calculateStreak(userId: string): Promise<number> {
    const reviewDates = await db
        .select({
            date: sql<string>`DATE(${reviewEvents.bewertetAm}, 'unixepoch', 'localtime')`.as(
                'date'
            ),
        })
        .from(reviewEvents)
        .where(eq(reviewEvents.userId, userId))
        .groupBy(
            sql`DATE(${reviewEvents.bewertetAm}, 'unixepoch', 'localtime')`
        )
        .orderBy(
            desc(
                sql`DATE(${reviewEvents.bewertetAm}, 'unixepoch', 'localtime')`
            )
        )

    if (reviewDates.length === 0) return 0

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    let streak = 0
    let currentDate = new Date(today)
    let currentDateStr = currentDate.toISOString().split('T')[0]

    const studiedToday = reviewDates.some((date) => date.date === todayStr)

    if (!studiedToday) {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (reviewDates.length > 0 && reviewDates[0].date === yesterdayStr) {
            currentDate = yesterday
            currentDateStr = yesterdayStr
        }
    }

    for (let i = 0; i < reviewDates.length; i++) {
        if (reviewDates[i].date === currentDateStr) {
            streak++
            currentDate.setDate(currentDate.getDate() - 1)
            currentDateStr = currentDate.toISOString().split('T')[0]
        } else {
            break
        }
    }

    return streak
}
