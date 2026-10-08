import {
    type AchievementSnapshot,
    type StreakState,
    type StreakUpdate,
    applyActivity,
    localDate,
    newAchievements,
    streakFromDates,
} from '@/lib/gamification'
import { parseItemRow } from '@/lib/items'
import {
    MASTERED_INTERVAL,
    type ReviewState,
    type SrsGrade,
    type StudyItem,
} from '@/lib/learn'
import { calculateNextReview } from '@/lib/srs'
import {
    and,
    count,
    countDistinct,
    eq,
    gte,
    inArray,
    isNull,
    or,
    sql,
} from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { db } from './index'
import {
    cardReviews,
    dailyActivity,
    deckRecords,
    decks,
    flashcards,
    reviewEvents,
    studySessions,
    userAchievements,
    userPreferences,
    userStats,
} from './schema'

/** `db` or a transaction. */
type Executor = Pick<typeof db, 'select' | 'insert' | 'update' | 'delete'>

export type StudyScope =
    | { type: 'deck'; deckId: string }
    | { type: 'due' }
    | { type: 'difficult' }

/** Ease factor (x100) below which an item counts as difficult. */
const DIFFICULT_EASE = 250

function activeDeck(now: Date) {
    return or(isNull(decks.activeUntil), gte(decks.activeUntil, now))
}

/** Items of the user's decks with their latest SRS state. */
export async function getStudyItems(
    userId: string,
    scope: StudyScope
): Promise<(StudyItem & { deckTitle: string })[]> {
    const now = new Date()
    const rows = await db
        .select({
            flashcard: flashcards,
            deckTitle: decks.title,
            review: cardReviews,
        })
        .from(flashcards)
        .innerJoin(decks, eq(flashcards.deckId, decks.id))
        .leftJoin(
            cardReviews,
            and(
                eq(cardReviews.flashcardId, flashcards.id),
                eq(cardReviews.userId, userId)
            )
        )
        .where(
            and(
                eq(decks.userId, userId),
                scope.type === 'deck'
                    ? eq(decks.id, scope.deckId)
                    : activeDeck(now)
            )
        )

    // card_reviews holds one row per user and item. Keep the newest if not.
    const byId = new Map<string, (typeof rows)[number]>()
    for (const row of rows) {
        const prev = byId.get(row.flashcard.id)
        if (
            !prev ||
            (row.review &&
                (!prev.review ||
                    row.review.reviewedAt > prev.review.reviewedAt))
        ) {
            byId.set(row.flashcard.id, row)
        }
    }

    const items = [...byId.values()].map((row) => ({
        item: parseItemRow(row.flashcard),
        deckTitle: row.deckTitle,
        review: row.review ? toReviewState(row.review) : null,
    }))

    if (scope.type === 'difficult') {
        return items.filter(
            (e) =>
                e.review &&
                (e.review.easeFactor * 100 < DIFFICULT_EASE ||
                    e.review.rating <= 1)
        )
    }
    return items
}

function toReviewState(row: typeof cardReviews.$inferSelect): ReviewState {
    return {
        rating: row.rating,
        interval: row.interval,
        easeFactor: row.easeFactor / 100,
        nextReview: row.nextReview,
    }
}

/** The subset of `ids` that belongs to the user's decks. */
export async function getOwnedItemIds(userId: string, ids: string[]) {
    if (!ids.length) return []
    const rows = await db
        .select({ id: flashcards.id })
        .from(flashcards)
        .innerJoin(decks, eq(flashcards.deckId, decks.id))
        .where(and(eq(decks.userId, userId), inArray(flashcards.id, ids)))
    return rows.map((r) => r.id)
}

/** Applies SM-2 to one item and records the review event. */
export async function applyReview(
    tx: Executor,
    data: {
        userId: string
        flashcardId: string
        grade: SrsGrade
        exerciseType?: string
        now?: Date
    }
) {
    const now = data.now ?? new Date()
    const [previous] = await tx
        .select()
        .from(cardReviews)
        .where(
            and(
                eq(cardReviews.flashcardId, data.flashcardId),
                eq(cardReviews.userId, data.userId)
            )
        )
        .limit(1)

    const prevInterval = Math.max(0, previous?.interval ?? 0)
    const prevEase = previous
        ? Math.min(4, Math.max(1.3, previous.easeFactor / 100))
        : 2.5
    const { nextInterval, newEaseFactor } = calculateNextReview(
        data.grade,
        prevInterval,
        prevEase
    )
    // Easy answers keep raising the ease factor. Keep it in a sane range.
    const easeFactor = Math.round(Math.min(4, newEaseFactor) * 100)
    const nextReview = new Date(now.getTime() + nextInterval * 86_400_000)
    const values = {
        reviewedAt: now,
        rating: data.grade,
        easeFactor,
        interval: nextInterval,
        nextReview,
    }

    if (previous) {
        await tx
            .update(cardReviews)
            .set(values)
            .where(eq(cardReviews.id, previous.id))
    } else {
        await tx.insert(cardReviews).values({
            id: nanoid(),
            flashcardId: data.flashcardId,
            userId: data.userId,
            ...values,
        })
    }

    await tx.insert(reviewEvents).values({
        id: nanoid(),
        flashcardId: data.flashcardId,
        userId: data.userId,
        reviewedAt: now,
        rating: data.grade,
        easeFactor,
        interval: nextInterval,
        exerciseType: data.exerciseType ?? null,
    })

    await tx
        .update(flashcards)
        .set({ difficultyLevel: Math.max(0, Math.floor(5 - easeFactor / 100)) })
        .where(eq(flashcards.id, data.flashcardId))

    return { nextInterval, nextReview, easeFactor: easeFactor / 100 }
}

