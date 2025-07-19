'use server'

import { authOptions } from '@/lib/auth'
import { sanitizeErrorMessage } from '@/lib/subscription/stripe/secure-error-handling'
import { stripe } from '@/lib/subscription/stripe/stripe-server'
import {
    UserSubscription,
    getUserSubscription,
    invalidateSubscriptionCache,
} from '@/lib/subscription/subscription'
import { StripeError } from '@stripe/stripe-js'
import Stripe from 'stripe'
import { z } from 'zod'

import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'

// Validation schemas
const createCheckoutSessionSchema = z.object({
    priceId: z.string().min(1),
})

const changePlanSchema = z.object({
    newPriceId: z.string().min(1),
})

const validPriceIds = [
    process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
].filter(Boolean)

// Plan metadata for easier management
const PLAN_METADATA = {
    [process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!]: {
        name: 'Pro Monthly',
        interval: 'month' as const,
        intervalCount: 1,
    },
    [process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!]: {
        name: 'Pro Yearly',
        interval: 'year' as const,
        intervalCount: 1,
    },
} as const

// Define subscription statuses
const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due']
const INACTIVE_SUBSCRIPTION_STATUSES = [
    'canceled',
    'incomplete',
    'incomplete_expired',
    'unpaid',
]

export async function createCheckoutSession(priceId: string) {
    try {
        // Validate input
        const validation = createCheckoutSessionSchema.safeParse({ priceId })
        if (!validation.success) {
            return {
                success: false,
                error: 'Invalid pricing plan selected',
            }
        }

        // Validate price ID against allowed values
        if (!validPriceIds.includes(priceId)) {
            return {
                success: false,
                error: 'Invalid pricing plan selected',
            }
        }

        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.email) {
            return {
                success: false,
                error: 'Please sign in to continue',
            }
        }

        const headersList = await headers()
        const origin =
            headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL

        if (!origin) {
            return {
                success: false,
                error: 'Service configuration error',
            }
        }

        // Check existing subscription and determine action
        let existingSubscription
        try {
            existingSubscription = await getUserSubscription(session.user.id)
        } catch (error) {
            console.error('Error fetching subscription:', error)
            return {
                success: false,
                error: 'Error checking subscription status',
            }
        }

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
                                return_url: `${origin}/profile?tab=billing`,
                            })
                        return { success: true, url: billingSession.url }
                    } catch (portalError: unknown) {
                        // Fallback to checkout if billing portal fails
                        console.warn(
                            'Billing portal failed, creating checkout session:',
                            (portalError as Error).message
                        )
                        return await createNewCheckoutSession(
                            priceId,
                            session.user.email,
                            origin,
                            session.user.id,
                            existingSubscription?.stripeCustomerId || undefined
                        )
                    }

                case 'checkout_existing_customer':
                    // User has canceled/expired subscription, create checkout with existing customer
                    return await createNewCheckoutSession(
                        priceId,
                        session.user.email,
                        origin,
                        session.user.id,
                        existingSubscription!.stripeCustomerId || undefined
                    )

                case 'checkout_new_customer':
                    // New user, create checkout with email
                    return await createNewCheckoutSession(
                        priceId,
                        session.user.email,
                        origin,
                        session.user.id
                    )

                default:
                    return {
                        success: false,
                        error: 'Unable to process subscription request',
                    }
            }
        } catch (stripeError: unknown) {
            console.error('Stripe API error:', stripeError)
            return {
                success: false,
                error: getStripeErrorMessage(stripeError as StripeError),
            }
        }
    } catch (error) {
        console.error('Error creating checkout session:', error)
        return {
            success: false,
            error: 'Failed to create checkout session. Please try again.',
        }
    }
}

async function determineSubscriptionAction(
    subscription: UserSubscription | null
) {
    if (!subscription) {
        return { action: 'checkout_new_customer' }
    }

    if (!subscription.stripeCustomerId) {
        return { action: 'checkout_new_customer' }
    }

    // Check if subscription is active
    if (ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status || '')) {
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
    if (INACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status || '')) {
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

async function createNewCheckoutSession(
    priceId: string,
    customerEmail: string,
    origin: string,
    userId: string,
    existingCustomerId?: string
) {
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        success_url: `${origin}/profile?tab=billing&success=true`,
        cancel_url: `${origin}/pricing`,
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
            userId,
        },
        subscription_data: {
            metadata: {
                userId,
            },
        },
        allow_promotion_codes: true,
        automatic_tax: {
            enabled: true,
        },
    }

    // Configure customer based on whether we have an existing customer
    if (existingCustomerId) {
        sessionConfig.customer = existingCustomerId
        sessionConfig.customer_update = {
            address: 'auto',
        }
        console.log(
            `Creating checkout session for existing customer: ${existingCustomerId}`
        )
    } else {
        sessionConfig.customer_email = customerEmail
        console.log(
            `Creating checkout session for new customer: ${customerEmail}`
        )
    }

    try {
        const checkoutSession =
            await stripe.checkout.sessions.create(sessionConfig)

        if (!checkoutSession.url) {
            throw new Error('Failed to create checkout session URL')
        }

        return { success: true, url: checkoutSession.url }
    } catch (stripeError: unknown) {
        console.error('Stripe checkout session creation failed:', stripeError)
        return {
            success: false,
            error: getStripeErrorMessage(stripeError as StripeError),
        }
    }
}

