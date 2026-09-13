import OpenAI from 'openai'

/**
 * Server-side OpenAI Service & Central AI Client
 * 
 * SECURITY NOTICE:
 * This module strictly executes on the Node.js server runtime.
 * OPENAI_API_KEY is read exclusively from private server environment variables
 * and is NEVER exposed or prefixed with NEXT_PUBLIC_.
 */

let cachedClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
    if (cachedClient) return cachedClient
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('OPENAI_API_KEY is not configured in server environment variables.')
    }
    cachedClient = new OpenAI({ apiKey: apiKey.trim() })
    return cachedClient
}

// Re-export production-grade image generation utilities
export {
    generateCustomImage,
    generateWebsiteBackground,
    generateRealisticArtwork,
    generateAIImage,
    buildWebsiteBackgroundPrompt,
    buildRealisticArtworkPrompt
} from './image-generation'
export type {
    ImageAspectRatio,
    ImageQuality,
    ImageStyle,
    ImageErrorCode,
    ImageGenerationResult,
    ImageGenerationMetadata,
    CustomImageOptions,
    WebsiteBackgroundOptions,
    RealisticArtworkOptions
} from './image-generation'

// UI Layout Generation Types & Utilities
export interface UILayoutOptions {
    prompt: string
    context?: string
    currentLayout?: string
    designTokens?: Record<string, string>
}

export interface UILayoutResult {
    layoutCode: string
    rationale: string
    tokensUsed: Record<string, string>
}

/**
 * Generate enterprise UI layouts, design systems, and component code using GPT-4o via official SDK
 */
export async function generateUILayout(options: UILayoutOptions): Promise<UILayoutResult> {
    const openai = getOpenAIClient()
    const { prompt, context, currentLayout, designTokens } = options

    const systemPrompt = `You are a Principal UI/UX Architect for EduBrilliant, an enterprise institutional education SaaS platform.
Follow these mandatory design rules:
1. Palette & Tone: Brand Navy (#004B93), Slate Background (#F8F9FA), Border (#E5E7EB), Dark Charcoal Text (#111827). High trust, academic prestige, clean modern whitespace.
2. Typography & Hierarchy: Inter or system sans-serif. Clear weights (700/800 for headers, 500/600 for labels). Sentence case for all buttons and labels. Active verbs ("Save changes", "View notes", "Create school"). No generic AI clichés.
3. Micro-interactions: Tactile feedback, crisp states, smooth hover and focus transitions.
4. Output Format: Provide a structured response with:
   - layoutCode: Full production-ready React / TSX code snippet
   - rationale: Detailed explanation of the architectural & UX decisions
   - tokensUsed: Key design tokens applied`

    const userPrompt = `Brief / Request: ${prompt}
${context ? `Context: ${context}` : ''}
${currentLayout ? `Current Layout to Improve: \n${currentLayout}` : ''}
${designTokens ? `Design Tokens: ${JSON.stringify(designTokens, null, 2)}` : ''}`

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.2,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]
    })

    const content = response.choices?.[0]?.message?.content || ''

    return {
        layoutCode: content,
        rationale: 'Generated layout compliant with EduBrilliant enterprise UI/UX specifications.',
        tokensUsed: designTokens || {
            brand: '#004B93',
            bg: '#F8F9FA',
            border: '#E5E7EB'
        }
    }
}
