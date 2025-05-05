import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const pathname = req.nextUrl.pathname

    // Geschützte Routen
    const protectedPaths = ['/learn', '/profile', '/deck']
    const isProtectedPath = protectedPaths.some((path) =>
        pathname.startsWith(path)
    )

    // Auth-Routen
    const authRoutes = ['/login', '/verify-request']
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    // Wenn eingeloggt und auf Auth-Route
    if (session && isAuthRoute) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    // Wenn nicht eingeloggt und auf geschützter Route
    if (!session && isProtectedPath) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
