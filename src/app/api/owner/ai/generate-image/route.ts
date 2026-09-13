import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import {
    generateCustomImage,
    generateWebsiteBackground,
    generateRealisticArtwork,
    WebsiteBackgroundOptions,
    RealisticArtworkOptions
} from '@/lib/ai/openai'

/**
 * POST /api/owner/ai/generate-image
 * Secure, authenticated endpoint to generate marketing, background & institutional visuals via DALL-E 3
 */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('cms.manage')
    if (!user) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const {
            type = 'custom',
            prompt,
            backgroundOptions,
            realisticOptions,
            aspectRatio = '16:9',
            quality = 'hd',
            style = 'natural'
        } = body

        let result

        if (type === 'website_background') {
            if (!backgroundOptions || !backgroundOptions.subject || !backgroundOptions.environment) {
                return NextResponse.json(
                    { error: 'Website background requires subject and environment in backgroundOptions.' },
                    { status: 400 }
                )
            }
            result = await generateWebsiteBackground({
                ...backgroundOptions,
                aspectRatio,
                quality
            })
        } else if (type === 'realistic_artwork') {
            if (!realisticOptions || !realisticOptions.subject || !realisticOptions.setting) {
                return NextResponse.json(
                    { error: 'Realistic artwork requires subject and setting in realisticOptions.' },
                    { status: 400 }
                )
            }
            result = await generateRealisticArtwork({
                ...realisticOptions,
                aspectRatio,
                quality
            })
        } else {
            // Custom prompt (also supports legacy body format with direct prompt string)
            if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
                return NextResponse.json({ error: 'Image prompt is required.' }, { status: 400 })
            }
            result = await generateCustomImage({
                prompt: prompt.trim(),
                aspectRatio,
                quality,
                style
            })
        }

        if (!result.success) {
            const statusCode = result.errorCode === 'INSUFFICIENT_QUOTA' ? 429 : 500
            return NextResponse.json({ error: result.error, errorCode: result.errorCode }, { status: statusCode })
        }

        return NextResponse.json(result)
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Image generation failed' }, { status: 500 })
    }
}
