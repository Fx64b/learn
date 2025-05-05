'use server'

import { db } from '@/db'
import { studySessions } from '@/db/schema'
import { authOptions } from '@/lib/auth'
import { desc, eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { getServerSession } from 'next-auth'

export async function saveStudySession(data: {
    deckId: string
    startTime: Date
    endTime: Date
    duration: number
    cardsReviewed: number
    isCompleted: boolean
}) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: 'Not authenticated' }
        }

        const id = nanoid()
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

        return { success: true, id }
    } catch (error) {
        console.error('Error saving study session:', error)
        return { success: false, error: 'Failed to save study session' }
    }
}

export async function getStudySessions() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, data: [] }
        }

        const sessions = await db
            .select()
            .from(studySessions)
            .where(eq(studySessions.userId, session.user.id))
            .orderBy(desc(studySessions.startTime))

        return { success: true, data: sessions }
    } catch (error) {
        console.error('Error fetching study sessions:', error)
        return { success: false, data: [] }
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
                startTime: studySessions.startTime, // Rohe UNIX timestamp
                sessions: sql<number>`COUNT(*)`.as('sessions'),
                cardsTotal: sql<number>`SUM(${studySessions.cardsReviewed})`.as('cardsTotal'),
                avgCards: sql<number>`CAST(AVG(${studySessions.cardsReviewed}) AS REAL)`.as('avgCards'),
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
        return { success: false, data: [], mostProductiveHour: null }
    }
}