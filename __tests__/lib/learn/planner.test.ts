import type { ItemOf } from '@/lib/items'
import {
    numericDistractors,
    pickDistractors,
    planExercise,
    planMatchBatch,
    seededRng,
} from '@/lib/learn'
import { describe, expect, it } from 'vitest'

import { CAPITALS, basic, typed } from './fixtures'

const ctx = () => ({ rng: seededRng(1), pool: CAPITALS })

describe('planExercise', () => {
    it('introduces new basic items with multiple choice', () => {
        const ex = planExercise(CAPITALS[0], 'new', ctx())
        expect(ex.kind).toBe('multipleChoice')
        if (ex.kind !== 'multipleChoice') return
        expect(ex.props.options).toContain('Ottawa')
        expect(ex.props.options).toHaveLength(4)
        expect(new Set(ex.props.options).size).toBe(4)
    })

    it('asks to type short answers once learning', () => {
        const ex = planExercise(CAPITALS[0], 'learning', ctx())
        expect(ex.kind).toBe('typeAnswer')
    })

    it('falls back to a flashcard for long answers', () => {
        const long = basic('Explain osmosis', 'x'.repeat(200))
        expect(planExercise(long, 'familiar', ctx()).kind).toBe('flashcard')
    })

    it('falls back from multiple choice without distractors', () => {
        const lonely = basic('Q', 'A')
        const ex = planExercise(lonely, 'new', { rng: seededRng(1), pool: [] })
        expect(ex.kind).toBe('typeAnswer')
    })

    it('scales passage hints with mastery', () => {
        const passage = typed('passage', 'Recite', {
            text: Array.from({ length: 40 }, (_, i) => `w${i}`).join(' '),
        })
        const hint = (m: 'learning' | 'familiar' | 'mastered') => {
            const ex = planExercise(passage, m, ctx())
            return ex.kind === 'firstLetter' ? ex.props.hint : null
        }
        expect(hint('learning')).toBe('full')
        expect(hint('familiar')).toBe('partial')
        expect(hint('mastered')).toBe('none')
    })

    it('plans every item type', () => {
        const items = [
            typed('choice', 'Q', { options: ['a', 'b'], answer: ['a'] }),
            typed('cloze', '', { text: 'A ___ b', answers: ['x'] }),
            typed('list', 'Q', { items: ['a', 'b'] }),
            typed('sequence', 'Q', {
                items: [{ label: '1' }, { label: '2' }, { label: '3' }],
            }),
            typed('number', 'Q', { value: 1969 }),
            typed('pairs', '', {
                pairs: [
                    { left: 'a', right: 'b' },
                    { left: 'c', right: 'd' },
                ],
            }),
            typed('diagram', 'Q', {
                image: 'https://example.com/a.png',
                alt: 'a',
                labels: [{ label: 'x', x: 10, y: 10 }],
            }),
        ]
        const kinds = items.map((i) => planExercise(i, 'learning', ctx()).kind)
        expect(kinds).toEqual([
            'multipleChoice',
            'fillBlank',
            'listRecall',
            'orderSequence',
            'numberAnswer',
            'matchPairs',
            'labelDiagram',
        ])
        expect(planExercise(items[6], 'mastered', ctx()).kind).toBe(
            'locateOnImage'
        )
    })

    it('marks practice exercises', () => {
        const ex = planExercise(CAPITALS[0], 'new', {
            ...ctx(),
            practice: true,
        })
        expect(ex.practice).toBe(true)
        expect(ex.itemIds).toEqual([CAPITALS[0].id])
    })
})

describe('distractors', () => {
    it('skips duplicates and the answer itself', () => {
        const d = pickDistractors(
            'Ottawa',
            ['ottawa', 'Tokyo', 'Tokyo ', 'Lima'],
            3,
            seededRng(2)
        )
        expect(d.sort()).toEqual(['Lima', 'Tokyo'])
    })

    it('makes plausible years', () => {
        const d = numericDistractors(1969, 0, 3, seededRng(3))
        expect(d).toHaveLength(3)
        d.forEach((n) => {
            expect(n).not.toBe(1969)
            expect(Math.abs(n - 1969)).toBeLessThanOrEqual(50)
        })
    })

    it('respects the tolerance', () => {
        const d = numericDistractors(100, 15, 3, seededRng(4))
        d.forEach((n) => expect(Math.abs(n - 100)).toBeGreaterThan(15))
    })
})

describe('planMatchBatch', () => {
    it('drops items with duplicate texts', () => {
        const ex = planMatchBatch(
            [
                ...CAPITALS.slice(0, 3),
                basic('Canada', 'Other'),
            ] as ItemOf<'basic'>[],
            ctx()
        )
        expect(ex.itemIds).toHaveLength(3)
    })
})
