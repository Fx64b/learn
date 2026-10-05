'use server'

import { db } from '@/db'
import * as learnDb from '@/db/learn'
import { getDeckById } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { displayStreak, isValidTimeZone, localDate } from '@/lib/gamification'
import {
    type ExerciseDescriptor,
    buildMatchGame,
    buildSession,
    buildTest,
    exerciseXp,
    isExerciseKind,
    isValidGrade,
    matchGameXp,
    sessionBonusXp,
    testXp,
} from '@/lib/learn'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { z } from 'zod'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'

const MAX_EXERCISE_MS = 10 * 60 * 1000

type Failure = { success: false; error: string }

async function requireUser(
    limit: 'studyReview' | 'studySession' | 'dataRetrieval'
): Promise<{ userId: string } | Failure> {
    const authT = await getTranslations('auth')
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return { success: false, error: authT('notAuthenticated') }
    }
    const rate = await checkRateLimit(`user:${session.user.id}:${limit}`, limit)
    if (!rate.success) {
        return { success: false, error: authT('ratelimitExceeded') }
    }
    return { userId: session.user.id }
}

const timezone = z
    .string()
    .optional()
    .transform((tz) => (isValidTimeZone(tz) ? tz : undefined))

/** Resolves a learn scope (deck id or "due" / "all" / "difficult"). */
async function resolveScope(
    userId: string,
    scope: string
): Promise<learnDb.StudyScope | null> {
    if (scope === 'due' || scope === 'all') return { type: 'due' }
    if (scope === 'difficult') return { type: 'difficult' }
    const deck = await getDeckById(scope, userId)
    return deck ? { type: 'deck', deckId: deck.id } : null
}

export interface LearnSessionData {
    success: true
    exercises: ExerciseDescriptor[]
    /** Items in scope, so the UI can tell an empty deck from "all done". */
    totalItems: number
}

/** Plans a learn session for a deck or one of the cross-deck scopes. */
export async function loadLearnSession(
    scope: string
): Promise<LearnSessionData | Failure> {
    const user = await requireUser('dataRetrieval')
    if (!('userId' in user)) return user
    const t = await getTranslations('session')

    const resolved = await resolveScope(user.userId, scope)
    if (!resolved) return { success: false, error: t('errors.notFound') }

    const items = await learnDb.getStudyItems(user.userId, resolved)
    return {
        success: true,
        exercises: buildSession(items),
        totalItems: items.length,
    }
}

/** Plans a practice test for a deck. Tests never change the SRS schedule. */
export async function loadTest(deckId: string, count = 20) {
    const user = await requireUser('dataRetrieval')
    if (!('userId' in user)) return user
    const t = await getTranslations('session')

    const resolved = await resolveScope(user.userId, deckId)
    if (!resolved || resolved.type !== 'deck') {
        return { success: false as const, error: t('errors.notFound') }
    }
    const items = await learnDb.getStudyItems(user.userId, resolved)
    return {
        success: true as const,
        exercises: buildTest(items, {
            count: Math.min(50, Math.max(5, count)),
        }),
    }
}

/** Pairs for the match game of a deck. */
export async function loadMatchGame(deckId: string) {
    const user = await requireUser('dataRetrieval')
    if (!('userId' in user)) return user
    const t = await getTranslations('session')

    const resolved = await resolveScope(user.userId, deckId)
    if (!resolved || resolved.type !== 'deck') {
        return { success: false as const, error: t('errors.notFound') }
    }
    const items = await learnDb.getStudyItems(user.userId, resolved)
    const record = await learnDb.getDeckRecord(user.userId, deckId)
    return {
        success: true as const,
        pairs: buildMatchGame(items).map(({ left, right }) => ({
            left,
            right,
        })),
        bestMs: record?.bestMatchMs ?? null,
    }
}

const exerciseResultSchema = z.object({
    kind: z.string().refine(isExerciseKind),
    itemIds: z.array(z.string().min(1).max(64)).min(1).max(10),
    practice: z.boolean(),
    retry: z.boolean(),
    correct: z.boolean(),
    grades: z.record(z.string(), z.number().refine(isValidGrade)),
    combo: z.number().int().min(0).max(10_000),
    durationMs: z.number().min(0),
    timezone,
})

export type ExerciseResultInput = z.input<typeof exerciseResultSchema>

