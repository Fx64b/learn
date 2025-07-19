import { NextRequest } from 'next/server'

/**
 * Official Stripe webhook IP addresses as of 2025
 * Source: https://docs.stripe.com/ips
 * Updated: January 2025
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

const STRIPE_USER_AGENT_PATTERN =
    /^Stripe\/1\.0 \(\+https:\/\/stripe\.com\/docs\/webhooks\)$/

interface WebhookSecurityResult {
    isValid: boolean
    reason?: string
    clientIP?: string
    userAgent?: string
    ipVerified: boolean
    signatureRequired: boolean
}

/**
 * Validates webhook source with graceful degradation
 * Signature verification is the primary security mechanism
 */
export function validateStripeWebhookSource(
    request: NextRequest
): WebhookSecurityResult {
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent')

    // Development mode - allow all
    if (process.env.NODE_ENV === 'development') {
        return {
            isValid: true,
            reason: 'Development mode - validation skipped',
            clientIP,
            userAgent: userAgent || undefined,
            ipVerified: false,
            signatureRequired: true,
        }
    }

    // Production mode - verify what we can, but don't block on IP issues
    let ipVerified = false
    let suspiciousActivity = false

    // Check IP if we can determine it
    if (clientIP && clientIP !== 'unknown') {
        if (STRIPE_WEBHOOK_IPS.includes(clientIP)) {
            ipVerified = true
        } else {
            // Log suspicious IP but don't block (could be proxy/CDN)
            console.warn(`Webhook from non-Stripe IP: ${clientIP}`)
            suspiciousActivity = true
        }
    }

    // Check User-Agent if available
    if (userAgent && !STRIPE_USER_AGENT_PATTERN.test(userAgent)) {
        console.warn(`Unexpected User-Agent: ${userAgent}`)
        suspiciousActivity = true
    }

    // Always allow but require signature verification
    // Log suspicious activity for monitoring
    return {
        isValid: true, // Always true - let signature verification be the gate
        reason: suspiciousActivity
            ? 'Suspicious activity detected but allowed pending signature verification'
            : 'Source validation passed',
        clientIP,
        userAgent: userAgent || undefined,
        ipVerified,
        signatureRequired: true,
    }
}

/**
 * IP address extraction from request headers
 */
function getClientIP(request: NextRequest): string {
    // Check headers in order of preference
    const headers = [
        'cf-connecting-ip', // Cloudflare (most reliable)
        'x-real-ip', // nginx proxy
        'x-forwarded-for', // Standard proxy header
        'x-client-ip', // Some proxies
        'x-cluster-client-ip', // Some load balancers
        'x-forwarded',
        'forwarded-for',
        'forwarded',
    ]

    for (const header of headers) {
        const value = request.headers.get(header)
        if (value) {
            // Handle comma-separated IPs (x-forwarded-for format)
            const ips = value.split(',').map((ip) => ip.trim())

            // Find first valid public IP
            for (const ip of ips) {
                if (isValidPublicIP(ip)) {
                    return ip
                }
            }
        }
    }

    // Fallback to connection IP if available
    // Note: This might not work in all deployment environments
    return 'unknown'
}

/**
 * Enhanced IP validation that excludes private IPs
 */
function isValidPublicIP(ip: string): boolean {
    // Basic format validation
    const ipv4Regex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
        return false
    }

    // Exclude private IPv4 ranges
    if (ipv4Regex.test(ip)) {
        const parts = ip.split('.').map(Number)
        // Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
        if (
            parts[0] === 10 ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (parts[0] === 192 && parts[1] === 168) ||
            parts[0] === 127 // localhost
        ) {
            return false
        }
    }

    return true
}

/**
 * Enhanced logging with security levels
 */
export function logWebhookSecurityEvent(
    event: 'allowed' | 'blocked' | 'suspicious',
    details: WebhookSecurityResult,
    additionalInfo?: Record<string, unknown>
) {
    const logData = {
        timestamp: new Date().toISOString(),
        event,
        clientIP: details.clientIP,
        userAgent: details.userAgent,
        reason: details.reason,
        isValid: details.isValid,
        ipVerified: details.ipVerified,
        ...additionalInfo,
    }

    if (event === 'blocked') {
        console.error('🚫 Stripe webhook BLOCKED:', logData)
    } else if (event === 'suspicious') {
        console.warn('⚠️ Suspicious Stripe webhook activity:', logData)
    } else {
        console.log('✅ Stripe webhook allowed:', logData)
    }
}
