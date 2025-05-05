import { rateLimitMiddleware } from '@/middleware/ratelimit'

import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

import { securityMiddleware } from './middleware/security'

export async function middleware(req: NextRequest) {
    const rateLimitResponse = await rateLimitMiddleware(req)
    if (rateLimitResponse.status === 429) {
        return rateLimitResponse
    }

    // Apply security headers
    const response = securityMiddleware(req)

    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const pathname = req.nextUrl.pathname

    // Protected routes
    const protectedPaths = ['/learn', '/profile', '/deck']
    const isProtectedPath = protectedPaths.some((path) =>
        pathname.startsWith(path)
    )

    // Auth routes
    const authRoutes = ['/login', '/verify-request']
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    // If logged in and on auth route
    if (session && isAuthRoute) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    // If not logged in and on protected route
    if (!session && isProtectedPath) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
