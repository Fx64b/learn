import { geminiOutputSchema, leanGeminiSchema } from '@/lib/gemini-schema'
import { aiItemSchema } from '@/lib/items'
import { asSchema } from 'ai'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const outputSchema = z.object({ items: z.array(aiItemSchema).min(1).max(65) })

describe('leanGeminiSchema', () => {
    it('removes array bounds, null branches and other costly keywords', async () => {
        const json = JSON.stringify(
            await asSchema(geminiOutputSchema(outputSchema)).jsonSchema
        )
        for (const keyword of [
            '$schema',
            'additionalProperties',
            'minItems',
            'maxItems',
            'anyOf',
            '"null"',
        ]) {
            expect(json).not.toContain(keyword)
        }
    })

    it('keeps types, descriptions and required fields', () => {
        expect(
            leanGeminiSchema({
                type: 'object',
                required: ['a'],
                additionalProperties: false,
                properties: {
                    a: { type: 'string', enum: ['x', 'y'] },
                    b: { type: ['number', 'null'], description: 'B' },
                    c: {
                        description: 'C',
                        anyOf: [
                            {
                                type: 'array',
                                maxItems: 3,
                                items: { type: 'string' },
                            },
                            { type: 'null' },
                        ],
                    },
                },
            })
        ).toEqual({
            type: 'object',
            required: ['a'],
            properties: {
                a: { type: 'string', enum: ['x', 'y'] },
                b: { type: 'number', description: 'B' },
                c: {
                    description: 'C',
                    type: 'array',
                    items: { type: 'string' },
                },
            },
        })
    })
})

describe('geminiOutputSchema', () => {
    it('validates against the full zod schema', async () => {
        const schema = asSchema(geminiOutputSchema(outputSchema))
        const ok = await schema.validate!({
            items: [{ type: 'basic', front: 'Q', back: 'A' }],
        })
        expect(ok.success).toBe(true)
        const empty = await schema.validate!({ items: [] })
        expect(empty.success).toBe(false)
    })
})
