import { db } from '@/db'
import { subscriptions, webhookEvents } from '@/db/schema'
import {
    ErrorCategory,
    createRateLimitErrorResponse,
    createSecureErrorResponse,
} from '@/lib/stripe/secure-error-handling'
import { checkStripeRateLimit } from '@/lib/stripe/stripe-rate-limit'
import { stripe } from '@/lib/stripe/stripe-server'
import {
    logWebhookSecurityEvent,
    validateStripeWebhookSource,
} from '@/lib/stripe/stripe-webhook-security'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Webhook event handlers
const HANDLED_EVENTS = new Set([
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.trial_will_end',
])

export async function POST(request: NextRequest) {
    const startTime = Date.now()
    let eventId: string | undefined

    try {
        // Step 1: Check rate limiting
        const rateLimitResponse = await checkStripeRateLimit(request, 'webhook')
        if (rateLimitResponse) {
            return rateLimitResponse
        }

        // Step 2: Validate webhook source (IP + User-Agent)
        const sourceValidation = validateStripeWebhookSource(request)
        if (!sourceValidation.isValid) {
            logWebhookSecurityEvent('blocked', sourceValidation, {
                reason: sourceValidation.reason,
                endpoint: '/api/stripe/webhook',
            })

            return createSecureErrorResponse(
                403,
                ErrorCategory.AUTHORIZATION,
                `Webhook source validation failed: ${sourceValidation.reason}`
            )
        }

        logWebhookSecurityEvent('allowed', sourceValidation, {
            endpoint: '/api/stripe/webhook',
        })

        // Step 3: Validate environment
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.error('STRIPE_WEBHOOK_SECRET not configured')
            return createSecureErrorResponse(
                500,
                ErrorCategory.SYSTEM,
                'Webhook configuration error'
            )
        }

        // Step 4: Get request body and headers
        const body = await request.text()
        const headersList = await headers()
        const signature = headersList.get('stripe-signature')

        if (!signature) {
            console.error('Missing stripe-signature header')
            return createSecureErrorResponse(
                400,
                ErrorCategory.VALIDATION,
                'Missing stripe-signature header'
            )
        }

        if (!body) {
            console.error('Empty request body')
            return createSecureErrorResponse(
                400,
                ErrorCategory.VALIDATION,
                'Empty request body'
            )
        }

        // Step 5: Verify webhook signature
        let event: Stripe.Event
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            )
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message)
            return createSecureErrorResponse(
                400,
                ErrorCategory.AUTHENTICATION,
                'Webhook signature verification failed'
            )
        }

        eventId = event.id
        console.log(`Processing webhook: ${event.type} [${eventId}]`)

        // Step 6: Check if event is handled
        if (!HANDLED_EVENTS.has(event.type)) {
            console.log(`Unhandled event type: ${event.type}`)
            return NextResponse.json({ received: true })
        }

        // Step 7: Check for idempotency (prevent duplicate processing)
        const existingEvent = await db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.id, eventId))
            .limit(1)

        if (existingEvent.length > 0) {
            console.log(`Webhook ${eventId} already processed`)
            return NextResponse.json({ received: true })
        }

        // Step 8: Process the event
        await processWebhookEvent(event)

        // Step 9: Log processing time
        const processingTime = Date.now() - startTime
        console.log(
            `Webhook ${eventId} processed successfully in ${processingTime}ms`
        )

        return NextResponse.json({ received: true })
    } catch (error: any) {
        const processingTime = Date.now() - startTime
        console.error(
            `Webhook processing failed in ${processingTime}ms:`,
            error
        )

        // Update webhook status to failed if we have an event ID
        if (eventId) {
            try {
                await db
                    .update(webhookEvents)
                    .set({
                        status: 'failed',
                        error: error.message || 'Unknown error',
                        retryCount: 1,
                    })
                    .where(eq(webhookEvents.id, eventId))
            } catch (dbError) {
                console.error('Failed to update webhook status:', dbError)
            }
        }

        // Return secure error response
        return createSecureErrorResponse(500, ErrorCategory.SYSTEM, error, {
            eventId,
            processingTime,
            retryable: true,
        })
    }
}