export type UserStatsRow = typeof userStats.$inferSelect

/** Returns the user's stats row, creating it from the activity history once. */
export async function ensureUserStats(
    tx: Executor,
    userId: string,
    timezone?: string
): Promise<UserStatsRow> {
    const [existing] = await tx
        .select()
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .limit(1)
    if (existing) {
        if (timezone && existing.timezone !== timezone) {
            await tx
                .update(userStats)
                .set({ timezone })
                .where(eq(userStats.userId, userId))
            return { ...existing, timezone }
        }
        return existing
    }

    const zone = timezone ?? 'UTC'
    const history = await tx
        .select({ date: dailyActivity.date, xp: dailyActivity.xp })
        .from(dailyActivity)
        .where(eq(dailyActivity.userId, userId))
    const streak = streakFromDates(
        history.map((h) => h.date),
        localDate(new Date(), zone)
    )
    const row: UserStatsRow = {
        userId,
        totalXp: history.reduce((sum, h) => sum + h.xp, 0),
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDate: streak.lastActiveDate,
        streakFreezes: streak.streakFreezes,
        timezone: zone,
        updatedAt: new Date(),
    }
    await tx.insert(userStats).values(row).onConflictDoNothing()
    return row
}

export interface ActivityResult {
    stats: UserStatsRow
    streak: StreakUpdate
    today: string
    todayXp: number
}

/** Adds XP and exercise counts to today's activity and updates the streak. */
export async function recordActivity(
    tx: Executor,
    data: {
        userId: string
        xp: number
        exercises?: number
        correct?: number
        timeMs?: number
        timezone?: string
        now?: Date
    }
): Promise<ActivityResult> {
    const stats = await ensureUserStats(tx, data.userId, data.timezone)
    const today = localDate(data.now ?? new Date(), stats.timezone)
    const exercises = data.exercises ?? 0
    const correct = data.correct ?? 0
    const timeMs = Math.max(0, Math.round(data.timeMs ?? 0))

    const [activity] = await tx
        .insert(dailyActivity)
        .values({
            userId: data.userId,
            date: today,
            xp: data.xp,
            exercises,
            correct,
            timeMs,
        })
        .onConflictDoUpdate({
            target: [dailyActivity.userId, dailyActivity.date],
            set: {
                xp: sql`${dailyActivity.xp} + ${data.xp}`,
                exercises: sql`${dailyActivity.exercises} + ${exercises}`,
                correct: sql`${dailyActivity.correct} + ${correct}`,
                timeMs: sql`${dailyActivity.timeMs} + ${timeMs}`,
            },
        })
        .returning({ xp: dailyActivity.xp })

    const state: StreakState = {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        lastActiveDate: stats.lastActiveDate,
        streakFreezes: stats.streakFreezes,
    }
    // Only real learning keeps the streak alive, not bonus XP alone.
    const streak =
        exercises > 0
            ? applyActivity(state, today)
            : {
                  state,
                  extended: false,
                  freezeUsed: false,
                  freezeEarned: false,
              }

    const updated: UserStatsRow = {
        ...stats,
        ...streak.state,
        totalXp: stats.totalXp + data.xp,
        updatedAt: new Date(),
    }
    await tx
        .update(userStats)
        .set({
            totalXp: sql`${userStats.totalXp} + ${data.xp}`,
            currentStreak: updated.currentStreak,
            longestStreak: updated.longestStreak,
            lastActiveDate: updated.lastActiveDate,
            streakFreezes: updated.streakFreezes,
            updatedAt: updated.updatedAt,
        })
        .where(eq(userStats.userId, data.userId))

    return { stats: updated, streak, today, todayXp: activity?.xp ?? data.xp }
}

export async function getDailyGoal(userId: string) {
    const [prefs] = await db
        .select({ dailyGoalXp: userPreferences.dailyGoalXp })
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1)
    return prefs?.dailyGoalXp ?? 30
}

export async function getTodayXp(userId: string, today: string) {
    const [row] = await db
        .select({ xp: dailyActivity.xp })
        .from(dailyActivity)
        .where(
            and(eq(dailyActivity.userId, userId), eq(dailyActivity.date, today))
        )
        .limit(1)
    return row?.xp ?? 0
}

