import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { verifyPlatformAccess } from '@/lib/platform-auth';
import { MasterTemplateEngine } from '@/lib/ai/template-engine';

// Allow up to 120s for AI question generation
export const maxDuration = 120;

// ── Preset Templates (quick-start, no DB needed) ──────────────────────────────
const PRESETS: Record<string, { template: any; sections: any[] }> = {
    'cbse-class10': {
        template: { name: 'CBSE Class 10 Standard', category: 'School', exam_type: 'Mixed', duration_minutes: 180, total_marks: 80, description: 'Standard CBSE Class 10 board exam pattern with Theory + MCQ sections.' },
        sections: [
            { section_name: 'Section A — Objective', section_type: 'Objective', optional_flag: false, order_index: 0, rules: [
                { question_type: 'MCQ', num_questions: 20, marks_per_question: 1, negative_marks: 0, difficulty_easy_pct: 40, difficulty_medium_pct: 40, difficulty_hard_pct: 20, internal_choice: false, order_index: 0 }
            ]},
            { section_name: 'Section B — Short Answer', section_type: 'Subjective', optional_flag: false, order_index: 1, instructions: 'Attempt any 10 out of 12 questions.', rules: [
                { question_type: 'Short Answer', num_questions: 10, marks_per_question: 2, negative_marks: 0, difficulty_easy_pct: 30, difficulty_medium_pct: 50, difficulty_hard_pct: 20, internal_choice: true, order_index: 0 }
            ]},
            { section_name: 'Section C — Long Answer', section_type: 'Subjective', optional_flag: false, order_index: 2, rules: [
                { question_type: 'Long Answer', num_questions: 5, marks_per_question: 4, negative_marks: 0, difficulty_easy_pct: 20, difficulty_medium_pct: 40, difficulty_hard_pct: 40, internal_choice: true, order_index: 0 }
            ]},
        ]
    },
    'jee-main': {
        template: { name: 'JEE Main Pattern', category: 'Entrance', exam_type: 'Objective', duration_minutes: 180, total_marks: 300, description: 'JEE Main 2024 pattern: Physics, Chemistry, Mathematics — 20 MCQ + 10 Numerical each.' },
        sections: [
            { section_name: 'Physics', section_type: 'Objective', optional_flag: false, order_index: 0, rules: [
                { question_type: 'MCQ', num_questions: 20, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 20, difficulty_medium_pct: 50, difficulty_hard_pct: 30, internal_choice: false, order_index: 0 },
                { question_type: 'Numerical', num_questions: 10, marks_per_question: 4, negative_marks: 0, difficulty_easy_pct: 20, difficulty_medium_pct: 40, difficulty_hard_pct: 40, internal_choice: false, order_index: 1 },
            ]},
            { section_name: 'Chemistry', section_type: 'Objective', optional_flag: false, order_index: 1, rules: [
                { question_type: 'MCQ', num_questions: 20, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 25, difficulty_medium_pct: 50, difficulty_hard_pct: 25, internal_choice: false, order_index: 0 },
                { question_type: 'Numerical', num_questions: 10, marks_per_question: 4, negative_marks: 0, difficulty_easy_pct: 20, difficulty_medium_pct: 50, difficulty_hard_pct: 30, internal_choice: false, order_index: 1 },
            ]},
            { section_name: 'Mathematics', section_type: 'Objective', optional_flag: false, order_index: 2, rules: [
                { question_type: 'MCQ', num_questions: 20, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 20, difficulty_medium_pct: 40, difficulty_hard_pct: 40, internal_choice: false, order_index: 0 },
                { question_type: 'Numerical', num_questions: 10, marks_per_question: 4, negative_marks: 0, difficulty_easy_pct: 15, difficulty_medium_pct: 40, difficulty_hard_pct: 45, internal_choice: false, order_index: 1 },
            ]},
        ]
    },
    'neet': {
        template: { name: 'NEET Pattern', category: 'Entrance', exam_type: 'Objective', duration_minutes: 200, total_marks: 720, description: 'NEET 2024 pattern: Physics 50Q, Chemistry 50Q, Biology 100Q (Botany + Zoology).' },
        sections: [
            { section_name: 'Physics', section_type: 'Objective', optional_flag: false, order_index: 0, rules: [
                { question_type: 'MCQ', num_questions: 50, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 25, difficulty_medium_pct: 50, difficulty_hard_pct: 25, internal_choice: false, order_index: 0 },
            ]},
            { section_name: 'Chemistry', section_type: 'Objective', optional_flag: false, order_index: 1, rules: [
                { question_type: 'MCQ', num_questions: 50, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 30, difficulty_medium_pct: 50, difficulty_hard_pct: 20, internal_choice: false, order_index: 0 },
            ]},
            { section_name: 'Botany', section_type: 'Objective', optional_flag: false, order_index: 2, rules: [
                { question_type: 'MCQ', num_questions: 50, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 30, difficulty_medium_pct: 45, difficulty_hard_pct: 25, internal_choice: false, order_index: 0 },
            ]},
            { section_name: 'Zoology', section_type: 'Objective', optional_flag: false, order_index: 3, rules: [
                { question_type: 'MCQ', num_questions: 50, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 30, difficulty_medium_pct: 45, difficulty_hard_pct: 25, internal_choice: false, order_index: 0 },
            ]},
        ]
    },
    'upsc-prelims': {
        template: { name: 'UPSC Prelims Pattern', category: 'Competitive', exam_type: 'Objective', duration_minutes: 120, total_marks: 200, description: 'UPSC Civil Services Preliminary Exam — GS Paper I pattern.' },
        sections: [
            { section_name: 'General Studies Paper I', section_type: 'Objective', optional_flag: false, order_index: 0, rules: [
                { question_type: 'MCQ', num_questions: 100, marks_per_question: 2, negative_marks: 0.67, difficulty_easy_pct: 20, difficulty_medium_pct: 50, difficulty_hard_pct: 30, internal_choice: false, order_index: 0 },
            ]},
        ]
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function err(msg: string, status = 400) {
    return NextResponse.json({ error: msg }, { status });
}

async function fetchTemplateFull(supabase: any, id: string) {
    const { data, error } = await supabase
        .from('paper_templates')
        .select(`
            *,
            sections:template_sections(
                *,
                rules:section_question_rules(* ORDER BY order_index ASC)
                ORDER BY order_index ASC
            )
        `)
        .eq('id', id)
        .single();
    if (error) throw new Error(error.message);
    return data;
}

async function upsertSectionsAndRules(supabase: any, templateId: string, sections: any[]) {
    // Delete existing sections (cascade deletes rules)
    await supabase.from('template_sections').delete().eq('template_id', templateId);

    for (let si = 0; si < sections.length; si++) {
        const { rules, ...sectionData } = sections[si];
        const { data: newSection, error: sErr } = await supabase
            .from('template_sections')
            .insert([{ ...sectionData, template_id: templateId, order_index: si }])
            .select()
            .single();
        if (sErr) throw new Error(`Section insert failed: ${sErr.message}`);

        if (Array.isArray(rules) && rules.length > 0) {
            const { error: rErr } = await supabase
                .from('section_question_rules')
                .insert(rules.map((r: any, ri: number) => ({ ...r, section_id: newSection.id, order_index: ri })));
            if (rErr) throw new Error(`Rules insert failed: ${rErr.message}`);
        }
    }
}

function validateMarks(template: any, sections: any[]): { valid: boolean; message: string } {
    if (!sections || sections.length === 0) return { valid: true, message: '' };
    const declared = Number(template.total_marks ?? 0);
    if (declared === 0) return { valid: true, message: '' };
    const computed = sections.reduce((acc, s) => {
        return acc + (s.rules ?? []).reduce((sa: number, r: any) => sa + (Number(r.num_questions ?? 0) * Number(r.marks_per_question ?? 0)), 0);
    }, 0);
    if (computed !== declared) {
        return { valid: false, message: `Marks mismatch: rules total ${computed}, declared total_marks is ${declared}. Please balance before saving.` };
    }
    return { valid: true, message: '' };
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage');
    if (!user) return err('Forbidden', 403);

    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const preset = searchParams.get('preset');

        // Return a specific preset
        if (preset) {
            const p = PRESETS[preset];
            if (!p) return err('Preset not found');
            return NextResponse.json(p);
        }

        // Return all presets list
        if (searchParams.get('list_presets') === '1') {
            return NextResponse.json(Object.entries(PRESETS).map(([key, p]) => ({
                key,
                name: p.template.name,
                category: p.template.category,
                sections: p.sections.length,
                total_marks: p.template.total_marks,
                duration_minutes: p.template.duration_minutes,
            })));
        }

        // Return single template with full sections + rules
        if (id) {
            const data = await fetchTemplateFull(supabase, id);
            return NextResponse.json(data);
        }

        // List all templates with section summaries
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const sortBy = searchParams.get('sort') || 'created_at';
        const isGlobal = searchParams.get('published');

        let q = supabase
            .from('paper_templates')
            .select(`
                *,
                sections:template_sections(
                    id, section_name, section_type, order_index,
                    rules:section_question_rules(id, question_type, num_questions, marks_per_question ORDER BY order_index ASC)
                    ORDER BY order_index ASC
                )
            `);

        if (search) q = q.ilike('name', `%${search}%`);
        if (category && category !== 'All') q = q.eq('category', category);
        if (isGlobal === 'true') q = q.eq('is_global', true);
        if (isGlobal === 'false') q = q.eq('is_global', false);

        const validSorts: Record<string, string> = {
            created_at: 'created_at',
            name: 'name',
            total_marks: 'total_marks',
            usage_count: 'usage_count',
        };
        const col = validSorts[sortBy] ?? 'created_at';
        q = q.order(col, { ascending: col === 'name' });

        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return NextResponse.json(data ?? []);

    } catch (e: any) {
        console.error('[Templates GET]', e.message);
        return err(e.message || 'Failed to fetch templates', 500);
    }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage');
    if (!user) return err('Forbidden', 403);

    let body: any;
    try { body = await request.json(); } catch { return err('Invalid JSON'); }

    const { action, template, sections, id, templateId, tenantId, syllabusNodeId } = body;

    try {
        const supabase = await createClient();

        // ── CREATE ──
        if (action === 'CREATE_TEMPLATE') {
            if (!template?.name?.trim()) return err('Template name is required');

            const marksCheck = validateMarks(template, sections);
            if (!marksCheck.valid) return err(marksCheck.message);

            const { data: newTemplate, error: tErr } = await supabase
                .from('paper_templates')
                .insert([{
                    name: template.name.trim(),
                    category: template.category || 'School',
                    exam_type: template.exam_type || 'Mixed',
                    duration_minutes: template.duration_minutes ?? 180,
                    total_marks: template.total_marks ?? 100,
                    instructions: template.instructions ?? [],
                    description: template.description ?? null,
                    tags: template.tags ?? [],
                    syllabus_node_id: template.syllabus_node_id ?? null,
                    is_active: true,
                    is_global: false,
                    version: 1,
                    created_by: user.id,
                }])
                .select()
                .single();

            if (tErr) throw new Error(`Template creation failed: ${tErr.message}`);

            if (Array.isArray(sections) && sections.length > 0) {
                await upsertSectionsAndRules(supabase, newTemplate.id, sections);
            }

            const full = await fetchTemplateFull(supabase, newTemplate.id);
            return NextResponse.json({ success: true, template: full });
        }

        // ── UPDATE ──
        if (action === 'UPDATE_TEMPLATE') {
            if (!id) return err('Template id is required for update');
            if (!template?.name?.trim()) return err('Template name is required');

            const marksCheck = validateMarks(template, sections);
            if (!marksCheck.valid) return err(marksCheck.message);

            // Bump version
            const { data: existing } = await supabase.from('paper_templates').select('version').eq('id', id).single();
            const nextVersion = (existing?.version ?? 1) + 1;

            const { error: tErr } = await supabase
                .from('paper_templates')
                .update({
                    name: template.name.trim(),
                    category: template.category,
                    exam_type: template.exam_type,
                    duration_minutes: template.duration_minutes,
                    total_marks: template.total_marks,
                    instructions: template.instructions ?? [],
                    description: template.description ?? null,
                    tags: template.tags ?? [],
                    syllabus_node_id: template.syllabus_node_id ?? null,
                    version: nextVersion,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (tErr) throw new Error(`Template update failed: ${tErr.message}`);

            if (Array.isArray(sections)) {
                await upsertSectionsAndRules(supabase, id, sections);
            }

            const full = await fetchTemplateFull(supabase, id);
            return NextResponse.json({ success: true, template: full });
        }

        // ── CLONE ──
        if (action === 'CLONE_TEMPLATE') {
            if (!templateId) return err('templateId required for clone');
            const src = await fetchTemplateFull(supabase, templateId);

            const { data: clone, error: cErr } = await supabase
                .from('paper_templates')
                .insert([{
                    name: `Copy of ${src.name}`,
                    category: src.category,
                    exam_type: src.exam_type,
                    duration_minutes: src.duration_minutes,
                    total_marks: src.total_marks,
                    instructions: src.instructions,
                    description: src.description,
                    tags: src.tags ?? [],
                    is_active: true,
                    is_global: false,
                    version: 1,
                    cloned_from: src.id,
                    created_by: user.id,
                }])
                .select()
                .single();

            if (cErr) throw new Error(`Clone failed: ${cErr.message}`);

            if (Array.isArray(src.sections) && src.sections.length > 0) {
                await upsertSectionsAndRules(supabase, clone.id, src.sections);
            }

            const full = await fetchTemplateFull(supabase, clone.id);
            return NextResponse.json({ success: true, template: full });
        }

        // ── PUBLISH / UNPUBLISH ──
        if (action === 'PUBLISH_TEMPLATE') {
            if (!id) return err('id required');
            const { data, error: pErr } = await supabase
                .from('paper_templates')
                .update({ is_global: body.is_published, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (pErr) throw new Error(pErr.message);
            return NextResponse.json({ success: true, template: data });
        }

        // ── DELETE ──
        if (action === 'DELETE_TEMPLATE') {
            if (!id) return err('id required');
            // Cascade: delete sections first (rules cascade from sections)
            await supabase.from('template_sections').delete().eq('template_id', id);
            const { error: dErr } = await supabase.from('paper_templates').delete().eq('id', id);
            if (dErr) throw new Error(dErr.message);
            return NextResponse.json({ success: true });
        }

        // ── AI GENERATE QUESTIONS ──
        if (action === 'GENERATE_QUESTIONS') {
            if (!templateId) return err('templateId required');
            if (!tenantId) return err('tenantId required — questions must be generated for a specific tenant question bank');

            const result = await MasterTemplateEngine.populateTemplateWithAI(
                templateId,
                tenantId,
                { syllabusNodeId, createdBy: user.id }
            );
            return NextResponse.json(result);
        }

        // ── FROM PRESET (bulk create from preset key) ──
        if (action === 'CREATE_FROM_PRESET') {
            const presetKey = body.presetKey;
            if (!presetKey || !PRESETS[presetKey]) return err('Unknown preset key');

            const preset = PRESETS[presetKey];
            const { data: newTemplate, error: tErr } = await supabase
                .from('paper_templates')
                .insert([{
                    ...preset.template,
                    name: body.name ?? preset.template.name,
                    is_active: true,
                    is_global: false,
                    version: 1,
                    created_by: user.id,
                    tags: [`preset:${presetKey}`],
                }])
                .select()
                .single();

            if (tErr) throw new Error(`Preset creation failed: ${tErr.message}`);
            await upsertSectionsAndRules(supabase, newTemplate.id, preset.sections);
            const full = await fetchTemplateFull(supabase, newTemplate.id);
            return NextResponse.json({ success: true, template: full });
        }

        return err('Unknown action');

    } catch (e: any) {
        console.error('[Templates POST]', e.message);
        return err(e.message || 'Operation failed', 500);
    }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage');
    if (!user) return err('Forbidden', 403);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return err('id required');

    try {
        const supabase = await createClient();
        await supabase.from('template_sections').delete().eq('template_id', id);
        const { error } = await supabase.from('paper_templates').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return err(e.message, 500);
    }
}
