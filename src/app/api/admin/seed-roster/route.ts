import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner', 'admin'].includes(profile.role) || !profile.tenant_id) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
        }

        const tenantId = profile.tenant_id

        // Check current student count
        const { count: currentStudents } = await supabaseAdmin
            .from('user_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('role', 'student')

        if ((currentStudents || 0) >= 10) {
            return NextResponse.json({ message: 'Roster already populated', count: currentStudents })
        }

        // Seed 12 sample students with realistic Indian school names & grade levels
        const sampleStudents = [
            { first_name: 'Aarav', last_name: 'Sharma', email: 'aarav.sharma@silverbells.edu', grade: 'Class 10', section: 'A', roll_number: '1001' },
            { first_name: 'Ananya', last_name: 'Patel', email: 'ananya.patel@silverbells.edu', grade: 'Class 10', section: 'A', roll_number: '1002' },
            { first_name: 'Vihaan', last_name: 'Verma', email: 'vihaan.verma@silverbells.edu', grade: 'Class 10', section: 'B', roll_number: '1003' },
            { first_name: 'Diya', last_name: 'Iyer', email: 'diya.iyer@silverbells.edu', grade: 'Class 10', section: 'B', roll_number: '1004' },
            { first_name: 'Reyansh', last_name: 'Mehta', email: 'reyansh.mehta@silverbells.edu', grade: 'Class 11', section: 'Sci', roll_number: '1101' },
            { first_name: 'Saanvi', last_name: 'Gupta', email: 'saanvi.gupta@silverbells.edu', grade: 'Class 11', section: 'Sci', roll_number: '1102' },
            { first_name: 'Kabir', last_name: 'Deshmukh', email: 'kabir.deshmukh@silverbells.edu', grade: 'Class 11', section: 'Com', roll_number: '1103' },
            { first_name: 'Myra', last_name: 'Choudhury', email: 'myra.c@silverbells.edu', grade: 'Class 11', section: 'Com', roll_number: '1104' },
            { first_name: 'Ishaan', last_name: 'Bhatia', email: 'ishaan.bhatia@silverbells.edu', grade: 'Class 12', section: 'Sci', roll_number: '1201' },
            { first_name: 'Aadhya', last_name: 'Reddy', email: 'aadhya.reddy@silverbells.edu', grade: 'Class 12', section: 'Sci', roll_number: '1202' },
            { first_name: 'Arjun', last_name: 'Nair', email: 'arjun.nair@silverbells.edu', grade: 'Class 12', section: 'Sci', roll_number: '1203' },
            { first_name: 'Tara', last_name: 'Saxena', email: 'tara.saxena@silverbells.edu', grade: 'Class 12', section: 'Hum', roll_number: '1204' },
        ]

        const created = []
        for (const s of sampleStudents) {
            // Check if profile exists
            const { data: existing } = await supabaseAdmin
                .from('user_profiles')
                .select('id')
                .eq('email', s.email)
                .maybeSingle()

            if (!existing) {
                // create user profile with auth id or random uuid
                const tempId = crypto.randomUUID()
                const { data: ins, error: insErr } = await supabaseAdmin
                    .from('user_profiles')
                    .insert({
                        id: tempId,
                        tenant_id: tenantId,
                        role: 'student',
                        first_name: s.first_name,
                        last_name: s.last_name,
                        email: s.email,
                        is_active: true,
                        settings: {
                            grade: s.grade,
                            section: s.section,
                            roll_number: s.roll_number
                        }
                    })
                    .select()
                    .single()

                if (!insErr && ins) created.push(ins)
            }
        }

        // Also seed 2 sample teachers if none exist
        const sampleTeachers = [
            { first_name: 'Dr. Rajesh', last_name: 'Mishra', email: 'rajesh.mishra@silverbells.edu', subject: 'Physics' },
            { first_name: 'Sunita', last_name: 'Bose', email: 'sunita.bose@silverbells.edu', subject: 'Mathematics' }
        ]

        for (const t of sampleTeachers) {
            const { data: existing } = await supabaseAdmin
                .from('user_profiles')
                .select('id')
                .eq('email', t.email)
                .maybeSingle()

            if (!existing) {
                const tempId = crypto.randomUUID()
                await supabaseAdmin
                    .from('user_profiles')
                    .insert({
                        id: tempId,
                        tenant_id: tenantId,
                        role: 'teacher',
                        first_name: t.first_name,
                        last_name: t.last_name,
                        email: t.email,
                        is_active: true,
                        settings: { subject: t.subject }
                    })
            }
        }

        // Seed 1 sample diagnostic exam if 0 exams
        const { count: examCount } = await supabaseAdmin
            .from('exams')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)

        if ((examCount || 0) === 0) {
            await supabaseAdmin
                .from('exams')
                .insert({
                    tenant_id: tenantId,
                    name: 'Class 10 CBSE Mid-Term Science Assessment',
                    description: 'Term-1 Physics & Chemistry Diagnostic Exam',
                    is_active: true,
                    duration_minutes: 60,
                    start_time: new Date().toISOString(),
                    settings: { subject: 'Science', total_marks: 50, passing_marks: 20 }
                })
        }

        return NextResponse.json({
            success: true,
            message: 'Starter academic roster and diagnostic assessment seeded successfully.',
            students_added: created.length
        })
    } catch (err: any) {
        console.error('[seed-roster] Error:', err)
        return NextResponse.json({ error: err.message || 'Roster seeding failed' }, { status: 500 })
    }
}
