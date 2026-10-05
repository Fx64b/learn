import type { ItemOf } from '@/lib/items'

import { getMastery, isDue } from './mastery'
import { isMatchable, planExercise, planMatchBatch } from './planner'
import { exerciseId, shuffleWith } from './random'
import type { ExerciseDescriptor, Rng, StudyItem } from './types'

export const SESSION_SIZE = 12
export const MAX_NEW_PER_SESSION = 5
/** A missed exercise comes back at most this often in one session. */
export const MAX_RETRIES = 2
const MIN_MATCH_BATCH = 4
const MAX_MATCH_BATCH = 5
const DAY_MS = 24 * 60 * 60 * 1000

export interface SessionOptions {
    rng?: Rng
    now?: Date
    size?: number
    maxNew?: number
    /** Other items for distractors (defaults to all given items). */
    pool?: StudyItem[]
}

function daysOverdue(entry: StudyItem, now: Date) {
    if (!entry.review) return 0
    return Math.max(
        0,
        Math.floor((now.getTime() - entry.review.nextReview.getTime()) / DAY_MS)
    )
}

/**
 * Picks the items for a learn session: due reviews first (most overdue
 * first), then a few new items. When nothing is due, it practises the items
 * that come up next, without changing their schedule.
 */
export function selectSessionItems(
    items: StudyItem[],
    options: SessionOptions = {}
) {
    const now = options.now ?? new Date()
    const size = options.size ?? SESSION_SIZE
    const maxNew = options.maxNew ?? MAX_NEW_PER_SESSION

    const due = items
        .filter((e) => e.review && isDue(e.review, now))
        .sort((a, b) => daysOverdue(b, now) - daysOverdue(a, now))
    const fresh = items.filter((e) => !e.review)

    const newCount = Math.min(
        fresh.length,
        maxNew,
        Math.max(size - due.length, Math.min(2, maxNew))
    )
    const reviews = due.slice(0, size - newCount)
    const selected = [...reviews, ...fresh.slice(0, newCount)]

    let ahead: StudyItem[] = []
    if (selected.length === 0) {
        ahead = items
            .filter((e) => e.review && !isDue(e.review, now))
            .sort(
                (a, b) =>
                    a.review!.nextReview.getTime() -
                    b.review!.nextReview.getTime()
            )
            .slice(0, size)
    }
    return { reviews, fresh: fresh.slice(0, newCount), ahead }
}

/** Mixes two lists so that new items are spread between reviews. */
function interleave<T>(a: T[], b: T[]): T[] {
    if (!b.length) return a
    if (!a.length) return b
    const out: T[] = []
    const step = Math.max(1, Math.floor(a.length / b.length))
    let bi = 0
    a.forEach((x, i) => {
        out.push(x)
        if ((i + 1) % step === 0 && bi < b.length) out.push(b[bi++])
    })
    return [...out, ...b.slice(bi)]
}

/** Builds the ordered exercise queue for a learn session. */
export function buildSession(
    items: StudyItem[],
    options: SessionOptions = {}
): ExerciseDescriptor[] {
    const rng = options.rng ?? Math.random
    const pool = (options.pool ?? items).map((e) => e.item)
    const { reviews, fresh, ahead } = selectSessionItems(items, options)

    const plan = (entries: StudyItem[], practice: boolean) =>
        entries.map((e) =>
            planExercise(e.item, getMastery(e.review), { rng, pool, practice })
        )

    // New short basic items can be introduced together as a match exercise.
    const exercises: ExerciseDescriptor[] = []
    let freshRest = fresh
    const matchable = fresh
        .map((e) => e.item)
        .filter(isMatchable) as ItemOf<'basic'>[]
    if (matchable.length >= MIN_MATCH_BATCH) {
        const batch = planMatchBatch(matchable.slice(0, MAX_MATCH_BATCH), {
            rng,
            pool,
        })
        if (batch.itemIds.length >= MIN_MATCH_BATCH) {
            exercises.push(batch)
            freshRest = fresh.filter((e) => !batch.itemIds.includes(e.item.id))
        }
    }

    const reviewExercises = shuffleWith(plan(reviews, false), rng)
    const newExercises = [...exercises, ...plan(freshRest, false)]
    return [
        ...interleave(reviewExercises, newExercises),
        ...shuffleWith(plan(ahead, true), rng),
    ]
}

/** Exercises for a practice test: recall-style, no SRS changes, no retries. */
export function buildTest(
    items: StudyItem[],
    options: { rng?: Rng; count?: number } = {}
): ExerciseDescriptor[] {
    const rng = options.rng ?? Math.random
    const pool = items.map((e) => e.item)
    return shuffleWith(items, rng)
        .slice(0, options.count ?? 20)
        .map((e) =>
            planExercise(
                e.item,
                // Test recall unless the item has never been seen.
                e.review ? 'familiar' : 'learning',
                { rng, pool, practice: true }
            )
        )
}

/** Pairs for the match game, from short basic items and pair sets. */
export function buildMatchGame(
    items: StudyItem[],
    options: { rng?: Rng; pairs?: number } = {}
) {
    const rng = options.rng ?? Math.random
    const candidates = items.flatMap(({ item }) => {
        if (isMatchable(item))
            return [{ left: item.front, right: item.back, itemId: item.id }]
        if (item.type === 'pairs')
            return item.content.pairs.map((p) => ({ ...p, itemId: item.id }))
        return []
    })
    const seen = new Set<string>()
    const out: { left: string; right: string; itemId: string }[] = []
    for (const c of shuffleWith(candidates, rng)) {
        const keys = [c.left.toLowerCase(), c.right.toLowerCase()]
        if (keys.some((k) => seen.has(k))) continue
        keys.forEach((k) => seen.add(k))
        out.push(c)
        if (out.length >= (options.pairs ?? 6)) break
    }
    return out
}

/**
 * Re-inserts a missed exercise a few positions later so it comes back in the
 * same session. Returns the queue unchanged once the retry limit is hit.
 */
export function requeue(
    queue: ExerciseDescriptor[],
    currentIndex: number,
    missed: ExerciseDescriptor,
    retries: number,
    rng: Rng = Math.random
): ExerciseDescriptor[] {
    if (retries >= MAX_RETRIES) return queue
    const copy = {
        ...missed,
        id: exerciseId(rng),
        retry: true,
    } as ExerciseDescriptor
    const gap = 3 + Math.floor(rng() * 3)
    const at = Math.min(queue.length, currentIndex + 1 + gap)
    return [...queue.slice(0, at), copy, ...queue.slice(at)]
}
