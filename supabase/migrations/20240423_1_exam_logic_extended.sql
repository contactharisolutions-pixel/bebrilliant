-- Support for Internal Choice Logic in Offline Exams
ALTER TABLE public.offline_exam_questions ADD COLUMN IF NOT EXISTS choice_group TEXT;
ALTER TABLE public.offline_exam_questions ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT FALSE;

-- Analytics extensions for online exams
ALTER TABLE public.online_exam_attempts ADD COLUMN IF NOT EXISTS marks_obtained DECIMAL DEFAULT 0;
ALTER TABLE public.online_exam_attempts ADD COLUMN IF NOT EXISTS rank_position INTEGER;
ALTER TABLE public.online_exam_attempts ADD COLUMN IF NOT EXISTS percentile_rank DECIMAL;
