import { db } from '@/db'
import { subscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

import { revalidateTag, unstable_cache } from 'next/cache'

// TODO: move to db/utils.ts or similar
export async function getUserSubscription(userId: string) {
    const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1)

    return subscription[0] || null
}

export async function isUserPro(userId: string): Promise<boolean> {
    const subscription = await getUserSubscription(userId)

    if (!subscription) return false

    const isActive =
        subscription.status === 'active' || subscription.status === 'trialing'
    const isPeriodValid = subscription.stripeCurrentPeriodEnd
        ? subscription.stripeCurrentPeriodEnd > new Date()
        : false

    // Allow access if subscription is active AND period is valid
    return isActive && isPeriodValid
}

export const getCachedUserSubscription = (userId: string) =>
    unstable_cache(
        async () => {
            return getUserSubscription(userId)
        },
        [`user-subscription-${userId}`],
        {
            revalidate: 60, // Cache for 1 minute
            tags: [`subscription-${userId}`],
        }
    )

export const isUserProCached = (userId: string) =>
    unstable_cache(
        async () => {
            return isUserPro(userId)
        },
        [`user-pro-status-${userId}`],
        {
            revalidate: 60,
            tags: [`subscription-${userId}`],
        }
    )

// Invalidate cache when subscription changes
export async function invalidateSubscriptionCache(userId: string) {
    revalidateTag(`subscription-${userId}`)
}
