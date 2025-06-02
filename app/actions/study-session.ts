'use server'

import { db } from '@/db'
import { studySessions } from '@/db/schema'
import { authOptions } from '@/lib/auth'
import { eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { getServerSession } from 'next-auth'
import {getTranslations} from "next-intl/server";

export async function saveStudySession(data: {
    id?: string
    deckId: string
    startTime: Date
    endTime: Date
    duration: number
    cardsReviewed: number
    isCompleted: boolean
}) {
    const authT = await getTranslations('auth')

    // TODO: this is not working 100% yet.
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const id = data.id || nanoid()

        // Early return to prevent unnecessary DB operations
        if (!data.id && data.cardsReviewed === 0) {
            return { success: true }
        }

        if (data.id) {
            await db
                .update(studySessions)
                .set({
                    endTime: data.endTime,
                    duration: data.duration,
                    cardsReviewed: data.cardsReviewed,
                    isCompleted: data.isCompleted,
                })
                .where(eq(studySessions.id, data.id))
        } else {
            await db.insert(studySessions).values({
                id,
                userId: session.user.id,
                deckId: data.deckId,
                startTime: data.startTime,
                endTime: data.endTime,
                duration: data.duration,
                cardsReviewed: data.cardsReviewed,
                isCompleted: data.isCompleted,
                erstelltAm: new Date(),
            })
        }

        return { success: true, id }
    } catch (error) {
        console.error('Error saving study session:', error)
        return { success: false, error: 'Failed to save study session' }
    }
}

export async function getTimeOfDayAnalysis() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, data: [], mostProductiveHour: null }
        }

        const hourlyData = await db
            .select({
                startTime: sql<number>`${studySessions.startTime}`.as(
                    'startTime'
                ),
                sessions: sql<number>`COUNT(*)`.as('sessions'),
                cardsTotal: sql<number>`SUM(${studySessions.cardsReviewed})`.as(
                    'cardsTotal'
                ),
                avgCards:
                    sql<number>`CAST(AVG(${studySessions.cardsReviewed}) AS REAL)`.as(
                        'avgCards'
                    ),
            })
            .from(studySessions)
            .where(eq(studySessions.userId, session.user.id))
            .groupBy(
                sql`strftime('%H', datetime(${studySessions.startTime}, 'unixepoch'))`
            )

        return {
            success: true,
            rawData: hourlyData,
        }
    } catch (error) {
        console.error('Error getting time of day analysis:', error)
        return { success: false, data: [], rawData: [] } // Immer rawData zurueckgeben, auch bei Fehler
    }
}
