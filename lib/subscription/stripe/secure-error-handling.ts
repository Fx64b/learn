import { StripeError } from '@stripe/stripe-js'
import Stripe from 'stripe'

import { NextResponse } from 'next/server'

/**
 * Secure error response types
 */
interface SecureErrorResponse {
    error: string
    code?: string
    details?: string
    retryAfter?: number
    requestId?: string
}


/**
 * Categories of errors that should be handled differently
 */
export enum ErrorCategory {
    AUTHENTICATION = 'authentication',
    AUTHORIZATION = 'authorization',
    VALIDATION = 'validation',
    RATE_LIMIT = 'rate_limit',
    PAYMENT = 'payment',
    SYSTEM = 'system',
    EXTERNAL_API = 'external_api',
}

/**
 * Predefined secure error messages that don't leak sensitive information
 */
const SECURE_ERROR_MESSAGES = {
    [ErrorCategory.AUTHENTICATION]: {
        400: 'Invalid credentials provided',
        401: 'Authentication required',
        403: 'Access denied',
    },
    [ErrorCategory.AUTHORIZATION]: {
        403: 'Insufficient permissions',
        404: 'Resource not found', // Don't reveal if resource exists
    },
    [ErrorCategory.VALIDATION]: {
        400: 'Invalid request data',
        422: 'Request validation failed',
    },
    [ErrorCategory.RATE_LIMIT]: {
        429: 'Too many requests. Please try again later.',
    },
    [ErrorCategory.PAYMENT]: {
        400: 'Payment processing failed',
        402: 'Payment required',
        409: 'Payment conflict',
    },
    [ErrorCategory.SYSTEM]: {
        500: 'Internal server error',
        502: 'Service temporarily unavailable',
        503: 'Service unavailable',
    },
    [ErrorCategory.EXTERNAL_API]: {
        500: 'External service error',
        502: 'External service unavailable',
        503: 'External service timeout',
    },
}

/**
 * Patterns to detect sensitive information in error messages
 */
const SENSITIVE_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /credential/i,
    /api[_-]?key/i,
    /auth[_-]?token/i,
    /bearer/i,
    /stripe[_-]?key/i,
    /sk_live_/i,
    /sk_test_/i,
    /whsec_/i,
    /database/i,
    /db/i,
    /connection/i,
    /stack trace/i,
    /\.env/i,
    /process\.env/i,
    /file system/i,
    /directory/i,
    /path/i,
    /internal/i,
    /mongodb/i,
    /mysql/i,
    /postgresql/i,
    /redis/i,
    /server/i,
    /localhost/i,
    /127\.0\.0\.1/i,
    /0\.0\.0\.0/i,
]

/**
 * Create a secure error response that doesn't leak sensitive information
 */
export function createSecureErrorResponse(
    statusCode: number,
    category: ErrorCategory,
    originalError?: Error | string,
    additionalDetails?: Record<string, unknown>
): NextResponse {
    const requestId = generateRequestId()

    // Get the secure message for this category and status code
    const secureMessage = getSecureErrorMessage(category, statusCode)

    // Log the actual error details for debugging (server-side only)
    logSecureError({
        requestId,
        statusCode,
        category,
        originalError,
        additionalDetails,
        timestamp: new Date().toISOString(),
    })

    // Create response with minimal, safe information
    const response: SecureErrorResponse = {
        error: secureMessage,
        code: `${category.toUpperCase()}_ERROR`,
        requestId,
    }

    // Add retry information for rate limiting
    if (
        category === ErrorCategory.RATE_LIMIT &&
        additionalDetails?.retryAfter
    ) {
        response.retryAfter = additionalDetails.retryAfter as number
    }

    return NextResponse.json(response, {
        status: statusCode,
        headers: {
            'X-Request-ID': requestId,
            'Content-Type': 'application/json',
        },
    })
}

/**
 * Sanitize error message to remove sensitive information
 */