async function processWebhookEvent(event: Stripe.Event) {
    try {
        await db.insert(webhookEvents).values({
            id: event.id,
            type: event.type,
            status: 'processing',
            processedAt: new Date(),
            retryCount: 0,
        })
    } catch (insertError) {
        console.error('Failed to insert webhook event record:', insertError)
    }

    try {
        await db.transaction(async (tx) => {
            switch (event.type) {
                case 'checkout.session.completed':
                    await handleCheckoutSessionCompleted(tx, event)
                    break

                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                    await handleSubscriptionUpsert(tx, event)
                    break

                case 'customer.subscription.deleted':
                    await handleSubscriptionDeleted(tx, event)
                    break

                case 'invoice.payment_succeeded':
                    await handleInvoicePaymentSucceeded(tx, event)
                    break

                case 'invoice.payment_failed':
                    await handleInvoicePaymentFailed(tx, event)
                    break

                case 'customer.subscription.trial_will_end':
                    await handleTrialWillEnd(tx, event)
                    break

                default:
                    console.warn(`Unhandled event type: ${event.type}`)
                    await updateWebhookStatus(event.id, 'skipped')
                    return
            }
        })

        await updateWebhookStatus(event.id, 'processed')
    } catch (error) {
        console.error(`Error processing ${event.type}:`, error)

        // Mark as failed in a separate operation to ensure it's recorded
        await updateWebhookStatus(
            event.id,
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
        )

        throw error
    }
}

async function updateWebhookStatus(
    eventId: string,
    status: string,
    error?: string
) {
    try {
        await db
            .update(webhookEvents)
            .set({
                status,
                error,
                retryCount: error ? 1 : 0,
            })
            .where(eq(webhookEvents.id, eventId))
    } catch (updateError) {
        console.error('Failed to update webhook status:', updateError)
    }
}

async function handleCheckoutSessionCompleted(tx: any, event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.mode !== 'subscription') {
        console.log('Checkout session is not for subscription, skipping')
        return
    }

    const subscriptionId = session.subscription as string
    const userId = session.metadata?.userId

    if (!userId) {
        console.error('No userId found in checkout session metadata')
        throw new Error('No userId found in session metadata')
    }

    if (!subscriptionId) {
        console.error('No subscription ID found in checkout session')
        throw new Error('No subscription ID found in checkout session')
    }

    console.log(
        `Processing checkout session for user ${userId}, subscription ${subscriptionId}`
    )

    // Retrieve the subscription from Stripe to get complete data
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    await upsertSubscription(tx, subscription, userId)
}

async function handleSubscriptionUpsert(tx: any, event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription
    const userId = await getUserIdFromSubscription(subscription)

    if (!userId) {
        console.error('No userId found for subscription:', subscription.id)
        throw new Error('No userId found for subscription')
    }

    console.debug(
        `Processing subscription ${subscription.id} for user ${userId}`
    )

    await upsertSubscription(tx, subscription, userId)
}

