import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe/stripe-server'
import { getUserSubscription } from '@/lib/subscription'
import { absoluteUrl } from '@/lib/utils'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

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

export async function POST(req: Request) {
    try {
        // Validate environment
        validateEnvironment()

        // Parse and validate request body
        const body = await req.json()
        const validation = createCheckoutRequestSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request data',
                    details: validation.error.issues.map((issue) => ({
                        field: issue.path.join('.'),
                        message: issue.message,
                    })),
                },
                { status: 400 }
            )
        }

        const { priceId } = validation.data

        // Validate user session
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Validate price ID against allowed values
        const validPriceIds = [
            process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
            process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
        ].filter(Boolean)

        if (!validPriceIds.includes(priceId)) {
            return NextResponse.json(
                { error: 'Invalid pricing plan selected' },
                { status: 400 }
            )
        }

        const billingUrl = absoluteUrl('/profile?tab=billing')
        const pricingUrl = absoluteUrl('/pricing')

        // Check for existing subscription
        const existingSubscription = await getUserSubscription(session.user.id)

        // Determine the best action based on subscription status
        const subscriptionAction =
            await determineSubscriptionAction(existingSubscription)

        switch (subscriptionAction.action) {
            case 'billing_portal':
                // User has active subscription, redirect to billing portal
                try {
                    const billingSession =
                        await stripe.billingPortal.sessions.create({
                            customer: existingSubscription!.stripeCustomerId!,
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
                throw new Error('Unknown subscription action')
        }
    } catch (error) {
        console.error('Error creating checkout session:', error)

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('Invalid pricing plan')) {
                return NextResponse.json(
                    { error: 'Invalid pricing plan selected' },
                    { status: 400 }
                )
            }

            if (error.message.includes('Environment variables')) {
                return NextResponse.json(
                    { error: 'Service configuration error' },
                    { status: 500 }
                )
            }

            if (error.message.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'Too many requests. Please try again later.' },
                    { status: 429 }
                )
            }
        }

        // Generic error response
        return NextResponse.json(
            { error: 'Failed to create checkout session. Please try again.' },
            { status: 500 }
        )
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
    // This is the key fix - only set customer_update when using existing customer
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

    const stripeSession = await stripe.checkout.sessions.create(
        checkoutConfig,
        { idempotencyKey }
    )

    if (!stripeSession.url) {
        throw new Error('Failed to create checkout session URL')
    }

    return NextResponse.json({ url: stripeSession.url })
}

// Helper function to check if subscription allows billing portal access
export function canAccessBillingPortal(subscriptionStatus: string): boolean {
    return ACTIVE_SUBSCRIPTION_STATUSES.includes(subscriptionStatus)
}

// Helper function to check if subscription is inactive
export function isSubscriptionInactive(subscriptionStatus: string): boolean {
    return INACTIVE_SUBSCRIPTION_STATUSES.includes(subscriptionStatus)
}
