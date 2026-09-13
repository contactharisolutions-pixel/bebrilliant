import OpenAI from 'openai'

/**
 * Server-Side OpenAI Image Generation Service
 * 
 * SECURITY & RUNTIME ARCHITECTURE:
 * - Strictly executes on the Node.js server runtime.
 * - OPENAI_API_KEY is read exclusively from private server environment variables.
 * - Under no circumstances is the API key logged, serialized, or exposed to the browser.
 * - Error handlers sanitize all output, redacting potential tokens or credential fragments.
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ImageAspectRatio = '16:9' | '1:1' | '9:16'
export type ImageQuality = 'standard' | 'hd'
export type ImageStyle = 'natural' | 'vivid'

export type ImageErrorCode =
    | 'KEY_NOT_CONFIGURED'
    | 'INSUFFICIENT_QUOTA'
    | 'AUTHENTICATION_ERROR'
    | 'CONTENT_POLICY_VIOLATION'
    | 'RATE_LIMIT_EXCEEDED'
    | 'INVALID_PROMPT'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR'

export interface ImageGenerationMetadata {
    model: 'dall-e-3' | 'dall-e-2'
    size: '1024x1024' | '1792x1024' | '1024x1792'
    quality: ImageQuality
    style: ImageStyle
    aspectRatio: ImageAspectRatio
    timestamp: string
}

export interface ImageGenerationResult {
    success: boolean
    url?: string
    revisedPrompt?: string
    metadata?: ImageGenerationMetadata
    error?: string
    errorCode?: ImageErrorCode
}

export interface CustomImageOptions {
    prompt: string
    aspectRatio?: ImageAspectRatio
    quality?: ImageQuality
    style?: ImageStyle
    model?: 'dall-e-3' | 'dall-e-2'
}

export interface WebsiteBackgroundOptions {
    /** Target page section: 'hero' | 'telemetry' | 'pedagogy' | 'infrastructure' | custom */
    section?: string
    /** Specific subject in the environment (e.g. "Indian principal and academic director in collaborative discussion") */
    subject: string
    /** Architectural or physical setting (e.g. "Sunlit CBSE conference hall with glass walls and timber tables") */
    environment: string
    /** Directional or natural lighting source */
    lighting?: string
    /** Content-safe negative space side for HTML text overlay */
    contentSafeSide?: 'left' | 'right' | 'center'
    /** Overall color atmosphere */
    colorMood?: string
    /** Optional aspect ratio (defaults to 16:9 for website sections) */
    aspectRatio?: ImageAspectRatio
    /** Quality level (defaults to 'hd' for high architectural fidelity) */
    quality?: ImageQuality
}

export interface RealisticArtworkOptions {
    /** Primary focus or character */
    subject: string
    /** Realistic context or venue */
    setting: string
    /** Photographic genre */
    genre?: 'editorial' | 'documentary' | 'architectural' | 'macro_technology'
    /** Camera optical specs (defaults to Sony A7R V / 50mm f/1.4) */
    cameraSpecs?: string
    /** Motivated lighting */
    lighting?: string
    /** Film stock or color grading (defaults to Kodak Portra 400 tones) */
    colorGrading?: string
    /** Aspect ratio */
    aspectRatio?: ImageAspectRatio
    /** Quality */
    quality?: ImageQuality
}

// ============================================================================
// Singleton Client & Key Security
// ============================================================================

let cachedClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
    if (cachedClient) return cachedClient
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
        throw new OpenAIConfigError('OPENAI_API_KEY is not configured in server environment variables.')
    }
    cachedClient = new OpenAI({ apiKey: apiKey.trim() })
    return cachedClient
}

class OpenAIConfigError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'OpenAIConfigError'
    }
}

// ============================================================================
// Secret-Safe Error Sanitization
// ============================================================================

