-- ============================================================
-- BrightBoard Phase 56 — Offline Exams Answer Key & Instructions
-- ============================================================

ALTER TABLE public.offline_exams 
  ADD COLUMN IF NOT EXISTS answer_key JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Index for answer_key search/lookup
CREATE INDEX IF NOT EXISTS idx_offline_exams_answer_key ON public.offline_exams USING gin (answer_key);
