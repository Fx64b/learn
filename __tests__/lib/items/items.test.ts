import {
    itemToInput,
    parseItemRow,
    summarizeContent,
    toItemRow,
} from '@/lib/items'
import { describe, expect, it } from 'vitest'

describe('toItemRow', () => {
    it('stores a basic card without content', () => {
        const res = toItemRow({ type: 'basic', front: 'Q', back: 'A' })
        expect(res).toEqual({
            success: true,
            data: { type: 'basic', front: 'Q', back: 'A', content: null },
        })
    })

    it('keeps accepted variants of basic cards', () => {
        const res = toItemRow({
            type: 'basic',
            front: 'Capital of Australia',
            back: 'Canberra',
            content: { accept: ['canberra city'] },
        })
        expect(res.success && res.data.content).toBe(
            JSON.stringify({ accept: ['canberra city'] })
        )
    })

    it('rejects a basic card without back', () => {
        expect(toItemRow({ type: 'basic', front: 'Q' }).success).toBe(false)
    })

    it('rejects choice answers that are not options', () => {
        const res = toItemRow({
            type: 'choice',
            front: 'Q',
            content: { options: ['a', 'b'], answer: ['c'] },
        })
        expect(res.success).toBe(false)
    })

    it('requires one answer per cloze blank', () => {
        const ok = toItemRow({
            type: 'cloze',
            content: { text: 'A ___ and a ___', answers: ['x', 'y'] },
        })
        const bad = toItemRow({
            type: 'cloze',
            content: { text: 'A ___ and a ___', answers: ['x'] },
        })
        expect(ok.success).toBe(true)
        expect(bad.success).toBe(false)
    })

    it('derives front and back for cloze items', () => {
        const res = toItemRow({
            type: 'cloze',
            content: { text: 'Water boils at ___ °C', answers: ['100'] },
        })
        expect(res.success && res.data.front).toBe('Water boils at ___ °C')
        expect(res.success && res.data.back).toBe('Water boils at 100 °C')
    })

    it('rejects unknown types', () => {
        expect(toItemRow({ type: 'video', front: 'x' }).success).toBe(false)
    })

    it('rejects diagram labels outside the image', () => {
        const res = toItemRow({
            type: 'diagram',
            front: 'Label it',
            content: {
                image: 'https://example.com/a.png',
                alt: 'a',
                labels: [{ label: 'x', x: 120, y: 5 }],
            },
        })
        expect(res.success).toBe(false)
    })
})

describe('summarizeContent', () => {
    it('summarizes each type', () => {
        expect(summarizeContent('list', { items: ['A', ['B', 'Bee']] })).toBe(
            'A, B'
        )
        expect(
            summarizeContent('sequence', {
                items: [{ label: '1' }, { label: '2' }, { label: '3' }],
            })
        ).toBe('1 → 2 → 3')
        expect(
            summarizeContent('number', {
                value: 8849,
                unit: 'm',
                tolerance: 50,
            })
        ).toBe('8849 m (±50)')
        expect(
            summarizeContent('pairs', {
                pairs: [
                    { left: 'a', right: 'b' },
                    { left: 'c', right: 'd' },
                ],
            })
        ).toBe('a – b; c – d')
    })
})

describe('parseItemRow', () => {
    const base = { id: '1', deckId: 'd', front: 'F', back: 'B' }

    it('treats legacy rows as basic cards', () => {
        expect(parseItemRow({ ...base })).toEqual({
            ...base,
            type: 'basic',
            content: {},
        })
    })

    it('parses valid content', () => {
        const item = parseItemRow({
            ...base,
            type: 'number',
            content: JSON.stringify({ value: 3 }),
        })
        expect(item.type).toBe('number')
        expect(item.content).toEqual({ value: 3 })
    })

    it('falls back to basic on broken content', () => {
        const item = parseItemRow({ ...base, type: 'list', content: '{oops' })
        expect(item.type).toBe('basic')
    })

    it('round-trips through itemToInput', () => {
        const item = parseItemRow({
            ...base,
            type: 'pairs',
            content: JSON.stringify({
                pairs: [
                    { left: 'a', right: 'b' },
                    { left: 'c', right: 'd' },
                ],
            }),
        })
        const row = toItemRow(itemToInput(item))
        expect(row.success && row.data.type).toBe('pairs')
    })
})
