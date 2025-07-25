import { db } from '@/db'
import { userPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'

import {
    getUserPreferences,
    updateUserPreferences,
} from '@/app/actions/preferences'

// Mock dependencies
vi.mock('next-auth')
vi.mock('next-intl/server')
vi.mock('next/cache')
vi.mock('@/db')
vi.mock('drizzle-orm')

const mockGetServerSession = vi.mocked(getServerSession)
const mockGetTranslations = vi.mocked(getTranslations)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockDb = vi.mocked(db)
const mockEq = vi.mocked(eq)

describe('Preferences Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockRevalidatePath.mockImplementation(() => {})
        mockEq.mockImplementation(
            (field, value) => ({ field, value, type: 'eq' }) as any
        )

        // Mock db query builder
        const mockSelect = vi.fn().mockReturnThis()
        const mockFrom = vi.fn().mockReturnThis()
        const mockWhere = vi.fn().mockReturnThis()
        const mockLimit = vi.fn()
        const mockInsert = vi.fn().mockReturnThis()
        const mockValues = vi.fn()
        const mockUpdate = vi.fn().mockReturnThis()
        const mockSet = vi.fn().mockReturnThis()

        mockDb.select = mockSelect
        mockDb.insert = mockInsert
        mockDb.update = mockUpdate

        mockSelect.mockImplementation(() => ({
            from: mockFrom,
        }))

        mockFrom.mockImplementation(() => ({
            where: mockWhere,
        }))

        mockWhere.mockImplementation(() => ({
            limit: mockLimit,
        }))

        mockInsert.mockImplementation(() => ({
            values: mockValues,
        }))

        mockUpdate.mockImplementation(() => ({
            set: mockSet,
        }))

        mockSet.mockImplementation(() => ({
            where: mockWhere,
        }))
    })

    describe('getUserPreferences', () => {
        test('should return user preferences when found', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockPreferences = {
                userId: 'user-1',
                animationsEnabled: true,
                animationSpeed: 300,
                animationDirection: 'vertical',
                theme: 'light',
                locale: 'de',
            }

            const mockLimit = vi.fn().mockResolvedValue([mockPreferences])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await getUserPreferences()

            expect(result).toEqual(mockPreferences)
            expect(mockSelect).toHaveBeenCalled()
            expect(mockFrom).toHaveBeenCalledWith(userPreferences)
            expect(mockWhere).toHaveBeenCalledWith({
                field: userPreferences.userId,
                value: 'user-1',
                type: 'eq',
            })
            expect(mockLimit).toHaveBeenCalledWith(1)
        })

        test('should return default preferences when no preferences found', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockLimit = vi.fn().mockResolvedValue([]) // No preferences found
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await getUserPreferences()

            expect(result).toEqual({
                userId: 'user-1',
                animationsEnabled: false,
                animationSpeed: 200,
                animationDirection: 'horizontal',
                theme: 'dark',
            })
        })

        test('should return null when user not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            const result = await getUserPreferences()

            expect(result).toBeNull()
        })

        test('should return null when user has no ID', async () => {
            const mockSession = {
                user: { email: 'test@example.com' }, // No ID
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const result = await getUserPreferences()

            expect(result).toBeNull()
        })

        test('should handle database errors gracefully', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockLimit = vi
                .fn()
                .mockRejectedValue(new Error('Database error'))
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            await expect(getUserPreferences()).rejects.toThrow('Database error')
        })
    })

    describe('updateUserPreferences', () => {
        beforeEach(() => {
            const mockTranslations = {
                notAuthenticated: 'Not authenticated',
            }
            mockGetTranslations.mockResolvedValue(
                (key: string) =>
                    mockTranslations[key as keyof typeof mockTranslations] ||
                    key
            )
        })

        test('should update existing preferences successfully', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            // Mock existing preferences found
            const mockExistingPreferences = [
                { userId: 'user-1', theme: 'dark' },
            ]
            const mockSelectLimit = vi
                .fn()
                .mockResolvedValue(mockExistingPreferences)
            const mockSelectWhere = vi
                .fn()
                .mockReturnValue({ limit: mockSelectLimit })
            const mockSelectFrom = vi
                .fn()
                .mockReturnValue({ where: mockSelectWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

            // Mock update operation
            const mockUpdateWhere = vi.fn().mockResolvedValue(undefined)
            const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
            const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

            mockDb.select = mockSelect
            mockDb.update = mockUpdate

            const updateData = {
                theme: 'light' as const,
                animationsEnabled: true,
                animationSpeed: 300,
            }

            const result = await updateUserPreferences(updateData)

            expect(result).toEqual({ success: true })
            expect(mockUpdate).toHaveBeenCalledWith(userPreferences)
            expect(mockSet).toHaveBeenCalledWith({
                ...updateData,
                updatedAt: expect.any(Date),
            })
            expect(mockRevalidatePath).toHaveBeenCalledWith('/profile')
        })

        test('should insert new preferences when none exist', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            // Mock no existing preferences
            const mockSelectLimit = vi.fn().mockResolvedValue([])
            const mockSelectWhere = vi
                .fn()
                .mockReturnValue({ limit: mockSelectLimit })
            const mockSelectFrom = vi
                .fn()
                .mockReturnValue({ where: mockSelectWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

            // Mock insert operation
            const mockValues = vi.fn().mockResolvedValue(undefined)
            const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

            mockDb.select = mockSelect
            mockDb.insert = mockInsert

            const updateData = {
                theme: 'light' as const,
                animationsEnabled: true,
                locale: 'de',
            }

            const result = await updateUserPreferences(updateData)

            expect(result).toEqual({ success: true })
            expect(mockInsert).toHaveBeenCalledWith(userPreferences)
            expect(mockValues).toHaveBeenCalledWith({
                userId: 'user-1',
                animationsEnabled: true,
                animationSpeed: 200, // default
                animationDirection: 'horizontal', // default
                theme: 'light',
                locale: 'de',
                updatedAt: expect.any(Date),
            })
            expect(mockRevalidatePath).toHaveBeenCalledWith('/profile')
        })

        test('should return error when user not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            const result = await updateUserPreferences({ theme: 'light' })

            expect(result).toEqual({
                success: false,
                error: 'Not authenticated',
            })
        })

        test('should return error when user has no ID', async () => {
            const mockSession = {
                user: { email: 'test@example.com' }, // No ID
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const result = await updateUserPreferences({ theme: 'light' })

            expect(result).toEqual({
                success: false,
                error: 'Not authenticated',
            })
        })

        test('should validate animation direction values', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockSelectLimit = vi.fn().mockResolvedValue([])
            const mockSelectWhere = vi
                .fn()
                .mockReturnValue({ limit: mockSelectLimit })
            const mockSelectFrom = vi
                .fn()
                .mockReturnValue({ where: mockSelectWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

            const mockValues = vi.fn().mockResolvedValue(undefined)
            const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

            mockDb.select = mockSelect
            mockDb.insert = mockInsert

            const updateData = {
                animationDirection: 'vertical' as const,
            }

            const result = await updateUserPreferences(updateData)

            expect(result).toEqual({ success: true })
            expect(mockValues).toHaveBeenCalledWith({
                userId: 'user-1',
                animationsEnabled: false, // default
                animationSpeed: 200, // default
                animationDirection: 'vertical',
                theme: 'dark', // default
                locale: 'en', // default
                updatedAt: expect.any(Date),
            })
        })

        test('should validate theme values', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockSelectLimit = vi.fn().mockResolvedValue([])
            const mockSelectWhere = vi
                .fn()
                .mockReturnValue({ limit: mockSelectLimit })
            const mockSelectFrom = vi
                .fn()
                .mockReturnValue({ where: mockSelectWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

            const mockValues = vi.fn().mockResolvedValue(undefined)
            const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

            mockDb.select = mockSelect
            mockDb.insert = mockInsert

            const updateData = {
                theme: 'system' as const,
            }

            const result = await updateUserPreferences(updateData)

            expect(result).toEqual({ success: true })
            expect(mockValues).toHaveBeenCalledWith({
                userId: 'user-1',
                animationsEnabled: false,
                animationSpeed: 200,
                animationDirection: 'horizontal',
                theme: 'system',
                locale: 'en',
                updatedAt: expect.any(Date),
            })
        })

        test('should handle database errors during update', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockSelectLimit = vi
                .fn()
                .mockRejectedValue(new Error('Database error'))
            const mockSelectWhere = vi
                .fn()
                .mockReturnValue({ limit: mockSelectLimit })
            const mockSelectFrom = vi
                .fn()
                .mockReturnValue({ where: mockSelectWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

            mockDb.select = mockSelect

            const result = await updateUserPreferences({ theme: 'light' })

            expect(result).toEqual({
                success: false,
                error: 'Error updating preferences',
            })
        })

        test('should handle database errors during insert', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockSelectLimit = vi.fn().mockResolvedValue([])
            const mockSelectWhere = vi
                .fn()
                .mockReturnValue({ limit: mockSelectLimit })
            const mockSelectFrom = vi
                .fn()
                .mockReturnValue({ where: mockSelectWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

            const mockValues = vi
                .fn()
                .mockRejectedValue(new Error('Insert failed'))
            const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

            mockDb.select = mockSelect
            mockDb.insert = mockInsert

            const result = await updateUserPreferences({ theme: 'light' })

            expect(result).toEqual({
                success: false,
                error: 'Error updating preferences',
            })
        })

        test('should handle partial preference updates', async () => {
            const mockSession = {
                user: { id: 'user-1', email: 'test@example.com' },
            }
            mockGetServerSession.mockResolvedValue(mockSession)

            const mockExistingPreferences = [
                { userId: 'user-1', theme: 'dark' },
            ]
            const mockSelectLimit = vi
                .fn()
                .mockResolvedValue(mockExistingPreferences)
            const mockSelectWhere = vi
                .fn()
                .mockReturnValue({ limit: mockSelectLimit })
            const mockSelectFrom = vi
                .fn()
                .mockReturnValue({ where: mockSelectWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

            const mockUpdateWhere = vi.fn().mockResolvedValue(undefined)
            const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
            const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

            mockDb.select = mockSelect
            mockDb.update = mockUpdate

            // Only update one field
            const updateData = {
                animationSpeed: 500,
            }

            const result = await updateUserPreferences(updateData)

            expect(result).toEqual({ success: true })
            expect(mockSet).toHaveBeenCalledWith({
                animationSpeed: 500,
                updatedAt: expect.any(Date),
            })
        })
    })
})
