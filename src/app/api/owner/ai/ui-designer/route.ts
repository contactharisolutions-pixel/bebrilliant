import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import { generateUILayout } from '@/lib/ai/openai'

/**
 * POST /api/owner/ai/ui-designer
 * Secure endpoint to generate enterprise layouts and UI/UX improvements via GPT-4o
 */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { prompt, context, currentLayout, designTokens } = body

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Layout prompt is required.' }, { status: 400 })
        }

        const result = await generateUILayout({
            prompt: prompt.trim(),
            context,
            currentLayout,
            designTokens
        })

        return NextResponse.json({ success: true, ...result })
    } catch (err: any) {
        console.error('[OpenAI UI Designer Error]:', err)
        return NextResponse.json({ error: err.message || 'Layout generation failed' }, { status: 500 })
    }
}
