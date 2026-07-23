-- ============================================================
-- Migration 039: Enterprise RBAC — Staff Invites, Suspension Log,
--                Extended Audit, Granular Permissions
-- ============================================================

-- ─── 1. EXTEND user_profiles ─────────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url      TEXT,
  ADD COLUMN IF NOT EXISTS department      TEXT,
  ADD COLUMN IF NOT EXISTS bio             TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS login_count     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_permissions JSONB NOT NULL DEFAULT '{}';

-- ─── 2. EXTEND audit_logs ────────────────────────────────────
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS ip_address  TEXT,
  ADD COLUMN IF NOT EXISTS user_agent  TEXT,
  ADD COLUMN IF NOT EXISTS severity    TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical'));

-- ─── 3. STAFF INVITES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  role         TEXT NOT NULL,
  first_name   TEXT,
  last_name    TEXT,
  invited_by   UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  token        TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '72 hours',
  accepted_at  TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_invites_email  ON public.staff_invites(email);
CREATE INDEX IF NOT EXISTS idx_staff_invites_status ON public.staff_invites(status);
CREATE INDEX IF NOT EXISTS idx_staff_invites_token  ON public.staff_invites(token);

-- ─── 4. USER SUSPENSION LOG ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_suspension_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  reason         TEXT NOT NULL,
  suspended_by   UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  suspended_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_days  INTEGER,
  auto_lift_at   TIMESTAMPTZ,
  lifted_at      TIMESTAMPTZ,
  lifted_by      UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  lift_reason    TEXT
);

CREATE INDEX IF NOT EXISTS idx_suspension_log_user ON public.user_suspension_log(user_id);
CREATE INDEX IF NOT EXISTS idx_suspension_log_auto_lift ON public.user_suspension_log(auto_lift_at)
  WHERE lifted_at IS NULL;

-- ─── 5. ROLE CUSTOM PERMISSIONS (per-role overrides) ──────────
CREATE TABLE IF NOT EXISTS public.role_custom_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role        TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  granted     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role, permission_key)
);

-- ─── 6. SEED GRANULAR PERMISSIONS MATRIX ─────────────────────
INSERT INTO public.permissions (module, action, key, description)
VALUES
  -- Exam
  ('exam', 'view',    'exam.view',    'View exam list and details'),
  ('exam', 'create',  'exam.create',  'Create new exams'),
  ('exam', 'edit',    'exam.edit',    'Edit existing exams'),
  ('exam', 'delete',  'exam.delete',  'Delete exams'),
  ('exam', 'publish', 'exam.publish', 'Publish or unpublish exams'),
  -- Question Bank
  ('question_bank', 'view',   'question_bank.view',   'View questions'),
  ('question_bank', 'create', 'question_bank.create', 'Create questions'),
  ('question_bank', 'edit',   'question_bank.edit',   'Edit questions'),
  ('question_bank', 'delete', 'question_bank.delete', 'Delete questions'),
  -- Students
  ('students', 'view',    'students.view',    'View student list'),
  ('students', 'create',  'students.create',  'Create student accounts'),
  ('students', 'edit',    'students.edit',    'Edit student profiles'),
  ('students', 'suspend', 'students.suspend', 'Suspend student accounts'),
  ('students', 'export',  'students.export',  'Export student data'),
  -- Teachers
  ('teachers', 'view',    'teachers.view',    'View teacher list'),
  ('teachers', 'create',  'teachers.create',  'Create teacher accounts'),
  ('teachers', 'edit',    'teachers.edit',    'Edit teacher profiles'),
  ('teachers', 'approve', 'teachers.approve', 'Approve pending teachers'),
  -- CRM
  ('crm', 'view',    'crm.view',    'View CRM leads'),
  ('crm', 'manage',  'crm.manage',  'Create and manage leads'),
  ('crm', 'delete',  'crm.delete',  'Delete leads'),
  ('crm', 'export',  'crm.export',  'Export CRM data'),
  -- Payments
  ('payments', 'view',    'payments.view',    'View payment records'),
  ('payments', 'refund',  'payments.refund',  'Issue refunds'),
  ('payments', 'export',  'payments.export',  'Export payment data'),
  -- Analytics
  ('analytics', 'view',   'analytics.view',   'View analytics dashboards'),
  ('analytics', 'export', 'analytics.export', 'Export analytics data'),
  -- AI
  ('ai', 'view',      'ai.view',      'View AI features'),
  ('ai', 'configure', 'ai.configure', 'Configure AI settings'),
  -- Settings
  ('settings', 'view',   'settings.view',   'View platform settings'),
  ('settings', 'manage', 'settings.manage', 'Modify platform settings'),
  ('settings', 'rbac',   'settings.rbac',   'Manage users and permissions'),
  -- Wallet
  ('wallet', 'view',   'wallet.view',   'View wallet settings'),
  ('wallet', 'manage', 'wallet.manage', 'Manage credits and rules'),
  -- Onboarding
  ('onboarding', 'view',   'onboarding.view',   'View onboarding pipelines'),
  ('onboarding', 'manage', 'onboarding.manage', 'Manage onboarding checklists')
ON CONFLICT (key) DO NOTHING;

-- ─── 7. FUNCTION: auto-expire invites ────────────────────────
CREATE OR REPLACE FUNCTION public.expire_old_invites()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.staff_invites
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;

COMMENT ON TABLE public.staff_invites IS
  'Tracks platform staff invitations with token-based acceptance flow.';
COMMENT ON TABLE public.user_suspension_log IS
  'Audit trail for user suspension and reinstatement events.';
