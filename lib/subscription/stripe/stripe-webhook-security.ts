import { NextRequest } from 'next/server'

/**
 * Official Stripe webhook IP addresses as of 2024
 * Source: https://docs.stripe.com/ips
 * Updated: January 2024
 */
const STRIPE_WEBHOOK_IPS = [
    '3.18.12.63',
    '3.130.192.231',
    '13.235.14.237',
    '13.235.122.149',
    '18.211.135.69',
    '35.154.171.200',
    '52.15.183.38',
    '54.88.130.119',
    '54.88.130.237',
    '54.187.174.169',
    '54.187.205.235',
    '54.187.216.72',
]

/**
 * Expected User-Agent pattern for Stripe webhooks
 */
const STRIPE_USER_AGENT_PATTERN =
    /^Stripe\/1\.0 \(\+https:\/\/stripe\.com\/docs\/webhooks\)$/

interface WebhookSecurityResult {
    isValid: boolean
    reason?: string
    clientIP?: string
    userAgent?: string
}

/**
 * Validates that a webhook request is actually from Stripe
 * This provides defense in depth alongside signature verification
 */
export function validateStripeWebhookSource(
    request: NextRequest
): WebhookSecurityResult {
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent')

    // Skip IP validation in development mode
    if (process.env.NODE_ENV === 'development') {
        console.log('Skipping Stripe webhook IP validation in development mode')
        return {
            isValid: true,
            reason: 'Development mode - IP validation skipped',
            clientIP,
            userAgent: userAgent || undefined,
        }
    }

    // Validate IP address
    if (!clientIP || clientIP === 'unknown') {
        return {
            isValid: false,
            reason: 'Unable to determine client IP address',
            clientIP,
            userAgent: userAgent || undefined,
        }
    }

    if (!STRIPE_WEBHOOK_IPS.includes(clientIP)) {
        return {
            isValid: false,
            reason: `IP address ${clientIP} is not in Stripe's authorized IP list`,
            clientIP,
            userAgent: userAgent || undefined,
        }
    }

    // Validate User-Agent (optional but recommended)
    if (userAgent && !STRIPE_USER_AGENT_PATTERN.test(userAgent)) {
        console.warn(`Suspicious User-Agent for Stripe webhook: ${userAgent}`)
        // Don't fail on User-Agent mismatch as it might be modified by proxies
        // But log it for monitoring
    }

    return {
        isValid: true,
        reason: 'Valid Stripe webhook source',
        clientIP,
        userAgent: userAgent || undefined,
    }
}

/**
 * Get the real client IP from request headers
 * Handles various proxy configurations
 */
function getClientIP(request: NextRequest): string {
    // Check common headers in order of preference
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

/**
 * Basic IP address validation
 */
function isValidIP(ip: string): boolean {
    const ipv4Regex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

/**
 * Log webhook security events for monitoring
 */
export function logWebhookSecurityEvent(
    event: 'allowed' | 'blocked' | 'suspicious',
    details: WebhookSecurityResult,
    additionalInfo?: Record<string, any>
) {
    const logData = {
        timestamp: new Date().toISOString(),
        event,
        clientIP: details.clientIP,
        userAgent: details.userAgent,
        reason: details.reason,
        isValid: details.isValid,
        ...additionalInfo,
    }

    if (event === 'blocked') {
        console.warn('Stripe webhook blocked:', logData)
    } else if (event === 'suspicious') {
        console.warn('Suspicious Stripe webhook activity:', logData)
    } else {
        console.log('Stripe webhook allowed:', logData)
    }

    // In production, you might want to send this to a monitoring service
    // Example: await sendToMonitoring(logData)
}

/**
 * Utility function to check if an IP is in the current Stripe IP list
 * Useful for debugging and monitoring
 */
export function isStripeIP(ip: string): boolean {
    return STRIPE_WEBHOOK_IPS.includes(ip)
}

/**
 * Get the current list of Stripe IPs (for debugging/monitoring)
 */
export function getStripeWebhookIPs(): string[] {
    return [...STRIPE_WEBHOOK_IPS]
}
