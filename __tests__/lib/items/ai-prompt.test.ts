import {
    AI_ITEM_TYPES,
    type AiItem,
    DEFAULT_MIN_ITEMS,
    MAX_ITEMS_PER_GENERATION,
    buildSystemPrompt,
    buildUserPrompt,
    cleanPromptText,
    dedupeAiItems,
    parseDeckTags,
    parseItemCount,
} from '@/lib/items'
import { describe, expect, it } from 'vitest'

describe('buildUserPrompt', () => {
    const deck = {
        title: 'Biology 101',
        description: 'Cell biology for the first semester',
        tags: ['Biology', 'Cells'],
    }

    it('includes deck title, description and tags', () => {
        const prompt = buildUserPrompt({ prompt: 'Photosynthesis', deck })
        expect(prompt).toContain('Title: Biology 101')
        expect(prompt).toContain(
            'Description: Cell biology for the first semester'
        )
        expect(prompt).toContain('Tags: Biology, Cells')
        expect(prompt).toContain('Request: Photosynthesis')
    })

    it('leaves out empty description and tags', () => {
        const prompt = buildUserPrompt({
            prompt: 'X',
            deck: { title: 'T', description: '  ', tags: [] },
        })
        expect(prompt).not.toContain('Description:')
        expect(prompt).not.toContain('Tags:')
    })

    it('states the item count rule', () => {
        const prompt = buildUserPrompt({ prompt: 'X', deck })
        expect(prompt).toContain(
            `between ${DEFAULT_MIN_ITEMS} and ${MAX_ITEMS_PER_GENERATION}`
        )
        expect(prompt).toContain('create exactly that number')
    })

    it('mentions the attached PDF only when there is one', () => {
        const withPdf = buildUserPrompt({
            prompt: 'Summarize',
            deck,
            hasDocument: true,
        })
        expect(withPdf).toContain('attached PDF document')
        expect(withPdf.indexOf('Request:')).toBeLessThan(
            withPdf.indexOf('attached PDF document')
        )
        expect(buildUserPrompt({ prompt: 'Summarize', deck })).not.toContain(
            'attached PDF'
        )
    })

    it('cleans and limits the deck fields', () => {
        const prompt = buildUserPrompt({
            prompt: 'X',
            deck: {
                title: '<b>' + 'a'.repeat(200),
                description: 'd'.repeat(900),
            },
        })
        expect(prompt).not.toContain('<b>')
        expect(prompt).toContain(`Title: b${'a'.repeat(99)}\n`)
        expect(prompt).not.toContain('d'.repeat(501))
    })
})

describe('buildSystemPrompt', () => {
    it('lists only the allowed types', () => {
        const prompt = buildSystemPrompt(['basic', 'cloze'])
        expect(prompt).toContain('- basic:')
        expect(prompt).toContain('- cloze:')
        expect(prompt).not.toContain('- pairs:')
    })

    it('describes every AI type', () => {
        const prompt = buildSystemPrompt(AI_ITEM_TYPES)
        for (const type of AI_ITEM_TYPES) {
            expect(prompt).toContain(`- ${type}:`)
        }
    })
})

describe('parseDeckTags', () => {
    it('parses the JSON category column', () => {
        expect(parseDeckTags('["Math"," Algebra ",""]')).toEqual([
            'Math',
            'Algebra',
        ])
    })

    it('falls back for invalid or empty values', () => {
        expect(parseDeckTags('')).toEqual([])
        expect(parseDeckTags(null)).toEqual([])
        expect(parseDeckTags('{"a":1}')).toEqual([])
        expect(parseDeckTags('Math, Physics')).toEqual(['Math', 'Physics'])
    })

    it('limits count and length', () => {
        const tags = parseDeckTags(
            JSON.stringify(Array.from({ length: 20 }, () => 'x'.repeat(80)))
        )
        expect(tags).toHaveLength(10)
        expect(tags[0]).toHaveLength(40)
    })
})

describe('cleanPromptText', () => {
    it('removes angle brackets and control characters', () => {
        expect(cleanPromptText('<i>Hi</i>\u0007 there', 50)).toBe('iHi/i there')
    })
})

describe('dedupeAiItems', () => {
    const cloze = (text: string): AiItem => ({
        type: 'cloze',
        front: 'Cell parts',
        text,
        answers: ['x'],
    })

    it('keeps items that share a title but differ in content', () => {
        const items = [
            cloze('The ___ is the powerhouse'),
            cloze('The ___ holds the DNA'),
        ]
        expect(dedupeAiItems(items)).toHaveLength(2)
    })

    it('removes exact repeats, ignoring case', () => {
        const items: AiItem[] = [
            { type: 'basic', front: 'Capital of France?', back: 'Paris' },
            { type: 'basic', front: 'capital of france?', back: 'paris' },
        ]
        expect(dedupeAiItems(items)).toHaveLength(1)
    })
})

describe('chosen item count', () => {
    it('replaces the automatic rule with the chosen amount', () => {
        const prompt = buildUserPrompt({ prompt: 'X', count: 40 })
        expect(prompt).toContain('the user chose about 40 items')
        expect(prompt).not.toContain('between 10 and 60')
    })

    it('keeps the automatic rule without a valid count', () => {
        for (const count of [undefined, 0, 61, 2.5]) {
            const prompt = buildUserPrompt({ prompt: 'X', count })
            expect(prompt).toContain('between 10 and 60')
        }
    })

    it('parses only whole numbers from 1 to 60', () => {
        expect(parseItemCount('20')).toBe(20)
        expect(parseItemCount(60)).toBe(60)
        expect(parseItemCount(0)).toBeUndefined()
        expect(parseItemCount(61)).toBeUndefined()
        expect(parseItemCount('abc')).toBeUndefined()
        expect(parseItemCount(undefined)).toBeUndefined()
    })
})