export async function createBillingPortalSession() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return {
                success: false,
                error: 'Please sign in to continue',
            }
        }

        let subscription
        try {
            subscription = await getUserSubscription(session.user.id)
        } catch (error) {
            console.error('Error fetching subscription:', error)
            return {
                success: false,
                error: 'Error checking subscription status',
            }
        }

        if (!subscription?.stripeCustomerId) {
            return {
                success: false,
                error: 'No subscription found',
            }
        }

        // Check if subscription status allows billing portal access
        if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status || '')) {
            return {
                success: false,
                error: 'Subscription is not active. Please renew your subscription.',
            }
        }

        const headersList = await headers()
        const origin =
            headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL

        if (!origin) {
            return {
                success: false,
                error: 'Service configuration error',
            }
        }

        // Verify customer exists and is not deleted
        try {
            const customer = await stripe.customers.retrieve(
                subscription.stripeCustomerId
            )
            if (customer.deleted) {
                return {
                    success: false,
                    error: 'Customer account not found',
                }
            }
        } catch (stripeError: unknown) {
            console.error('Error retrieving customer:', stripeError)
            return {
                success: false,
                error: getStripeErrorMessage(stripeError as StripeError),
            }
        }

        // Create billing portal session
        try {
            const billingSession = await stripe.billingPortal.sessions.create({
                customer: subscription.stripeCustomerId,
                return_url: `${origin}/profile?tab=billing`,
            })

            if (!billingSession.url) {
                throw new Error('Failed to create billing portal session URL')
            }

            return { success: true, url: billingSession.url }
        } catch (stripeError: unknown) {
            console.error(
                'Billing portal session creation failed:',
                stripeError
            )
            return {
                success: false,
                error: getStripeErrorMessage(stripeError as StripeError),
            }
        }
    } catch (error) {
        console.error('Error creating billing portal session:', error)
        return {
            success: false,
            error: 'Failed to access billing portal. Please try again.',
        }
    }
}

// NEW: Plan Management Functions
export async function changeSubscriptionPlan(newPriceId: string) {
    try {
        // Validate input
        const validation = changePlanSchema.safeParse({ newPriceId })
        if (!validation.success) {
            return {
                success: false,
                error: 'Invalid plan selected',
            }
        }

        // Validate price ID against allowed values
        if (!validPriceIds.includes(newPriceId)) {
            return {
                success: false,
                error: 'Invalid plan selected',
            }
        }

        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return {
                success: false,
                error: 'Please sign in to continue',
            }
        }

        // Get current subscription
        let subscription
        try {
            subscription = await getUserSubscription(session.user.id)
        } catch (error) {
            console.error('Error fetching subscription:', error)
            return {
                success: false,
                error: 'Error checking subscription status',
            }
        }

        // Validate subscription exists and is active
        if (!subscription?.stripeSubscriptionId) {
            return {
                success: false,
                error: 'No active subscription found',
            }
        }

        if (!['active', 'trialing'].includes(subscription.status || '')) {
            return {
                success: false,
                error: 'Subscription is not active',
            }
        }

        // Check if already on the requested plan
        if (subscription.stripePriceId === newPriceId) {
            return {
                success: false,
                error: 'Already on the selected plan',
            }
        }

        try {
            // Retrieve current Stripe subscription
            const stripeSubscription = await stripe.subscriptions.retrieve(
                subscription.stripeSubscriptionId
            )

            if (!stripeSubscription) {
                return {
                    success: false,
                    error: 'Subscription not found',
                }
            }

            // Check if we're changing billing intervals
            const currentPlan =
                PLAN_METADATA[
                    subscription.stripePriceId as keyof typeof PLAN_METADATA
                ]
            const newPlan =
                PLAN_METADATA[newPriceId as keyof typeof PLAN_METADATA]
            const isChangingInterval =
                currentPlan?.interval !== newPlan?.interval

            // Update the subscription with the new price
            const updateConfig: Stripe.SubscriptionUpdateParams = {
                items: [
                    {
                        id: stripeSubscription.items.data[0].id,
                        price: newPriceId,
                    },
                ],
                proration_behavior: 'create_prorations', // Enable proration
            }

            // When changing intervals, we must start a new billing cycle
            if (isChangingInterval) {
                updateConfig.billing_cycle_anchor = 'now'
            } else {
                updateConfig.billing_cycle_anchor = 'unchanged'
            }

            const updatedSubscription = await stripe.subscriptions.update(
                subscription.stripeSubscriptionId,
                updateConfig
            )

            // Invalidate cache to force refresh of subscription data
            await invalidateSubscriptionCache(session.user.id)

            const planName =
                PLAN_METADATA[newPriceId as keyof typeof PLAN_METADATA]?.name ||
                'Selected plan'
            const successMessage = isChangingInterval
                ? `Successfully changed to ${planName}. Your new billing cycle starts now.`
                : `Successfully changed to ${planName}`

            return {
                success: true,
                message: successMessage,
                subscription: {
                    id: updatedSubscription.id,
                    priceId: newPriceId,
                    status: updatedSubscription.status,
                    currentPeriodEnd: new Date(
                        updatedSubscription.current_period_end * 1000
                    ),
                },
            }
        } catch (stripeError: unknown) {
            console.error('Stripe subscription update error:', stripeError)
            return {
                success: false,
                error: getStripeErrorMessage(stripeError as StripeError),
            }
        }
    } catch (error) {
        console.error('Error changing subscription plan:', error)
        return {
            success: false,
            error: 'Failed to change plan. Please try again.',
        }
    }
}

