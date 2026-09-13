import { NextRequest, NextResponse } from 'next/server'
import {
    generateCustomImage,
    generateWebsiteBackground,
    generateRealisticArtwork,
    ImageAspectRatio,
    ImageQuality,
    ImageStyle,
    ImageErrorCode,
    WebsiteBackgroundOptions,
    RealisticArtworkOptions
} from '@/lib/ai/openai'

/**
 * Valid aspect ratios, qualities, and styles supported by the service
 */
const VALID_ASPECT_RATIOS: readonly ImageAspectRatio[] = ['16:9', '1:1', '9:16']
const VALID_QUALITIES: readonly ImageQuality[] = ['standard', 'hd']
const VALID_STYLES: readonly ImageStyle[] = ['natural', 'vivid']
const VALID_TYPES = ['custom', 'website_background', 'realistic_artwork'] as const

type RequestType = typeof VALID_TYPES[number]

/**
 * Sanitizes any raw exception string to prevent leaking secrets, credentials or bearer tokens
 */
function sanitizeError(message: string): string {
    return message
        .replace(/sk-[A-Za-z0-9_-]{20,}/g, '[REDACTED_API_KEY]')
        .replace(/Bearer\s+[A-Za-z0-9_.-]+/gi, 'Bearer [REDACTED_TOKEN]')
        .replace(/https:\/\/[^:]+:[^@]+@/g, 'https://[REDACTED_CREDS]@')
}

/**
 * Maps typed ImageErrorCode to appropriate HTTP status code
 */
function getHttpStatusCode(errorCode?: ImageErrorCode): number {
    switch (errorCode) {
        case 'INVALID_PROMPT':
            return 400
        case 'CONTENT_POLICY_VIOLATION':
            return 422
        case 'INSUFFICIENT_QUOTA':
        case 'RATE_LIMIT_EXCEEDED':
            return 429
        case 'KEY_NOT_CONFIGURED':
            return 503
        case 'AUTHENTICATION_ERROR':
            return 502
        case 'NETWORK_ERROR':
            return 504
        default:
            return 500
    }
}

/**
 * GET /api/generate-image
 * Health check & configuration status (safely verifies server configuration without exposing secrets)
 */
export async function GET() {
    const isConfigured = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '')
    return NextResponse.json({
        service: 'openai-image-generation',
        status: 'ready',
        configured: isConfigured,
        supportedTypes: ['custom', 'website_background', 'realistic_artwork'],
        supportedAspectRatios: ['16:9', '1:1', '9:16'],
        supportedQualities: ['standard', 'hd'],
        supportedStyles: ['natural', 'vivid'],
        models: ['dall-e-3', 'dall-e-2']
    })
}

/**
 * POST /api/generate-image
 * Validates request payload and invokes the server-side OpenAI image generation utility.
 */