async function handleSubscriptionDeleted(tx: any, event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription

    console.debug(`Marking subscription ${subscription.id} as canceled`)

    await tx
        .update(subscriptions)
        .set({
            status: 'canceled',
            updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
}

async function handleInvoicePaymentSucceeded(tx: any, event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = invoice.subscription as string

    if (!subscriptionId) {
        console.log('No subscription ID found in invoice')
        return
    }

    console.log(
        `Marking subscription ${subscriptionId} as active due to successful payment`
    )

    await tx
        .update(subscriptions)
        .set({
            status: 'active',
            updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
}

async function handleInvoicePaymentFailed(tx: any, event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = invoice.subscription as string

    if (!subscriptionId) {
        console.log('No subscription ID found in invoice')
        return
    }

    console.log(
        `Marking subscription ${subscriptionId} as past_due due to failed payment`
    )

    await tx
        .update(subscriptions)
        .set({
            status: 'past_due',
            updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
}

async function handleTrialWillEnd(tx: any, event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription
    console.log(`Trial will end for subscription ${subscription.id}`)

    // Here you could add logic to notify the user about trial ending
    // For now, just log it
}

async function getUserIdFromSubscription(
    subscription: Stripe.Subscription
): Promise<string | null> {
    // Try to get userId from subscription metadata first
    let userId = subscription.metadata?.userId

    if (!userId) {
        // Try to get from customer metadata
        try {
            const customer = await stripe.customers.retrieve(
                subscription.customer as string
            )
            if (customer && !customer.deleted && customer.metadata?.userId) {
                userId = customer.metadata.userId
            }
        } catch (error) {
            console.error('Error retrieving customer:', error)
        }

        // If still no userId, try to find existing subscription in database
        if (!userId) {
            const existingSubscription = await db
                .select({ userId: subscriptions.userId })
                .from(subscriptions)
                .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
                .limit(1)

            if (existingSubscription.length > 0) {
                userId = existingSubscription[0].userId
            }
        }
    }

    return userId || null
}

async function upsertSubscription(
    tx: any,
    subscription: Stripe.Subscription,
    userId: string
) {
    console.log(`Upserting subscription ${subscription.id} for user ${userId}`)

    // Validate subscription data
    if (!subscription.customer || !subscription.id) {
        throw new Error('Invalid subscription data')
    }

    let stripeCurrentPeriodEnd: Date

    if (subscription.current_period_end) {
        stripeCurrentPeriodEnd = new Date(
            subscription.current_period_end * 1000
        )
    } else {
        // Fallback based on price interval if available
        const priceInterval =
            subscription.items.data[0]?.price?.recurring?.interval
        const fallbackDays = priceInterval === 'year' ? 365 : 30
        stripeCurrentPeriodEnd = new Date(
            Date.now() + fallbackDays * 24 * 60 * 60 * 1000
        )

        console.warn(
            `Using fallback period end for subscription ${subscription.id}: ${fallbackDays} days`
        )
    }

    const subscriptionData = {
        userId,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price?.id || null,
        status: subscription.status,
        stripeCurrentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        updatedAt: new Date(),
    }

    // Check for existing subscription by multiple criteria
    // 1. By stripeSubscriptionId (exact match)
    // 2. By userId (user's current subscription)
    // 3. By stripeCustomerId (customer's subscription)
    const existingBySubscriptionId = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
        .limit(1)

    const existingByUserId = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1)

    const existingByCustomerId = await tx
        .select()
        .from(subscriptions)
        .where(
            eq(subscriptions.stripeCustomerId, subscription.customer as string)
        )
        .limit(1)

    // Determine which record to update
    let recordToUpdate = null

    if (existingBySubscriptionId.length > 0) {
        // Exact match by subscription ID - this is the most specific
        recordToUpdate = existingBySubscriptionId[0]
        console.log(
            `Found existing subscription by subscription ID: ${recordToUpdate.id}`
        )
    } else if (existingByUserId.length > 0) {
        // User has an existing subscription - update it with new subscription details
        recordToUpdate = existingByUserId[0]
        console.log(
            `Found existing subscription by user ID: ${recordToUpdate.id}`
        )
    } else if (existingByCustomerId.length > 0) {
        // Customer has an existing subscription - update it
        recordToUpdate = existingByCustomerId[0]
        console.log(
            `Found existing subscription by customer ID: ${recordToUpdate.id}`
        )
    }

    if (recordToUpdate) {
        // Update existing subscription
        console.log(
            `Updating existing subscription record: ${recordToUpdate.id}`
        )
        await tx
            .update(subscriptions)
            .set(subscriptionData)
            .where(eq(subscriptions.id, recordToUpdate.id))
    } else {
        // Create new subscription
        console.log(
            `Creating new subscription record for subscription: ${subscription.id}`
        )
        await tx.insert(subscriptions).values({
            id: subscription.id,
            ...subscriptionData,
        })
    }

    console.log(`Successfully upserted subscription ${subscription.id}`)

    // Invalidate cache for this user
    try {
        const { invalidateSubscriptionCache } = await import(
            '@/lib/subscription'
        )
        await invalidateSubscriptionCache(userId)
    } catch (error) {
        console.error('Error invalidating cache:', error)
    }
}