export function sanitizeErrorMessage(message: string): string {
    let sanitized = message

    // Remove sensitive patterns
    for (const pattern of SENSITIVE_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REDACTED]')
    }

    // Remove file paths
    sanitized = sanitized.replace(
        /\/[a-zA-Z0-9_\-\.\/]+\.(ts|js|json|env)/g,
        '[FILE_PATH]'
    )

    // Remove stack traces
    sanitized = sanitized.replace(/at\s+.+\(.+:\d+:\d+\)/g, '[STACK_TRACE]')

    // Remove database-specific errors
    sanitized = sanitized.replace(
        /Query failed:|Connection refused:|Access denied for user/g,
        '[DATABASE_ERROR]'
    )

    return sanitized
}

/**
 * Get appropriate secure error message
 */
function getSecureErrorMessage(
    category: ErrorCategory,
    statusCode: number
): string {
    const categoryMessages = SECURE_ERROR_MESSAGES[category]

    if (
        categoryMessages &&
        categoryMessages[statusCode as keyof typeof categoryMessages]
    ) {
        return categoryMessages[statusCode as keyof typeof categoryMessages]
    }

    // Fallback to generic messages based on status code
    if (statusCode >= 400 && statusCode < 500) {
        return 'Bad request'
    } else if (statusCode >= 500) {
        return 'Internal server error'
    }

    return 'An error occurred'
}

/**
 * Log error details securely (server-side only)
 */
function logSecureError(errorData: {
    requestId: string
    statusCode: number
    category: ErrorCategory
    originalError?: Error | string
    additionalDetails?: Record<string, unknown>
    timestamp: string
}) {
    const logEntry = {
        ...errorData,
        message:
            typeof errorData.originalError === 'string'
                ? errorData.originalError
                : errorData.originalError?.message,
        stack:
            errorData.originalError instanceof Error
                ? errorData.originalError.stack
                : undefined,
    }

    // Log based on severity
    if (errorData.statusCode >= 500) {
        console.error('Server error:', logEntry)
    } else if (errorData.statusCode >= 400) {
        console.warn('Client error:', logEntry)
    } else {
        console.log('Error event:', logEntry)
    }

    // In production, send to monitoring service
    // await sendToMonitoring(logEntry)
}

/**
 * Generate a unique request ID for error tracking
 */
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Stripe-specific error handling
 */
export function createStripeErrorResponse(
    statusCode: number,
    stripeError?: Stripe.errors.StripeError | StripeError,
    context?: string
): NextResponse {
    let category: ErrorCategory
    let message: string

    // Map Stripe error types to our categories
    if (stripeError?.type === 'card_error') {
        category = ErrorCategory.PAYMENT
        message = 'Your payment could not be processed'
    } else if (stripeError?.type === 'rate_limit_error') {
        category = ErrorCategory.RATE_LIMIT
        message = 'Too many requests to payment processor'
    } else if (stripeError?.type === 'authentication_error') {
        category = ErrorCategory.AUTHENTICATION
        message = 'Payment authentication failed'
    } else {
        category = ErrorCategory.PAYMENT
        message = 'Payment processing failed'
    }

    return createSecureErrorResponse(statusCode, category, message, {
        context,
        stripeErrorType: stripeError?.type,
        stripeErrorCode: stripeError?.code,
    })
}

/**
 * Validation error handling
 */
export function createValidationErrorResponse(
    validationErrors: Array<{ field: string; message: string }>,
    context?: string
): NextResponse {
    const requestId = generateRequestId()

    // Sanitize field names and messages
    const sanitizedErrors = validationErrors.map((error) => ({
        field: error.field,
        message: sanitizeErrorMessage(error.message),
    }))

    logSecureError({
        requestId,
        statusCode: 400,
        category: ErrorCategory.VALIDATION,
        originalError: `Validation failed: ${JSON.stringify(validationErrors)}`,
        additionalDetails: { context },
        timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
        {
            error: 'Request validation failed',
            code: 'VALIDATION_ERROR',
            details: sanitizedErrors,
            requestId,
        },
        {
            status: 400,
            headers: {
                'X-Request-ID': requestId,
                'Content-Type': 'application/json',
            },
        }
    )
}

/**
 * Authentication error response
 */
export function createAuthErrorResponse(
    statusCode: 401 | 403 = 401,
    context?: string
): NextResponse {
    return createSecureErrorResponse(
        statusCode,
        ErrorCategory.AUTHENTICATION,
        `Authentication failed: ${context}`
    )
}