export async function POST(req: NextRequest) {
    // 1. Parse JSON body safely
    let body: any
    try {
        body = await req.json()
    } catch {
        return NextResponse.json(
            { success: false, error: 'Invalid JSON request payload.', errorCode: 'INVALID_PROMPT' },
            { status: 400 }
        )
    }

    if (!body || typeof body !== 'object') {
        return NextResponse.json(
            { success: false, error: 'Request body must be a valid JSON object.', errorCode: 'INVALID_PROMPT' },
            { status: 400 }
        )
    }

    // 2. Extract and validate parameters
    const type: RequestType = VALID_TYPES.includes(body.type) ? body.type : 'custom'
    const aspectRatio: ImageAspectRatio = VALID_ASPECT_RATIOS.includes(body.aspectRatio) ? body.aspectRatio : '16:9'
    const quality: ImageQuality = VALID_QUALITIES.includes(body.quality) ? body.quality : 'standard'
    const style: ImageStyle = VALID_STYLES.includes(body.style) ? body.style : 'natural'
    const model: 'dall-e-3' | 'dall-e-2' = body.model === 'dall-e-2' ? 'dall-e-2' : 'dall-e-3'

    try {
        // 3. Dispatch based on request type with strict parameter validation
        if (type === 'website_background') {
            // Options can be nested under backgroundOptions or provided at top level
            const bgOptions: Partial<WebsiteBackgroundOptions> = body.backgroundOptions || body

            const subject = typeof bgOptions.subject === 'string' ? bgOptions.subject.trim() : ''
            const environment = typeof bgOptions.environment === 'string' ? bgOptions.environment.trim() : ''

            if (!subject || subject.length < 3) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Website background requires a descriptive "subject" (at least 3 characters).',
                        errorCode: 'INVALID_PROMPT'
                    },
                    { status: 400 }
                )
            }

            if (!environment || environment.length < 3) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Website background requires a descriptive "environment" (at least 3 characters).',
                        errorCode: 'INVALID_PROMPT'
                    },
                    { status: 400 }
                )
            }

            const contentSafeSide = ['left', 'right', 'center'].includes(bgOptions.contentSafeSide as string)
                ? (bgOptions.contentSafeSide as 'left' | 'right' | 'center')
                : 'left'

            const result = await generateWebsiteBackground({
                section: typeof bgOptions.section === 'string' ? bgOptions.section.trim() : undefined,
                subject,
                environment,
                lighting: typeof bgOptions.lighting === 'string' ? bgOptions.lighting.trim() : undefined,
                contentSafeSide,
                colorMood: typeof bgOptions.colorMood === 'string' ? bgOptions.colorMood.trim() : undefined,
                aspectRatio,
                quality
            })

            if (!result.success) {
                return NextResponse.json(
                    { success: false, error: result.error, errorCode: result.errorCode },
                    { status: getHttpStatusCode(result.errorCode) }
                )
            }

            return NextResponse.json(result)
        }

        if (type === 'realistic_artwork') {
            // Options can be nested under realisticOptions or provided at top level
            const artOptions: Partial<RealisticArtworkOptions> = body.realisticOptions || body

            const subject = typeof artOptions.subject === 'string' ? artOptions.subject.trim() : ''
            const setting = typeof artOptions.setting === 'string' ? artOptions.setting.trim() : ''

            if (!subject || subject.length < 3) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Realistic artwork requires a descriptive "subject" (at least 3 characters).',
                        errorCode: 'INVALID_PROMPT'
                    },
                    { status: 400 }
                )
            }

            if (!setting || setting.length < 3) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Realistic artwork requires a descriptive "setting" (at least 3 characters).',
                        errorCode: 'INVALID_PROMPT'
                    },
                    { status: 400 }
                )
            }

            const result = await generateRealisticArtwork({
                subject,
                setting,
                perspective: typeof artOptions.perspective === 'string' ? artOptions.perspective.trim() : undefined,
                lighting: typeof artOptions.lighting === 'string' ? artOptions.lighting.trim() : undefined,
                mood: typeof artOptions.mood === 'string' ? artOptions.mood.trim() : undefined,
                optics: typeof artOptions.optics === 'string' ? artOptions.optics.trim() : undefined,
                aspectRatio,
                quality
            })

            if (!result.success) {
                return NextResponse.json(
                    { success: false, error: result.error, errorCode: result.errorCode },
                    { status: getHttpStatusCode(result.errorCode) }
                )
            }

            return NextResponse.json(result)
        }

        // Default: Custom Image Generation
        const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
        if (!prompt || prompt.length < 3) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Custom image generation requires a valid "prompt" of at least 3 characters.',
                    errorCode: 'INVALID_PROMPT'
                },
                { status: 400 }
            )
        }

        if (prompt.length > 4000) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Image prompt is too long (maximum 4000 characters).',
                    errorCode: 'INVALID_PROMPT'
                },
                { status: 400 }
            )
        }

        const result = await generateCustomImage({
            prompt,
            aspectRatio,
            quality,
            style,
            model
        })

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error, errorCode: result.errorCode },
                { status: getHttpStatusCode(result.errorCode) }
            )
        }

        return NextResponse.json(result)
    } catch (error: any) {
        // Safe error logging: Scrub secrets before logging
        const rawMessage = error?.message || 'An unexpected error occurred during image generation.'
        const safeMessage = sanitizeError(rawMessage)

        return NextResponse.json(
            {
                success: false,
                error: safeMessage,
                errorCode: 'UNKNOWN_ERROR' as ImageErrorCode
            },
            { status: 500 }
        )
    }
}
