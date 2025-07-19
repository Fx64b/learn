import { authOptions } from '@/lib/auth'
import {
    ErrorCategory,
    createAuthErrorResponse,
    createSecureErrorResponse,
    createStripeErrorResponse,
    createValidationErrorResponse,
} from '@/lib/subscription/stripe/secure-error-handling'
import { checkStripeRateLimit } from '@/lib/subscription/stripe/stripe-rate-limit'
import { stripe } from '@/lib/subscription/stripe/stripe-server'
import { getUserSubscription } from '@/lib/subscription/subscription'
import { absoluteUrl } from '@/lib/utils'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// Request validation schema
const createCheckoutRequestSchema = z.object({
    priceId: z.string().min(1, 'Price ID is required'),
})

// Environment validation
const requiredEnvVars = [
    'NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID',
    'NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_SITE_URL',
] as const

function validateEnvironment() {
    const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        )
    }
}

// Define subscription statuses
const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due']
const INACTIVE_SUBSCRIPTION_STATUSES = [
    'canceled',
    'incomplete',
    'incomplete_expired',
    'unpaid',
]

export async function POST(request: NextRequest) {
    try {
        // Step 1: Check rate limiting
        const session = await getServerSession(authOptions)
        const rateLimitResponse = await checkStripeRateLimit(
            request,
            'create-checkout-session',
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
        let body: any
        try {
            body = await request.json()
        } catch (error) {
            return createValidationErrorResponse(
                [{ field: 'body', message: 'Invalid JSON in request body' }],
                'checkout-session-creation'
            )
        }

        const validation = createCheckoutRequestSchema.safeParse(body)

        if (!validation.success) {
            const validationErrors = validation.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }))
            return createValidationErrorResponse(
                validationErrors,
                'checkout-session-creation'
            )
        }

        const { priceId } = validation.data

        // Step 4: Validate user session
        if (!session?.user?.id || !session?.user?.email) {
            return createAuthErrorResponse(401, 'checkout-session-creation')
        }

        // Step 5: Validate price ID against allowed values
        const validPriceIds = [
            process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
            process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
        ].filter(Boolean)

        if (!validPriceIds.includes(priceId)) {
            return createValidationErrorResponse(
                [
                    {
                        field: 'priceId',
                        message: 'Invalid pricing plan selected',
                    },
                ],
                'checkout-session-creation'
            )
        }

        const billingUrl = absoluteUrl('/profile?tab=billing')
        const pricingUrl = absoluteUrl('/pricing')

        // Step 6: Check for existing subscription
        let existingSubscription
        try {
            existingSubscription = await getUserSubscription(session.user.id)
        } catch (error) {
            console.error('Error fetching user subscription:', error)
            return createSecureErrorResponse(
                500,
                ErrorCategory.SYSTEM,
                'Error checking subscription status'
            )
        }

        // Step 7: Determine the best action based on subscription status
        const subscriptionAction =
            await determineSubscriptionAction(existingSubscription)

        try {
            switch (subscriptionAction.action) {
                case 'billing_portal':
                    // User has active subscription, redirect to billing portal
                    try {
                        const billingSession =
                            await stripe.billingPortal.sessions.create({
                                customer:
                                    existingSubscription!.stripeCustomerId!,
                                return_url: billingUrl,
                            })
                        return NextResponse.json({ url: billingSession.url })
                    } catch (portalError: any) {
                        // Fallback to checkout if billing portal fails
                        console.warn(
                            'Billing portal failed, creating checkout session:',
                            portalError.message
                        )
                        return createCheckoutSession(
                            priceId,
                            session.user,
                            existingSubscription?.stripeCustomerId,
                            billingUrl,
                            pricingUrl
                        )
                    }

                case 'checkout_existing_customer':
                    // User has canceled/expired subscription, create checkout with existing customer
                    return createCheckoutSession(
                        priceId,
                        session.user,
                        existingSubscription!.stripeCustomerId,
                        billingUrl,
                        pricingUrl
                    )

                case 'checkout_new_customer':
                    // New user, create checkout with email
                    return createCheckoutSession(
                        priceId,
                        session.user,
                        undefined,
                        billingUrl,
                        pricingUrl
                    )

                default:
                    return createSecureErrorResponse(
                        500,
                        ErrorCategory.SYSTEM,
                        'Unknown subscription action'
                    )
            }
        } catch (stripeError: any) {
            console.error('Stripe API error:', stripeError)
            return createStripeErrorResponse(
                stripeError.statusCode || 500,
                stripeError,
                'checkout-session-creation'
            )
        }
    } catch (error: any) {
        console.error('Error creating checkout session:', error)

        // Handle specific error types
        if (error.code === 'ECONNREFUSED') {
            return createSecureErrorResponse(
                503,
                ErrorCategory.EXTERNAL_API,
                'Payment service temporarily unavailable'
            )
        }

        return createSecureErrorResponse(500, ErrorCategory.SYSTEM, error, {
            context: 'checkout-session-creation',
        })
    }
}

