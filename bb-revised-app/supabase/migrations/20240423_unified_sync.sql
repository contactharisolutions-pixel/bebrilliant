-- Unified Exam System - Column Sync
ALTER TABLE public.offline_exam_questions ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE public.offline_exams ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES paper_templates(id);

-- Ensure we have the same structure for OMR as well if needed
ALTER TABLE public.offline_exams ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 180;
