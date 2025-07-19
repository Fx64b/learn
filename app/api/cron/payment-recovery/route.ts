import { sendPaymentReminderEmail } from '@/lib/subscription/email-service'
import {
    getRecoveryEventsNeedingEmail,
    markEmailSent,
    updateRecoveryStatuses,
} from '@/lib/subscription/stripe/payment-recovery'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log('Running payment recovery cron job...')

        // Update recovery statuses based on time elapsed
        await updateRecoveryStatuses()

        // Get events that need email notifications
        const eventsNeedingEmail = await getRecoveryEventsNeedingEmail()

        // Send reminder emails
        for (const event of eventsNeedingEmail) {
            try {
                if (event.status === 'warning') {
                    const daysRemaining = event.gracePeriodEnd
                        ? Math.max(
                              0,
                              Math.ceil(
                                  (event.gracePeriodEnd.getTime() -
                                      Date.now()) /
                                      (1000 * 60 * 60 * 24)
                              )
                          )
                        : 0

                    await sendPaymentReminderEmail(event.userId, {
                        invoiceId: event.stripeInvoiceId,
                        amount: 400, // You'll need to fetch actual amount from Stripe
                        currency: 'usd',
                        daysRemaining,
                        updatePaymentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=billing`,
                    })

                    await markEmailSent(event.id)
                    console.log(
                        `Sent reminder email for recovery event ${event.id}`
                    )
                }
            } catch (emailError) {
                console.error(
                    `Failed to send email for event ${event.id}:`,
                    emailError
                )
            }
        }

        console.log(
            `Payment recovery cron completed. Processed ${eventsNeedingEmail.length} events.`
        )

        return NextResponse.json({
            success: true,
            processedEvents: eventsNeedingEmail.length,
        })
    } catch (error) {
        console.error('Payment recovery cron failed:', error)
        return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
    }
}
