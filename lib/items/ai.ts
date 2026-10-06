import { z } from 'zod'

import type { ItemType } from './schema'

/** Item types the AI may generate. Diagrams need an image, so they are manual only. */
export const AI_ITEM_TYPES = [
    'basic',
    'choice',
    'cloze',
    'passage',
    'list',
    'sequence',
    'number',
    'pairs',
] as const satisfies readonly ItemType[]

export type AiItemType = (typeof AI_ITEM_TYPES)[number]

/**
 * Flat output schema for the model. Structured output works more reliably
 * with one object shape and optional fields than with a union, so each type
 * uses a subset of the fields and `aiItemToInput` maps it to the strict schema.
 */
export const aiItemSchema = z.object({
    type: z.enum(AI_ITEM_TYPES),
    front: z
        .string()
        .describe(
            'Question or task shown to the learner. For cloze and pairs a short title that is unique for each item.'
        ),
    back: z
        .string()
        .nullish()
        .describe('basic only: the answer, short and precise'),
    options: z
        .array(z.string())
        .nullish()
        .describe('choice only: 3-5 answer options'),
    correct: z
        .array(z.string())
        .nullish()
        .describe('choice only: the correct options, copied exactly'),
    text: z
        .string()
        .nullish()
        .describe(
            'cloze: sentence with ___ for each blank. passage: the exact text to learn'
        ),
    answers: z
        .array(z.string())
        .nullish()
        .describe('cloze only: the word for each ___, in order'),
    items: z
        .array(z.string())
        .nullish()
        .describe(
            'list: every member of the set (aliases separated by " / "). sequence: steps in the correct order'
        ),
    value: z.number().nullish().describe('number only: the correct value'),
    tolerance: z
        .number()
        .nullish()
        .describe('number only: accepted distance from the value'),
    unit: z.string().nullish().describe('number only: unit such as m or kg'),
    pairs: z
        .array(z.object({ left: z.string(), right: z.string() }))
        .nullish()
        .describe('pairs only: 3-6 term and match pairs'),
})

export type AiItem = z.infer<typeof aiItemSchema>

const clean = (values?: string[] | null) =>
    (values ?? []).map((v) => v.trim()).filter(Boolean)

/** Maps a model item to the raw item input validated by `toItemRow`. */
export function aiItemToInput(item: AiItem): unknown {
    const front = item.front?.trim() ?? ''
    switch (item.type) {
        case 'basic':
            return { type: 'basic', front, back: item.back?.trim() ?? '' }
        case 'choice':
            return {
                type: 'choice',
                front,
                content: {
                    options: clean(item.options),
                    answer: clean(item.correct),
                },
            }
        case 'cloze':
            return {
                type: 'cloze',
                front,
                content: {
                    text: item.text?.trim() ?? '',
                    answers: clean(item.answers),
                },
            }
        case 'passage':
            return {
                type: 'passage',
                front,
                content: { text: item.text?.trim() ?? '' },
            }
        case 'list':
            return {
                type: 'list',
                front,
                content: {
                    items: clean(item.items).map((entry) => {
                        const aliases = clean(entry.split('/'))
                        return aliases.length > 1 ? aliases : aliases[0]
                    }),
                },
            }
        case 'sequence':
            return {
                type: 'sequence',
                front,
                content: {
                    items: clean(item.items).map((label) => ({ label })),
                },
            }
        case 'number':
            return {
                type: 'number',
                front,
                content: {
                    value: item.value ?? undefined,
                    ...(item.tolerance
                        ? { tolerance: Math.abs(item.tolerance) }
                        : {}),
                    ...(item.unit?.trim() ? { unit: item.unit.trim() } : {}),
                },
            }
        case 'pairs':
            return {
                type: 'pairs',
                front,
                content: {
                    pairs: (item.pairs ?? [])
                        .map((p) => ({
                            left: p.left.trim(),
                            right: p.right.trim(),
                        }))
                        .filter((p) => p.left && p.right),
                },
            }
    }
}

/**
 * Removes repeated items. Two items count as the same only if type, prompt
 * and answer match, so cloze or pairs items that share a title both stay.
 */
export function dedupeAiItems(items: AiItem[]): AiItem[] {
    const seen = new Set<string>()
    return items.filter((item) => {
        const answer = [
            item.back,
            item.text,
            item.value,
            ...(item.correct ?? []),
            ...(item.items ?? []),
            ...(item.pairs ?? []).map((p) => `${p.left}=${p.right}`),
        ]
            .filter((v) => v !== null && v !== undefined)
            .join('|')
        const key = `${item.type}:${item.front}:${answer}`.toLowerCase().trim()
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

/** Every string in an AI item, for content safety checks. */
export function aiItemStrings(item: AiItem): string[] {
    return [
        item.front,
        item.back,
        item.text,
        item.unit,
        ...(item.options ?? []),
        ...(item.correct ?? []),
        ...(item.answers ?? []),
        ...(item.items ?? []),
        ...(item.pairs ?? []).flatMap((p) => [p.left, p.right]),
    ].filter((s): s is string => typeof s === 'string')
}

export function isAiItemType(value: unknown): value is AiItemType {
    return (
        typeof value === 'string' &&
        (AI_ITEM_TYPES as readonly string[]).includes(value)
    )
}
