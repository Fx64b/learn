import {
    MAX_RETRIES,
    buildMatchGame,
    buildSession,
    buildTest,
    requeue,
    seededRng,
    selectSessionItems,
} from '@/lib/learn'
import { describe, expect, it } from 'vitest'

import { CAPITALS, NOW, basic, review, study, typed } from './fixtures'

const opts = { rng: seededRng(7), now: NOW }

describe('selectSessionItems', () => {
    it('puts the most overdue reviews first and adds new items', () => {
        const items = [
            study(CAPITALS[0], review(6, -1)),
            study(CAPITALS[1], review(6, -10)),
            study(CAPITALS[2], review(6, 5)),
            study(CAPITALS[3]),
        ]
        const { reviews, fresh, ahead } = selectSessionItems(items, opts)
        expect(reviews.map((r) => r.item.id)).toEqual([
            CAPITALS[1].id,
            CAPITALS[0].id,
        ])
        expect(fresh.map((r) => r.item.id)).toEqual([CAPITALS[3].id])
        expect(ahead).toEqual([])
    })

    it('limits new items', () => {
        const items = Array.from({ length: 20 }, (_, i) =>
            study(basic(`q${i}`, `a${i}`))
        )
        const { fresh } = selectSessionItems(items, { ...opts, maxNew: 5 })
        expect(fresh).toHaveLength(5)
    })

    it('keeps room for new items when many reviews are due', () => {
        const due = Array.from({ length: 20 }, (_, i) =>
            study(basic(`q${i}`, `a${i}`), review(3, -1))
        )
        const { reviews, fresh } = selectSessionItems(
            [...due, study(basic('n1', 'x')), study(basic('n2', 'y'))],
            { ...opts, size: 12 }
        )
        expect(reviews).toHaveLength(10)
        expect(fresh).toHaveLength(2)
    })

    it('practises ahead when nothing is due', () => {
        const items = [
            study(CAPITALS[0], review(6, 3)),
            study(CAPITALS[1], review(6, 1)),
        ]
        const { ahead } = selectSessionItems(items, opts)
        expect(ahead.map((a) => a.item.id)).toEqual([
            CAPITALS[1].id,
            CAPITALS[0].id,
        ])
    })
})

describe('buildSession', () => {
    it('batches new short items into one match exercise', () => {
        const queue = buildSession(
            CAPITALS.map((c) => study(c)),
            opts
        )
        const match = queue.find((e) => e.kind === 'matchPairs')
        expect(match?.itemIds.length).toBeGreaterThanOrEqual(4)
        const covered = queue.flatMap((e) => e.itemIds)
        expect(new Set(covered).size).toBe(covered.length)
    })

    it('marks practise-ahead exercises', () => {
        const queue = buildSession([study(CAPITALS[0], review(6, 3))], opts)
        expect(queue).toHaveLength(1)
        expect(queue[0].practice).toBe(true)
    })

    it('returns nothing for an empty deck', () => {
        expect(buildSession([], opts)).toEqual([])
    })
})

describe('requeue', () => {
    const queue = buildSession(
        CAPITALS.map((c) => study(c, review(1, -1))),
        opts
    )

    it('inserts a retry a few positions later', () => {
        const next = requeue(queue, 0, queue[0], 0, seededRng(1))
        expect(next).toHaveLength(queue.length + 1)
        const idx = next.findIndex((e) => e.retry)
        expect(idx).toBeGreaterThanOrEqual(4)
        expect(next[idx].itemIds).toEqual(queue[0].itemIds)
        expect(next[idx].id).not.toBe(queue[0].id)
    })

    it('stops after the retry limit', () => {
        expect(requeue(queue, 0, queue[0], MAX_RETRIES)).toBe(queue)
    })
})

describe('buildTest and buildMatchGame', () => {
    it('makes practice-only tests', () => {
        const test = buildTest(
            CAPITALS.map((c) => study(c, review(3, 1))),
            {
                rng: seededRng(1),
                count: 4,
            }
        )
        expect(test).toHaveLength(4)
        test.forEach((e) => expect(e.practice).toBe(true))
        expect(test.every((e) => e.kind === 'typeAnswer')).toBe(true)
    })

    it('collects unique pairs from basic and pairs items', () => {
        const pairs = typed('pairs', '', {
            pairs: [
                { left: 'H', right: 'Hydrogen' },
                { left: 'He', right: 'Helium' },
            ],
        })
        const game = buildMatchGame(
            [...CAPITALS.map((c) => study(c)), study(pairs)],
            { rng: seededRng(5), pairs: 8 }
        )
        expect(game).toHaveLength(8)
    })
})
