-- ============================================================
-- Migration 041: Enterprise Onboarding — Templates, Rich Tasks,
--                Lifecycle Stages, Comments, Milestones, Timeline
-- ============================================================

-- ─── 1. ONBOARDING TEMPLATES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  tasks       JSONB NOT NULL DEFAULT '[]',  -- Array of task template objects
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default template matching the 6 hardcoded tasks
INSERT INTO public.onboarding_templates (name, description, is_default, tasks)
VALUES (
  'Standard Institute Onboarding',
  'Default onboarding checklist for institute-type tenants',
  TRUE,
  '[
    {"title": "Send Welcome Email with Credentials", "description": "Email admin login details and onboarding guide", "priority": "high", "subtasks": []},
    {"title": "Schedule Kickoff Call", "description": "Book 30-min orientation call with tenant admin", "priority": "high", "subtasks": []},
    {"title": "Configure Domain & Branding", "description": "Set custom domain, logo, and brand colors", "priority": "medium", "subtasks": [
      {"title": "Upload logo"},
      {"title": "Set brand colors"},
      {"title": "Configure subdomain"}
    ]},
    {"title": "Setup Syllabus Structure", "description": "Import or build initial syllabus with subjects and chapters", "priority": "medium", "subtasks": []},
    {"title": "Onboard First Teacher Accounts", "description": "Create and train 2-3 core teacher accounts", "priority": "medium", "subtasks": []},
    {"title": "Conduct Training Session", "description": "Live walkthrough of admin panel features", "priority": "high", "subtasks": []}
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- ─── 2. EXTEND onboarding_checklists ─────────────────────────
ALTER TABLE public.onboarding_checklists
  ADD COLUMN IF NOT EXISTS template_id            UUID REFERENCES public.onboarding_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lifecycle_stage         TEXT NOT NULL DEFAULT 'provisioned'
    CHECK (lifecycle_stage IN ('provisioned', 'setup', 'training', 'go_live', 'active', 'at_risk', 'churned')),
  ADD COLUMN IF NOT EXISTS expected_completion_date DATE,
  ADD COLUMN IF NOT EXISTS go_live_date            DATE,
  ADD COLUMN IF NOT EXISTS sla_days                INTEGER NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS sla_breached_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS health_score            INTEGER NOT NULL DEFAULT 100
    CHECK (health_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS churn_risk_level        TEXT NOT NULL DEFAULT 'safe'
    CHECK (churn_risk_level IN ('safe', 'at_risk', 'critical')),
  ADD COLUMN IF NOT EXISTS secondary_staff_ids     UUID[] NOT NULL DEFAULT '{}';

-- Migrate existing task JSONB to rich format (add id, description, priority, subtasks fields)
UPDATE public.onboarding_checklists
SET tasks = (
  SELECT jsonb_agg(
    task || jsonb_build_object(
      'id',          gen_random_uuid()::text,
      'description', '',
      'priority',    'medium',
      'due_date',    null,
      'completed_at', null,
      'completed_by', null,
      'blocked_by',  '[]'::jsonb,
      'subtasks',    '[]'::jsonb
    )
  )
  FROM jsonb_array_elements(tasks) AS task
)
WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0;

CREATE INDEX IF NOT EXISTS idx_onboarding_lifecycle ON public.onboarding_checklists(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_onboarding_health    ON public.onboarding_checklists(health_score);

-- ─── 3. ONBOARDING COMMENTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id  UUID NOT NULL REFERENCES public.onboarding_checklists(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  mentions      UUID[] NOT NULL DEFAULT '{}',
  parent_id     UUID REFERENCES public.onboarding_comments(id) ON DELETE CASCADE,
  created_by    UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  edited_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_comments_checklist ON public.onboarding_comments(checklist_id, created_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_comments_parent    ON public.onboarding_comments(parent_id);

-- ─── 4. ONBOARDING MILESTONES ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id  UUID NOT NULL REFERENCES public.onboarding_checklists(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  target_date   DATE NOT NULL,
  completed_at  TIMESTAMPTZ,
  completed_by  UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_milestones_checklist ON public.onboarding_milestones(checklist_id);

-- ─── 5. ONBOARDING TIMELINE EVENTS ───────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_timeline_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id  UUID NOT NULL REFERENCES public.onboarding_checklists(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN (
    'stage_change', 'task_complete', 'task_added', 'task_removed',
    'comment_added', 'staff_assigned', 'milestone_reached',
    'health_score_change', 'note_added'
  )),
  payload       JSONB NOT NULL DEFAULT '{}',
  created_by    UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_timeline_checklist ON public.onboarding_timeline_events(checklist_id, created_at DESC);

-- ─── 6. TRIGGER: auto-log stage changes ──────────────────────
CREATE OR REPLACE FUNCTION public.log_onboarding_stage_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.lifecycle_stage IS DISTINCT FROM NEW.lifecycle_stage THEN
    INSERT INTO public.onboarding_timeline_events (checklist_id, type, payload)
    VALUES (
      NEW.id,
      'stage_change',
      jsonb_build_object(
        'from', OLD.lifecycle_stage,
        'to',   NEW.lifecycle_stage
      )
    );
  END IF;

  IF OLD.health_score IS DISTINCT FROM NEW.health_score THEN
    INSERT INTO public.onboarding_timeline_events (checklist_id, type, payload)
    VALUES (
      NEW.id,
      'health_score_change',
      jsonb_build_object(
        'from', OLD.health_score,
        'to',   NEW.health_score
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_onboarding_stage ON public.onboarding_checklists;
CREATE TRIGGER trg_log_onboarding_stage
  AFTER UPDATE ON public.onboarding_checklists
  FOR EACH ROW EXECUTE FUNCTION public.log_onboarding_stage_change();

-- ─── 7. FUNCTION: compute SLA breach ─────────────────────────
CREATE OR REPLACE FUNCTION public.check_onboarding_sla_breach()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.onboarding_checklists
  SET sla_breached_at = NOW(),
      churn_risk_level = 'at_risk'
  WHERE lifecycle_stage NOT IN ('active', 'go_live', 'churned')
    AND sla_breached_at IS NULL
    AND created_at + (sla_days || ' days')::INTERVAL < NOW();
END;
$$;

COMMENT ON TABLE public.onboarding_templates IS
  'Reusable task templates for tenant onboarding checklists.';
COMMENT ON TABLE public.onboarding_comments IS
  'Internal threaded comments on onboarding checklists with @mention support.';
COMMENT ON TABLE public.onboarding_milestones IS
  'Key milestone dates (target vs actual) for onboarding tracking.';
COMMENT ON TABLE public.onboarding_timeline_events IS
  'Full chronological event log per onboarding checklist.';
