import { authOptions } from '@/lib/auth'
import {
    ErrorCategory,
    createAuthErrorResponse,
    createSecureErrorResponse,
    createStripeErrorResponse,
} from '@/lib/subscription/stripe/secure-error-handling'
import { checkStripeRateLimit } from '@/lib/subscription/stripe/stripe-rate-limit'
import { stripe } from '@/lib/subscription/stripe/stripe-server'
import { getUserSubscription } from '@/lib/subscription/subscription'
import { absoluteUrl } from '@/lib/utils'

import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// Define subscription statuses that allow billing portal access
const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due']

export async function POST(request: NextRequest) {
    try {
        // Step 1: Validate user session
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return createAuthErrorResponse(401, 'billing-portal-access')
        }

        // Step 2: Check rate limiting
        const rateLimitResponse = await checkStripeRateLimit(
            request,
            'billing-portal',
            session.user.id
        )
        if (rateLimitResponse) {
            return rateLimitResponse
        }

        // Step 3: Get user subscription
        let subscription
        try {
            subscription = await getUserSubscription(session.user.id)
        } catch (error) {
            console.error('Error fetching user subscription:', error)
            return createSecureErrorResponse(
                500,
                ErrorCategory.SYSTEM,
                'Error checking subscription status'
            )
        }

        // Step 4: Validate subscription exists
        if (!subscription?.stripeCustomerId) {
            return createSecureErrorResponse(
                404,
                ErrorCategory.VALIDATION,
                'No subscription found',
                { context: 'billing-portal-access' }
            )
        }

        // Step 5: Check if subscription status allows billing portal access
        if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
            return createSecureErrorResponse(
                403,
                ErrorCategory.AUTHORIZATION,
                'Subscription is not active. Please renew your subscription.',
                {
                    context: 'billing-portal-access',
                    subscriptionStatus: subscription.status,
                }
            )
        }

        // Step 6: Validate environment
        const billingUrl = absoluteUrl('/profile?tab=billing')
        if (!billingUrl) {
            return createSecureErrorResponse(
                500,
                ErrorCategory.SYSTEM,
                'Service configuration error'
            )
        }

        // Step 7: Verify customer exists and is not deleted
        let customer
        try {
            customer = await stripe.customers.retrieve(
                subscription.stripeCustomerId
            )
            if (customer.deleted) {
                return createSecureErrorResponse(
                    404,
                    ErrorCategory.VALIDATION,
                    'Customer account not found'
                )
            }
        } catch (stripeError: any) {
            console.error('Error retrieving Stripe customer:', stripeError)
            return createStripeErrorResponse(
                stripeError.statusCode || 500,
                stripeError,
                'billing-portal-customer-retrieval'
            )
        }

        // Step 8: Create billing portal session
        try {
            const billingSession = await stripe.billingPortal.sessions.create({
                customer: subscription.stripeCustomerId,
                return_url: billingUrl,
            })

            if (!billingSession.url) {
                throw new Error('Failed to create billing portal session URL')
            }

            return NextResponse.json({ url: billingSession.url })
        } catch (stripeError: any) {
            console.error(
                'Billing portal session creation failed:',
                stripeError
            )

            // Handle specific Stripe errors
            if (stripeError.code === 'billing_portal_configuration_not_found') {
                return createSecureErrorResponse(
                    503,
                    ErrorCategory.SYSTEM,
                    'Billing portal is not configured. Please contact support.'
                )
            }

            return createStripeErrorResponse(
                stripeError.statusCode || 500,
                stripeError,
                'billing-portal-session-creation'
            )
        }
    } catch (error: any) {
        console.error('Billing portal error:', error)

        // Handle specific error types
        if (error.code === 'ECONNREFUSED') {
            return createSecureErrorResponse(
                503,
                ErrorCategory.EXTERNAL_API,
                'Payment service temporarily unavailable'
            )
        }

        return createSecureErrorResponse(500, ErrorCategory.SYSTEM, error, {
            context: 'billing-portal-access',
        })
    }
}
