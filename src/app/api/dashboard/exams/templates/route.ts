import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyTenantStaff } from '@/lib/auth-server';
import { MasterTemplateEngine } from '@/lib/ai/template-engine';

export const maxDuration = 120; // AI Question Generation allowance

// ── Built-in Standard Presets ────────────────────────────────────────────────
const PRESETS: Record<string, { template: any; sections: any[] }> = {
    'cbse-class10': {
        template: {
            name: 'CBSE Class 10 Standard Pattern',
            category: 'School',
            exam_type: 'Mixed',
            duration_minutes: 180,
            total_marks: 80,
            description: 'Standard CBSE Class 10 board exam pattern with Objective MCQs, Short Answer, and Long Answer sections.',
            tags: ['CBSE', 'Class 10', 'Board Exam', 'Standard']
        },
        sections: [
            {
                section_name: 'Section A — Objective',
                section_type: 'Objective',
                optional_flag: false,
                order_index: 0,
                rules: [
                    { question_type: 'MCQ', num_questions: 20, marks_per_question: 1, negative_marks: 0, difficulty_easy_pct: 40, difficulty_medium_pct: 40, difficulty_hard_pct: 20, internal_choice: false, order_index: 0 }
                ]
            },
            {
                section_name: 'Section B — Short Answer',
                section_type: 'Subjective',
                optional_flag: false,
                order_index: 1,
                instructions: 'Attempt any 10 out of 12 questions.',
                rules: [
                    { question_type: 'Short Answer', num_questions: 10, marks_per_question: 2, negative_marks: 0, difficulty_easy_pct: 30, difficulty_medium_pct: 50, difficulty_hard_pct: 20, internal_choice: true, order_index: 0 }
                ]
            },
            {
                section_name: 'Section C — Long Answer',
                section_type: 'Subjective',
                optional_flag: false,
                order_index: 2,
                rules: [
                    { question_type: 'Long Answer', num_questions: 5, marks_per_question: 4, negative_marks: 0, difficulty_easy_pct: 20, difficulty_medium_pct: 40, difficulty_hard_pct: 40, internal_choice: true, order_index: 0 }
                ]
            },
        ]
    },
    'jee-main': {
        template: {
            name: 'JEE Main Examination Pattern',
            category: 'Entrance',
            exam_type: 'Objective',
            duration_minutes: 180,
            total_marks: 300,
            description: 'JEE Main 2024 standardized pattern: Physics, Chemistry, and Mathematics — 20 MCQ + 10 Numerical each (+4, -1 marking).',
            tags: ['JEE', 'Entrance', 'Engineering', 'NTA']
        },
        sections: [
            {
                section_name: 'Physics',
                section_type: 'Objective',
                optional_flag: false,
                order_index: 0,
                rules: [
                    { question_type: 'MCQ', num_questions: 20, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 20, difficulty_medium_pct: 50, difficulty_hard_pct: 30, internal_choice: false, order_index: 0 },
                    { question_type: 'Numerical', num_questions: 10, marks_per_question: 4, negative_marks: 0, difficulty_easy_pct: 20, difficulty_medium_pct: 40, difficulty_hard_pct: 40, internal_choice: false, order_index: 1 },
                ]
            },
            {
                section_name: 'Chemistry',
                section_type: 'Objective',
                optional_flag: false,
                order_index: 1,
                rules: [
                    { question_type: 'MCQ', num_questions: 20, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 25, difficulty_medium_pct: 50, difficulty_hard_pct: 25, internal_choice: false, order_index: 0 },
                    { question_type: 'Numerical', num_questions: 10, marks_per_question: 4, negative_marks: 0, difficulty_easy_pct: 20, difficulty_medium_pct: 50, difficulty_hard_pct: 30, internal_choice: false, order_index: 1 },
                ]
            },
            {
                section_name: 'Mathematics',
                section_type: 'Objective',
                optional_flag: false,
                order_index: 2,
                rules: [
                    { question_type: 'MCQ', num_questions: 20, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 20, difficulty_medium_pct: 40, difficulty_hard_pct: 40, internal_choice: false, order_index: 0 },
                    { question_type: 'Numerical', num_questions: 10, marks_per_question: 4, negative_marks: 0, difficulty_easy_pct: 15, difficulty_medium_pct: 40, difficulty_hard_pct: 45, internal_choice: false, order_index: 1 },
                ]
            },
        ]
    },
    'neet': {
        template: {
            name: 'NEET UG Examination Pattern',
            category: 'Entrance',
            exam_type: 'Objective',
            duration_minutes: 200,
            total_marks: 720,
            description: 'NEET 2024 standardized pre-medical pattern: Physics (50Q), Chemistry (50Q), Botany (50Q), Zoology (50Q).',
            tags: ['NEET', 'Medical', 'Entrance', 'NCERT']
        },
        sections: [
            {
                section_name: 'Physics',
                section_type: 'Objective',
                optional_flag: false,
                order_index: 0,
                rules: [
                    { question_type: 'MCQ', num_questions: 50, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 25, difficulty_medium_pct: 50, difficulty_hard_pct: 25, internal_choice: false, order_index: 0 },
                ]
            },
            {
                section_name: 'Chemistry',
                section_type: 'Objective',
                optional_flag: false,
                order_index: 1,
                rules: [
                    { question_type: 'MCQ', num_questions: 50, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 30, difficulty_medium_pct: 50, difficulty_hard_pct: 20, internal_choice: false, order_index: 0 },
                ]
            },
            {
                section_name: 'Botany',
                section_type: 'Objective',
                optional_flag: false,
                order_index: 2,
                rules: [
                    { question_type: 'MCQ', num_questions: 50, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 30, difficulty_medium_pct: 45, difficulty_hard_pct: 25, internal_choice: false, order_index: 0 },
                ]
            },
            {
                section_name: 'Zoology',
                section_type: 'Objective',
                optional_flag: false,
                order_index: 3,
                rules: [
                    { question_type: 'MCQ', num_questions: 50, marks_per_question: 4, negative_marks: 1, difficulty_easy_pct: 30, difficulty_medium_pct: 45, difficulty_hard_pct: 25, internal_choice: false, order_index: 0 },
                ]
            },
        ]
    },
    'upsc-prelims': {
        template: {
            name: 'UPSC Civil Services Prelims (GS Paper I)',
            category: 'Competitive',
            exam_type: 'Objective',
            duration_minutes: 120,
            total_marks: 200,
            description: 'UPSC Civil Services Preliminary Examination — General Studies Paper I benchmark.',
            tags: ['UPSC', 'Civil Services', 'Government', 'General Studies']
        },
        sections: [
            {
                section_name: 'General Studies Paper I',
                section_type: 'Objective',
                optional_flag: false,
                order_index: 0,
                rules: [
                    { question_type: 'MCQ', num_questions: 100, marks_per_question: 2, negative_marks: 0.67, difficulty_easy_pct: 20, difficulty_medium_pct: 50, difficulty_hard_pct: 30, internal_choice: false, order_index: 0 },
                ]
            },
        ]
    },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function err(msg: string, status = 400) {
    return NextResponse.json({ error: msg }, { status });
}

async function fetchTemplateFull(id: string) {
    const { data, error } = await supabaseAdmin
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

async function upsertSectionsAndRules(templateId: string, sections: any[]) {
    // Cascade delete existing sections
    await supabaseAdmin.from('template_sections').delete().eq('template_id', templateId);

    for (let si = 0; si < sections.length; si++) {
        const { rules, ...sectionData } = sections[si];
        const { data: newSection, error: sErr } = await supabaseAdmin
            .from('template_sections')
            .insert([{ ...sectionData, template_id: templateId, order_index: si }])
            .select()
            .single();
        if (sErr) throw new Error(`Section insert failed: ${sErr.message}`);

        if (Array.isArray(rules) && rules.length > 0) {
            const { error: rErr } = await supabaseAdmin
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

// ── GET: List or Single Template Scoped for Tenant ────────────────────────────
export async function GET(request: NextRequest) {
    const session = await verifyTenantStaff();
    if (!session || !session.tenant_id) return err('Unauthorized or missing tenant context', 403);
    const tenantId = session.tenant_id;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const preset = searchParams.get('preset');

        // Return specific preset details
        if (preset) {
            const p = PRESETS[preset];
            if (!p) return err('Preset not found', 404);
            return NextResponse.json(p);
        }

        // Return list of presets
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

        // Return single template if accessible to this tenant
        if (id) {
            const template = await fetchTemplateFull(id);
            if (!template) return err('Template not found', 404);

            // Access check: either it belongs to this tenant, or it is a published global template
            const isMine = template.tenant_id === tenantId;
            const isGlobal = template.is_global === true && (!template.tenant_id || template.tenant_id !== tenantId);
            if (!isMine && !isGlobal) {
                return err('Access denied to this template', 403);
            }

            return NextResponse.json({
                ...template,
                is_mine: isMine,
                is_owner_published: isGlobal
            });
        }

        // List templates
        const scope = searchParams.get('scope') || 'all'; // 'all' | 'mine' | 'owner_published'
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const sortBy = searchParams.get('sort') || 'created_at';

        // 1. Fetch tenant's own templates
        let mineQuery = supabaseAdmin
            .from('paper_templates')
            .select(`
                *,
                sections:template_sections(
                    id, section_name, section_type, optional_flag, instructions, order_index,
                    rules:section_question_rules(id, question_type, num_questions, marks_per_question, negative_marks, difficulty_easy_pct, difficulty_medium_pct, difficulty_hard_pct, internal_choice ORDER BY order_index ASC)
                    ORDER BY order_index ASC
                )
            `)
            .eq('tenant_id', tenantId)
            .eq('is_active', true);

        // 2. Fetch owner published templates
        let globalQuery = supabaseAdmin
            .from('paper_templates')
            .select(`
                *,
                sections:template_sections(
                    id, section_name, section_type, optional_flag, instructions, order_index,
                    rules:section_question_rules(id, question_type, num_questions, marks_per_question, negative_marks, difficulty_easy_pct, difficulty_medium_pct, difficulty_hard_pct, internal_choice ORDER BY order_index ASC)
                    ORDER BY order_index ASC
                )
            `)
            .eq('is_global', true)
            .eq('is_active', true);

        if (search) {
            mineQuery = mineQuery.ilike('name', `%${search}%`);
            globalQuery = globalQuery.ilike('name', `%${search}%`);
        }
        if (category && category !== 'All') {
            mineQuery = mineQuery.eq('category', category);
            globalQuery = globalQuery.eq('category', category);
        }

        const validSorts: Record<string, string> = {
            created_at: 'created_at',
            name: 'name',
            total_marks: 'total_marks',
            usage_count: 'usage_count',
        };
        const sortCol = validSorts[sortBy] ?? 'created_at';
        mineQuery = mineQuery.order(sortCol, { ascending: sortCol === 'name' });
        globalQuery = globalQuery.order(sortCol, { ascending: sortCol === 'name' });

        const [mineRes, globalRes] = await Promise.all([
            mineQuery,
            globalQuery
        ]);

        if (mineRes.error) throw new Error(mineRes.error.message);
        if (globalRes.error) throw new Error(globalRes.error.message);

        const myTemplates = mineRes.data || [];
        const rawGlobals = (globalRes.data || []).filter(t => t.tenant_id !== tenantId);

        // Track which owner templates have already been imported by this tenant
        const importedSourceIds = new Set(
            myTemplates.map(t => t.cloned_from).filter(Boolean)
        );

        const annotatedMine = myTemplates.map(t => ({
            ...t,
            is_mine: true,
            is_owner_published: false,
            is_imported: Boolean(t.cloned_from)
        }));

        const annotatedGlobals = rawGlobals.map(t => ({
            ...t,
            is_mine: false,
            is_owner_published: true,
            is_imported: importedSourceIds.has(t.id)
        }));

        let combined: any[] = [];
        if (scope === 'mine') {
            combined = annotatedMine;
        } else if (scope === 'owner_published') {
            combined = annotatedGlobals;
        } else {
            // 'all': Show tenant's own formats first, then global templates
            combined = [...annotatedMine, ...annotatedGlobals];
        }

        // Stats
        const stats = {
            total: combined.length,
            mine: annotatedMine.length,
            school: combined.filter(t => t.category === 'School').length,
            entrance: combined.filter(t => t.category === 'Entrance').length,
            competitive: combined.filter(t => t.category === 'Competitive').length,
            owner_published: annotatedGlobals.length,
            imported: annotatedMine.filter(t => t.is_imported).length
        };

        return NextResponse.json({
            templates: combined,
            stats
        });

    } catch (e: any) {
        console.error('[Tenant Templates GET]', e.message);
        return err(e.message || 'Failed to fetch templates', 500);
    }
}

// ── POST: Actions (Create, Update, Delete, Import, Clone, AI Generate) ─────────
export async function POST(request: NextRequest) {
    const session = await verifyTenantStaff();
    if (!session || !session.tenant_id) return err('Unauthorized or missing tenant context', 403);
    const tenantId = session.tenant_id;
    const userId = session.user.id;

    let body: any;
    try { body = await request.json(); } catch { return err('Invalid JSON'); }

    const { action, template, sections, id, templateId, customName, syllabusNodeId, presetKey } = body;

    try {
        // ── 1. CREATE TEMPLATE (ISOLATED TO THIS TENANT) ─────────────────────
        if (action === 'CREATE_TEMPLATE') {
            if (!template?.name?.trim()) return err('Template name is required');

            const marksCheck = validateMarks(template, sections);
            if (!marksCheck.valid) return err(marksCheck.message);

            const { data: newTemplate, error: tErr } = await supabaseAdmin
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
                    is_global: false, // Strict tenant isolation: always false for tenant creations
                    tenant_id: tenantId, // Strictly isolated to this tenant
                    version: 1,
                    created_by: userId,
                }])
                .select()
                .single();

            if (tErr) throw new Error(`Template creation failed: ${tErr.message}`);

            if (Array.isArray(sections) && sections.length > 0) {
                await upsertSectionsAndRules(newTemplate.id, sections);
            }

            const full = await fetchTemplateFull(newTemplate.id);
            return NextResponse.json({ success: true, template: { ...full, is_mine: true } });
        }

        // ── 2. UPDATE TEMPLATE (TENANT OWNED ONLY) ───────────────────────────
        if (action === 'UPDATE_TEMPLATE') {
            if (!id) return err('Template ID is required for update');
            if (!template?.name?.trim()) return err('Template name is required');

            // Strictly verify ownership before mutating
            const { data: existing, error: findErr } = await supabaseAdmin
                .from('paper_templates')
                .select('id, version, tenant_id, is_global')
                .eq('id', id)
                .single();

            if (findErr || !existing) return err('Template not found', 404);
            if (existing.tenant_id !== tenantId) {
                return err('Permission denied: You can only edit templates belonging to your institute.', 403);
            }

            const marksCheck = validateMarks(template, sections);
            if (!marksCheck.valid) return err(marksCheck.message);

            const nextVersion = (existing.version ?? 1) + 1;

            const updatePayload: Record<string, any> = {
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
                // Keep tenant_id intact and is_global false
                is_global: false,
                tenant_id: tenantId
            };

            const { error: tErr } = await supabaseAdmin
                .from('paper_templates')
                .update(updatePayload)
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (tErr) throw new Error(`Template update failed: ${tErr.message}`);

            if (Array.isArray(sections)) {
                await upsertSectionsAndRules(id, sections);
            }

            const full = await fetchTemplateFull(id);
            return NextResponse.json({ success: true, template: { ...full, is_mine: true } });
        }

        // ── 3. DELETE TEMPLATE (TENANT OWNED ONLY) ───────────────────────────
        if (action === 'DELETE_TEMPLATE') {
            if (!id) return err('Template ID is required');

            // Strictly verify ownership
            const { data: existing } = await supabaseAdmin
                .from('paper_templates')
                .select('id, tenant_id')
                .eq('id', id)
                .single();

            if (!existing) return err('Template not found', 404);
            if (existing.tenant_id !== tenantId) {
                return err('Permission denied: You cannot delete templates that do not belong to your institute.', 403);
            }

            // Cascade delete sections and rules, then template
            await supabaseAdmin.from('template_sections').delete().eq('template_id', id);
            const { error: dErr } = await supabaseAdmin
                .from('paper_templates')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (dErr) throw new Error(dErr.message);
            return NextResponse.json({ success: true });
        }

        // ── 4. IMPORT OWNER PUBLISHED TEMPLATE INTO TENANT ────────────────────
        if (action === 'IMPORT_TEMPLATE') {
            if (!templateId) return err('Source templateId is required for import');

            // Fetch source template (must be global or published)
            const src = await fetchTemplateFull(templateId);
            if (!src || (!src.is_global && src.tenant_id !== tenantId)) {
                return err('Source template is not available for import', 404);
            }

            const targetName = customName?.trim() || `${src.name} (My Institute)`;

            // Create isolated copy for this tenant
            const { data: imported, error: cErr } = await supabaseAdmin
                .from('paper_templates')
                .insert([{
                    name: targetName,
                    category: src.category,
                    exam_type: src.exam_type,
                    duration_minutes: src.duration_minutes,
                    total_marks: src.total_marks,
                    instructions: src.instructions ?? [],
                    description: src.description ? `${src.description} (Imported to institute library)` : 'Imported from platform registry',
                    tags: [...(src.tags || []), 'Imported'],
                    is_active: true,
                    is_global: false, // Isolated to tenant
                    tenant_id: tenantId, // Belongs to this tenant
                    cloned_from: src.id,
                    version: 1,
                    created_by: userId,
                }])
                .select()
                .single();

            if (cErr) throw new Error(`Import failed: ${cErr.message}`);

            // Deep-copy sections and rules
            if (Array.isArray(src.sections) && src.sections.length > 0) {
                await upsertSectionsAndRules(imported.id, src.sections);
            }

            // Increment usage count on the source owner template
            try {
                await supabaseAdmin
                    .from('paper_templates')
                    .update({
                        usage_count: (src.usage_count || 0) + 1,
                        last_used_at: new Date().toISOString()
                    })
                    .eq('id', src.id);
            } catch { /* non-critical */ }

            const full = await fetchTemplateFull(imported.id);
            return NextResponse.json({
                success: true,
                message: `Successfully imported "${src.name}" into your institute library.`,
                template: { ...full, is_mine: true, is_imported: true }
            });
        }

        // ── 5. CLONE AN EXISTING TENANT TEMPLATE ─────────────────────────────
        if (action === 'CLONE_TEMPLATE') {
            if (!templateId) return err('templateId is required for clone');
            const src = await fetchTemplateFull(templateId);
            if (!src) return err('Source template not found', 404);

            const cloneName = `Copy of ${src.name}`;
            const { data: clone, error: cErr } = await supabaseAdmin
                .from('paper_templates')
                .insert([{
                    name: cloneName,
                    category: src.category,
                    exam_type: src.exam_type,
                    duration_minutes: src.duration_minutes,
                    total_marks: src.total_marks,
                    instructions: src.instructions ?? [],
                    description: src.description,
                    tags: src.tags ?? [],
                    is_active: true,
                    is_global: false,
                    tenant_id: tenantId,
                    version: 1,
                    cloned_from: src.id,
                    created_by: userId,
                }])
                .select()
                .single();

            if (cErr) throw new Error(`Clone failed: ${cErr.message}`);

            if (Array.isArray(src.sections) && src.sections.length > 0) {
                await upsertSectionsAndRules(clone.id, src.sections);
            }

            const full = await fetchTemplateFull(clone.id);
            return NextResponse.json({ success: true, template: { ...full, is_mine: true } });
        }

        // ── 6. CREATE FROM PRESET (TENANT ISOLATED) ──────────────────────────
        if (action === 'CREATE_FROM_PRESET') {
            if (!presetKey || !PRESETS[presetKey]) return err('Unknown preset key');

            const preset = PRESETS[presetKey];
            const { data: newTemplate, error: tErr } = await supabaseAdmin
                .from('paper_templates')
                .insert([{
                    ...preset.template,
                    name: body.name || preset.template.name,
                    is_active: true,
                    is_global: false,
                    tenant_id: tenantId,
                    version: 1,
                    created_by: userId,
                    tags: [...(preset.template.tags || []), `preset:${presetKey}`],
                }])
                .select()
                .single();

            if (tErr) throw new Error(`Preset creation failed: ${tErr.message}`);
            await upsertSectionsAndRules(newTemplate.id, preset.sections);
            const full = await fetchTemplateFull(newTemplate.id);
            return NextResponse.json({ success: true, template: { ...full, is_mine: true } });
        }

        // ── 7. AI QUESTION GENERATION FOR THIS TENANT'S QUESTION BANK ────────
        if (action === 'GENERATE_QUESTIONS') {
            if (!templateId) return err('templateId is required');

            // Verify template access
            const t = await fetchTemplateFull(templateId);
            if (!t) return err('Template not found', 404);
            if (t.tenant_id && t.tenant_id !== tenantId && !t.is_global) {
                return err('Access denied', 403);
            }

            const result = await MasterTemplateEngine.populateTemplateWithAI(
                templateId,
                tenantId, // Generated strictly into this tenant's question bank
                { syllabusNodeId, createdBy: userId }
            );
            return NextResponse.json(result);
        }

        return err('Unsupported action');

    } catch (e: any) {
        console.error('[Tenant Templates POST Error]', e.message);
        return err(e.message || 'Operation failed', 500);
    }
}
