import { NextResponse, type NextRequest } from 'next/server'

function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = atob(base64)
        return JSON.parse(jsonPayload)
    } catch {
        return null
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const response = NextResponse.next()

    // API routes handle their own auth — never block them in middleware
    if (pathname.startsWith('/api/')) {
        return response
    }

    const token = request.cookies.get('bb_token')?.value

    const protectedPaths = ['/dashboard', '/admin', '/owner', '/tenant']
    const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
    const authPaths = ['/auth/login', '/auth/signup', '/auth/forgot-password']
    const isAuthRoute = authPaths.some((p) => pathname.startsWith(p))

    if (isProtected && !token) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    if (token) {
        const decoded = parseJwt(token)
        // If token is malformed, clear it
        if (!decoded || !decoded.id) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            const res = NextResponse.redirect(url)
            res.cookies.delete('bb_token')
            return res
        }

        // Handle role-based routing checks
        if (pathname.startsWith('/owner') && decoded.role !== 'owner' && decoded.role !== 'platform_staff') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        if (isAuthRoute) {
            if (decoded.role === 'owner' || decoded.role === 'platform_staff') {
                return NextResponse.redirect(new URL('/owner/dashboard', request.url))
            }
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
