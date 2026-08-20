import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import crypto from 'crypto'

const PRESET_PALETTES = [
    {
        id: 'preset-navy',
        name: 'Institutional Navy',
        primary_color: '#004B93',
        secondary_color: '#002D5B',
        background: '#F8FAFC',
        card_bg: '#FFFFFF',
        text_color: '#0F172A',
        accent_color: '#2563EB',
        border_color: '#E2E8F0',
        is_preset: true
    },
    {
        id: 'preset-emerald',
        name: 'Emerald Excellence',
        primary_color: '#059669',
        secondary_color: '#064E3B',
        background: '#F0FDF4',
        card_bg: '#FFFFFF',
        text_color: '#064E3B',
        accent_color: '#10B981',
        border_color: '#D1FAE5',
        is_preset: true
    },
    {
        id: 'preset-amethyst',
        name: 'Royal Amethyst',
        primary_color: '#7C3AED',
        secondary_color: '#4C1D95',
        background: '#F5F3FF',
        card_bg: '#FFFFFF',
        text_color: '#1E1B4B',
        accent_color: '#8B5CF6',
        border_color: '#DDD6FE',
        is_preset: true
    },
    {
        id: 'preset-amber',
        name: 'Sunset Amber',
        primary_color: '#EA580C',
        secondary_color: '#7C2D12',
        background: '#FFF7ED',
        card_bg: '#FFFFFF',
        text_color: '#431407',
        accent_color: '#F97316',
        border_color: '#FFEDD5',
        is_preset: true
    },
    {
        id: 'preset-crimson',
        name: 'Crimson Passion',
        primary_color: '#DC2626',
        secondary_color: '#7F1D1D',
        background: '#FEF2F2',
        card_bg: '#FFFFFF',
        text_color: '#450A0A',
        accent_color: '#EF4444',
        border_color: '#FCA5A5',
        is_preset: true
    },
    {
        id: 'preset-slate',
        name: 'Midnight Slate',
        primary_color: '#334155',
        secondary_color: '#0F172A',
        background: '#F8FAFC',
        card_bg: '#FFFFFF',
        text_color: '#0F172A',
        accent_color: '#475569',
        border_color: '#E2E8F0',
        is_preset: true
    },
    {
        id: 'preset-cyber',
        name: 'Cyber Obsidian',
        primary_color: '#3B82F6',
        secondary_color: '#1E40AF',
        background: '#0F172A',
        card_bg: '#1E293B',
        text_color: '#F8FAFC',
        accent_color: '#60A5FA',
        border_color: '#334155',
        is_preset: true
    },
    {
        id: 'preset-teal',
        name: 'Teal Horizon',
        primary_color: '#0D9488',
        secondary_color: '#134E4A',
        background: '#F0FDFA',
        card_bg: '#FFFFFF',
        text_color: '#042F2E',
        accent_color: '#14B8A6',
        border_color: '#CCFBF1',
        is_preset: true
    },
    {
        id: 'preset-rose',
        name: 'Rose Quartz',
        primary_color: '#E11D48',
        secondary_color: '#881337',
        background: '#FFF1F2',
        card_bg: '#FFFFFF',
        text_color: '#4C0519',
        accent_color: '#F43F5E',
        border_color: '#FFE4E6',
        is_preset: true
    },
    {
        id: 'preset-sapphire',
        name: 'Sapphire Corporate',
        primary_color: '#1E3A8A',
        secondary_color: '#172554',
        background: '#EFF6FF',
        card_bg: '#FFFFFF',
        text_color: '#1E293B',
        accent_color: '#3B82F6',
        border_color: '#DBEAFE',
        is_preset: true
    }
]

export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('cms.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        // Fetch active theme from platform_settings
        const { data: activeSetting } = await supabaseAdmin
            .from('platform_settings')
            .select('value')
            .eq('key', 'owner_active_theme')
            .maybeSingle()

        const activeTheme = activeSetting?.value || PRESET_PALETTES[0]

        // Fetch custom themes from theme_palettes
        const { data: customPalettes } = await supabaseAdmin
            .from('theme_palettes')
            .select('*')
            .order('created_at', { ascending: false })

        const customMapped = (customPalettes || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            primary_color: p.primary_color || '#004B93',
            secondary_color: p.secondary_color || '#002D5B',
            background: p.background || '#F8FAFC',
            card_bg: p.card_bg || '#FFFFFF',
            text_color: p.text_color || '#0F172A',
            accent_color: p.accent_color || p.primary_color || '#2563EB',
            border_color: p.border_color || '#E2E8F0',
            is_preset: false,
            created_at: p.created_at
        }))

        const allPalettes = [...PRESET_PALETTES, ...customMapped]

        return NextResponse.json({
            activeTheme,
            palettes: allPalettes,
            presetCount: PRESET_PALETTES.length,
            customCount: customMapped.length
        })
    } catch (e: any) {
        console.error('Owner CMS GET error:', e)
        return NextResponse.json({ error: e.message || 'GET failed' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('cms.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'SET_ACTIVE_THEME') {
            const { data, error } = await supabaseAdmin
                .from('platform_settings')
                .upsert([
                    { key: 'owner_active_theme', value: payload }
                ], { onConflict: 'key' })
                .select()

            if (error) throw error
            return NextResponse.json({ success: true, activeTheme: payload })
        }

        if (action === 'CREATE_PALETTE') {
            const { data, error } = await supabaseAdmin
                .from('theme_palettes')
                .insert([{
                    name: payload.name,
                    primary_color: payload.primary_color,
                    secondary_color: payload.secondary_color,
                    background: payload.background,
                    card_bg: payload.card_bg || '#FFFFFF',
                    text_color: payload.text_color,
                    accent_color: payload.accent_color || payload.primary_color,
                    border_color: payload.border_color || '#E2E8F0'
                }])
                .select()
                .single()

            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'DELETE_PALETTE') {
            const { error } = await supabaseAdmin
                .from('theme_palettes')
                .delete()
                .eq('id', payload.id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    } catch (error: any) {
        console.error('CMS Owner POST Action Failed:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

