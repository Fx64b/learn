import { MASTERY_LEVELS, type Mastery, type ReviewState } from './types'

/** Interval (days) from which an item counts as familiar / mastered. */
export const FAMILIAR_INTERVAL = 3
export const MASTERED_INTERVAL = 21

/**
 * Mastery stage of an item, derived from its SRS state:
 * never reviewed = new, failed last time or interval < 3 days = learning,
 * interval < 21 days = familiar, otherwise mastered.
 */
export function getMastery(review: ReviewState | null | undefined): Mastery {
    if (!review) return 'new'
    if (review.rating <= 1 || review.interval < FAMILIAR_INTERVAL)
        return 'learning'
    if (review.interval < MASTERED_INTERVAL) return 'familiar'
    return 'mastered'
}

export type MasteryCounts = Record<Mastery, number>

export function countMastery(
    reviews: (ReviewState | null | undefined)[]
): MasteryCounts {
    const counts = Object.fromEntries(
        MASTERY_LEVELS.map((m) => [m, 0])
    ) as MasteryCounts
    for (const review of reviews) counts[getMastery(review)]++
    return counts
}

export function isDue(review: ReviewState | null, now: Date) {
    return !review || review.nextReview.getTime() <= now.getTime()
}
