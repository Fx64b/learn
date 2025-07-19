import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
    windowMs: number
    maxRequests: number
    message: string
    skipSuccessfulRequests?: boolean
}

const STRIPE_RATE_LIMITS: Record<string, RateLimitConfig> = {
    'create-checkout-session': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 checkout attempts per 15 minutes per user
        message: 'Too many checkout attempts. Please try again later.',
        skipSuccessfulRequests: true,
    },
    'billing-portal': {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 10, // 10 billing portal requests per 5 minutes per user
        message: 'Too many billing portal requests. Please try again later.',
    },
    'change-plan': {
        windowMs: 10 * 60 * 1000, // 10 minutes
        maxRequests: 3, // 3 plan changes per 10 minutes per user
        message: 'Too many plan change attempts. Please try again later.',
    },
    webhook: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 webhook requests per minute (generous for Stripe)
        message: 'Webhook rate limit exceeded.',
    },
}

export async function checkStripeRateLimit(
    request: NextRequest,
    endpoint: keyof typeof STRIPE_RATE_LIMITS,
    userId?: string
): Promise<NextResponse | null> {
    const config = STRIPE_RATE_LIMITS[endpoint]

    if (!config) {
        console.warn(
            `No rate limit configuration found for endpoint: ${endpoint}`
        )
        return null
    }

    // Create identifier - prefer userId, fallback to IP
    const ip = getClientIP(request)
    const identifier = userId
        ? `user:${userId}:${endpoint}`
        : `ip:${ip}:${endpoint}`

    try {
        const result = await checkRateLimit(identifier, 'general')

        if (!result.success) {
            console.warn(`Rate limit exceeded for ${identifier}`, {
                endpoint,
                ip,
                userId,
                limit: result.limit,
                remaining: result.remaining,
                reset: result.reset,
            })

            const retryAfter = result.reset
                ? Math.ceil((result.reset - Date.now()) / 1000)
                : 900

            return NextResponse.json(
                {
                    error: config.message,
                    retryAfter,
                    code: 'RATE_LIMIT_EXCEEDED',
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': retryAfter.toString(),
                        'X-RateLimit-Limit': result.limit?.toString() || '100',
                        'X-RateLimit-Remaining':
                            result.remaining?.toString() || '0',
                        'X-RateLimit-Reset': result.reset?.toString() || '0',
                        'X-RateLimit-Policy': `${config.maxRequests} requests per ${config.windowMs / 1000} seconds`,
                    },
                }
            )
        }

        return null // No rate limit hit
    } catch (error) {
        console.error(`Rate limit check failed for ${identifier}:`, error)
        // Don't block requests if rate limiting fails
        return null
    }
}

function getClientIP(request: NextRequest): string {
    // Try to get the real IP from various headers in order of preference
    const headers = [
        'x-forwarded-for',
        'x-real-ip',
        'cf-connecting-ip', // Cloudflare
        'x-client-ip',
        'x-forwarded',
        'forwarded-for',
        'forwarded',
    ]

    for (const header of headers) {
        const value = request.headers.get(header)
        if (value) {
            // x-forwarded-for can contain multiple IPs, take the first one
            const ip = value.split(',')[0].trim()
            if (isValidIP(ip)) {
                return ip
            }
        }
    }

    return 'unknown'
}

function isValidIP(ip: string): boolean {
    // Basic IP validation for IPv4 and IPv6
    const ipv4Regex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

    return (
        ipv4Regex.test(ip) ||
        ipv6Regex.test(ip) ||
        ip === '::1' ||
        ip === 'localhost'
    )
}