export interface ExerciseResultData {
    success: true
    xp: number
    todayXp: number
    dailyGoalXp: number
    goalReachedNow: boolean
    streak: number
    streakExtended: boolean
}

/**
 * Stores one answered exercise: updates the SRS state of its items (first
 * attempt only, never for practice), adds XP and keeps the streak.
 */
export async function submitExerciseResult(
    input: ExerciseResultInput
): Promise<ExerciseResultData | Failure> {
    const user = await requireUser('studyReview')
    if (!('userId' in user)) return user
    const t = await getTranslations('session')

    const parsed = exerciseResultSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: t('errors.invalid') }
    const data = parsed.data
    const itemIds = [...new Set(data.itemIds)]

    const owned = await learnDb.getOwnedItemIds(user.userId, itemIds)
    if (owned.length !== itemIds.length) {
        return { success: false, error: t('errors.notFound') }
    }

    const writeSrs = !data.practice && !data.retry
    if (writeSrs && itemIds.some((id) => !isValidGrade(data.grades[id]))) {
        return { success: false, error: t('errors.invalid') }
    }

    const xp = exerciseXp({
        kind: data.kind as ExerciseDescriptor['kind'],
        correct: data.correct,
        retry: data.retry,
        combo: data.combo,
        items: itemIds.length,
    })

    try {
        const dailyGoalXp = await learnDb.getDailyGoal(user.userId)
        const result = await db.transaction(async (tx) => {
            if (writeSrs) {
                for (const id of itemIds) {
                    await learnDb.applyReview(tx, {
                        userId: user.userId,
                        flashcardId: id,
                        grade: data.grades[id] as 1 | 2 | 3 | 4,
                        exerciseType: data.kind,
                    })
                }
            }
            return learnDb.recordActivity(tx, {
                userId: user.userId,
                xp,
                exercises: 1,
                correct: data.correct ? 1 : 0,
                timeMs: Math.min(MAX_EXERCISE_MS, data.durationMs),
                timezone: data.timezone,
            })
        })

        return {
            success: true,
            xp,
            todayXp: result.todayXp,
            dailyGoalXp,
            goalReachedNow:
                result.todayXp >= dailyGoalXp &&
                result.todayXp - xp < dailyGoalXp,
            streak: result.stats.currentStreak,
            streakExtended: result.streak.extended,
        }
    } catch (error) {
        console.error('Error saving exercise result:', error)
        return { success: false, error: t('errors.save') }
    }
}

const sessionSchema = z.object({
    sessionId: z.string().min(1).max(64),
    scope: z.string().min(1).max(64),
    startedAt: z.number(),
    exercises: z.number().int().min(0).max(500),
    mistakes: z.number().int().min(0).max(500),
    completed: z.boolean(),
    timezone,
})

export type CompleteSessionInput = z.input<typeof sessionSchema>

export interface RewardData {
    success: true
    bonusXp: number
    todayXp: number
    dailyGoalXp: number
    totalXp: number
    streak: number
    newAchievements: string[]
}

async function reward(
    userId: string,
    bonusXp: number,
    tz: string | undefined,
    event: Parameters<typeof learnDb.unlockAchievements>[2]
): Promise<RewardData> {
    const activity = await db.transaction((tx) =>
        learnDb.recordActivity(tx, { userId, xp: bonusXp, timezone: tz })
    )
    const dailyGoalXp = await learnDb.getDailyGoal(userId)
    const newAchievements = await learnDb.unlockAchievements(
        userId,
        activity.stats,
        { ...event, dailyGoalReached: activity.todayXp >= dailyGoalXp }
    )
    return {
        success: true,
        bonusXp,
        todayXp: activity.todayXp,
        dailyGoalXp,
        totalXp: activity.stats.totalXp,
        streak: activity.stats.currentStreak,
        newAchievements,
    }
}

