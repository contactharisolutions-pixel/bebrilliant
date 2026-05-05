-- ============================================================
-- Migration 004.1: Online Exams Table (Extracted from old DB)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.online_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_marks INTEGER,
  duration INTEGER, -- in minutes
  pricing_type TEXT CHECK (pricing_type IN ('free', 'paid')),
  price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  instructions JSONB DEFAULT '{}'::jsonb,
  blueprint JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.online_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_access_online_exams" ON public.online_exams
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
  );

CREATE INDEX IF NOT EXISTS idx_online_exams_tenant ON public.online_exams(tenant_id);
