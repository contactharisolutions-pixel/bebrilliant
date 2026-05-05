-- ============================================================
-- BrightBoard Phase 14.3 — AI Intelligence Schema & Settings
-- Ensures every tenant has a settings blob for AI configs
-- ============================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Update defaults for existing tenants
UPDATE tenants 
SET settings = '{"ai": {"adaptive_learning": true, "auto_grading": false, "ai_question_generation": true, "llm_model": "gpt-4-turbo"}}'::jsonb
WHERE settings IS NULL OR settings = '{}'::jsonb;
