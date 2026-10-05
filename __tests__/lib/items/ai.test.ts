import { aiItemStrings, aiItemToInput, toItemRow } from '@/lib/items'
import type { AiItem } from '@/lib/items'
import { describe, expect, it } from 'vitest'

const valid = (item: AiItem) => toItemRow(aiItemToInput(item)).success

describe('aiItemToInput', () => {
    it('maps every AI type to a valid item', () => {
        const items: AiItem[] = [
            { type: 'basic', front: 'Capital of Peru?', back: 'Lima' },
            {
                type: 'choice',
                front: 'Noble gases?',
                options: ['Neon', 'Oxygen', 'Argon'],
                correct: ['Neon', 'Argon'],
            },
            {
                type: 'cloze',
                front: 'Water',
                text: 'Water boils at ___ °C.',
                answers: ['100'],
            },
            { type: 'passage', front: 'Recite', text: 'To be or not to be' },
            {
                type: 'list',
                front: 'Continents',
                items: ['Asia', 'Australia / Oceania'],
            },
            {
                type: 'sequence',
                front: 'Order',
                items: ['First', 'Second', 'Third'],
            },
            {
                type: 'number',
                front: 'Everest',
                value: 8849,
                tolerance: -50,
                unit: 'm',
            },
            {
                type: 'pairs',
                front: 'Symbols',
                pairs: [
                    { left: 'Gold', right: 'Au' },
                    { left: 'Iron', right: 'Fe' },
                ],
            },
        ]
        items.forEach((item) => expect(valid(item), item.type).toBe(true))
    })

    it('keeps aliases in lists', () => {
        const input = aiItemToInput({
            type: 'list',
            front: 'x',
            items: ['A', 'B / Bee'],
        }) as { content: { items: unknown[] } }
        expect(input.content.items).toEqual(['A', ['B', 'Bee']])
    })

    it('rejects inconsistent model output', () => {
        expect(
            valid({
                type: 'choice',
                front: 'Q',
                options: ['a', 'b'],
                correct: ['c'],
            })
        ).toBe(false)
        expect(
            valid({
                type: 'cloze',
                front: 'Q',
                text: 'No blanks',
                answers: ['x'],
            })
        ).toBe(false)
        expect(valid({ type: 'number', front: 'Q' })).toBe(false)
    })

    it('collects all strings for safety checks', () => {
        expect(
            aiItemStrings({
                type: 'pairs',
                front: 'f',
                pairs: [{ left: 'l', right: '<script>' }],
            })
        ).toContain('<script>')
    })
})
