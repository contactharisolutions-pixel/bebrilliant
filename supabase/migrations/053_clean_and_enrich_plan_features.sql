-- ==============================================================================
-- Migration 053: Clean Up Bogus Feature Modules & Enrich Real Plan Feature Mappings
-- ==============================================================================

-- 1. Remove the bogus 'active_student' pseudo-feature (capacity limits are handled by max_students column)
DELETE FROM public.plan_features WHERE key = 'active_student';

-- 2. Strip 'active_student' key from plans.features jsonb
UPDATE public.plans 
SET features = features - 'active_student' 
WHERE features ? 'active_student';

-- 3. Map realistic, enterprise feature modules per plan tier

-- Solo Tutor (Independent Teacher)
UPDATE public.plans 
SET features = jsonb_build_object(
    'ai_mentor', true,
    'attendance', true,
    'parent_portal', true,
    'adaptive_exam', false,
    'white_label', false,
    'live_classes', false,
    'analytics_reports', false,
    'bulk_sms', false,
    'custom_certs', false,
    'marketplace', false
)
WHERE name = 'Solo Tutor';

-- Institue / Coating (Institute / Coaching)
UPDATE public.plans 
SET features = jsonb_build_object(
    'ai_mentor', true,
    'attendance', true,
    'live_classes', true,
    'parent_portal', true,
    'bulk_sms', true,
    'analytics_reports', false,
    'adaptive_exam', false,
    'white_label', false,
    'custom_certs', false,
    'marketplace', false
)
WHERE name = 'Institue / Coating';

-- Starter Tier
UPDATE public.plans 
SET features = jsonb_build_object(
    'ai_mentor', false,
    'attendance', true,
    'parent_portal', true,
    'live_classes', false,
    'analytics_reports', false,
    'adaptive_exam', false,
    'white_label', false,
    'bulk_sms', false,
    'custom_certs', false,
    'marketplace', false
)
WHERE name = 'Starter';

-- School (Basic)
UPDATE public.plans 
SET features = jsonb_build_object(
    'ai_mentor', true,
    'attendance', true,
    'live_classes', true,
    'parent_portal', true,
    'bulk_sms', true,
    'analytics_reports', true,
    'adaptive_exam', false,
    'white_label', false,
    'custom_certs', false,
    'marketplace', false
)
WHERE name = 'School (Basic)';

-- School (Standard)
UPDATE public.plans 
SET features = jsonb_build_object(
    'ai_mentor', true,
    'attendance', true,
    'live_classes', true,
    'parent_portal', true,
    'bulk_sms', true,
    'analytics_reports', true,
    'adaptive_exam', true,
    'custom_certs', true,
    'white_label', false,
    'marketplace', false
)
WHERE name = 'School (Standard)';

-- School (Advance)
UPDATE public.plans 
SET features = jsonb_build_object(
    'ai_mentor', true,
    'attendance', true,
    'live_classes', true,
    'parent_portal', true,
    'bulk_sms', true,
    'analytics_reports', true,
    'adaptive_exam', true,
    'custom_certs', true,
    'white_label', true,
    'marketplace', true
)
WHERE name = 'School (Advance)';

-- Pro
UPDATE public.plans 
SET features = jsonb_build_object(
    'ai_mentor', true,
    'attendance', true,
    'live_classes', true,
    'parent_portal', true,
    'analytics_reports', true,
    'adaptive_exam', true,
    'bulk_sms', true,
    'custom_certs', true,
    'white_label', false,
    'marketplace', false
)
WHERE name = 'Pro';

-- Enterprise
UPDATE public.plans 
SET features = jsonb_build_object(
    'ai_mentor', true,
    'attendance', true,
    'live_classes', true,
    'parent_portal', true,
    'analytics_reports', true,
    'adaptive_exam', true,
    'white_label', true,
    'custom_certs', true,
    'bulk_sms', true,
    'marketplace', true
)
WHERE name = 'Enterprise';
