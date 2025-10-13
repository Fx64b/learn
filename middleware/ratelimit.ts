import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

import { NextRequest, NextResponse } from 'next/server'

export async function rateLimitMiddleware(request: NextRequest) {
    const ip =
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-client-ip') ||
        'unknown'

    const path = request.nextUrl.pathname

    const rateLimitedPaths = ['/api', '/auth']
    const shouldRateLimit = rateLimitedPaths.some((p) => path.startsWith(p))

    if (shouldRateLimit) {
        const result = await checkRateLimit(`ip:${ip}`)

        if (!result.success) {
            return NextResponse.json(
                { error: 'Too many requests' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': result.limit?.toString() || '100',
                        'X-RateLimit-Remaining':
                            result.remaining?.toString() || '0',
                        'X-RateLimit-Reset': result.reset?.toString() || '0',
                    },
                }
            )
        }
    }

    return NextResponse.next()
}
