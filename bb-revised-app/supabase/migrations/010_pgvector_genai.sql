-- ============================================================
-- BrightBoard pgvector Extension: AI Question Generation
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── 1. ENABLE PGVECTOR ──────────────────────────────────────────────────────
-- Requires Postgres 11+ and Supabase Pro or Local with pgvector installed
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── 2. ATTACH VECTOR STORAGE TO QUESTIONS ───────────────────────────────────
-- 1536 dimensions matches standard OpenAI text-embedding-ada-002 model output
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- ─── 3. CREATE VECTOR SIMILARITY INDEX ───────────────────────────────────────
-- Using IVFFlat with Cosine distance for fast semantic similarity lookups
-- (Calculates vectors pointing in exactly the same semantic direction)
CREATE INDEX IF NOT EXISTS idx_questions_embedding 
ON questions USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ─── 4. AI TELEMETRY & COST TRACKING ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id),
  prompt TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model TEXT DEFAULT 'gpt-4',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. SEMANTIC MATCHING RPC HOOK ───────────────────────────────────────────
-- This function allows the backend to pass a float array (vector) and structurally 
-- query the database for mathematically identical or heavily paraphrased questions.
CREATE OR REPLACE FUNCTION match_questions (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  target_tenant_id uuid
)
RETURNS TABLE (
  id uuid,
  question_text jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.question_text,
    1 - (q.embedding <=> query_embedding) AS similarity
  FROM questions q
  WHERE q.tenant_id = target_tenant_id
    AND 1 - (q.embedding <=> query_embedding) > match_threshold
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
