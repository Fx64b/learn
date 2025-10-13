import { db } from '@/db'
import { subscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

import { revalidateTag, unstable_cache } from 'next/cache'

export interface UserSubscription {
    id: string
    userId: string
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    stripePriceId: string | null
    stripeCurrentPeriodEnd: Date | null
    status: string | null
    cancelAtPeriodEnd: boolean | null
    createdAt: Date
    updatedAt: Date
}

// Define subscription statuses as constants for type safety
export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    TRIALING: 'trialing',
    PAST_DUE: 'past_due',
    CANCELED: 'canceled',
    INCOMPLETE: 'incomplete',
    INCOMPLETE_EXPIRED: 'incomplete_expired',
    UNPAID: 'unpaid',
} as const

export type SubscriptionStatus =
    (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS]

const ACTIVE_STATUSES: SubscriptionStatus[] = [
    SUBSCRIPTION_STATUS.ACTIVE,
    SUBSCRIPTION_STATUS.TRIALING,
    SUBSCRIPTION_STATUS.PAST_DUE,
]

export async function getUserSubscription(
    userId: string
): Promise<UserSubscription | null> {
    if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID provided')
    }

    try {
        const subscription = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .limit(1)

        return subscription[0] || null
    } catch (error) {
        console.error('Error fetching user subscription:', error)
        throw new Error('Failed to fetch subscription data')
    }
}

export async function isUserPro(userId: string): Promise<boolean> {
    if (!userId || typeof userId !== 'string') {
        return false
    }

    try {
        const subscription = await getUserSubscription(userId)

        if (!subscription) {
            return false
        }

        // Check if subscription status is active
        const isActive = ACTIVE_STATUSES.includes(
            subscription.status as SubscriptionStatus
        )

        // Check if subscription period is still valid
        const isPeriodValid = subscription.stripeCurrentPeriodEnd
            ? subscription.stripeCurrentPeriodEnd > new Date()
            : false

        // User is Pro if subscription is active AND period is valid
        return isActive && isPeriodValid
    } catch (error) {
        console.error('Error checking Pro status:', error)
        // Fail gracefully - return false if there's an error
        return false
    }
}

// Cached version with better typing
export const getCachedUserSubscription = (userId: string) => {
    if (!userId) {
        throw new Error('User ID is required for cached subscription lookup')
    }

    return unstable_cache(
        async (): Promise<UserSubscription | null> => {
            return getUserSubscription(userId)
        },
        [`user-subscription-${userId}`],
        {
            revalidate: 60, // Cache for 1 minute
            tags: [`subscription-${userId}`],
        }
    )()
}

export const isUserProCached = (userId: string) => {
    if (!userId) {
        return Promise.resolve(false)
    }

    return unstable_cache(
        async (): Promise<boolean> => {
            return isUserPro(userId)
        },
        [`user-pro-status-${userId}`],
        {
            revalidate: 60,
            tags: [`subscription-${userId}`],
        }
    )()
}

// Invalidate cache when subscription changes
export async function invalidateSubscriptionCache(
    userId: string
): Promise<void> {
    if (!userId) {
        console.warn('Cannot invalidate cache: no user ID provided')
        return
    }

    try {
        revalidateTag(`subscription-${userId}`)
    } catch (error) {
        console.error('Error invalidating subscription cache:', error)
        // Don't throw - cache invalidation failure shouldn't break the app
    }
}

// Helper function to check if a subscription status is considered active
export function isActiveSubscriptionStatus(status: string | null): boolean {
    if (!status) return false
    return ACTIVE_STATUSES.includes(status as SubscriptionStatus)
}

// Helper function to get user-friendly status text
export function getSubscriptionStatusText(status: string | null): string {
    switch (status) {
        case SUBSCRIPTION_STATUS.ACTIVE:
            return 'Active'
        case SUBSCRIPTION_STATUS.TRIALING:
            return 'Trial'
        case SUBSCRIPTION_STATUS.PAST_DUE:
            return 'Past Due'
        case SUBSCRIPTION_STATUS.CANCELED:
            return 'Canceled'
        case SUBSCRIPTION_STATUS.INCOMPLETE:
            return 'Incomplete'
        case SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED:
            return 'Expired'
        case SUBSCRIPTION_STATUS.UNPAID:
            return 'Unpaid'
        default:
            return 'Unknown'
    }
}
