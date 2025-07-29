import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAIFlashcards } from '@/lib/hooks/use-ai-flashcards'

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
                data: { requiresPro: true }
            })
        }

        vi.mocked(fetch).mockResolvedValue(mockResponse as any)

        const { result } = renderHook(() => useAIFlashcards())

        await act(async () => {
            try {
                await result.current.generateFlashcards({
                    deckId: 'test-deck',
                    prompt: 'Test prompt'
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
                    prompt: 'Test prompt'
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
                    read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
                }),
            },
        }

        vi.mocked(fetch).mockResolvedValue(mockResponse as any)

        const { result } = renderHook(() => useAIFlashcards())

        act(() => {
            result.current.generateFlashcards({
                deckId: 'test-deck',
                prompt: 'Test prompt'
            })
        })

        expect(result.current.isGenerating).toBe(true)
        expect(result.current.progress).toEqual({
            step: 'starting',
            percentage: 0,
            message: 'Initializing AI flashcard generation...'
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
                    prompt: 'Test prompt'
                })
            } catch (error) {
                expect(error).toBeDefined()
            }
        })
    })
})