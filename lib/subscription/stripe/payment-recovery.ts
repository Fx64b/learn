'use server'

import { db } from '@/db'
import { paymentRecoveryEvents, users } from '@/db/schema'
import { and, eq, isNull, lte, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export type RecoveryStatus = 'grace' | 'warning' | 'limited' | 'recovered'

export interface PaymentRecoveryEvent {
    id: string
    userId: string
    stripeInvoiceId: string
    stripeCustomerId: string
    attemptCount: number
    status: RecoveryStatus
    gracePeriodEnd: Date | null
    lastEmailSent: Date | null
    recoveredAt: Date | null
    createdAt: Date
    updatedAt: Date
}

export interface RecoveryConfig {
    gracePeriodHours: number // 48 hours default
    warningPeriodDays: number // 7 days default
    limitationPeriodDays: number // 14 days default
    emailIntervalHours: number // 48 hours between emails
}

const DEFAULT_CONFIG: RecoveryConfig = {
    gracePeriodHours: 48,
    warningPeriodDays: 7,
    limitationPeriodDays: 14,
    emailIntervalHours: 48,
}

/**
 * Start payment recovery process when a payment fails
 */
export async function startPaymentRecovery(
    userId: string,
    stripeInvoiceId: string,
    stripeCustomerId: string,
    config: Partial<RecoveryConfig> = {}
): Promise<PaymentRecoveryEvent> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config }
    const now = new Date()
    const gracePeriodEnd = new Date(
        now.getTime() + fullConfig.gracePeriodHours * 60 * 60 * 1000
    )

    // Check if recovery already exists for this invoice
    const existing = await db
        .select()
        .from(paymentRecoveryEvents)
        .where(eq(paymentRecoveryEvents.stripeInvoiceId, stripeInvoiceId))
        .limit(1)

    if (existing.length > 0) {
        // Update existing recovery
        await db
            .update(paymentRecoveryEvents)
            .set({
                attemptCount: existing[0].attemptCount + 1,
                updatedAt: now,
            })
            .where(eq(paymentRecoveryEvents.id, existing[0].id))

        return {
            ...existing[0],
            attemptCount: existing[0].attemptCount + 1,
            updatedAt: now,
            gracePeriodEnd: existing[0].gracePeriodEnd || null,
            lastEmailSent: existing[0].lastEmailSent || null,
            recoveredAt: existing[0].recoveredAt || null,
        } as PaymentRecoveryEvent
    }

    // Create new recovery event
    const id = nanoid()
    await db.insert(paymentRecoveryEvents).values({
        id,
        userId,
        stripeInvoiceId,
        stripeCustomerId,
        attemptCount: 1,
        status: 'grace',
        gracePeriodEnd,
        lastEmailSent: null,
        recoveredAt: null,
        createdAt: now,
        updatedAt: now,
    })

    return {
        id,
        userId,
        stripeInvoiceId,
        stripeCustomerId,
        attemptCount: 1,
        status: 'grace',
        gracePeriodEnd,
        lastEmailSent: null,
        recoveredAt: null,
        createdAt: now,
        updatedAt: now,
    }
}

/**
 * Mark payment as recovered
 */
export async function markPaymentRecovered(
    stripeInvoiceId: string
): Promise<void> {
    const now = new Date()

    await db
        .update(paymentRecoveryEvents)
        .set({
            status: 'recovered',
            recoveredAt: now,
            updatedAt: now,
        })
        .where(eq(paymentRecoveryEvents.stripeInvoiceId, stripeInvoiceId))
}

/**
 * Update recovery status based on time elapsed
 */
