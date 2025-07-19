import { authOptions } from '@/lib/auth'
import {
    ErrorCategory,
    createAuthErrorResponse,
    createSecureErrorResponse,
    createValidationErrorResponse,
} from '@/lib/subscription/stripe/secure-error-handling'
import { checkStripeRateLimit } from '@/lib/subscription/stripe/stripe-rate-limit'
import Stripe from 'stripe'
import { z } from 'zod'

import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

import { changeSubscriptionPlan } from '@/app/actions/stripe'

// Request validation schema
const changePlanRequestSchema = z.object({
    newPriceId: z.string().min(1, 'Price ID is required'),
})

// Environment validation
const requiredEnvVars = [
    'NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID',
    'NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID',
    'STRIPE_SECRET_KEY',
] as const

function validateEnvironment() {
    const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Step 1: Check rate limiting
        const session = await getServerSession(authOptions)
        const rateLimitResponse = await checkStripeRateLimit(
            request,
            'create-checkout-session', // Reuse existing rate limit
            session?.user?.id
        )
        if (rateLimitResponse) {
            return rateLimitResponse
        }

        // Step 2: Validate environment
        try {
            validateEnvironment()
        } catch (error) {
            console.error('Environment validation failed:', error)
            return createSecureErrorResponse(
                500,
                ErrorCategory.SYSTEM,
                'Service configuration error'
            )
        }

        // Step 3: Parse and validate request body
        let body
        try {
            body = await request.json()
        } catch (error: unknown) {
            console.error('Failed to parse request body:', error)
            return createValidationErrorResponse(
                [{ field: 'body', message: 'Invalid JSON in request body' }],
                'plan-change'
            )
        }

        const validation = changePlanRequestSchema.safeParse(body)

        if (!validation.success) {
            const validationErrors = validation.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }))
            return createValidationErrorResponse(
                validationErrors,
                'plan-change'
            )
        }

        const { newPriceId } = validation.data

        // Step 4: Validate user session
        if (!session?.user?.id) {
            return createAuthErrorResponse(401, 'plan-change')
        }

        // Step 5: Validate price ID against allowed values
        const validPriceIds = [
            process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
            process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
        ].filter(Boolean)

        if (!validPriceIds.includes(newPriceId)) {
            return createValidationErrorResponse(
                [
                    {
                        field: 'newPriceId',
                        message: 'Invalid plan selected',
                    },
                ],
                'plan-change'
            )
        }

        // Step 6: Attempt to change the plan
        const result = await changeSubscriptionPlan(newPriceId)

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message,
                subscription: result.subscription,
            })
        } else {
            // Handle different types of errors
            if (result.error?.includes('No active subscription')) {
                return createSecureErrorResponse(
                    404,
                    ErrorCategory.VALIDATION,
                    'No active subscription found'
                )
            }

            if (result.error?.includes('Already on the selected plan')) {
                return createValidationErrorResponse(
                    [
                        {
                            field: 'newPriceId',
                            message: 'Already on the selected plan',
                        },
                    ],
                    'plan-change'
                )
            }

            if (result.error?.includes('not active')) {
                return createSecureErrorResponse(
                    400,
                    ErrorCategory.VALIDATION,
                    'Subscription is not active'
                )
            }

            // Generic error response
            return createSecureErrorResponse(
                400,
                ErrorCategory.PAYMENT,
                result.error || 'Failed to change plan'
            )
        }
    } catch (error: unknown) {
        console.error('Error in plan change API:', error)

        // Handle specific error types
        if ((error as Stripe.errors.StripeError).code === 'ECONNREFUSED') {
            return createSecureErrorResponse(
                503,
                ErrorCategory.EXTERNAL_API,
                'Payment service temporarily unavailable'
            )
        }

        return createSecureErrorResponse(
            500,
            ErrorCategory.SYSTEM,
            error as Stripe.errors.StripeError,
            {
                context: 'plan-change',
            }
        )
    }
}