function sanitizeErrorMessage(rawError: any): { message: string; code: ImageErrorCode } {
    if (rawError instanceof OpenAIConfigError) {
        return {
            message: 'OpenAI API key is missing on the server. Please configure OPENAI_API_KEY in environment variables.',
            code: 'KEY_NOT_CONFIGURED'
        }
    }

    const status = rawError?.status
    const codeStr = rawError?.code || rawError?.error?.code
    const rawMsg = rawError?.message || String(rawError || '')

    // Scrub any potential secret key patterns (sk-..., Bearer ...) from error messages
    const scrubbed = rawMsg
        .replace(/sk-[a-zA-Z0-9_-]{20,}/g, '[REDACTED_API_KEY]')
        .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED_TOKEN]')

    if (
        status === 429 ||
        codeStr === 'credit_balance_exhausted' ||
        codeStr === 'insufficient_quota' ||
        scrubbed.toLowerCase().includes('quota') ||
        scrubbed.toLowerCase().includes('credits')
    ) {
        return {
            message: 'OpenAI API credit quota is currently exhausted. Please recharge billing credits at https://platform.openai.com.',
            code: 'INSUFFICIENT_QUOTA'
        }
    }

    if (status === 401 || codeStr === 'invalid_api_key' || scrubbed.toLowerCase().includes('incorrect api key')) {
        return {
            message: 'Authentication failed: The server OpenAI API key is invalid.',
            code: 'AUTHENTICATION_ERROR'
        }
    }

    if (codeStr === 'content_policy_violation' || scrubbed.toLowerCase().includes('safety system')) {
        return {
            message: 'The requested image prompt was flagged by OpenAI safety guidelines. Please adjust the prompt.',
            code: 'CONTENT_POLICY_VIOLATION'
        }
    }

    if (status === 400) {
        return {
            message: `Invalid image generation request: ${scrubbed}`,
            code: 'INVALID_PROMPT'
        }
    }

    return {
        message: scrubbed || 'An unexpected error occurred during image generation.',
        code: 'UNKNOWN_ERROR'
    }
}

// ============================================================================
// Aspect Ratio & Dimension Resolution
// ============================================================================

function resolveDimensions(aspectRatio: ImageAspectRatio = '16:9'): '1792x1024' | '1024x1024' | '1024x1792' {
    switch (aspectRatio) {
        case '16:9':
            return '1792x1024'
        case '9:16':
            return '1024x1792'
        case '1:1':
        default:
            return '1024x1024'
    }
}

// ============================================================================
// Master Prompt Construction Helpers
// ============================================================================

/**
 * Construct an art-directed prompt for website backgrounds.
 * Guarantees content-safe negative space and forbids simulated UI elements.
 */
export function buildWebsiteBackgroundPrompt(options: WebsiteBackgroundOptions): string {
    const {
        subject,
        environment,
        lighting = 'Warm directional 45-degree morning sunlight casting soft architectural shadows',
        contentSafeSide = 'left',
        colorMood = 'Kodak Portra 400 color tones, natural skin tones, deep collegiate navy and warm timber accents',
        section = 'executive website section'
    } = options

    const negativeSpaceRule = contentSafeSide === 'left'
        ? 'Asymmetric composition: The primary subject and focal elements are positioned exclusively on the right 40% of the frame. The left 60% of the frame is an uncluttered, clean, soft-focus architectural negative space with gentle diffuse daylight falloff, reserved as an empty content-safe area.'
        : contentSafeSide === 'right'
            ? 'Asymmetric composition: The primary subject and focal elements are positioned exclusively on the left 40% of the frame. The right 60% of the frame is an uncluttered, clean, soft-focus architectural negative space with gentle diffuse daylight falloff, reserved as an empty content-safe area.'
            : 'Symmetric architectural framing with gentle ambient negative space in the upper vertical half of the frame.'

    return [
        `High-end editorial architectural and environmental photography designed as a background canvas for an ${section}.`,
        `Subject & Action: ${subject}.`,
        `Environment & Setting: ${environment}.`,
        `Lighting: ${lighting}.`,
        `Color Grading: ${colorMood}, cinematic dynamic range, authentic textures, realistic skin pores, no plastic smoothing.`,
        `Composition & Negative Space: ${negativeSpaceRule}`,
        `STRICT PROHIBITIONS: Absolutely NO text, NO typography, NO words, NO letters, NO logos, NO watermarks, NO buttons, NO cards, NO fake website interfaces, NO device mockups, NO computer UI, and NO floating holograms. Clean physical reality only.`
    ].join(' ')
}

/**
 * Construct an authentic, cinematic prompt for realistic institutional artwork.
 */
