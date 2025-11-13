'use server'

import { db } from '@/db'
import { userPreferences } from '@/db/schema'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { eq } from 'drizzle-orm'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'

export async function getUserPreferences() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return null
    }

    const rateLimitResult = await checkRateLimit(
        `user:${session.user.id}:data-retrieval`,
        'dataRetrieval'
    )

    if (!rateLimitResult.success) {
        return null
    }

    const preferences = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, session.user.id))
        .limit(1)

    return (
        preferences[0] || {
            userId: session.user.id,
            animationsEnabled: false,
            animationSpeed: 200,
            animationDirection: 'horizontal',
            theme: 'dark',
        }
    )
}

export async function updateUserPreferences(data: {
    animationsEnabled?: boolean
    animationSpeed?: number
    animationDirection?: 'horizontal' | 'vertical'
    theme?: 'light' | 'dark' | 'system'
    locale?: string
}) {
    const authT = await getTranslations('auth')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        const rateLimitResult = await checkRateLimit(
            `user:${session.user.id}:preferences`,
            'preferences'
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: authT('ratelimitExceeded'),
            }
        }

        const existing = await db
            .select()
            .from(userPreferences)
            .where(eq(userPreferences.userId, session.user.id))
            .limit(1)

        if (existing.length > 0) {
            await db
                .update(userPreferences)
                .set({
                    ...data,
                    updatedAt: new Date(),
                })
                .where(eq(userPreferences.userId, session.user.id))
        } else {
            await db.insert(userPreferences).values({
                userId: session.user.id,
                animationsEnabled: data.animationsEnabled ?? false,
                animationSpeed: data.animationSpeed ?? 200,
                animationDirection: data.animationDirection ?? 'horizontal',
                theme: data.theme ?? 'dark',
                locale: data.locale ?? 'en',
                updatedAt: new Date(),
            })
        }

        revalidatePath('/profile')
        return { success: true }
    } catch (error) {
        console.error('Error updating user preferences:', error)
        return { success: false, error: 'Error updating preferences' }
    }
}
