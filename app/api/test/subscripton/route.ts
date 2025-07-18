import { authOptions } from '@/lib/auth'
import { getUserSubscription, isUserPro } from '@/lib/subscription'

import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
    // return 404 if node env not development

    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const subscription = await getUserSubscription(session.user.id)
        const isPro = await isUserPro(session.user.id)

        return NextResponse.json({
            userId: session.user.id,
            subscription: subscription
                ? {
                      id: subscription.id,
                      status: subscription.status,
                      stripeCurrentPeriodEnd:
                          subscription.stripeCurrentPeriodEnd,
                      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                      stripeCustomerId: subscription.stripeCustomerId,
                      stripePriceId: subscription.stripePriceId,
                  }
                : null,
            isPro,
            debug: {
                hasSubscription: !!subscription,
                subscriptionStatus: subscription?.status,
                periodEndValid: subscription?.stripeCurrentPeriodEnd
                    ? subscription.stripeCurrentPeriodEnd > new Date()
                    : false,
                notCanceled: subscription
                    ? !subscription.cancelAtPeriodEnd
                    : false,
                currentTime: new Date().toISOString(),
                periodEnd: subscription?.stripeCurrentPeriodEnd?.toISOString(),
            },
        })
    } catch (error) {
        console.error('Error checking subscription:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
