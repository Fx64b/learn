import { db } from '@/db'
import { subscriptions } from '@/db/schema'
import {
    SUBSCRIPTION_STATUS,
    getCachedUserSubscription,
    getUserSubscription,
    isUserPro,
} from '@/lib/subscription/subscription'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { revalidateTag, unstable_cache } from 'next/cache'

// Mock dependencies
vi.mock('@/db')
vi.mock('@/db/schema')
vi.mock('drizzle-orm')
vi.mock('next/cache')

const mockDb = vi.mocked(db)
const mockEq = vi.mocked(eq)
const mockRevalidateTag = vi.mocked(revalidateTag)
const mockUnstableCache = vi.mocked(unstable_cache)

describe('Subscription Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockEq.mockImplementation(
            (field, value) => ({ field, value, type: 'eq' }) as any
        )
        mockRevalidateTag.mockImplementation(() => {})
        mockUnstableCache.mockImplementation(
            (fn) => () => Promise.resolve(null)
        )

        // Mock db operations
        const mockSelect = vi.fn().mockReturnThis()
        const mockFrom = vi.fn().mockReturnThis()
        const mockWhere = vi.fn().mockReturnThis()
        const mockLimit = vi.fn()

        mockDb.select = mockSelect

        mockSelect.mockImplementation(() => ({
            from: mockFrom,
        }))

        mockFrom.mockImplementation(() => ({
            where: mockWhere,
        }))

        mockWhere.mockImplementation(() => ({
            limit: mockLimit,
        }))
    })

    describe('SUBSCRIPTION_STATUS constants', () => {
        test('should have correct status values', () => {
            expect(SUBSCRIPTION_STATUS.ACTIVE).toBe('active')
            expect(SUBSCRIPTION_STATUS.TRIALING).toBe('trialing')
            expect(SUBSCRIPTION_STATUS.PAST_DUE).toBe('past_due')
            expect(SUBSCRIPTION_STATUS.CANCELED).toBe('canceled')
            expect(SUBSCRIPTION_STATUS.INCOMPLETE).toBe('incomplete')
            expect(SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED).toBe(
                'incomplete_expired'
            )
            expect(SUBSCRIPTION_STATUS.UNPAID).toBe('unpaid')
        })
    })

    describe('getUserSubscription', () => {
        test('should return subscription for valid user ID', async () => {
            const mockSubscription = {
                id: 'sub-1',
                userId: 'user-1',
                stripeCustomerId: 'cus_123',
                stripeSubscriptionId: 'sub_123',
                stripePriceId: 'price_123',
                stripeCurrentPeriodEnd: new Date('2024-12-31'),
                status: 'active',
                cancelAtPeriodEnd: false,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            }

            const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await getUserSubscription('user-1')

            expect(result).toEqual(mockSubscription)
            expect(mockSelect).toHaveBeenCalled()
            expect(mockFrom).toHaveBeenCalledWith(subscriptions)
            expect(mockWhere).toHaveBeenCalledWith({
                field: subscriptions.userId,
                value: 'user-1',
                type: 'eq',
            })
            expect(mockLimit).toHaveBeenCalledWith(1)
        })

        test('should return null when no subscription found', async () => {
            const mockLimit = vi.fn().mockResolvedValue([])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await getUserSubscription('user-1')

            expect(result).toBeNull()
        })

        test('should throw error for invalid user ID', async () => {
            await expect(getUserSubscription('')).rejects.toThrow(
                'Invalid user ID provided'
            )
            await expect(getUserSubscription(null as any)).rejects.toThrow(
                'Invalid user ID provided'
            )
            await expect(getUserSubscription(undefined as any)).rejects.toThrow(
                'Invalid user ID provided'
            )
            await expect(getUserSubscription(123 as any)).rejects.toThrow(
                'Invalid user ID provided'
            )
        })

        test('should handle database errors', async () => {
            const mockLimit = vi
                .fn()
                .mockRejectedValue(new Error('Database connection failed'))
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            await expect(getUserSubscription('user-1')).rejects.toThrow(
                'Failed to fetch subscription data'
            )
        })

        test('should handle multiple subscriptions by returning first', async () => {
            const mockSubscriptions = [
                { id: 'sub-1', userId: 'user-1', status: 'active' },
                { id: 'sub-2', userId: 'user-1', status: 'canceled' },
            ]

            const mockLimit = vi.fn().mockResolvedValue(mockSubscriptions)
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await getUserSubscription('user-1')

            expect(result).toEqual(mockSubscriptions[0])
            expect(mockLimit).toHaveBeenCalledWith(1) // Should limit to 1
        })
    })

    describe('isUserPro', () => {
        test('should return true for active subscription with valid period', async () => {
            const futureDate = new Date()
            futureDate.setMonth(futureDate.getMonth() + 1) // One month in future

            const mockSubscription = {
                id: 'sub-1',
                userId: 'user-1',
                status: 'active',
                stripeCurrentPeriodEnd: futureDate,
                stripeCustomerId: 'cus_123',
                stripeSubscriptionId: 'sub_123',
                stripePriceId: 'price_123',
                cancelAtPeriodEnd: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await isUserPro('user-1')

            expect(result).toBe(true)
        })

        test('should return true for trialing subscription', async () => {
            const futureDate = new Date()
            futureDate.setMonth(futureDate.getMonth() + 1)

            const mockSubscription = {
                id: 'sub-1',
                userId: 'user-1',
                status: 'trialing',
                stripeCurrentPeriodEnd: futureDate,
                stripeCustomerId: 'cus_123',
                stripeSubscriptionId: 'sub_123',
                stripePriceId: 'price_123',
                cancelAtPeriodEnd: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await isUserPro('user-1')

            expect(result).toBe(true)
        })

        test('should return true for past_due subscription with valid period', async () => {
            const futureDate = new Date()
            futureDate.setMonth(futureDate.getMonth() + 1)

            const mockSubscription = {
                id: 'sub-1',
                userId: 'user-1',
                status: 'past_due',
                stripeCurrentPeriodEnd: futureDate,
                stripeCustomerId: 'cus_123',
                stripeSubscriptionId: 'sub_123',
                stripePriceId: 'price_123',
                cancelAtPeriodEnd: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await isUserPro('user-1')

            expect(result).toBe(true)
        })

        test('should return false for canceled subscription', async () => {
            const futureDate = new Date()
            futureDate.setMonth(futureDate.getMonth() + 1)

            const mockSubscription = {
                id: 'sub-1',
                userId: 'user-1',
                status: 'canceled',
                stripeCurrentPeriodEnd: futureDate,
                stripeCustomerId: 'cus_123',
                stripeSubscriptionId: 'sub_123',
                stripePriceId: 'price_123',
                cancelAtPeriodEnd: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await isUserPro('user-1')

            expect(result).toBe(false)
        })

        test('should return false for active subscription with expired period', async () => {
            const pastDate = new Date()
            pastDate.setMonth(pastDate.getMonth() - 1) // One month in past

            const mockSubscription = {
                id: 'sub-1',
                userId: 'user-1',
                status: 'active',
                stripeCurrentPeriodEnd: pastDate,
                stripeCustomerId: 'cus_123',
                stripeSubscriptionId: 'sub_123',
                stripePriceId: 'price_123',
                cancelAtPeriodEnd: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await isUserPro('user-1')

            expect(result).toBe(false)
        })

        test('should return false when no subscription exists', async () => {
            const mockLimit = vi.fn().mockResolvedValue([])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await isUserPro('user-1')

            expect(result).toBe(false)
        })

        test('should return false for invalid user ID', async () => {
            const result1 = await isUserPro('')
            const result2 = await isUserPro(null as any)
            const result3 = await isUserPro(undefined as any)

            expect(result1).toBe(false)
            expect(result2).toBe(false)
            expect(result3).toBe(false)
        })

        test('should return false for subscription without period end', async () => {
            const mockSubscription = {
                id: 'sub-1',
                userId: 'user-1',
                status: 'active',
                stripeCurrentPeriodEnd: null,
                stripeCustomerId: 'cus_123',
                stripeSubscriptionId: 'sub_123',
                stripePriceId: 'price_123',
                cancelAtPeriodEnd: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await isUserPro('user-1')

            expect(result).toBe(false)
        })

        test('should handle database errors gracefully', async () => {
            const mockLimit = vi
                .fn()
                .mockRejectedValue(new Error('Database error'))
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await isUserPro('user-1')

            expect(result).toBe(false) // Should fail gracefully
        })

        test('should validate all subscription statuses', async () => {
            const futureDate = new Date()
            futureDate.setMonth(futureDate.getMonth() + 1)

            const testCases = [
                { status: 'active', expected: true },
                { status: 'trialing', expected: true },
                { status: 'past_due', expected: true },
                { status: 'canceled', expected: false },
                { status: 'incomplete', expected: false },
                { status: 'incomplete_expired', expected: false },
                { status: 'unpaid', expected: false },
                { status: 'unknown_status', expected: false },
            ]

            for (const testCase of testCases) {
                const mockSubscription = {
                    id: 'sub-1',
                    userId: 'user-1',
                    status: testCase.status,
                    stripeCurrentPeriodEnd: futureDate,
                    stripeCustomerId: 'cus_123',
                    stripeSubscriptionId: 'sub_123',
                    stripePriceId: 'price_123',
                    cancelAtPeriodEnd: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }

                const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
                const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
                const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
                const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

                mockDb.select = mockSelect

                const result = await isUserPro('user-1')
                expect(result).toBe(testCase.expected)
            }
        })
    })

    describe('getCachedUserSubscription', () => {
        test('should throw error for missing user ID', () => {
            expect(() => getCachedUserSubscription('')).toThrow(
                'User ID is required for cached subscription lookup'
            )
            expect(() => getCachedUserSubscription(null as any)).toThrow(
                'User ID is required for cached subscription lookup'
            )
            expect(() => getCachedUserSubscription(undefined as any)).toThrow(
                'User ID is required for cached subscription lookup'
            )
        })

        test('should call unstable_cache with correct function', () => {
            const userId = 'user-1'

            // Mock the database to prevent actual calls
            const mockLimit = vi.fn().mockResolvedValue([])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            getCachedUserSubscription(userId)

            expect(mockUnstableCache).toHaveBeenCalledWith(
                expect.any(Function),
                [`user-subscription-${userId}`],
                {
                    revalidate: 60,
                    tags: [`subscription-${userId}`],
                }
            )
        })

        test('should return cached function result', async () => {
            const userId = 'user-1'
            const mockSubscription = { id: 'sub-1', userId }

            // Mock the database call first
            const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            // Mock the cached function to return the cached result
            mockUnstableCache.mockImplementation((fn) => {
                return async () => {
                    return await fn()
                }
            })

            const result = await getCachedUserSubscription(userId)

            expect(result).toEqual(mockSubscription)
        })
    })

    describe('edge cases and error handling', () => {
        test('should handle malformed subscription data', async () => {
            const malformedSubscription = {
                // Missing required fields
                id: 'sub-1',
                userId: 'user-1',
                // Missing other fields
            }

            const mockLimit = vi.fn().mockResolvedValue([malformedSubscription])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            const result = await getUserSubscription('user-1')
            expect(result).toEqual(malformedSubscription)

            // isUserPro should handle missing fields gracefully
            const isProResult = await isUserPro('user-1')
            expect(isProResult).toBe(false)
        })

        test('should handle date edge cases', async () => {
            const now = new Date()
            const exactlyNow = new Date(now.getTime())
            const oneSecondAgo = new Date(now.getTime() - 1000)
            const oneSecondFuture = new Date(now.getTime() + 1000)

            const testCases = [
                { date: exactlyNow, description: 'exactly now' },
                { date: oneSecondAgo, description: 'one second ago' },
                { date: oneSecondFuture, description: 'one second future' },
            ]

            for (const testCase of testCases) {
                const mockSubscription = {
                    id: 'sub-1',
                    userId: 'user-1',
                    status: 'active',
                    stripeCurrentPeriodEnd: testCase.date,
                    stripeCustomerId: 'cus_123',
                    stripeSubscriptionId: 'sub_123',
                    stripePriceId: 'price_123',
                    cancelAtPeriodEnd: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }

                const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
                const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
                const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
                const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

                mockDb.select = mockSelect

                const result = await isUserPro('user-1')
                const expected = testCase.date > now
                expect(result).toBe(expected)
            }
        })

        test('should handle concurrent subscription checks', async () => {
            const mockSubscription = {
                id: 'sub-1',
                userId: 'user-1',
                status: 'active',
                stripeCurrentPeriodEnd: new Date(Date.now() + 86400000), // Tomorrow
                stripeCustomerId: 'cus_123',
                stripeSubscriptionId: 'sub_123',
                stripePriceId: 'price_123',
                cancelAtPeriodEnd: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const mockLimit = vi.fn().mockResolvedValue([mockSubscription])
            const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

            mockDb.select = mockSelect

            // Run multiple concurrent checks
            const promises = [
                isUserPro('user-1'),
                isUserPro('user-1'),
                isUserPro('user-1'),
                getUserSubscription('user-1'),
            ]

            const results = await Promise.all(promises)

            expect(results[0]).toBe(true)
            expect(results[1]).toBe(true)
            expect(results[2]).toBe(true)
            expect(results[3]).toEqual(mockSubscription)
        })
    })
})
