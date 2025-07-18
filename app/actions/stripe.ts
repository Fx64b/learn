'use server'

import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe/stripe-server'
import { getUserSubscription } from '@/lib/subscription'
import { z } from 'zod'

import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'

// Validation schemas
const createCheckoutSessionSchema = z.object({
    priceId: z.string().min(1),
})

const validPriceIds = [
    process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
].filter(Boolean)

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
            throw new Error('Invalid price ID provided')
        }

        // Validate price ID against allowed values
        if (!validPriceIds.includes(priceId)) {
            throw new Error('Invalid price ID')
        }

        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.email) {
            throw new Error('User not authenticated')
        }

        const headersList = await headers()
        const origin =
            headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL

        if (!origin) {
            throw new Error('Origin not found')
        }

        // Check existing subscription and determine action
        const existingSubscription = await getUserSubscription(session.user.id)
        const subscriptionAction =
            await determineSubscriptionAction(existingSubscription)

        switch (subscriptionAction.action) {
            case 'billing_portal':
                // User has active subscription, redirect to billing portal
                try {
                    const billingSession =
                        await stripe.billingPortal.sessions.create({
                            customer: existingSubscription!.stripeCustomerId!,
                            return_url: `${origin}/profile?tab=billing`,
                        })
                    return { url: billingSession.url }
                } catch (portalError: any) {
                    // Fallback to checkout if billing portal fails
                    console.warn(
                        'Billing portal failed, creating checkout session:',
                        portalError.message
                    )
                    return await createNewCheckoutSession(
                        priceId,
                        session.user.email,
                        origin,
                        session.user.id,
                        existingSubscription?.stripeCustomerId
                    )
                }

            case 'checkout_existing_customer':
                // User has canceled/expired subscription, create checkout with existing customer
                return await createNewCheckoutSession(
                    priceId,
                    session.user.email,
                    origin,
                    session.user.id,
                    existingSubscription!.stripeCustomerId
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
                throw new Error('Unknown subscription action')
        }
    } catch (error) {
        console.error('Error creating checkout session:', error)

        // Return more specific error messages
        if (error instanceof Error) {
            if (error.message.includes('Invalid price ID')) {
                throw new Error('Invalid pricing plan selected')
            }
            if (error.message.includes('not authenticated')) {
                throw new Error('Please sign in to continue')
            }
            if (
                error.message.includes('billing_portal_configuration_not_found')
            ) {
                throw new Error(
                    'Billing configuration error. Please contact support.'
                )
            }
        }

        throw new Error('Failed to create checkout session. Please try again.')
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

async function createNewCheckoutSession(
    priceId: string,
    customerEmail: string,
    origin: string,
    userId: string,
    existingCustomerId?: string
) {
    const sessionConfig: any = {
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
    // This is the key fix - only set customer_update when using existing customer
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

    const checkoutSession = await stripe.checkout.sessions.create(sessionConfig)

    if (!checkoutSession.url) {
        throw new Error('Failed to create checkout session URL')
    }

    return { url: checkoutSession.url }
}

export async function createBillingPortalSession() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            throw new Error('User not authenticated')
        }

        const subscription = await getUserSubscription(session.user.id)
        if (!subscription?.stripeCustomerId) {
            throw new Error('No subscription found')
        }

        // Check if subscription status allows billing portal access
        if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
            throw new Error(
                'Subscription is not active. Please renew your subscription.'
            )
        }

        const headersList = await headers()
        const origin =
            headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL

        if (!origin) {
            throw new Error('Origin not found')
        }

        // Verify customer exists and is not deleted
        const customer = await stripe.customers.retrieve(
            subscription.stripeCustomerId
        )
        if (customer.deleted) {
            throw new Error('Customer account not found')
        }

        // Create billing portal session
        const billingSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${origin}/profile?tab=billing`,
        })

        if (!billingSession.url) {
            throw new Error('Failed to create billing portal session URL')
        }

        return { url: billingSession.url }
    } catch (error) {
        console.error('Error creating billing portal session:', error)

        if (error instanceof Error) {
            if (error.message.includes('not authenticated')) {
                throw new Error('Please sign in to continue')
            }
            if (error.message.includes('No subscription found')) {
                throw new Error('No active subscription found')
            }
            if (error.message.includes('not active')) {
                throw error // Pass through the specific subscription status error
            }
            if (error.message.includes('not configured')) {
                throw new Error(
                    'Billing portal is not configured. Please contact support.'
                )
            }
        }

        throw new Error('Failed to access billing portal. Please try again.')
    }
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
