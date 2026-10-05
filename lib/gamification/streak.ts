import { addDays, daysBetween } from './dates'

export const MAX_STREAK_FREEZES = 1
/** A used streak freeze is earned back every this many streak days. */
export const FREEZE_EARN_INTERVAL = 7

export interface StreakState {
    currentStreak: number
    longestStreak: number
    /** YYYY-MM-DD of the last active day, in the user's timezone. */
    lastActiveDate: string | null
    streakFreezes: number
}

export interface StreakUpdate {
    state: StreakState
    /** The streak grew by a day with this activity. */
    extended: boolean
    freezeUsed: boolean
    freezeEarned: boolean
}

/**
 * Records activity on `today`. A single missed day is covered by a streak
 * freeze when one is available. A longer gap restarts the streak.
 */
export function applyActivity(state: StreakState, today: string): StreakUpdate {
    const unchanged = {
        state,
        extended: false,
        freezeUsed: false,
        freezeEarned: false,
    }
    if (state.lastActiveDate === today) return unchanged

    const gap = state.lastActiveDate
        ? daysBetween(state.lastActiveDate, today)
        : Infinity
    // Clock changes or travel can make "today" earlier than the last day.
    if (gap < 0) return unchanged

    let freezes = state.streakFreezes
    let freezeUsed = false
    let streak: number
    if (gap === 1) {
        streak = state.currentStreak + 1
    } else if (gap === 2 && freezes > 0) {
        freezes -= 1
        freezeUsed = true
        streak = state.currentStreak + 1
    } else {
        streak = 1
    }

    let freezeEarned = false
    if (streak % FREEZE_EARN_INTERVAL === 0 && freezes < MAX_STREAK_FREEZES) {
        freezes += 1
        freezeEarned = true
    }

    return {
        state: {
            currentStreak: streak,
            longestStreak: Math.max(state.longestStreak, streak),
            lastActiveDate: today,
            streakFreezes: freezes,
        },
        extended: true,
        freezeUsed,
        freezeEarned,
    }
}

/**
 * Streak to display on `today`: still alive if the user was active today or
 * yesterday, or the day before with a freeze left to cover the gap.
 */
export function displayStreak(state: StreakState, today: string): number {
    if (!state.lastActiveDate) return 0
    const gap = daysBetween(state.lastActiveDate, today)
    if (gap <= 1) return state.currentStreak
    if (gap === 2 && state.streakFreezes > 0) return state.currentStreak
    return 0
}

/** True when the user has not been active today yet but the streak is alive. */
export function streakAtRisk(state: StreakState, today: string): boolean {
    return state.lastActiveDate !== today && displayStreak(state, today) > 0
}

/** Rebuilds the streak state from a list of active days (used for backfill). */
export function streakFromDates(days: string[], today: string): StreakState {
    const sorted = [...new Set(days)].filter((d) => d <= today).sort()
    let longest = 0
    let run = 0
    let prev: string | null = null
    for (const day of sorted) {
        run = prev && addDays(prev, 1) === day ? run + 1 : 1
        longest = Math.max(longest, run)
        prev = day
    }
    return {
        currentStreak: run,
        longestStreak: longest,
        lastActiveDate: prev,
        streakFreezes: MAX_STREAK_FREEZES,
    }
}
