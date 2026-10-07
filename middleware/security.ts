import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Builds the Content-Security-Policy. Any new browser request to another
 * origin needs an entry in `connect-src` here, or the browser blocks it.
 */
export function buildCsp({ preview }: { preview: boolean }): string {
    // The Vercel toolbar on preview deployments. Never in production.
    const toolbar = (...sources: string[]) => (preview ? sources : [])

    const directives: Record<string, string[]> = {
        'default-src': ["'self'"],
        'img-src': [
            "'self'",
            'data:',
            'https:',
            ...toolbar('https://vercel.live', 'https://vercel.com', 'blob:'),
        ],
        'script-src': [
            "'self'",
            "'unsafe-eval'",
            "'unsafe-inline'",
            ...toolbar('https://vercel.live'),
        ],
        'style-src': [
            "'self'",
            "'unsafe-inline'",
            ...toolbar('https://vercel.live'),
        ],
        // PDF uploads for AI generation go from the browser straight to
        // Vercel Blob (presigned PUT and multipart under /api/blob/).
        'connect-src': [
            "'self'",
            'https://vercel.com/api/blob/',
            'https://blob.vercel-storage.com',
            'https://*.blob.vercel-storage.com',
            ...toolbar('https://vercel.live', 'wss://ws-us3.pusher.com'),
        ],
    }
    if (preview) {
        directives['frame-src'] = ['https://vercel.live']
        directives['font-src'] = [
            "'self'",
            'https://vercel.live',
            'https://assets.vercel.com',
        ]
    }

    return Object.entries(directives)
        .map(([name, sources]) => `${name} ${sources.join(' ')};`)
        .join(' ')
}

export function securityMiddleware(request: NextRequest) {
    const response = NextResponse.next()

    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
        'Content-Security-Policy',
        buildCsp({ preview: process.env.VERCEL_ENV === 'preview' })
    )
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
    )
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()'
    )

    return response
}