export function buildRealisticArtworkPrompt(options: RealisticArtworkOptions): string {
    const {
        subject,
        setting,
        genre = 'editorial',
        cameraSpecs = 'Shot on Sony A7R V with 50mm f/1.4 G-Master lens, shallow depth of field with creamy natural bokeh',
        lighting = 'Motivated natural daylight filtering through large clean windows',
        colorGrading = 'Natural cinematic 35mm film tones, rich contrast, authentic collegiate navy and warm natural wood tones'
    } = options

    return [
        `Authentic photorealistic ${genre} photography.`,
        `Subject: ${subject}.`,
        `Setting: ${setting}.`,
        `Optics & Camera: ${cameraSpecs}.`,
        `Lighting: ${lighting}.`,
        `Color & Texture: ${colorGrading}, genuine human micro-expressions, authentic skin textures, architectural precision, no airbrushed plastic appearance, no generic stock-photo cheesiness.`,
        `Negative Constraints: Absolutely NO fake digital UI, NO buttons, NO mock computer screens, NO floating icons, NO text, NO watermarks, and NO cartoon illustration.`
    ].join(' ')
}

// ============================================================================
// Public Generation Functions
// ============================================================================

/**
 * 1. Generate Custom Image
 * Supports direct custom prompts with aspect ratio, quality, and style controls.
 */
export async function generateCustomImage(options: CustomImageOptions): Promise<ImageGenerationResult> {
    const {
        prompt,
        aspectRatio = '1:1',
        quality = 'hd',
        style = 'natural',
        model = 'dall-e-3'
    } = options

    if (!prompt || prompt.trim() === '') {
        return {
            success: false,
            error: 'Prompt cannot be empty.',
            errorCode: 'INVALID_PROMPT'
        }
    }

    const size = resolveDimensions(aspectRatio)

    try {
        const openai = getOpenAIClient()
        const response = await openai.images.generate({
            model,
            prompt: prompt.trim(),
            n: 1,
            size,
            quality: model === 'dall-e-3' ? quality : undefined,
            style: model === 'dall-e-3' ? style : undefined,
            response_format: 'url'
        })

        const item = response.data?.[0]
        if (!item?.url) {
            throw new Error('OpenAI returned an empty image array.')
        }

        return {
            success: true,
            url: item.url,
            revisedPrompt: item.revised_prompt,
            metadata: {
                model,
                size,
                quality,
                style,
                aspectRatio,
                timestamp: new Date().toISOString()
            }
        }
    } catch (err: any) {
        const { message, code } = sanitizeErrorMessage(err)
        // Log cleanly to server console without leaking secrets
        console.error(`[OpenAI Image Service] Generation failed (${code}): ${message}`)
        return {
            success: false,
            error: message,
            errorCode: code
        }
    }
}

/**
 * 2. Generate Website Background
 * Engineered specifically for website sections with content-safe negative space and zero UI pollution.
 */
export async function generateWebsiteBackground(options: WebsiteBackgroundOptions): Promise<ImageGenerationResult> {
    const fullPrompt = buildWebsiteBackgroundPrompt(options)
    return generateCustomImage({
        prompt: fullPrompt,
        aspectRatio: options.aspectRatio || '16:9',
        quality: options.quality || 'hd',
        style: 'natural',
        model: 'dall-e-3'
    })
}

/**
 * 3. Generate Realistic Visual Artwork
 * Generates photographic, cinematic scenes (leadership, classrooms, diagnostic testing) with natural textures.
 */
export async function generateRealisticArtwork(options: RealisticArtworkOptions): Promise<ImageGenerationResult> {
    const fullPrompt = buildRealisticArtworkPrompt(options)
    return generateCustomImage({
        prompt: fullPrompt,
        aspectRatio: options.aspectRatio || '16:9',
        quality: options.quality || 'hd',
        style: 'natural',
        model: 'dall-e-3'
    })
}

/**
 * Backward compatibility wrapper for existing codebase callers.
 */
export async function generateAIImage(options: {
    prompt: string
    model?: 'dall-e-3' | 'dall-e-2'
    size?: '1024x1024' | '1024x1792' | '1792x1024' | '512x512' | '256x256'
    quality?: 'standard' | 'hd'
    style?: 'vivid' | 'natural'
}): Promise<{ url: string; revisedPrompt?: string }> {
    const res = await generateCustomImage({
        prompt: options.prompt,
        model: options.model || 'dall-e-3',
        quality: options.quality || 'standard',
        style: options.style || 'natural'
    })

    if (!res.success || !res.url) {
        throw new Error(res.error || 'Image generation failed')
    }

    return {
        url: res.url,
        revisedPrompt: res.revisedPrompt
    }
}
