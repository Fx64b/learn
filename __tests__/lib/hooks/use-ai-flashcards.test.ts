import { useAIFlashcards } from '@/lib/hooks/use-ai-flashcards'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { uploadPresigned } from '@vercel/blob/client'

vi.mock('@vercel/blob/client', () => ({ uploadPresigned: vi.fn() }))

// Mock fetch
global.fetch = vi.fn()

// Mock ReadableStream
global.ReadableStream = vi.fn().mockImplementation(() => ({
    getReader: vi.fn().mockReturnValue({
        read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
    }),
}))

describe('useAIFlashcards', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should initialize with correct default values', () => {
        const { result } = renderHook(() => useAIFlashcards())

        expect(result.current.isGenerating).toBe(false)
        expect(result.current.progress).toBe(null)
        expect(typeof result.current.generateFlashcards).toBe('function')
        expect(typeof result.current.cancelGeneration).toBe('function')
    })

    it('should handle rate limit errors', async () => {
        const mockResponse = {
            ok: false,
            status: 429,
            json: vi.fn().mockResolvedValue({
                type: 'rate_limit',
                error: 'Rate limit exceeded',
                data: { requiresPro: true },
            }),
        }

        vi.mocked(fetch).mockResolvedValue(mockResponse as any)

        const { result } = renderHook(() => useAIFlashcards())

        await act(async () => {
            try {
                await result.current.generateFlashcards({
                    deckId: 'test-deck',
                    prompt: 'Test prompt',
                })
            } catch (error: any) {
                expect(error.type).toBe('rate_limit')
                expect(error.error).toBe('Rate limit exceeded')
                expect(error.data.requiresPro).toBe(true)
            }
        })

        expect(result.current.isGenerating).toBe(false)
        expect(result.current.progress).toBe(null)
    })

    it('should handle network errors', async () => {
        vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

        const { result } = renderHook(() => useAIFlashcards())

        await act(async () => {
            try {
                await result.current.generateFlashcards({
                    deckId: 'test-deck',
                    prompt: 'Test prompt',
                })
            } catch (error: any) {
                expect(error.type).toBe('error')
                expect(error.error).toContain('Network error')
            }
        })

        expect(result.current.isGenerating).toBe(false)
        expect(result.current.progress).toBe(null)
    })

    it('should set generating state when starting', async () => {
        const mockResponse = {
            ok: true,
            body: {
                getReader: vi.fn().mockReturnValue({
                    read: vi
                        .fn()
                        .mockResolvedValue({ done: true, value: undefined }),
                }),
            },
        }

        vi.mocked(fetch).mockResolvedValue(mockResponse as any)

        const { result } = renderHook(() => useAIFlashcards())

        act(() => {
            result.current.generateFlashcards({
                deckId: 'test-deck',
                prompt: 'Test prompt',
            })
        })

        expect(result.current.isGenerating).toBe(true)
        expect(result.current.progress).toEqual({
            step: 'initializing',
            percentage: 0,
            message: 'Initializing AI generation...',
        })
    })

    it('should reset state when cancelling generation', () => {
        const { result } = renderHook(() => useAIFlashcards())

        act(() => {
            result.current.cancelGeneration()
        })

        expect(result.current.isGenerating).toBe(false)
        expect(result.current.progress).toBe(null)
    })

    it('should validate required parameters', async () => {
        const { result } = renderHook(() => useAIFlashcards())

        await act(async () => {
            try {
                await result.current.generateFlashcards({
                    deckId: '',
                    prompt: 'Test prompt',
                })
            } catch (error) {
                expect(error).toBeDefined()
            }
        })
    })

    it('uploads the PDF to Blob and sends only its URL', async () => {
        vi.mocked(uploadPresigned).mockResolvedValue({
            url: 'https://x.public.blob.vercel-storage.com/ai-uploads/u1/My-Notes-abc.pdf',
        } as never)
        vi.mocked(fetch).mockRejectedValue(new Error('stop here'))
        const file = new File(['%PDF-1.7'], 'My Notes (v2).pdf', {
            type: 'application/pdf',
        })

        const { result } = renderHook(() => useAIFlashcards())
        await act(async () => {
            await result.current.generateFlashcards({
                deckId: 'd1',
                prompt: 'X',
                file,
                userId: 'u1',
            })
        })

        const [path, body, options] = vi.mocked(uploadPresigned).mock.calls[0]
        expect(path).toMatch(
            /^ai-uploads\/u1\/[A-Za-z0-9-]+-My-Notes-v2-\.pdf$/
        )
        expect(body).toBe(file)
        expect(options).toMatchObject({
            access: 'public',
            handleUploadUrl: '/api/ai-flashcards/upload',
            contentType: 'application/pdf',
        })
        const form = vi.mocked(fetch).mock.calls[0][1]?.body as FormData
        expect(form.get('fileUrl')).toContain('/ai-uploads/u1/')
        expect(form.get('file')).toBeNull()
    })

    it('reports a failed upload without calling the API', async () => {
        vi.mocked(uploadPresigned).mockRejectedValue(new Error('token refused'))
        const file = new File(['%PDF-1.7'], 'a.pdf', {
            type: 'application/pdf',
        })

        const { result } = renderHook(() => useAIFlashcards())
        let res: Awaited<ReturnType<typeof result.current.generateFlashcards>>
        await act(async () => {
            res = await result.current.generateFlashcards({
                deckId: 'd1',
                prompt: 'X',
                file,
                userId: 'u1',
            })
        })

        expect(res!.success).toBe(false)
        expect(res!.errorCode).toBe('upload_failed')
        expect(fetch).not.toHaveBeenCalled()
    })
})
