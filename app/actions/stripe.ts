'use server'

import { authOptions } from '@/lib/auth'
import { sanitizeErrorMessage } from '@/lib/stripe/secure-error-handling'
import { stripe } from '@/lib/stripe/stripe-server'
import {
    getUserSubscription,
    invalidateSubscriptionCache,
} from '@/lib/subscription'
import { z } from 'zod'

import { getServerSession } from 'next-auth'

// Validation schema
const changePlanSchema = z.object({
    newPriceId: z.string().min(1),
})

// Define valid price IDs
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

            // Update the subscription with the new price
            // Stripe automatically handles proration
            const updatedSubscription = await stripe.subscriptions.update(
                subscription.stripeSubscriptionId,
                {
                    items: [
                        {
                            id: stripeSubscription.items.data[0].id,
                            price: newPriceId,
                        },
                    ],
                    proration_behavior: 'create_prorations', // Enable proration
                    billing_cycle_anchor: 'unchanged', // Keep the current billing cycle
                }
            )

            // Invalidate cache to force refresh of subscription data
            await invalidateSubscriptionCache(session.user.id)

            const planName =
                PLAN_METADATA[newPriceId as keyof typeof PLAN_METADATA]?.name ||
                'Selected plan'

            return {
                success: true,
                message: `Successfully changed to ${planName}`,
                subscription: {
                    id: updatedSubscription.id,
                    priceId: newPriceId,
                    status: updatedSubscription.status,
                    currentPeriodEnd: new Date(
                        updatedSubscription.current_period_end * 1000
                    ),
                },
            }
        } catch (stripeError: any) {
            console.error('Stripe subscription update error:', stripeError)
            return {
                success: false,
                error: getStripeErrorMessage(stripeError),
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
                status: subscription.status || 'inactive - stripe.ts',
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
function getStripeErrorMessage(stripeError: any): string {
    // Don't expose sensitive Stripe error details
    if (stripeError.type === 'card_error') {
        return 'Payment method error. Please update your payment method.'
    }

    if (stripeError.type === 'rate_limit_error') {
        return 'Too many requests. Please try again in a moment.'
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
        return 'Plan change failed. Please try again or contact support.'
    }

    return sanitizedMessage
}
