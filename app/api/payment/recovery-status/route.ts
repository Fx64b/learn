import { authOptions } from '@/lib/auth'
import { getUserRecoveryStatus } from '@/lib/subscription/stripe/payment-recovery'

import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ recoveryStatus: null })
        }

        const recoveryEvent = await getUserRecoveryStatus(session.user.id)

        if (!recoveryEvent) {
            return NextResponse.json({ recoveryStatus: null })
        }

        // Calculate days remaining based on status
        let daysRemaining = 0
        const now = new Date()

        if (recoveryEvent.status === 'grace' && recoveryEvent.gracePeriodEnd) {
            const timeDiff =
                recoveryEvent.gracePeriodEnd.getTime() - now.getTime()
            daysRemaining = Math.max(
                0,
                Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
            )
        } else if (recoveryEvent.status === 'warning') {
            // Calculate days until limitation (14 days from creation)
            const limitationDate = new Date(
                recoveryEvent.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000
            )
            const timeDiff = limitationDate.getTime() - now.getTime()
            daysRemaining = Math.max(
                0,
                Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
            )
        }

        // TODO: Fetch the actual invoice from Stripe to get the amount and currency
        // Get amount and currency from Stripe invoice (simplified version)
        // In a real implementation, you might want to fetch this from Stripe
        const recoveryStatus = {
            status: recoveryEvent.status,
            gracePeriodEnd: recoveryEvent.gracePeriodEnd,
            daysRemaining,
            amount: 400, // $4.00 in cents - you'd get this from the actual invoice
            currency: 'usd', // You'd get this from the actual invoice
        }

        return NextResponse.json({ recoveryStatus })
    } catch (error) {
        console.error('Error fetching recovery status:', error)
        return NextResponse.json({ recoveryStatus: null })
    }
}
