import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe/stripe-server'
import { getUserSubscription } from '@/lib/subscription'
import { absoluteUrl } from '@/lib/utils'

import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function POST() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const subscription = await getUserSubscription(session.user.id)

        if (!subscription?.stripeCustomerId) {
            return NextResponse.json(
                { error: 'No subscription found' },
                { status: 404 }
            )
        }

        const billingUrl = absoluteUrl('/profile?tab=billing')

        const stripeSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: billingUrl,
        })

        return NextResponse.json({ url: stripeSession.url })
    } catch (error) {
        console.error('Billing portal error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
