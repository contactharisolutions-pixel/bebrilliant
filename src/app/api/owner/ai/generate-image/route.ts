import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import { generateAIImage } from '@/lib/ai/openai'

/**
 * POST /api/owner/ai/generate-image
 * Secure, authenticated endpoint to generate marketing & institutional visuals via DALL-E 3
 */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('cms.manage')
    if (!user) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { prompt, size = '1024x1024', style = 'vivid' } = body

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Image prompt is required.' }, { status: 400 })
        }

        const result = await generateAIImage({
            prompt: prompt.trim(),
            size,
            style,
            quality: 'standard'
        })

        return NextResponse.json({ success: true, ...result })
    } catch (err: any) {
        console.error('[OpenAI Image Error]:', err)
        return NextResponse.json({ error: err.message || 'Image generation failed' }, { status: 500 })
    }
}
