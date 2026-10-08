import * as dbUtils from '@/db/utils'
import { deleteBlobs } from '@/lib/blob'
import { NoObjectGeneratedError, generateObject } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getServerSession } from 'next-auth'

import { generateAIFlashcards } from '@/app/actions/ai-flashcards'
import { createItemsFromJson } from '@/app/actions/flashcard'

vi.mock('@/db/utils', () => ({ getDeckById: vi.fn() }))
vi.mock('ai', async (importOriginal) => ({
    ...(await importOriginal<typeof import('ai')>()),
    generateObject: vi.fn(),
}))
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
vi.mock('@/lib/blob', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/blob')>()),
    deleteBlobs: vi.fn(),
}))

const PDF_PATH = 'ai-uploads/u1/notes-x1.pdf'
const PDF_URL = `https://abc.public.blob.vercel-storage.com/${PDF_PATH}`

const blobApi = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@vercel/blob', () => blobApi)

/** Makes the Blob SDK return this body for the uploaded PDF. */
function mockBlob(body: string) {
    const bytes = new TextEncoder().encode(body)
    blobApi.get.mockResolvedValue({
        statusCode: 200,
        stream: new Response(bytes).body,
        headers: new Headers(),
        blob: { size: bytes.byteLength, contentType: 'application/pdf' },
    })
    return blobApi.get
}

const oneItem = {
    object: {
        items: [{ type: 'basic', front: 'What is ATP?', back: 'Energy' }],
    },
} as never

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
            messages: Array<{ content: Array<{ text?: string }> }>
        }
        const text = call.messages[0].content[0].text ?? ''
        expect(call.messages[0].content).toHaveLength(1)
        expect(text).toContain('Title: Biology 101')
        expect(text).toContain('Description: Cells and organelles')
        expect(text).toContain('Tags: Biology, Cells')
        expect(text).not.toContain('2030')
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

    it('reports a cut-off answer with its own message', async () => {
        vi.mocked(generateObject).mockRejectedValue(
            new NoObjectGeneratedError({
                message: 'No object generated: could not parse the response.',
                text: '{"items":[{"type":"basic"',
                response: {
                    id: 'r',
                    timestamp: new Date(),
                    modelId: 'm',
                },
                usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
                finishReason: 'length',
            })
        )
        const res = await generateAIFlashcards({ deckId: 'd1', prompt: 'X' })
        expect(res.success).toBe(false)
        expect(res.error).toBe('aiTruncated')
    })

    it('uses a real message when every item is invalid', async () => {
        vi.mocked(generateObject).mockResolvedValue({
            object: { items: [{ type: 'basic', front: 'Q', back: null }] },
        } as never)
        const res = await generateAIFlashcards({ deckId: 'd1', prompt: 'X' })
        expect(res.success).toBe(false)
        expect(res.error).toBe('noDuplicateCards')
    })

    describe('with an uploaded PDF', () => {
        it('sends the PDF as a file part and deletes it afterwards', async () => {
            mockBlob('%PDF-1.7 content')
            vi.mocked(generateObject).mockResolvedValue(oneItem)

            const res = await generateAIFlashcards({
                deckId: 'd1',
                prompt: 'Chapter 3',
                fileUrl: PDF_URL,
            })

            expect(res.success).toBe(true)
            // Read by validated pathname through the SDK, not by the URL.
            expect(blobApi.get).toHaveBeenCalledWith(PDF_PATH, {
                access: 'public',
                useCache: false,
            })
            const call = vi.mocked(generateObject).mock.calls[0][0] as {
                messages: Array<{
                    content: Array<{ type: string; mimeType?: string }>
                }>
            }
            const parts = call.messages[0].content
            expect(parts[0].type).toBe('text')
            expect(parts[1]).toMatchObject({
                type: 'file',
                mimeType: 'application/pdf',
            })
            expect(deleteBlobs).toHaveBeenCalledWith([PDF_PATH])
        })

        it('deletes the PDF when the model fails', async () => {
            mockBlob('%PDF-1.7 content')
            vi.mocked(generateObject).mockRejectedValue(new Error('boom'))

            const res = await generateAIFlashcards({
                deckId: 'd1',
                prompt: 'X',
                fileUrl: PDF_URL,
            })

            expect(res.success).toBe(false)
            expect(deleteBlobs).toHaveBeenCalledWith([PDF_PATH])
        })

        it('rejects a file that is not a PDF', async () => {
            mockBlob('<html>not a pdf</html>')

            const res = await generateAIFlashcards({
                deckId: 'd1',
                prompt: 'X',
                fileUrl: PDF_URL,
            })

            expect(res.success).toBe(false)
            expect(generateObject).not.toHaveBeenCalled()
            expect(deleteBlobs).toHaveBeenCalledWith([PDF_PATH])
        })

        it('never fetches or deletes a URL outside the own folder', async () => {
            const getMock = mockBlob('%PDF-1.7')
            const foreign =
                'https://abc.public.blob.vercel-storage.com/ai-uploads/u2/a.pdf'

            for (const fileUrl of [
                foreign,
                'https://evil.example.com/ai-uploads/u1/a.pdf',
            ]) {
                const res = await generateAIFlashcards({
                    deckId: 'd1',
                    prompt: 'X',
                    fileUrl,
                })
                expect(res.success).toBe(false)
            }

            expect(getMock).not.toHaveBeenCalled()
            expect(generateObject).not.toHaveBeenCalled()
            expect(deleteBlobs).not.toHaveBeenCalled()
        })
    })
})
