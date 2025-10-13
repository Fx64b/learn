import * as dbUtils from '@/db/utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'

import {
    createDeck,
    deleteDeck,
    getAllDecks,
    resetDeckProgress,
    updateDeck,
} from '@/app/actions/deck'

// Mock dependencies
vi.mock('next-auth')
vi.mock('next-intl/server')
vi.mock('next/cache')
vi.mock('@/db/utils')

const mockGetServerSession = vi.mocked(getServerSession)
const mockGetTranslations = vi.mocked(getTranslations)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockDbUtils = vi.mocked(dbUtils)

describe('Deck Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockRevalidatePath.mockImplementation(() => {})

        // Mock translations
        const mockTranslations = {
            error: 'Error creating deck',
            'edit.error': 'Error updating deck',
            'edit.notFound': 'Deck not found',
            'edit.dangerZone.resetProgress.error': 'Error resetting progress',
            'edit.dangerZone.deleteDeck.error': 'Error deleting deck',
        }
        const mockAuthTranslations = {
            notAuthenticated: 'Not authenticated',
        }

        mockGetTranslations.mockImplementation((namespace: string) => {
            return Promise.resolve((key: string) => {
                if (namespace === 'auth') {
                    return (
                        mockAuthTranslations[
                            key as keyof typeof mockAuthTranslations
                        ] || key
                    )
                }
                return (
                    mockTranslations[key as keyof typeof mockTranslations] ||
                    key
                )
            })
        })
    })

    describe('createDeck', () => {
        test('should create deck successfully', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.createDeck.mockResolvedValue('new-deck-id')

            const formData = new FormData()
            formData.append('title', 'Test Deck')
            formData.append('description', 'Test Description')
            formData.append('category', 'Education')
            formData.append('activeUntil', '2024-12-31')

            const result = await createDeck(formData)

            expect(result).toEqual({ success: true, id: 'new-deck-id' })
            expect(mockDbUtils.createDeck).toHaveBeenCalledWith({
                title: 'Test Deck',
                description: 'Test Description',
                category: 'Education',
                activeUntil: new Date('2024-12-31'),
                userId: 'user-1',
            })
            expect(mockRevalidatePath).toHaveBeenCalledWith('/')
        })

        test('should create deck without activeUntil date', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.createDeck.mockResolvedValue('new-deck-id')

            const formData = new FormData()
            formData.append('title', 'Test Deck')
            formData.append('description', 'Test Description')
            formData.append('category', 'Education')

            const result = await createDeck(formData)

            expect(result).toEqual({ success: true, id: 'new-deck-id' })
            expect(mockDbUtils.createDeck).toHaveBeenCalledWith({
                title: 'Test Deck',
                description: 'Test Description',
                category: 'Education',
                activeUntil: null,
                userId: 'user-1',
            })
        })

        test('should return error when user not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            const formData = new FormData()
            formData.append('title', 'Test Deck')

            const result = await createDeck(formData)

            expect(result).toEqual({
                success: false,
                error: 'Not authenticated',
            })
            expect(mockDbUtils.createDeck).not.toHaveBeenCalled()
        })

        test('should return error when user has no ID', async () => {
            const mockSession = {
                user: { email: 'test@example.com' }, // No ID
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const formData = new FormData()
            formData.append('title', 'Test Deck')

            const result = await createDeck(formData)

            expect(result).toEqual({
                success: false,
                error: 'Not authenticated',
            })
        })

        test('should handle database errors', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.createDeck.mockRejectedValue(
                new Error('Database error')
            )

            const formData = new FormData()
            formData.append('title', 'Test Deck')

            const result = await createDeck(formData)

            expect(result).toEqual({
                success: false,
                error: 'Error creating deck',
            })
        })

        test('should handle empty form data', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.createDeck.mockResolvedValue('new-deck-id')

            const formData = new FormData()

            const result = await createDeck(formData)

            expect(result).toEqual({ success: true, id: 'new-deck-id' })
            expect(mockDbUtils.createDeck).toHaveBeenCalledWith({
                title: null,
                description: null,
                category: null,
                activeUntil: null,
                userId: 'user-1',
            })
        })

        test('should handle invalid date format', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.createDeck.mockResolvedValue('new-deck-id')

            const formData = new FormData()
            formData.append('title', 'Test Deck')
            formData.append('activeUntil', 'invalid-date')

            const result = await createDeck(formData)

            expect(result).toEqual({ success: true, id: 'new-deck-id' })
            // Invalid date should result in an Invalid Date object
            expect(mockDbUtils.createDeck).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Test Deck',
                    userId: 'user-1',
                    activeUntil: expect.any(Date),
                })
            )
        })
    })

    describe('getAllDecks', () => {
        test('should return decks for authenticated user', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockDecks = [
                { id: 'deck-1', title: 'Deck 1', description: 'Description 1' },
                { id: 'deck-2', title: 'Deck 2', description: 'Description 2' },
            ]
            mockDbUtils.getAllDecks.mockResolvedValue(mockDecks as any)

            const result = await getAllDecks()

            expect(result).toEqual(mockDecks)
            expect(mockDbUtils.getAllDecks).toHaveBeenCalledWith('user-1')
        })

        test('should return empty array when user not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            const result = await getAllDecks()

            expect(result).toEqual([])
            expect(mockDbUtils.getAllDecks).not.toHaveBeenCalled()
        })

        test('should return empty array when user has no ID', async () => {
            const mockSession = {
                user: { email: 'test@example.com' }, // No ID
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const result = await getAllDecks()

            expect(result).toEqual([])
        })

        test('should handle database errors', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.getAllDecks.mockRejectedValue(
                new Error('Database error')
            )

            const result = await getAllDecks()

            expect(result).toEqual([])
        })

        test('should return empty array when no decks exist', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.getAllDecks.mockResolvedValue([])

            const result = await getAllDecks()

            expect(result).toEqual([])
        })
    })

    describe('updateDeck', () => {
        test('should update deck successfully', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockExistingDeck = {
                id: 'deck-1',
                userId: 'user-1',
                title: 'Old Title',
            }
            mockDbUtils.getDeckById.mockResolvedValue(mockExistingDeck as any)
            mockDbUtils.updateDeck.mockResolvedValue(undefined)

            const formData = new FormData()
            formData.append('id', 'deck-1')
            formData.append('title', 'Updated Title')
            formData.append('description', 'Updated Description')
            formData.append('category', 'Science')
            formData.append('activeUntil', '2024-06-30')

            const result = await updateDeck(formData)

            expect(result).toEqual({ success: true })
            expect(mockDbUtils.updateDeck).toHaveBeenCalledWith({
                id: 'deck-1',
                title: 'Updated Title',
                description: 'Updated Description',
                category: 'Science',
                activeUntil: new Date('2024-06-30'),
            })
            expect(mockRevalidatePath).toHaveBeenCalledWith('/')
            expect(mockRevalidatePath).toHaveBeenCalledWith('/deck/deck-1/edit')
        })

        test('should return error when user not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            const formData = new FormData()
            formData.append('id', 'deck-1')

            const result = await updateDeck(formData)

            expect(result).toEqual({
                success: false,
                error: 'Not authenticated',
            })
        })

        test('should return error when deck not found', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.getDeckById.mockResolvedValue(null)

            const formData = new FormData()
            formData.append('id', 'deck-1')

            const result = await updateDeck(formData)

            expect(result).toEqual({
                success: false,
                error: 'Deck not found',
            })
        })

        test('should handle database update errors', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockExistingDeck = {
                id: 'deck-1',
                userId: 'user-1',
                title: 'Old Title',
            }
            mockDbUtils.getDeckById.mockResolvedValue(mockExistingDeck as any)
            mockDbUtils.updateDeck.mockRejectedValue(new Error('Update failed'))

            const formData = new FormData()
            formData.append('id', 'deck-1')
            formData.append('title', 'Updated Title')

            const result = await updateDeck(formData)

            expect(result).toEqual({
                success: false,
                error: 'Error updating deck',
            })
        })
    })

    describe('resetDeckProgress', () => {
        test('should reset deck progress successfully', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockExistingDeck = {
                id: 'deck-1',
                userId: 'user-1',
                title: 'Test Deck',
            }
            mockDbUtils.getDeckById.mockResolvedValue(mockExistingDeck as any)
            mockDbUtils.resetDeckProgress.mockResolvedValue(undefined)

            const result = await resetDeckProgress('deck-1')

            expect(result).toEqual({ success: true })
            expect(mockDbUtils.resetDeckProgress).toHaveBeenCalledWith(
                'user-1',
                'deck-1'
            )
            expect(mockRevalidatePath).toHaveBeenCalledWith('/')
            expect(mockRevalidatePath).toHaveBeenCalledWith('/deck/deck-1/edit')
        })

        test('should return error when user not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            const result = await resetDeckProgress('deck-1')

            expect(result).toEqual({
                success: false,
                error: 'Not authenticated',
            })
        })

        test('should return error when deck not found', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.getDeckById.mockResolvedValue(null)

            const result = await resetDeckProgress('deck-1')

            expect(result).toEqual({
                success: false,
                error: 'Deck not found',
            })
        })

        test('should handle database reset errors', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockExistingDeck = {
                id: 'deck-1',
                userId: 'user-1',
                title: 'Test Deck',
            }
            mockDbUtils.getDeckById.mockResolvedValue(mockExistingDeck as any)
            mockDbUtils.resetDeckProgress.mockRejectedValue(
                new Error('Reset failed')
            )

            const result = await resetDeckProgress('deck-1')

            expect(result).toEqual({
                success: false,
                error: 'Error resetting progress',
            })
        })
    })

    describe('deleteDeck', () => {
        test('should delete deck successfully', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockExistingDeck = {
                id: 'deck-1',
                userId: 'user-1',
                title: 'Test Deck',
            }
            mockDbUtils.getDeckById.mockResolvedValue(mockExistingDeck as any)
            mockDbUtils.deleteDeck.mockResolvedValue(undefined)

            const result = await deleteDeck('deck-1')

            expect(result).toEqual({ success: true })
            expect(mockDbUtils.deleteDeck).toHaveBeenCalledWith(
                'user-1',
                'deck-1'
            )
            expect(mockRevalidatePath).toHaveBeenCalledWith('/')
        })

        test('should return error when user not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            const result = await deleteDeck('deck-1')

            expect(result).toEqual({
                success: false,
                error: 'Not authenticated',
            })
        })

        test('should return error when deck not found', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.getDeckById.mockResolvedValue(null)

            const result = await deleteDeck('deck-1')

            expect(result).toEqual({
                success: false,
                error: 'Deck not found',
            })
        })

        test('should handle database delete errors', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockExistingDeck = {
                id: 'deck-1',
                userId: 'user-1',
                title: 'Test Deck',
            }
            mockDbUtils.getDeckById.mockResolvedValue(mockExistingDeck as any)
            mockDbUtils.deleteDeck.mockRejectedValue(new Error('Delete failed'))

            const result = await deleteDeck('deck-1')

            expect(result).toEqual({
                success: false,
                error: 'Error deleting deck',
            })
        })

        test('should handle missing deck ID', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.getDeckById.mockResolvedValue(null)

            const result = await deleteDeck('')

            expect(result).toEqual({
                success: false,
                error: 'Deck not found',
            })
            expect(mockDbUtils.getDeckById).toHaveBeenCalledWith('', 'user-1')
        })
    })

    describe('edge cases and error scenarios', () => {
        test('should handle concurrent deck operations', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.createDeck.mockResolvedValue('deck-1')
            mockDbUtils.getAllDecks.mockResolvedValue([])

            const formData = new FormData()
            formData.append('title', 'Concurrent Deck')

            // Run multiple operations concurrently
            const [createResult, getAllResult] = await Promise.all([
                createDeck(formData),
                getAllDecks(),
            ])

            expect(createResult.success).toBe(true)
            expect(getAllResult).toEqual([])
        })

        test('should handle special characters in deck data', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.createDeck.mockResolvedValue('deck-1')

            const formData = new FormData()
            formData.append('title', 'Deck with üöä & 🎯 emojis')
            formData.append('description', '<script>alert("xss")</script>')
            formData.append('category', 'Test & Learn')

            const result = await createDeck(formData)

            expect(result).toEqual({ success: true, id: 'deck-1' })
            expect(mockDbUtils.createDeck).toHaveBeenCalledWith({
                title: 'Deck with üöä & 🎯 emojis',
                description: '<script>alert("xss")</script>',
                category: 'Test & Learn',
                activeUntil: null,
                userId: 'user-1',
            })
        })

        test('should handle very long deck titles and descriptions', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)
            mockDbUtils.createDeck.mockResolvedValue('deck-1')

            const longTitle = 'A'.repeat(1000)
            const longDescription = 'B'.repeat(5000)

            const formData = new FormData()
            formData.append('title', longTitle)
            formData.append('description', longDescription)

            const result = await createDeck(formData)

            expect(result).toEqual({ success: true, id: 'deck-1' })
            expect(mockDbUtils.createDeck).toHaveBeenCalledWith({
                title: longTitle,
                description: longDescription,
                category: null,
                activeUntil: null,
                userId: 'user-1',
            })
        })

        test('should handle session timeout during operation', async () => {
            // First call succeeds, second fails
            mockGetServerSession
                .mockResolvedValueOnce({ user: { id: 'user-1' } })
                .mockResolvedValueOnce(null)

            mockDbUtils.getAllDecks.mockResolvedValue([])

            const result1 = await getAllDecks()
            const result2 = await getAllDecks()

            expect(result1).toEqual([])
            expect(result2).toEqual([])
        })
    })
})
