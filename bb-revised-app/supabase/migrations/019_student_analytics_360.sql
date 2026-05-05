-- STUDENT RESULT 360° ANALYTICS SCHEMA - ROBUST EDITION
-- FOCUS: High-density performance data and aggregated metrics for faculty intelligence.

-- 1. Student Performance (Fact Table)
CREATE TABLE IF NOT EXISTS public.student_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  subject TEXT DEFAULT 'General',
  chapter TEXT,
  topic TEXT,
  marks_obtained NUMERIC DEFAULT 0,
  total_marks NUMERIC DEFAULT 100,
  exam_date DATE DEFAULT CURRENT_DATE,
  week_number INTEGER DEFAULT extract(week from CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROBUST COLUMN ENSURANCE (In case the table existed without these specific columns)
ALTER TABLE public.student_performance ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'General';
ALTER TABLE public.student_performance ADD COLUMN IF NOT EXISTS chapter TEXT;
ALTER TABLE public.student_performance ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.student_performance ADD COLUMN IF NOT EXISTS marks_obtained NUMERIC DEFAULT 0;
ALTER TABLE public.student_performance ADD COLUMN IF NOT EXISTS total_marks NUMERIC DEFAULT 100;
ALTER TABLE public.student_performance ADD COLUMN IF NOT EXISTS percentage NUMERIC GENERATED ALWAYS AS (CASE WHEN total_marks > 0 THEN (marks_obtained / total_marks) * 100 ELSE 0 END) STORED;

-- 2. Aggregated Analytics Table (Optimized for Dashboard Queries)
CREATE TABLE IF NOT EXISTS public.student_analytics_agg (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  class TEXT,
  division TEXT,
  subject TEXT DEFAULT 'General',
  chapter TEXT,
  topic TEXT,
  avg_percentage NUMERIC DEFAULT 0,
  total_tests INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.student_analytics_agg ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'General';
ALTER TABLE public.student_analytics_agg ADD COLUMN IF NOT EXISTS chapter TEXT;
ALTER TABLE public.student_analytics_agg ADD COLUMN IF NOT EXISTS topic TEXT;

-- Handle Unique constraint properly if table exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_analytics_agg_unique_constraint') THEN
        ALTER TABLE public.student_analytics_agg ADD CONSTRAINT student_analytics_agg_unique_constraint UNIQUE(student_id, subject, chapter, topic);
    END IF;
END $$;

-- 3. Weekly Progress Table
CREATE TABLE IF NOT EXISTS public.weekly_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  subject TEXT DEFAULT 'General',
  chapter TEXT,
  topic TEXT,
  avg_score NUMERIC DEFAULT 0,
  improvement NUMERIC DEFAULT 0, -- Comparing to previous week
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.weekly_progress ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'General';

-- 4. Analytics Audit Logs
CREATE TABLE IF NOT EXISTS public.analytics_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RLS Policies
ALTER TABLE public.student_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_analytics_agg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;

-- Faculty and admin and owners can see all performance data for their tenant
DROP POLICY IF EXISTS "Tenant Performance Visibility" ON public.student_performance;
CREATE POLICY "Tenant Performance Visibility" ON public.student_performance
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant Analytics Agg Visibility" ON public.student_analytics_agg;
CREATE POLICY "Tenant Analytics Agg Visibility" ON public.student_analytics_agg
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant Weekly Progress Visibility" ON public.weekly_progress;
CREATE POLICY "Tenant Weekly Progress Visibility" ON public.weekly_progress
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant Analytics Logs Visibility" ON public.analytics_logs;
CREATE POLICY "Tenant Analytics Logs Visibility" ON public.analytics_logs
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()));

-- 6. Indexes for High-Performance Drilldown
CREATE INDEX IF NOT EXISTS idx_perf_student ON public.student_performance(student_id);
CREATE INDEX IF NOT EXISTS idx_perf_subject ON public.student_performance(subject);
CREATE INDEX IF NOT EXISTS idx_perf_chapter ON public.student_performance(chapter);
CREATE INDEX IF NOT EXISTS idx_perf_tenant ON public.student_performance(tenant_id);

CREATE INDEX IF NOT EXISTS idx_agg_student_subject ON public.student_analytics_agg(student_id, subject);
CREATE INDEX IF NOT EXISTS idx_weekly_student_week ON public.weekly_progress(student_id, week_number);
