// lib/signup-codes.ts
import { checkRateLimit } from '@/lib/rate-limit'
import { Redis } from '@upstash/redis'

const redis = process.env.REDIS_URL ? Redis.fromEnv() : null

export const SIGNUP_CODE_CONFIG = {
    CODE_LENGTH: 6,
    CODE_EXPIRY_MINUTES: 5,
    MAX_VERIFICATION_ATTEMPTS: 3,
} as const

type SignupCodeResult = {
    success: boolean
    code?: string
    error?: string
}

type VerifyCodeResult = {
    success: boolean
    email?: string
    error?: string
}

/**
 * Check if signup codes are available (Redis is configured)
 */
export function isSignupCodesAvailable(): boolean {
    return redis !== null
}

/**
 * Generate a random 6-digit code
 */
function generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Generate and store a signup code for an email
 */
export async function generateSignupCode(
    email: string
): Promise<SignupCodeResult> {
    if (!redis) {
        return { success: false, error: 'Redis not available' }
    }

    try {
        // Rate limit code generation
        const rateLimitResult = await checkRateLimit(
            `signup_code:${email}`,
            'email'
        )
        if (!rateLimitResult.success) {
            return {
                success: false,
                error: 'Too many code requests. Please wait before requesting another code.',
            }
        }

        const code = generateCode()
        const expirySeconds = SIGNUP_CODE_CONFIG.CODE_EXPIRY_MINUTES * 60

        // Store code with email as key for verification
        await redis.setex(
            `signup_code:${email}`,
            expirySeconds,
            JSON.stringify({
                code,
                attempts: 0,
                createdAt: Date.now(),
            })
        )

        return { success: true, code }
    } catch (error) {
        console.error('Error generating signup code:', error)
        return { success: false, error: 'Failed to generate signup code' }
    }
}

/**
 * Verify a signup code against an email
 */
export async function verifySignupCode(
    email: string,
    inputCode: string
): Promise<VerifyCodeResult> {
    if (!redis) {
        return { success: false, error: 'Redis not available' }
    }

    try {
        // Get stored code data
        const storedData = await redis.get(`signup_code:${email}`)

        if (!storedData) {
            return {
                success: false,
                error: 'Code is not valid. Please request a new code.',
            }
        }

        const data =
            typeof storedData === 'string' ? JSON.parse(storedData) : storedData
        const { code, attempts } = data

        // Check attempt limit
        if (attempts >= SIGNUP_CODE_CONFIG.MAX_VERIFICATION_ATTEMPTS) {
            await redis.del(`signup_code:${email}`)
            return {
                success: false,
                error: 'Too many verification attempts. Please request a new code.',
            }
        }

        // Rate limit verification attempts
        const rateLimitResult = await checkRateLimit(
            `verify_code:${email}:${inputCode}`,
            'general'
        )
        if (!rateLimitResult.success) {
            return {
                success: false,
                error: 'Too many verification attempts. Please wait.',
            }
        }

        // Check if code matches
        if (code !== inputCode) {
            // Increment attempts
            await incrementVerificationAttempts(email)
            return { success: false, error: 'Invalid code. Please try again.' }
        }

        // Code is valid - clean up
        await redis.del(`signup_code:${email}`)

        return { success: true, email }
    } catch (error) {
        console.error('Error verifying signup code:', error)
        return { success: false, error: 'Failed to verify code' }
    }
}

/**
 * Increment verification attempts for an email
 */
async function incrementVerificationAttempts(email: string): Promise<void> {
    if (!redis) return

    try {
        const storedData = await redis.get(`signup_code:${email}`)
        if (storedData) {
            const data = JSON.parse(storedData as string)
            data.attempts = (data.attempts || 0) + 1

            // Update with remaining TTL
            const ttl = await redis.ttl(`signup_code:${email}`)
            if (ttl > 0) {
                await redis.setex(
                    `signup_code:${email}`,
                    ttl,
                    JSON.stringify(data)
                )
            }
        }
    } catch (error) {
        console.error('Error incrementing verification attempts:', error)
    }
}
