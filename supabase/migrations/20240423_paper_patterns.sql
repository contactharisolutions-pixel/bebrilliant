-- Paper Pattern Template Engine Schema

-- 1. Master Templates Table
CREATE TABLE IF NOT EXISTS paper_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- School / Entrance / Competitive
    exam_type TEXT NOT NULL, -- Objective / Subjective / Mixed
    duration_minutes INTEGER DEFAULT 180,
    total_marks INTEGER DEFAULT 100,
    instructions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Template Sections
CREATE TABLE IF NOT EXISTS template_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES paper_templates(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL, -- Section A, B, C...
    section_type TEXT NOT NULL, -- Objective / Subjective
    optional_flag BOOLEAN DEFAULT false,
    attempt_limit INTEGER, -- e.g. 5
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Section Question Rules
CREATE TABLE IF NOT EXISTS section_question_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES template_sections(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL, -- MCQ, MSQ, Short, Long, Case...
    num_questions INTEGER NOT NULL,
    marks_per_question NUMERIC NOT NULL,
    negative_marks NUMERIC DEFAULT 0,
    difficulty_easy_pct INTEGER DEFAULT 30,
    difficulty_medium_pct INTEGER DEFAULT 50,
    difficulty_hard_pct INTEGER DEFAULT 20,
    internal_choice BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_temp_sections_template ON template_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_rules_section ON section_question_rules(section_id);
