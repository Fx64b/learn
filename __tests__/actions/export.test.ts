import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getExportableFlashcards } from '@/app/actions/export'
import * as flashcardActions from '@/app/actions/flashcard'
import { getServerSession } from 'next-auth'

// Mock dependencies
vi.mock('@/app/actions/flashcard')

const mockGetFlashcardsByDeckId = vi.mocked(
    flashcardActions.getFlashcardsByDeckId
)
const mockGetServerSession = vi.mocked(getServerSession)

describe('Export Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Mock authenticated session by default
        mockGetServerSession.mockResolvedValue({
            user: { id: 'test-user-id', email: 'test@example.com' },
            expires: new Date(Date.now() + 86400000).toISOString(),
        })
    })

    describe('getExportableFlashcards', () => {
        test('should return formatted flashcards for valid deck', async () => {
            const mockFlashcards = [
                {
                    id: 'card-1',
                    deckId: 'deck-1',
                    front: 'Question 1',
                    back: 'Answer 1',
                    isExamRelevant: true,
                    createdAt: new Date(),
                    interval: 1,
                    easeFactor: 250,
                    nextReview: new Date(),
                },
                {
                    id: 'card-2',
                    deckId: 'deck-1',
                    front: 'Question 2',
                    back: 'Answer 2',
                    isExamRelevant: false,
                    createdAt: new Date(),
                    interval: 2,
                    easeFactor: 260,
                    nextReview: new Date(),
                },
            ]

            mockGetFlashcardsByDeckId.mockResolvedValue(mockFlashcards)

            const result = await getExportableFlashcards('deck-1')

            expect(result).toEqual([
                { front: 'Question 1', back: 'Answer 1' },
                { front: 'Question 2', back: 'Answer 2' },
            ])
            expect(mockGetFlashcardsByDeckId).toHaveBeenCalledWith('deck-1')
        })

        test('should return empty array when no flashcards exist', async () => {
            mockGetFlashcardsByDeckId.mockResolvedValue([])

            const result = await getExportableFlashcards('deck-1')

            expect(result).toEqual([])
            expect(mockGetFlashcardsByDeckId).toHaveBeenCalledWith('deck-1')
        })

        test('should handle invalid deck id', async () => {
            mockGetFlashcardsByDeckId.mockResolvedValue([])

            const result = await getExportableFlashcards('invalid-deck')

            expect(result).toEqual([])
            expect(mockGetFlashcardsByDeckId).toHaveBeenCalledWith(
                'invalid-deck'
            )
        })

        test('should preserve only front and back properties', async () => {
            const mockFlashcards = [
                {
                    id: 'card-1',
                    deckId: 'deck-1',
                    front: 'Question 1',
                    back: 'Answer 1',
                    isExamRelevant: true,
                    createdAt: new Date(),
                    interval: 1,
                    easeFactor: 250,
                    nextReview: new Date(),
                    // Extra properties that should be filtered out
                    sensitiveData: 'should not appear',
                    internalId: 12345,
                } as any,
            ]

            mockGetFlashcardsByDeckId.mockResolvedValue(mockFlashcards)

            const result = await getExportableFlashcards('deck-1')

            expect(result).toEqual([{ front: 'Question 1', back: 'Answer 1' }])
            expect(result[0]).not.toHaveProperty('sensitiveData')
            expect(result[0]).not.toHaveProperty('internalId')
            expect(result[0]).not.toHaveProperty('id')
            expect(result[0]).not.toHaveProperty('deckId')
        })

        test('should handle special characters in flashcard content', async () => {
            const mockFlashcards = [
                {
                    id: 'card-1',
                    deckId: 'deck-1',
                    front: 'Question with üöä special chars & symbols?',
                    back: 'Answer with 🎯 emojis and <b>HTML</b> tags',
                    isExamRelevant: true,
                    createdAt: new Date(),
                    interval: 1,
                    easeFactor: 250,
                    nextReview: new Date(),
                },
            ]

            mockGetFlashcardsByDeckId.mockResolvedValue(mockFlashcards)

            const result = await getExportableFlashcards('deck-1')

            expect(result).toEqual([
                {
                    front: 'Question with üöä special chars & symbols?',
                    back: 'Answer with 🎯 emojis and <b>HTML</b> tags',
                },
            ])
        })

        test('should handle errors from getFlashcardsByDeckId gracefully', async () => {
            // When getFlashcardsByDeckId returns empty array on error
            mockGetFlashcardsByDeckId.mockResolvedValue([])

            const result = await getExportableFlashcards('deck-1')

            expect(result).toEqual([])
        })
    })
})
