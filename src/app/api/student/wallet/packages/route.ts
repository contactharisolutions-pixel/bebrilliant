import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const { data: packages, error } = await supabaseAdmin
            .from('credit_packages')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true })

        if (error) throw error

        return NextResponse.json({ packages: packages || [] })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