export async function getCurrentPlan() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return {
                success: false,
                error: 'Not authenticated',
                currentPlan: null,
            }
        }

        const subscription = await getUserSubscription(session.user.id)

        if (!subscription?.stripePriceId) {
            return {
                success: true,
                currentPlan: null,
            }
        }

        const planMetadata =
            PLAN_METADATA[
                subscription.stripePriceId as keyof typeof PLAN_METADATA
            ]

        return {
            success: true,
            currentPlan: {
                priceId: subscription.stripePriceId,
                name: planMetadata?.name || 'Unknown Plan',
                interval: planMetadata?.interval || 'month',
                status: subscription.status,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
            },
        }
    } catch (error) {
        console.error('Error getting current plan:', error)
        return {
            success: false,
            error: 'Failed to get current plan',
            currentPlan: null,
        }
    }
}

/**
 * Convert Stripe errors to user-friendly messages
 */
function getStripeErrorMessage(stripeError: StripeError): string {
    // Don't expose sensitive Stripe error details
    if (stripeError.type === 'card_error') {
        return 'Your payment could not be processed. Please try a different payment method.'
    }

    if (stripeError.type === 'rate_limit_error') {
        return 'Too many requests. Please try again in a moment.'
    }

    if (stripeError.type === 'authentication_error') {
        return 'Payment authentication failed. Please try again.'
    }

    if (stripeError.code === 'billing_portal_configuration_not_found') {
        return 'Billing portal is not configured. Please contact support.'
    }

    if (stripeError.code === 'customer_not_found') {
        return 'Customer account not found. Please contact support.'
    }

    if (stripeError.code === 'subscription_not_found') {
        return 'Subscription not found.'
    }

    if (stripeError.code === 'invoice_no_customer_line_items') {
        return 'Unable to change plan at this time. Please try again later.'
    }

    // For unknown errors, return a generic message
    const sanitizedMessage = sanitizeErrorMessage(
        stripeError.message || 'Unknown error'
    )

    // If the sanitized message is too generic, provide a helpful fallback
    if (
        sanitizedMessage.includes('[REDACTED]') ||
        sanitizedMessage.length < 10
    ) {
        return 'Payment processing failed. Please try again or contact support.'
    }

    return sanitizedMessage
}

// Helper functions for checking subscription status
export async function canAccessBillingPortal(
    subscriptionStatus: string
): Promise<boolean> {
    return ACTIVE_SUBSCRIPTION_STATUSES.includes(subscriptionStatus)
}

export async function isSubscriptionInactive(
    subscriptionStatus: string
): Promise<boolean> {
    return INACTIVE_SUBSCRIPTION_STATUSES.includes(subscriptionStatus)
}

export async function isSubscriptionActive(
    subscriptionStatus: string
): Promise<boolean> {
    return ACTIVE_SUBSCRIPTION_STATUSES.includes(subscriptionStatus)
}

// Helper function to validate webhook signatures more securely
export async function validateWebhookSignature(
    body: string,
    signature: string
): Promise<boolean> {
    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.error('STRIPE_WEBHOOK_SECRET not configured')
            return false
        }

        stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
        return true
    } catch (error) {
        console.error('Webhook signature validation failed:', error)
        return false
    }
}
