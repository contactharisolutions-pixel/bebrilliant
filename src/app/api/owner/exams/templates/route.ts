import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { MasterTemplateEngine } from '@/lib/ai/template-engine';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const { data, error } = await supabase
                .from('paper_templates')
                .select(`
                    *,
                    sections:template_sections(
                        *,
                        rules:section_question_rules(*)
                    )
                `)
                .eq('id', id)
                .single();
            if (error) throw error;
            return NextResponse.json(data);
        }

        const { data, error } = await supabase
            .from('paper_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { action, template, sections, templateId, syllabusNodeId } = body;

        if (action === 'GENERATE_QUESTIONS') {
            if (!templateId) throw new Error("Template ID required");
            const { data: userData } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', userData.user?.id).single();

            const result = await MasterTemplateEngine.populateTemplateWithAI(
                templateId, 
                profile?.tenant_id, 
                syllabusNodeId
            );
            return NextResponse.json(result);
        }

        if (action === 'CREATE_TEMPLATE') {
            const { data: userData } = await supabase.auth.getUser();
            
            // 1. Insert Template
            const { data: newTemplate, error: tError } = await supabase
                .from('paper_templates')
                .insert([{ ...template, created_by: userData.user?.id }])
                .select()
                .single();

            if (tError) throw tError;

            // 2. Insert Sections & Rules if provided
            if (sections && Array.isArray(sections)) {
                for (const section of sections) {
                    const { rules, ...sectionData } = section;
                    const { data: newSection, error: sError } = await supabase
                        .from('template_sections')
                        .insert([{ ...sectionData, template_id: newTemplate.id }])
                        .select()
                        .single();

                    if (sError) throw sError;

                    if (rules && Array.isArray(rules)) {
                        const { error: rError } = await supabase
                            .from('section_question_rules')
                            .insert(rules.map((r: any) => ({ ...r, section_id: newSection.id })));
                        if (rError) throw rError;
                    }
                }
            }

            return NextResponse.json({ success: true, template: newTemplate });
        }

        if (action === 'PUBLISH_TEMPLATE') {
            const { id, is_published } = body;
            const { data, error } = await supabase
                .from('paper_templates')
                .update({ is_global: is_published })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === 'DELETE_TEMPLATE') {
            const { error } = await supabase
                .from('paper_templates')
                .delete()
                .eq('id', body.id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
