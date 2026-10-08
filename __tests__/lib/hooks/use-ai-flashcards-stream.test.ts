import { useAIFlashcards } from '@/lib/hooks/use-ai-flashcards'
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@vercel/blob/client', () => ({ uploadPresigned: vi.fn() }))

/** A fetch response whose body arrives in exactly these chunks. */
function streamResponse(chunks: string[]) {
    const encoder = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks)
                controller.enqueue(encoder.encode(chunk))
            controller.close()
        },
    })
    return new Response(body, { status: 200 })
}

async function generate(chunks: string[]) {
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => streamResponse(chunks))
    )
    const { result } = renderHook(() => useAIFlashcards())
    let res: Awaited<ReturnType<typeof result.current.generateFlashcards>>
    await act(async () => {
        res = await result.current.generateFlashcards({
            deckId: 'd1',
            prompt: 'X',
        })
    })
    return res!
}

describe('useAIFlashcards stream parsing', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('reads a final message that spans several chunks', async () => {
        const items = Array.from({ length: 60 }, (_, i) => ({
            type: 'basic',
            front: `Question ${i}`,
        }))
        const final = `data: ${JSON.stringify({
            type: 'success',
            data: { success: true, cardsCreated: 60, items, requestId: 'r' },
        })}\n\n`
        const progress = `data: ${JSON.stringify({
            type: 'progress',
            progress: { step: 'ai', percentage: 60, message: 'Working' },
        })}\n\n`
        const cut = Math.floor(final.length / 3)

        const res = await generate([
            progress + final.slice(0, cut),
            final.slice(cut, cut * 2),
            final.slice(cut * 2),
        ])

        expect(res.success).toBe(true)
        expect(res.cardsCreated).toBe(60)
        expect(res.items).toHaveLength(60)
    })

    it('reports a stream that ends without a result', async () => {
        const progress = `data: ${JSON.stringify({
            type: 'progress',
            progress: { step: 'ai', percentage: 60, message: 'Working' },
        })}\n\n`

        const res = await generate([progress])

        expect(res.success).toBe(false)
        expect(res.errorCode).toBe('stream_ended')
    })

    it('passes server errors through', async () => {
        const res = await generate([
            `data: ${JSON.stringify({
                type: 'error',
                error: 'x',
                data: { success: false, error: 'Nope', requestId: 'r' },
            })}\n\n`,
        ])
        expect(res.success).toBe(false)
        expect(res.error).toBe('Nope')
    })

    it('sends the chosen item count', async () => {
        const fetchMock = vi.fn(async () =>
            streamResponse([
                `data: ${JSON.stringify({ type: 'success', data: { success: true, requestId: 'r' } })}\n\n`,
            ])
        )
        vi.stubGlobal('fetch', fetchMock)
        const { result } = renderHook(() => useAIFlashcards())
        await act(async () => {
            await result.current.generateFlashcards({
                deckId: 'd1',
                prompt: 'X',
                count: 40,
            })
        })
        const form = (fetchMock.mock.calls[0] as unknown[])[1] as {
            body: FormData
        }
        expect(form.body.get('count')).toBe('40')
    })
})
