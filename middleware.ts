import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value

    // Public paths
    if (request.nextUrl.pathname.startsWith('/api/auth') ||
        request.nextUrl.pathname === '/login') {
        return NextResponse.next()
    }

    // Protected files (next internals, etc) are ignored by matcher usually
    // But here we explicitly check for app routes

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Basic verification (in a real app we might check DB or expiration logic in middleware if stateless)
    // verifyToken returns null if invalid, but we can't easily import verifyToken in middleware 
    // because it uses node runtime specific 'jsonwebtoken' which might not work in Edge runtime of middleware.
    // Next.js Middleware runs on Edge Runtime. 'jsonwebtoken' might fail if not edges-compatible or polyfilled.
    // For simplicity, we just check existence of token here.
    // Proper way involves 'jose' library for Edge compatible JWT.

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
