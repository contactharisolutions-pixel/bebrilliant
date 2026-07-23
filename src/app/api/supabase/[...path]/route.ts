import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, await params)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, await params)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, await params)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, await params)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, await params)
}

async function handleProxy(request: NextRequest, { path }: { path: string[] }) {
    try {
        const pathStr = path.join('/')
        const searchParams = request.nextUrl.search
        
        // Target URL is the local Kong gateway on VPS
        const targetUrl = `http://127.0.0.1:8000/${pathStr}${searchParams}`

        // Extract headers from request
        const reqHeaders = new Headers(request.headers)
        
        // Ensure Host header is not forwarded to prevent loop
        reqHeaders.delete('host')
        
        // Get JWT token from cookie if present, and attach as Authorization header
        const cookieStore = await cookies()
        const token = cookieStore.get('bb_token')?.value
        if (token) {
            reqHeaders.set('Authorization', `Bearer ${token}`)
        }

        // Forward request
        const res = await fetch(targetUrl, {
            method: request.method,
            headers: reqHeaders,
            body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : undefined,
            cache: 'no-store'
        })

        // Forward response headers
        const resHeaders = new Headers(res.headers)
        resHeaders.set('Access-Control-Allow-Origin', '*')

        return new NextResponse(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: resHeaders
        })
    } catch (err: any) {
        console.error('[Supabase Proxy Error]:', err)
        return NextResponse.json({ error: 'Supabase Proxy Error', details: err.message }, { status: 500 })
    }
}
