import { db } from '@/db'
import * as learnDb from '@/db/learn'
import { getDeckById } from '@/db/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getServerSession } from 'next-auth'

import {
    completeSession,
    completeTest,
    loadLearnSession,
    submitExerciseResult,
} from '@/app/actions/learn'

vi.mock('@/db/learn', () => ({
    getStudyItems: vi.fn(),
    getOwnedItemIds: vi.fn(),
    applyReview: vi.fn(),
    recordActivity: vi.fn(),
    getDailyGoal: vi.fn(),
    unlockAchievements: vi.fn(),
    saveSession: vi.fn(),
    saveDeckRecord: vi.fn(),
    getDeckRecord: vi.fn(),
    ensureUserStats: vi.fn(),
    getTodayXp: vi.fn(),
}))
vi.mock('@/db/utils', () => ({ getDeckById: vi.fn() }))

const mocked = vi.mocked(learnDb)
const stats = {
    userId: 'u1',
    totalXp: 115,
    currentStreak: 3,
    longestStreak: 3,
    lastActiveDate: '2026-10-05',
    streakFreezes: 1,
    timezone: 'UTC',
    updatedAt: new Date(),
}

function activity(xp: number, todayXp: number) {
    return {
        stats: { ...stats, totalXp: stats.totalXp + xp },
        streak: {
            state: stats,
            extended: true,
            freezeUsed: false,
            freezeEarned: false,
        },
        today: '2026-10-05',
        todayXp,
    }
}

const result = {
    kind: 'typeAnswer',
    itemIds: ['i1'],
    practice: false,
    retry: false,
    correct: true,
    grades: { i1: 3 },
    combo: 0,
    durationMs: 4000,
    timezone: 'Europe/Zurich',
}

describe('learn actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: 'u1' },
        } as never)
        ;(db as unknown as { transaction: unknown }).transaction = vi.fn(
            (cb: (tx: unknown) => unknown) => cb(db)
        )
        mocked.getOwnedItemIds.mockResolvedValue(['i1'])
        mocked.getDailyGoal.mockResolvedValue(30)
        mocked.recordActivity.mockImplementation(async (_tx, data) =>
            activity(data.xp, 25 + data.xp)
        )
        mocked.unlockAchievements.mockResolvedValue([])
    })

    it('rejects unauthenticated users', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)
        const res = await submitExerciseResult(result)
        expect(res.success).toBe(false)
        expect(mocked.applyReview).not.toHaveBeenCalled()
    })

    it('rejects items of other users', async () => {
        mocked.getOwnedItemIds.mockResolvedValue([])
        const res = await submitExerciseResult(result)
        expect(res.success).toBe(false)
        expect(mocked.recordActivity).not.toHaveBeenCalled()
    })

    it('updates the SRS state and awards XP', async () => {
        const res = await submitExerciseResult(result)
        expect(mocked.applyReview).toHaveBeenCalledWith(db, {
            userId: 'u1',
            flashcardId: 'i1',
            grade: 3,
            exerciseType: 'typeAnswer',
        })
        expect(res).toMatchObject({
            success: true,
            xp: 15,
            todayXp: 40,
            goalReachedNow: true,
        })
        expect(mocked.recordActivity.mock.calls[0][1]).toMatchObject({
            exercises: 1,
            correct: 1,
            timezone: 'Europe/Zurich',
        })
    })

    it('does not touch the SRS state for retries and practice', async () => {
        await submitExerciseResult({ ...result, retry: true })
        await submitExerciseResult({ ...result, practice: true })
        expect(mocked.applyReview).not.toHaveBeenCalled()
        expect(mocked.recordActivity).toHaveBeenCalledTimes(2)
    })

    it('validates grades and kinds', async () => {
        expect(
            (await submitExerciseResult({ ...result, grades: { i1: 7 } }))
                .success
        ).toBe(false)
        expect(
            (await submitExerciseResult({ ...result, kind: 'hack' })).success
        ).toBe(false)
    })

    it('ignores invalid timezones', async () => {
        await submitExerciseResult({ ...result, timezone: 'Mars/Base' })
        expect(mocked.recordActivity.mock.calls[0][1].timezone).toBeUndefined()
    })

    it('gives no XP for wrong answers', async () => {
        const res = await submitExerciseResult({
            ...result,
            correct: false,
            grades: { i1: 1 },
        })
        expect(res).toMatchObject({ success: true, xp: 0 })
    })

    it('awards a bonus for a perfect session', async () => {
        const res = await completeSession({
            sessionId: 's1',
            scope: 'due',
            startedAt: Date.now() - 60_000,
            exercises: 10,
            mistakes: 0,
            completed: true,
        })
        expect(res).toMatchObject({ success: true, bonusXp: 20 })
        expect(mocked.saveSession).toHaveBeenCalled()
        expect(mocked.unlockAchievements.mock.calls[0][2]).toMatchObject({
            perfectSession: true,
        })
    })

    it('checks deck ownership for tests', async () => {
        vi.mocked(getDeckById).mockResolvedValue(undefined as never)
        const res = await completeTest({ deckId: 'd1', total: 10, correct: 9 })
        expect(res.success).toBe(false)
    })

    it('plans a session for the due scope', async () => {
        mocked.getStudyItems.mockResolvedValue([])
        const res = await loadLearnSession('due')
        expect(res).toEqual({ success: true, exercises: [], totalItems: 0 })
        expect(mocked.getStudyItems).toHaveBeenCalledWith('u1', {
            type: 'due',
        })
    })
})
