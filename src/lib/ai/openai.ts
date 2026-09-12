/**
 * Server-side OpenAI Service
 * 
 * SECURITY NOTICE:
 * This module strictly executes on the Node.js server runtime.
 * OPENAI_API_KEY is read exclusively from private server environment variables
 * and is NEVER exposed or prefixed with NEXT_PUBLIC_.
 */

function getOpenAIKey(): string {
    const key = process.env.OPENAI_API_KEY
    if (!key) {
        throw new Error('OPENAI_API_KEY is not configured in server environment variables.')
    }
    return key
}

export interface ImageGenerationOptions {
    prompt: string
    model?: 'dall-e-3' | 'dall-e-2'
    size?: '1024x1024' | '1024x1792' | '1792x1024' | '512x512' | '256x256'
    quality?: 'standard' | 'hd'
    style?: 'vivid' | 'natural'
}

export interface ImageGenerationResult {
    url: string
    revisedPrompt?: string
}

/**
 * Generate high-fidelity images using DALL-E 3 / OpenAI Images API
 */
export async function generateAIImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const apiKey = getOpenAIKey()
    const {
        prompt,
        model = 'dall-e-3',
        size = '1024x1024',
        quality = 'standard',
        style = 'vivid'
    } = options

    const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            prompt,
            n: 1,
            size,
            quality: model === 'dall-e-3' ? quality : undefined,
            style: model === 'dall-e-3' ? style : undefined,
            response_format: 'url'
        })
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData?.error?.message || `OpenAI Image API error: ${res.statusText}`)
    }

    const data = await res.json()
    const item = data?.data?.[0]
    if (!item?.url) {
        throw new Error('No image URL returned from OpenAI.')
    }

    return {
        url: item.url,
        revisedPrompt: item.revised_prompt
    }
}

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
 * Generate enterprise UI layouts, design systems, and component code using GPT-4o
 */
export async function generateUILayout(options: UILayoutOptions): Promise<UILayoutResult> {
    const apiKey = getOpenAIKey()
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

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            temperature: 0.2,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData?.error?.message || `OpenAI Chat API error: ${res.statusText}`)
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content || ''

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
