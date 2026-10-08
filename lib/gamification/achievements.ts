/** Facts used to decide which achievements are unlocked. */
export interface AchievementSnapshot {
    totalXp: number
    longestStreak: number
    masteredItems: number
    completedSessions: number
    /** The session that was just finished had no mistakes. */
    perfectSession?: boolean
    /** Time of the match game that was just finished. */
    matchTimeMs?: number
    /** Daily goal reached today. */
    dailyGoalReached?: boolean
    /** Distinct item types in the user's decks. */
    itemTypesUsed: number
    /** Score of the practice test that was just finished. */
    testScore?: number
}

export interface Achievement {
    id: string
    /** lucide icon name, mapped in the UI. */
    icon:
        | 'footprints'
        | 'flame'
        | 'zap'
        | 'trophy'
        | 'sparkles'
        | 'timer'
        | 'target'
        | 'shapes'
        | 'graduation-cap'
    tier: 'bronze' | 'silver' | 'gold'
    check: (s: AchievementSnapshot) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first-session',
        icon: 'footprints',
        tier: 'bronze',
        check: (s) => s.completedSessions >= 1,
    },
    {
        id: 'goal-getter',
        icon: 'target',
        tier: 'bronze',
        check: (s) => s.dailyGoalReached === true,
    },
    {
        id: 'perfect-session',
        icon: 'sparkles',
        tier: 'bronze',
        check: (s) => s.perfectSession === true,
    },
    {
        id: 'streak-3',
        icon: 'flame',
        tier: 'bronze',
        check: (s) => s.longestStreak >= 3,
    },
    {
        id: 'streak-7',
        icon: 'flame',
        tier: 'silver',
        check: (s) => s.longestStreak >= 7,
    },
    {
        id: 'streak-30',
        icon: 'flame',
        tier: 'gold',
        check: (s) => s.longestStreak >= 30,
    },
    {
        id: 'xp-500',
        icon: 'zap',
        tier: 'bronze',
        check: (s) => s.totalXp >= 500,
    },
    {
        id: 'xp-5000',
        icon: 'zap',
        tier: 'silver',
        check: (s) => s.totalXp >= 5000,
    },
    {
        id: 'mastered-50',
        icon: 'trophy',
        tier: 'silver',
        check: (s) => s.masteredItems >= 50,
    },
    {
        id: 'mastered-250',
        icon: 'trophy',
        tier: 'gold',
        check: (s) => s.masteredItems >= 250,
    },
    {
        id: 'speed-matcher',
        icon: 'timer',
        tier: 'silver',
        check: (s) => s.matchTimeMs !== undefined && s.matchTimeMs <= 20_000,
    },
    {
        id: 'top-of-class',
        icon: 'graduation-cap',
        tier: 'silver',
        check: (s) => s.testScore === 100,
    },
    {
        id: 'all-rounder',
        icon: 'shapes',
        tier: 'silver',
        check: (s) => s.itemTypesUsed >= 5,
    },
]

export const ACHIEVEMENT_IDS = ACHIEVEMENTS.map((a) => a.id)

/** Achievements that the snapshot unlocks and that are not unlocked yet. */
export function newAchievements(
    snapshot: AchievementSnapshot,
    unlocked: Iterable<string>
): string[] {
    const have = new Set(unlocked)
    return ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.check(snapshot)).map(
        (a) => a.id
    )
}