async function determineSubscriptionAction(subscription: any) {
    if (!subscription) {
        return { action: 'checkout_new_customer' }
    }

    if (!subscription.stripeCustomerId) {
        return { action: 'checkout_new_customer' }
    }

    // Check if subscription is active
    if (ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
        // Verify customer still exists in Stripe
        try {
            const customer = await stripe.customers.retrieve(
                subscription.stripeCustomerId
            )
            if (customer.deleted) {
                console.warn(
                    `Customer ${subscription.stripeCustomerId} was deleted`
                )
                return { action: 'checkout_new_customer' }
            }
            return { action: 'billing_portal' }
        } catch (error) {
            console.warn('Customer not found in Stripe:', error)
            return { action: 'checkout_new_customer' }
        }
    }

    // Subscription is inactive (canceled, expired, etc.)
    if (INACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
        // Verify customer still exists in Stripe
        try {
            const customer = await stripe.customers.retrieve(
                subscription.stripeCustomerId
            )
            if (customer.deleted) {
                console.warn(
                    `Customer ${subscription.stripeCustomerId} was deleted`
                )
                return { action: 'checkout_new_customer' }
            }
            return { action: 'checkout_existing_customer' }
        } catch (error) {
            console.warn('Customer not found in Stripe:', error)
            return { action: 'checkout_new_customer' }
        }
    }

    // Unknown status, default to existing customer checkout
    console.warn(`Unknown subscription status: ${subscription.status}`)
    return { action: 'checkout_existing_customer' }
}

async function createCheckoutSession(
    priceId: string,
    user: { id: string; email: string },
    existingCustomerId: string | undefined,
    billingUrl: string,
    pricingUrl: string
) {
    const idempotencyKey = `checkout_${user.id}_${nanoid()}`

    const checkoutConfig: any = {
        success_url: `${billingUrl}?success=true`,
        cancel_url: pricingUrl,
        payment_method_types: ['card'],
        mode: 'subscription',
        billing_address_collection: 'auto',
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        metadata: {
            userId: user.id,
            idempotencyKey,
        },
        subscription_data: {
            metadata: {
                userId: user.id,
            },
        },
        allow_promotion_codes: true,
        automatic_tax: {
            enabled: true,
        },
        phone_number_collection: {
            enabled: false,
        },
    }

    // Configure customer based on whether we have an existing customer
    if (existingCustomerId) {
        checkoutConfig.customer = existingCustomerId
        checkoutConfig.customer_update = {
            address: 'auto',
        }
        console.log(
            `Creating checkout session for existing customer: ${existingCustomerId}`
        )
    } else {
        checkoutConfig.customer_email = user.email
        console.log(`Creating checkout session for new customer: ${user.email}`)
    }

    try {
        const stripeSession = await stripe.checkout.sessions.create(
            checkoutConfig,
            { idempotencyKey }
        )

        if (!stripeSession.url) {
            throw new Error('Failed to create checkout session URL')
        }

        return NextResponse.json({ url: stripeSession.url })
    } catch (stripeError: any) {
        console.error('Stripe checkout session creation failed:', stripeError)
        throw stripeError // Re-throw to be handled by the calling function
    }
}

// Helper function to check if subscription allows billing portal access
export function canAccessBillingPortal(subscriptionStatus: string): boolean {
    return ACTIVE_SUBSCRIPTION_STATUSES.includes(subscriptionStatus)
}

// Helper function to check if subscription is inactive
export function isSubscriptionInactive(subscriptionStatus: string): boolean {
    return INACTIVE_SUBSCRIPTION_STATUSES.includes(subscriptionStatus)
}
