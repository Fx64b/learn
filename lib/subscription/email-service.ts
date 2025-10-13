'use server'

import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface PaymentFailedEmailData {
    invoiceId: string
    amount: number
    currency: string
    gracePeriodEnd: Date
    retryDate: Date
}

interface PaymentRecoveredEmailData {
    invoiceId: string
    amount: number
    currency: string
}

interface PaymentReminderEmailData {
    invoiceId: string
    amount: number
    currency: string
    daysRemaining: number
    updatePaymentUrl: string
}

/**
 * Send immediate payment failed notification
 */
export async function sendPaymentFailedEmail(
    userId: string,
    data: PaymentFailedEmailData
): Promise<void> {
    const user = await getUserEmail(userId)
    if (!user) return

    const amount = formatAmount(data.amount, data.currency)
    const gracePeriodFormatted = data.gracePeriodEnd.toLocaleDateString()
    const retryDateFormatted = data.retryDate.toLocaleDateString()

    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'learn@fx64b.dev',
            to: user.email,
            subject: 'Payment Issue - Action Required',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #dc2626; margin: 0 0 10px 0;">Payment Issue Detected</h2>
                        <p style="margin: 0; color: #7f1d1d;">We had trouble processing your payment for Learn Pro.</p>
                    </div>

                    <h3>What happened?</h3>
                    <p>Your payment of <strong>${amount}</strong> could not be processed. This can happen for various reasons:</p>
                    <ul>
                        <li>Insufficient funds</li>
                        <li>Expired or invalid payment method</li>
                        <li>Bank security restrictions</li>
                    </ul>

                    <h3>What we're doing:</h3>
                    <p>✅ Your Pro features remain active until <strong>${gracePeriodFormatted}</strong><br>
                    ✅ We'll automatically retry your payment on <strong>${retryDateFormatted}</strong><br>
                    ✅ You can update your payment method anytime</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=billing" 
                           style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Update Payment Method
                        </a>
                    </div>

                    <h3>Need help?</h3>
                    <p>If you continue having issues, please reply to this email or contact us at learn@fx64b.dev</p>

                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 14px; color: #6b7280;">
                        This email was sent regarding your Learn Pro subscription. Invoice ID: ${data.invoiceId}
                    </p>
                </div>
            `,
        })

        console.log(`Payment failed email sent to ${user.email}`)
    } catch (error) {
        console.error('Error sending payment failed email:', error)
        throw error
    }
}

/**
 * Send payment recovered notification
 */
export async function sendPaymentRecoveredEmail(
    userId: string,
    data: PaymentRecoveredEmailData
): Promise<void> {
    const user = await getUserEmail(userId)
    if (!user) return

    const amount = formatAmount(data.amount, data.currency)

    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'learn@fx64b.dev',
            to: user.email,
            subject: '🎉 Payment Successful - Welcome Back!',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #15803d; margin: 0 0 10px 0;">🎉 Payment Successful!</h2>
                        <p style="margin: 0; color: #14532d;">Your Learn Pro subscription has been restored.</p>
                    </div>

                    <h3>Payment Processed</h3>
                    <p>We've successfully processed your payment of <strong>${amount}</strong>.</p>

                    <h3>Your Pro Features</h3>
                    <p>✅ AI-powered flashcard generation<br>
                    ✅ Advanced learning analytics<br>
                    ✅ Unlimited file uploads<br>
                    ✅ Priority support</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/" 
                           style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Start Learning
                        </a>
                    </div>

                    <p>Thank you for being a Learn Pro user! 🚀</p>

                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 14px; color: #6b7280;">
                        This email was sent regarding your Learn Pro subscription. Invoice ID: ${data.invoiceId}
                    </p>
                </div>
            `,
        })

        console.log(`Payment recovered email sent to ${user.email}`)
    } catch (error) {
        console.error('Error sending payment recovered email:', error)
        throw error
    }
}

/**
 * Send payment reminder during warning period
 */
export async function sendPaymentReminderEmail(
    userId: string,
    data: PaymentReminderEmailData
): Promise<void> {
    const user = await getUserEmail(userId)
    if (!user) return

    const amount = formatAmount(data.amount, data.currency)

    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'learn@fx64b.dev',
            to: user.email,
            subject: `Payment Reminder - ${data.daysRemaining} days remaining`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h2 style="margin: 0 0 10px 0;">⚠️ Payment Reminder</h2>
                        <p style="margin: 0;">Your Learn Pro subscription needs attention.</p>
                    </div>

                    <h3>Payment Still Pending</h3>
                    <p>We're still having trouble processing your payment of <strong>${amount}</strong>.</p>
                    
                    <p>Your Pro features will be limited in <strong>${data.daysRemaining} days</strong> if payment isn't resolved.</p>

                    <h3>Quick Actions</h3>
                    <div style="margin: 20px 0;">
                        <a href="${data.updatePaymentUrl}" 
                           style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
                            Update Payment Method
                        </a>
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=billing" 
                           style="background: #6b7280; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Retry Payment
                        </a>
                    </div>

                    <h3>What happens next?</h3>
                    <p>🟡 <strong>Next ${data.daysRemaining} days:</strong> All Pro features remain active<br>
                    🔴 <strong>After ${data.daysRemaining} days:</strong> Pro features will be temporarily disabled<br>
                    ✅ <strong>After payment:</strong> All features restored immediately</p>

                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 14px; color: #6b7280;">
                        This email was sent regarding your Learn Pro subscription. Invoice ID: ${data.invoiceId}
                    </p>
                </div>
            `,
        })

        console.log(`Payment reminder email sent to ${user.email}`)
    } catch (error) {
        console.error('Error sending payment reminder email:', error)
        throw error
    }
}

/**
 * Get user email and name from database
 */
async function getUserEmail(
    userId: string
): Promise<{ email: string; name?: string } | null> {
    try {
        const user = await db
            .select({ email: users.email, name: users.name })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

        return user[0] ? { ...user[0], name: user[0].name ?? undefined } : null
    } catch (error) {
        console.error('Error fetching user email:', error)
        return null
    }
}

/**
 * Format amount with currency
 */
function formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100) // Stripe amounts are in cents
}
