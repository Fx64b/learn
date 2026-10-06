import * as dbUtils from '@/db/utils'
import { generateObject } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getServerSession } from 'next-auth'

import { generateAIFlashcards } from '@/app/actions/ai-flashcards'
import { createItemsFromJson } from '@/app/actions/flashcard'

vi.mock('@/db/utils', () => ({ getDeckById: vi.fn() }))
vi.mock('ai', () => ({ generateObject: vi.fn() }))
vi.mock('@ai-sdk/google', () => ({ google: vi.fn(() => 'model') }))
vi.mock('@/lib/rate-limit/ai-rate-limit', () => ({
    checkAIRateLimitWithDetails: vi.fn(async () => ({
        allowed: true,
        tier: 'pro',
        remaining: 10,
    })),
}))
vi.mock('@/app/actions/flashcard', () => ({
    createItemsFromJson: vi.fn(),
}))

const deck = {
    id: 'd1',
    userId: 'u1',
    title: 'Biology 101',
    description: 'Cells and organelles',
    category: '["Biology","Cells"]',
    activeUntil: new Date('2030-01-01'),
    createdAt: new Date(),
}

describe('generateAIFlashcards', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: 'u1', email: 'a@b.c' },
        } as never)
        vi.mocked(dbUtils.getDeckById).mockImplementation(async (id, userId) =>
            id === 'd1' && userId === 'u1' ? deck : undefined
        )
        vi.mocked(createItemsFromJson).mockImplementation(async ({ json }) => ({
            success: true,
            created: JSON.parse(json).length,
            errors: [],
            types: [],
        }))
    })

    it('rejects a foreign deck before calling the model', async () => {
        const res = await generateAIFlashcards({
            deckId: 'other',
            prompt: 'Photosynthesis',
        })
        expect(res.success).toBe(false)
        expect(generateObject).not.toHaveBeenCalled()
    })

    it('sends deck context and saves all valid items', async () => {
        vi.mocked(generateObject).mockResolvedValue({
            object: {
                items: [
                    { type: 'basic', front: 'What is ATP?', back: 'Energy' },
                    {
                        type: 'cloze',
                        front: 'Organelles',
                        text: 'The ___ makes ATP',
                        answers: ['mitochondrion'],
                    },
                    {
                        type: 'cloze',
                        front: 'Organelles',
                        text: 'The ___ holds DNA',
                        answers: ['nucleus'],
                    },
                    { type: 'basic', front: 'Broken', back: null },
                ],
            },
        } as never)

        const res = await generateAIFlashcards({
            deckId: 'd1',
            prompt: 'Organelles',
        })

        const call = vi.mocked(generateObject).mock.calls[0][0] as {
            prompt: string
        }
        expect(call.prompt).toContain('Title: Biology 101')
        expect(call.prompt).toContain('Description: Cells and organelles')
        expect(call.prompt).toContain('Tags: Biology, Cells')
        expect(call.prompt).not.toContain('2030')
        expect(res.success).toBe(true)
        expect(res.cardsCreated).toBe(3)
    })

    it('reports an unknown model as a configuration error', async () => {
        vi.mocked(generateObject).mockRejectedValue(
            new Error(
                'models/gemini-x is not found for API version v1beta, or is not supported for generateContent.'
            )
        )
        const res = await generateAIFlashcards({ deckId: 'd1', prompt: 'X' })
        expect(res.success).toBe(false)
        expect(res.error).toBe('aiConfigError')
    })
})