export async function getActivitySince(userId: string, fromDate: string) {
    return db
        .select()
        .from(dailyActivity)
        .where(
            and(
                eq(dailyActivity.userId, userId),
                gte(dailyActivity.date, fromDate)
            )
        )
        .orderBy(dailyActivity.date)
}

export async function getUnlockedAchievements(userId: string) {
    return db
        .select({
            id: userAchievements.achievementId,
            unlockedAt: userAchievements.unlockedAt,
        })
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId))
}

/** Facts for achievement checks that come from the database. */
async function achievementFacts(userId: string) {
    const [mastered] = await db
        .select({ value: count() })
        .from(cardReviews)
        .innerJoin(flashcards, eq(cardReviews.flashcardId, flashcards.id))
        .where(
            and(
                eq(cardReviews.userId, userId),
                gte(cardReviews.interval, MASTERED_INTERVAL)
            )
        )
    const [sessions] = await db
        .select({ value: count() })
        .from(studySessions)
        .where(
            and(
                eq(studySessions.userId, userId),
                eq(studySessions.isCompleted, true)
            )
        )
    const [types] = await db
        .select({ value: countDistinct(flashcards.type) })
        .from(flashcards)
        .innerJoin(decks, eq(flashcards.deckId, decks.id))
        .where(eq(decks.userId, userId))
    return {
        masteredItems: mastered?.value ?? 0,
        completedSessions: sessions?.value ?? 0,
        itemTypesUsed: types?.value ?? 0,
    }
}

/** Checks all achievements and stores the newly unlocked ones. */
export async function unlockAchievements(
    userId: string,
    stats: Pick<UserStatsRow, 'totalXp' | 'longestStreak'>,
    event: Partial<AchievementSnapshot> = {}
): Promise<string[]> {
    const [facts, unlocked] = await Promise.all([
        achievementFacts(userId),
        getUnlockedAchievements(userId),
    ])
    const ids = newAchievements(
        {
            ...facts,
            totalXp: stats.totalXp,
            longestStreak: stats.longestStreak,
            ...event,
        },
        unlocked.map((u) => u.id)
    )
    if (ids.length) {
        await db
            .insert(userAchievements)
            .values(ids.map((achievementId) => ({ userId, achievementId })))
            .onConflictDoNothing()
    }
    return ids
}

export async function saveSession(data: {
    id: string
    userId: string
    deckId: string
    startTime: Date
    endTime: Date
    cardsReviewed: number
    isCompleted: boolean
}) {
    await db
        .insert(studySessions)
        .values({
            ...data,
            duration: Math.max(
                0,
                data.endTime.getTime() - data.startTime.getTime()
            ),
        })
        .onConflictDoUpdate({
            target: studySessions.id,
            set: {
                endTime: data.endTime,
                duration: Math.max(
                    0,
                    data.endTime.getTime() - data.startTime.getTime()
                ),
                cardsReviewed: data.cardsReviewed,
                isCompleted: data.isCompleted,
            },
            setWhere: eq(studySessions.userId, data.userId),
        })
}

export async function getDeckRecord(userId: string, deckId: string) {
    const [row] = await db
        .select()
        .from(deckRecords)
        .where(
            and(eq(deckRecords.userId, userId), eq(deckRecords.deckId, deckId))
        )
        .limit(1)
    return row ?? null
}

/** Stores a personal best. Returns true when it beats the previous record. */
export async function saveDeckRecord(
    userId: string,
    deckId: string,
    record: { matchMs?: number; testScore?: number }
) {
    const previous = await getDeckRecord(userId, deckId)
    const betterMatch =
        record.matchMs !== undefined &&
        (previous?.bestMatchMs == null || record.matchMs < previous.bestMatchMs)
    const betterTest =
        record.testScore !== undefined &&
        (previous?.bestTestScore == null ||
            record.testScore > previous.bestTestScore)
    if (!betterMatch && !betterTest) return false

    const values = {
        ...(betterMatch ? { bestMatchMs: record.matchMs } : {}),
        ...(betterTest ? { bestTestScore: record.testScore } : {}),
        updatedAt: new Date(),
    }
    if (previous) {
        await db
            .update(deckRecords)
            .set(values)
            .where(eq(deckRecords.id, previous.id))
    } else {
        await db
            .insert(deckRecords)
            .values({ id: nanoid(), userId, deckId, ...values })
    }
    return true
}

/** Mastery inputs (latest SRS state) of all items per deck. */
export async function getDeckReviewStates(userId: string) {
    return db
        .select({
            deckId: flashcards.deckId,
            itemId: flashcards.id,
            rating: cardReviews.rating,
            interval: cardReviews.interval,
            easeFactor: cardReviews.easeFactor,
            nextReview: cardReviews.nextReview,
        })
        .from(flashcards)
        .innerJoin(decks, eq(flashcards.deckId, decks.id))
        .leftJoin(
            cardReviews,
            and(
                eq(cardReviews.flashcardId, flashcards.id),
                eq(cardReviews.userId, userId)
            )
        )
        .where(eq(decks.userId, userId))
}
