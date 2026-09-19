-- ============================================================
-- BeBrilliant: Tenant Exam Format Isolation Migration
-- ============================================================

-- 1. Ensure tenant_id column exists on paper_templates
ALTER TABLE public.paper_templates 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. Performance indexes for tenant-scoped filtering and global lookups
CREATE INDEX IF NOT EXISTS idx_paper_templates_tenant_id 
ON public.paper_templates(tenant_id);

CREATE INDEX IF NOT EXISTS idx_paper_templates_tenant_global 
ON public.paper_templates(tenant_id, is_global, is_active);

CREATE INDEX IF NOT EXISTS idx_paper_templates_cloned_from 
ON public.paper_templates(cloned_from);

-- 3. Ensure existing global owner templates have tenant_id NULL and is_global true
UPDATE public.paper_templates 
SET is_global = true 
WHERE is_global IS NULL OR (tenant_id IS NULL AND is_global = true);
