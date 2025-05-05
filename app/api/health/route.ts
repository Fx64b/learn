import { checkRateLimit } from '@/lib/rate-limit'

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor
        ? forwardedFor.split(',')[0]
        : request.headers.get('x-real-ip') || 'unknown'

    const rateLimitResult = await checkRateLimit(`health:${ip}`)

    if (!rateLimitResult.success) {
        return NextResponse.json(
            {
                error: 'Too many requests',
                limit: rateLimitResult.limit || 100,
                remaining: rateLimitResult.remaining || 0,
                reset: rateLimitResult.reset || 0,
            },
            { status: 429 }
        )
    }

    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        rateLimit: {
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            reset: rateLimitResult.reset,
        },
    })
}
