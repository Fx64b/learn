import { z } from 'zod'

/**
 * Item types a deck can hold. Every item is stored as one `flashcards` row:
 * `front` is the prompt, `back` a plain-text answer summary and `content`
 * the type-specific JSON validated by the schemas below.
 */
export const ITEM_TYPES = [
    'basic',
    'choice',
    'cloze',
    'passage',
    'list',
    'sequence',
    'number',
    'pairs',
    'diagram',
] as const

export type ItemType = (typeof ITEM_TYPES)[number]

/** Marks a blank in cloze text, e.g. "Water boils at ___ °C". */
export const BLANK_PATTERN = /_{3,}/g

const text = (max: number) => z.string().trim().min(1).max(max)
const prompt = text(500)

export const basicContentSchema = z.object({
    /** Extra accepted spellings for typed answers. */
    accept: z.array(text(200)).max(10).optional(),
})

export const choiceContentSchema = z
    .object({
        options: z.array(text(200)).min(2).max(8),
        answer: z.array(text(200)).min(1).max(8),
    })
    .refine((c) => new Set(c.options).size === c.options.length, {
        message: 'Options must be unique',
        path: ['options'],
    })
    .refine((c) => c.answer.every((a) => c.options.includes(a)), {
        message: 'Every answer must be one of the options',
        path: ['answer'],
    })

export const clozeContentSchema = z
    .object({
        text: text(1000),
        answers: z.array(text(100)).min(1).max(10),
        distractors: z.array(text(100)).max(10).optional(),
    })
    .refine(
        (c) => (c.text.match(BLANK_PATTERN) ?? []).length === c.answers.length,
        {
            message: 'The number of blanks (___) must match the answers',
            path: ['answers'],
        }
    )

export const passageContentSchema = z.object({
    text: text(2000),
})

const listEntry = z.union([text(200), z.array(text(200)).min(1).max(5)])

export const listContentSchema = z.object({
    items: z.array(listEntry).min(2).max(30),
})

export const sequenceItemSchema = z.object({
    label: text(200),
    detail: z.string().trim().max(100).optional(),
})

export const sequenceContentSchema = z.object({
    items: z.array(sequenceItemSchema).min(3).max(12),
    ends: z.tuple([text(50), text(50)]).optional(),
})

export const numberContentSchema = z.object({
    value: z.number().finite(),
    tolerance: z.number().finite().min(0).optional(),
    unit: z.string().trim().max(20).optional(),
})

export const pairSchema = z.object({ left: text(200), right: text(200) })

export const pairsContentSchema = z.object({
    pairs: z.array(pairSchema).min(2).max(10),
})

const percent = z.number().min(0).max(100)

export const diagramLabelSchema = z.object({
    label: text(100),
    x: percent,
    y: percent,
    tag: z.enum(['above', 'below']).optional(),
})

export const diagramContentSchema = z.object({
    image: z.string().url().max(1000),
    alt: text(200),
    labels: z.array(diagramLabelSchema).min(1).max(20),
    distractors: z.array(text(100)).max(10).optional(),
})

export const contentSchemas = {
    basic: basicContentSchema,
    choice: choiceContentSchema,
    cloze: clozeContentSchema,
    passage: passageContentSchema,
    list: listContentSchema,
    sequence: sequenceContentSchema,
    number: numberContentSchema,
    pairs: pairsContentSchema,
    diagram: diagramContentSchema,
} as const

export type ItemContentMap = {
    [K in ItemType]: z.infer<(typeof contentSchemas)[K]>
}

/** Input from the editor, bulk import and AI. `back` is required only for basic items. */
export const itemInputSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('basic'),
        front: prompt,
        back: text(2000),
        content: basicContentSchema.optional(),
    }),
    z.object({
        type: z.literal('choice'),
        front: prompt,
        content: choiceContentSchema,
    }),
    z.object({
        type: z.literal('cloze'),
        front: z.string().trim().max(500).optional(),
        content: clozeContentSchema,
    }),
    z.object({
        type: z.literal('passage'),
        front: prompt,
        content: passageContentSchema,
    }),
    z.object({
        type: z.literal('list'),
        front: prompt,
        content: listContentSchema,
    }),
    z.object({
        type: z.literal('sequence'),
        front: prompt,
        content: sequenceContentSchema,
    }),
    z.object({
        type: z.literal('number'),
        front: prompt,
        content: numberContentSchema,
    }),
    z.object({
        type: z.literal('pairs'),
        front: z.string().trim().max(500).optional(),
        content: pairsContentSchema,
    }),
    z.object({
        type: z.literal('diagram'),
        front: prompt,
        content: diagramContentSchema,
    }),
])

export type ItemInput = z.input<typeof itemInputSchema>

/** An item as used by the app, with parsed content. */
export type Item = {
    [K in ItemType]: {
        id: string
        deckId: string
        type: K
        front: string
        back: string
        content: ItemContentMap[K]
    }
}[ItemType]

export type ItemOf<K extends ItemType> = Extract<Item, { type: K }>

export function isItemType(value: unknown): value is ItemType {
    return (
        typeof value === 'string' &&
        (ITEM_TYPES as readonly string[]).includes(value)
    )
}