export async function updateRecoveryStatuses(
    config: Partial<RecoveryConfig> = {}
): Promise<void> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config }
    const now = new Date()

    const warningThreshold = new Date(
        now.getTime() - fullConfig.warningPeriodDays * 24 * 60 * 60 * 1000
    )
    const limitationThreshold = new Date(
        now.getTime() - fullConfig.limitationPeriodDays * 24 * 60 * 60 * 1000
    )

    // Update to warning status
    await db
        .update(paymentRecoveryEvents)
        .set({
            status: 'warning',
            updatedAt: now,
        })
        .where(
            and(
                eq(paymentRecoveryEvents.status, 'grace'),
                lte(paymentRecoveryEvents.gracePeriodEnd, warningThreshold)
            )
        )

    // Update to limited status
    await db
        .update(paymentRecoveryEvents)
        .set({
            status: 'limited',
            updatedAt: now,
        })
        .where(
            and(
                eq(paymentRecoveryEvents.status, 'warning'),
                lte(paymentRecoveryEvents.createdAt, limitationThreshold)
            )
        )
}

/**
 * Get active recovery events that need email notifications
 */
export async function getRecoveryEventsNeedingEmail(
    config: Partial<RecoveryConfig> = {}
): Promise<
    Array<PaymentRecoveryEvent & { user: { email: string; name?: string } }>
> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config }
    const now = new Date()
    const emailThreshold = new Date(
        now.getTime() - fullConfig.emailIntervalHours * 60 * 60 * 1000
    )

    const events = await db
        .select({
            recovery: paymentRecoveryEvents,
            user: {
                email: users.email,
                name: users.name,
            },
        })
        .from(paymentRecoveryEvents)
        .innerJoin(users, eq(paymentRecoveryEvents.userId, users.id))
        .where(
            and(
                // Not recovered
                eq(paymentRecoveryEvents.status, 'grace'),
                // Either never sent email or last email was long ago
                or(
                    isNull(paymentRecoveryEvents.lastEmailSent),
                    lte(paymentRecoveryEvents.lastEmailSent, emailThreshold)
                )
            )
        )

    return events.map((event) => ({
        ...event.recovery,
        gracePeriodEnd: event.recovery.gracePeriodEnd || null,
        lastEmailSent: event.recovery.lastEmailSent || null,
        recoveredAt: event.recovery.recoveredAt || null,
        user: event.user,
    })) as Array<
        PaymentRecoveryEvent & { user: { email: string; name?: string } }
    >
}

/**
 * Mark email as sent for a recovery event
 */
export async function markEmailSent(recoveryEventId: string): Promise<void> {
    const now = new Date()

    await db
        .update(paymentRecoveryEvents)
        .set({
            lastEmailSent: now,
            updatedAt: now,
        })
        .where(eq(paymentRecoveryEvents.id, recoveryEventId))
}

/**
 * Get user's current payment recovery status
 */
export async function getUserRecoveryStatus(
    userId: string
): Promise<PaymentRecoveryEvent | null> {
    const events = await db
        .select()
        .from(paymentRecoveryEvents)
        .where(
            and(
                eq(paymentRecoveryEvents.userId, userId),
                // Not recovered
                or(
                    eq(paymentRecoveryEvents.status, 'grace'),
                    eq(paymentRecoveryEvents.status, 'warning'),
                    eq(paymentRecoveryEvents.status, 'limited')
                )
            )
        )
        .orderBy(paymentRecoveryEvents.createdAt)
        .limit(1)

    if (events.length === 0) return null

    const event = events[0]
    return {
        ...event,
        gracePeriodEnd: event.gracePeriodEnd || null,
        lastEmailSent: event.lastEmailSent || null,
        recoveredAt: event.recoveredAt || null,
    } as PaymentRecoveryEvent
}

/**
 * Check if user is in grace period (Pro features should remain active)
 */
export async function isUserInGracePeriod(userId: string): Promise<boolean> {
    const recovery = await getUserRecoveryStatus(userId)
    return recovery?.status === 'grace' || recovery?.status === 'warning'
}

/**
 * Check if user has limited access (Pro features should be disabled)
 */
export async function isUserLimited(userId: string): Promise<boolean> {
    const recovery = await getUserRecoveryStatus(userId)
    return recovery?.status === 'limited'
}
