-- 047_merge_owner_admin_rbac.sql
-- Merges owner and admin roles, adds platform_staff role, and seeds module permissions.

-- 1. Modify CHECK constraint on user_profiles.role to include platform_staff
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles 
  ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('owner', 'platform_staff', 'tenant_admin', 'teacher', 'teacher_pending', 'student', 'parent'));

-- 2. Seed custom platform module permissions
INSERT INTO public.permissions (module, action, key, description) VALUES
  ('cms', 'manage', 'cms.manage', 'Manage Website CMS and White-labeling'),
  ('automation', 'manage', 'automation.manage', 'Manage panel automation & whatsapp settings'),
  ('settings', 'manage', 'settings.manage', 'Configure system settings, plans & commission rules'),
  ('payouts', 'manage', 'payouts.manage', 'Manage payouts & withdrawals'),
  ('crm', 'manage', 'crm.manage', 'Manage CRM leads and inquiries'),
  ('analytics', 'view', 'analytics.view', 'View Platform Analytics & Reports')
ON CONFLICT (key) DO UPDATE SET 
  module = EXCLUDED.module,
  action = EXCLUDED.action,
  description = EXCLUDED.description;