/** Finishes a learn session: completion bonus, session log, achievements. */
export async function completeSession(
    input: CompleteSessionInput
): Promise<RewardData | Failure> {
    const user = await requireUser('studySession')
    if (!('userId' in user)) return user
    const t = await getTranslations('session')

    const parsed = sessionSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: t('errors.invalid') }
    const data = parsed.data

    try {
        const now = new Date()
        const startedAt = new Date(
            Math.min(now.getTime(), Math.max(0, data.startedAt))
        )
        await learnDb.saveSession({
            id: data.sessionId,
            userId: user.userId,
            deckId: data.scope,
            startTime: startedAt,
            endTime: now,
            cardsReviewed: data.exercises,
            isCompleted: data.completed,
        })
        const completed = data.completed && data.exercises > 0
        return await reward(
            user.userId,
            sessionBonusXp({ completed, perfect: data.mistakes === 0 }),
            data.timezone,
            { perfectSession: completed && data.mistakes === 0 }
        )
    } catch (error) {
        console.error('Error completing session:', error)
        return { success: false, error: t('errors.save') }
    }
}

const matchSchema = z.object({
    deckId: z.string().min(1).max(64),
    pairs: z.number().int().min(1).max(20),
    timeMs: z
        .number()
        .int()
        .min(1000)
        .max(60 * 60 * 1000),
    timezone,
})

/** Stores a finished match game and its personal best. */
export async function completeMatchGame(
    input: z.input<typeof matchSchema>
): Promise<(RewardData & { newBest: boolean }) | Failure> {
    const user = await requireUser('studySession')
    if (!('userId' in user)) return user
    const t = await getTranslations('session')

    const parsed = matchSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: t('errors.invalid') }
    const data = parsed.data
    if (!(await getDeckById(data.deckId, user.userId))) {
        return { success: false, error: t('errors.notFound') }
    }

    try {
        // Only full games (6 pairs) count as records.
        const newBest =
            data.pairs >= 6 &&
            (await learnDb.saveDeckRecord(user.userId, data.deckId, {
                matchMs: data.timeMs,
            }))
        const result = await reward(
            user.userId,
            matchGameXp(data.pairs, newBest),
            data.timezone,
            data.pairs >= 6 ? { matchTimeMs: data.timeMs } : {}
        )
        return { ...result, newBest }
    } catch (error) {
        console.error('Error saving match game:', error)
        return { success: false, error: t('errors.save') }
    }
}

const testSchema = z.object({
    deckId: z.string().min(1).max(64),
    total: z.number().int().min(1).max(50),
    correct: z.number().int().min(0).max(50),
    timezone,
})

/** Stores a finished practice test and its best score. */
export async function completeTest(
    input: z.input<typeof testSchema>
): Promise<(RewardData & { newBest: boolean; score: number }) | Failure> {
    const user = await requireUser('studySession')
    if (!('userId' in user)) return user
    const t = await getTranslations('session')

    const parsed = testSchema.safeParse(input)
    if (!parsed.success || parsed.data.correct > parsed.data.total) {
        return { success: false, error: t('errors.invalid') }
    }
    const data = parsed.data
    if (!(await getDeckById(data.deckId, user.userId))) {
        return { success: false, error: t('errors.notFound') }
    }

    try {
        const score = Math.round((data.correct / data.total) * 100)
        const newBest = await learnDb.saveDeckRecord(user.userId, data.deckId, {
            testScore: score,
        })
        const result = await reward(user.userId, testXp(score), data.timezone, {
            testScore: data.total >= 10 ? score : undefined,
        })
        return { ...result, newBest, score }
    } catch (error) {
        console.error('Error saving test:', error)
        return { success: false, error: t('errors.save') }
    }
}

export interface GamificationSummary {
    totalXp: number
    streak: number
    longestStreak: number
    streakFreezes: number
    /** Not active today yet, but the streak is still alive. */
    streakAtRisk: boolean
    todayXp: number
    dailyGoalXp: number
}

/** XP, streak and daily goal for the header and dashboard. */
export async function getGamificationSummary(): Promise<GamificationSummary | null> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return null
    const userId = session.user.id
    try {
        const stats = await learnDb.ensureUserStats(db, userId)
        const today = localDate(new Date(), stats.timezone)
        const [todayXp, dailyGoalXp] = await Promise.all([
            learnDb.getTodayXp(userId, today),
            learnDb.getDailyGoal(userId),
        ])
        const streak = displayStreak(stats, today)
        return {
            totalXp: stats.totalXp,
            streak,
            longestStreak: stats.longestStreak,
            streakFreezes: stats.streakFreezes,
            streakAtRisk: streak > 0 && stats.lastActiveDate !== today,
            todayXp,
            dailyGoalXp,
        }
    } catch (error) {
        console.error('Error loading gamification summary:', error)
        return null
    }
}
