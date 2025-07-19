'use server'

import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import {
    isUserInGracePeriod,
    isUserLimited,
} from '@/lib/subscription/stripe/payment-recovery'
import { isUserPro } from '@/lib/subscription/subscription'

export interface AIRateLimitConfig {
    windowMs: number
    maxRequests: number
    description: string
}

const AI_RATE_LIMITS: Record<string, AIRateLimitConfig> = {
    'ai-generation-pro': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 50,
        description: 'Pro users: 50 AI generations per hour',
    },
    'ai-generation-grace': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 15,
        description: 'Grace period: 15 AI generations per hour',
    },
    'ai-generation-limited': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 5,
        description: 'Limited access: 5 AI generations per hour',
    },
    'ai-generation-free': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 0,
        description: 'Free users: AI generation not available',
    },
}

export type AIUserTier = 'pro' | 'grace' | 'limited' | 'free'

/**
 * Determine user's AI rate limit tier
 */
export async function getAIUserTier(userId: string): Promise<AIUserTier> {
    try {
        // Check if user is limited due to failed payments
        const isLimited = await isUserLimited(userId)
        if (isLimited) {
            return 'limited'
        }

        // Check if user is in grace period
        const isInGrace = await isUserInGracePeriod(userId)
        if (isInGrace) {
            return 'grace'
        }

        // Check if user has active Pro subscription
        const isPro = await isUserPro(userId)
        if (isPro) {
            return 'pro'
        }

        // Default to free tier
        return 'free'
    } catch (error) {
        console.error('Error determining AI user tier:', error)
        return 'free' // Fail-safe to most restrictive tier
    }
}

/**
 * Check AI rate limit for a user based on their tier
 */
export async function checkAIRateLimit(
    userId: string,
    userEmail: string
): Promise<{
    success: boolean
    tier: AIUserTier
    limit: number
    remaining?: number
    reset?: number
    resetTime?: Date
}> {
    try {
        const tier = await getAIUserTier(userId)
        const limitType = `ai-generation-${tier}`
        const config = AI_RATE_LIMITS[limitType]

        // Free users are completely blocked
        if (tier === 'free') {
            return {
                success: false,
                tier,
                limit: 0,
                remaining: 0,
            }
        }

        // Check rate limit using existing system
        const identifier = `user:${userEmail}:${limitType}`
        const result = await checkRateLimit(identifier, 'general')

        return {
            success: result.success,
            tier,
            limit: config.maxRequests,
            remaining: result.remaining,
            reset: result.reset,
            resetTime: result.reset ? new Date(result.reset) : undefined,
        }
    } catch (error) {
        console.error('Error checking AI rate limit:', error)
        return {
            success: false,
            tier: 'free',
            limit: 0,
            remaining: 0,
        }
    }
}

/**
 * Get user-friendly rate limit message
 */
function getAIRateLimitMessage(tier: AIUserTier, resetTime?: Date): string {
    const config = AI_RATE_LIMITS[`ai-generation-${tier}`]

    switch (tier) {
        case 'free':
            return 'AI flashcard generation is available for Pro users. Upgrade to unlock this feature!'

        case 'limited':
            return `AI generation is limited to ${config.maxRequests} requests per hour due to payment issues. Update your payment method to restore full access.`

        case 'grace':
            return `You have ${config.maxRequests} AI generations per hour during the grace period. Update your payment method to restore full Pro limits.`

        case 'pro':
            if (resetTime) {
                return `Rate limit reached. You can generate more AI flashcards at ${resetTime.toLocaleTimeString()}.`
            }
            return `You have ${config.maxRequests} AI generations per hour as a Pro user.`

        default:
            return 'AI generation is not available.'
    }
}

/**
 * Enhanced rate limit check with detailed error information
 */
export async function checkAIRateLimitWithDetails(
    userId: string,
    userEmail: string
): Promise<{
    allowed: boolean
    tier: AIUserTier
    message: string
    limit: number
    remaining?: number
    resetTime?: Date
    upgradeRequired?: boolean
    paymentIssue?: boolean
}> {
    const result = await checkAIRateLimit(userId, userEmail)

    return {
        allowed: result.success,
        tier: result.tier,
        message: getAIRateLimitMessage(result.tier, result.resetTime),
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime,
        upgradeRequired: result.tier === 'free',
        paymentIssue: result.tier === 'limited' || result.tier === 'grace',
    }
}
