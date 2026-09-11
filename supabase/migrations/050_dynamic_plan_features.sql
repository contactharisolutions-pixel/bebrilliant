-- ============================================================
-- Migration 050 — Dynamic Plan Features Registry
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. PLAN FEATURES REGISTRY TABLE
--    Global catalog of all platform modules/features.
--    Owner can add/remove entries. Plans reference feature keys via JSONB.
CREATE TABLE IF NOT EXISTS public.plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,           -- machine key, e.g. "ai_mentor"
    label TEXT NOT NULL,                -- human label, e.g. "AI Study Assistant"
    description TEXT,                   -- short help text shown in UI
    icon TEXT NOT NULL DEFAULT 'Star',  -- Lucide icon component name
    category TEXT NOT NULL DEFAULT 'Core',  -- grouping: Core | Learning | Reporting | Advanced
    is_system BOOLEAN NOT NULL DEFAULT false, -- system features cannot be deleted
    sort_order INT NOT NULL DEFAULT 99,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read (needed for tenant subscription page)
DROP POLICY IF EXISTS "public_read_plan_features" ON public.plan_features;
CREATE POLICY "public_read_plan_features" ON public.plan_features
    FOR SELECT USING (true);

-- Only platform owners can manage the registry
DROP POLICY IF EXISTS "owner_manage_plan_features" ON public.plan_features;
CREATE POLICY "owner_manage_plan_features" ON public.plan_features
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
    );

-- 3. SEED DEFAULT SYSTEM FEATURES (is_system = true = cannot be deleted)
INSERT INTO public.plan_features (key, label, description, icon, category, is_system, sort_order)
VALUES
    ('ai_mentor',         'AI Study Assistant',       'Personalised AI-powered study guidance for students',     'Bot',           'AI & Smart',  true,  1),
    ('adaptive_exam',     'Online Proctored Exams',   'Browser-lock + webcam proctoring for online exams',       'ShieldCheck',   'Examinations', true,  2),
    ('white_label',       'Custom Platform Branding', 'Remove BeBrilliant branding and use institute logo/domain', 'Palette',     'Customisation', true,  3),
    ('live_classes',      'Live Classes (Video)',      'Host live video sessions via integrated meeting rooms',    'Video',         'Learning',    false, 4),
    ('attendance',        'Attendance Tracking',       'QR / biometric attendance system with reports',           'UserCheck',     'Core',        false, 5),
    ('parent_portal',     'Parent Portal',             'Dedicated parent login to track ward progress',            'Users',         'Core',        false, 6),
    ('analytics_reports', 'Advanced Analytics',        'In-depth institute analytics and downloadable reports',   'TrendingUp',    'Reporting',   false, 7),
    ('custom_certs',      'Custom Certificates',       'Design and issue branded digital certificates',            'Award',         'Customisation', false, 8),
    ('bulk_sms',          'Bulk SMS Notifications',    'Send SMS alerts to students, parents, and teachers',      'MessageSquare', 'Communication', false, 9),
    ('marketplace',       'Course Marketplace',        'Publish and sell courses on the BeBrilliant marketplace', 'ShoppingBag',   'Revenue',     false, 10)
ON CONFLICT (key) DO UPDATE
    SET label       = EXCLUDED.label,
        description = EXCLUDED.description,
        icon        = EXCLUDED.icon,
        category    = EXCLUDED.category,
        sort_order  = EXCLUDED.sort_order;

-- 4. Ensure plans table has the amount column used by subscriptions
ALTER TABLE public.tenant_subscriptions ADD COLUMN IF NOT EXISTS amount NUMERIC NOT NULL DEFAULT 0;

-- 5. Extra invoice columns
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_no TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS base_amount NUMERIC;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill invoice_no for existing rows that are null
UPDATE public.invoices
SET invoice_no = 'BB-' || UPPER(SUBSTRING(id::text, 1, 8))
WHERE invoice_no IS NULL;
