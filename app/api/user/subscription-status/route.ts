import { authOptions } from '@/lib/auth'
import { isUserPro } from '@/lib/subscription/subscription'

import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ isPro: false })
        }

        const isPro = await isUserPro(session.user.id)

        return NextResponse.json({ isPro })
    } catch (error) {
        console.error('Error checking subscription status:', error)
        return NextResponse.json({ isPro: false })
    }
}
