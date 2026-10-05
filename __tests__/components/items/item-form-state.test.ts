import { ITEM_TYPES, type ItemInput, itemInputSchema } from '@/lib/items'
import { describe, expect, it } from 'vitest'

import {
    emptyFormState,
    formToInput,
    inputToForm,
    parseBrackets,
} from '@/components/items/item-form-state'

describe('item form state', () => {
    it('parses cloze brackets', () => {
        expect(parseBrackets('I [drink] a [tea].')).toEqual({
            text: 'I ___ a ___.',
            answers: ['drink', 'tea'],
        })
    })

    it('builds valid input for every type', () => {
        const f = {
            ...emptyFormState(),
            front: 'Prompt',
            back: 'Answer',
            options: [
                { text: 'a', correct: true },
                { text: 'b', correct: false },
            ],
            cloze: 'A [b] c',
            passage: 'Some text here',
            lines: 'One / 1\nTwo | 2\nThree',
            value: '8849',
            tolerance: '50',
            unit: 'm',
            pairs: [
                { left: 'x', right: 'y' },
                { left: 'z', right: 'w' },
            ],
            image: 'https://example.com/a.png',
            labels: [{ label: 'Spot', x: 10, y: 20 }],
        }
        for (const type of ITEM_TYPES) {
            const input = formToInput(type, f)
            const parsed = itemInputSchema.safeParse(input)
            expect(parsed.success, type).toBe(true)
        }
    })

    it('round-trips through the form', () => {
        const inputs: ItemInput[] = [
            {
                type: 'list',
                front: 'Continents',
                content: { items: ['Asia', ['Australia', 'Oceania']] },
            },
            {
                type: 'sequence',
                front: 'Order',
                content: {
                    items: [
                        { label: 'a', detail: '1' },
                        { label: 'b' },
                        { label: 'c' },
                    ],
                    ends: ['First', 'Last'],
                },
            },
            {
                type: 'cloze',
                front: 'Hint',
                content: { text: 'A ___ b', answers: ['x'] },
            },
            {
                type: 'basic',
                front: 'Q',
                back: 'A',
                content: { accept: ['a1', 'a2'] },
            },
        ]
        for (const input of inputs) {
            expect(formToInput(input.type, inputToForm(input))).toEqual(input)
        }
    })
})
