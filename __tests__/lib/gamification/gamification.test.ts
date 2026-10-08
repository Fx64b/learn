import {
    addDays,
    applyActivity,
    daysBetween,
    displayStreak,
    localDate,
    newAchievements,
    streakAtRisk,
    streakFromDates,
} from '@/lib/gamification'
import { describe, expect, it } from 'vitest'

const state = (
    currentStreak: number,
    lastActiveDate: string | null,
    streakFreezes = 1
) => ({
    currentStreak,
    longestStreak: currentStreak,
    lastActiveDate,
    streakFreezes,
})

describe('dates', () => {
    it('uses the user timezone', () => {
        const date = new Date('2026-10-05T23:30:00Z')
        expect(localDate(date, 'UTC')).toBe('2026-10-05')
        expect(localDate(date, 'Europe/Zurich')).toBe('2026-10-06')
        expect(localDate(date, 'America/Los_Angeles')).toBe('2026-10-05')
        expect(localDate(date, 'Not/AZone')).toBe('2026-10-05')
    })

    it('counts days across months and DST', () => {
        expect(daysBetween('2026-03-28', '2026-04-02')).toBe(5)
        expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    })
})

describe('applyActivity', () => {
    it('starts a streak', () => {
        const r = applyActivity(state(0, null), '2026-10-05')
        expect(r.state.currentStreak).toBe(1)
        expect(r.extended).toBe(true)
    })

    it('counts a day only once', () => {
        const r = applyActivity(state(4, '2026-10-05'), '2026-10-05')
        expect(r.state.currentStreak).toBe(4)
        expect(r.extended).toBe(false)
    })

    it('extends on the next day', () => {
        const r = applyActivity(state(4, '2026-10-04'), '2026-10-05')
        expect(r.state.currentStreak).toBe(5)
    })

    it('uses a freeze for one missed day', () => {
        const r = applyActivity(state(4, '2026-10-03', 1), '2026-10-05')
        expect(r.state.currentStreak).toBe(5)
        expect(r.freezeUsed).toBe(true)
        expect(r.state.streakFreezes).toBe(0)
    })

    it('resets without a freeze or after a longer gap', () => {
        expect(
            applyActivity(state(4, '2026-10-03', 0), '2026-10-05').state
                .currentStreak
        ).toBe(1)
        expect(
            applyActivity(state(4, '2026-10-01', 1), '2026-10-05').state
                .currentStreak
        ).toBe(1)
    })

    it('earns a freeze back every 7 days', () => {
        const r = applyActivity(state(6, '2026-10-04', 0), '2026-10-05')
        expect(r.state.streakFreezes).toBe(1)
        expect(r.freezeEarned).toBe(true)
    })

    it('ignores days in the past', () => {
        const r = applyActivity(state(4, '2026-10-05'), '2026-10-04')
        expect(r.extended).toBe(false)
    })
})

describe('displayStreak', () => {
    it('keeps the streak alive until it is lost', () => {
        expect(displayStreak(state(3, '2026-10-04'), '2026-10-05')).toBe(3)
        expect(displayStreak(state(3, '2026-10-03', 1), '2026-10-05')).toBe(3)
        expect(displayStreak(state(3, '2026-10-03', 0), '2026-10-05')).toBe(0)
        expect(streakAtRisk(state(3, '2026-10-04'), '2026-10-05')).toBe(true)
        expect(streakAtRisk(state(3, '2026-10-05'), '2026-10-05')).toBe(false)
    })
})

describe('streakFromDates', () => {
    it('rebuilds current and longest streak', () => {
        const s = streakFromDates(
            [
                '2026-09-01',
                '2026-09-02',
                '2026-09-03',
                '2026-10-03',
                '2026-10-04',
            ],
            '2026-10-05'
        )
        expect(s.currentStreak).toBe(2)
        expect(s.longestStreak).toBe(3)
        expect(s.lastActiveDate).toBe('2026-10-04')
    })
})

describe('newAchievements', () => {
    const base = {
        totalXp: 0,
        longestStreak: 0,
        masteredItems: 0,
        completedSessions: 0,
        itemTypesUsed: 1,
    }

    it('unlocks matching achievements once', () => {
        expect(
            newAchievements({ ...base, completedSessions: 1, totalXp: 600 }, [])
        ).toEqual(['first-session', 'xp-500'])
        expect(
            newAchievements({ ...base, completedSessions: 1 }, [
                'first-session',
            ])
        ).toEqual([])
    })

    it('handles event achievements', () => {
        expect(newAchievements({ ...base, matchTimeMs: 15_000 }, [])).toEqual([
            'speed-matcher',
        ])
        expect(newAchievements({ ...base, testScore: 100 }, [])).toEqual([
            'top-of-class',
        ])
    })
})
