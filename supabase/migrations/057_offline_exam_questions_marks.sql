-- Migration 057: Add marks column to offline_exam_questions if not exists
ALTER TABLE public.offline_exam_questions ADD COLUMN IF NOT EXISTS marks NUMERIC DEFAULT 1;
