-- ============================================================
-- Migration 040: Enterprise CRM — Lead Scoring, Activities,
--                Reminders, Custom Stages, Attachments
-- ============================================================

-- ─── 1. EXTEND owner_leads ────────────────────────────────────
ALTER TABLE public.owner_leads
  ADD COLUMN IF NOT EXISTS lead_score          INTEGER NOT NULL DEFAULT 0
    CHECK (lead_score >= 0 AND lead_score <= 100),
  ADD COLUMN IF NOT EXISTS priority            TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS expected_value      DECIMAL(14, 2),
  ADD COLUMN IF NOT EXISTS expected_close_date DATE,
  ADD COLUMN IF NOT EXISTS tags                TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS custom_fields       JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lost_reason         TEXT,
  ADD COLUMN IF NOT EXISTS win_reason          TEXT,
  ADD COLUMN IF NOT EXISTS stage_id            UUID,  -- FK added after table creation
  ADD COLUMN IF NOT EXISTS last_activity_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS days_in_stage       INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_owner_leads_score    ON public.owner_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_owner_leads_priority ON public.owner_leads(priority);
CREATE INDEX IF NOT EXISTS idx_owner_leads_stage_id ON public.owner_leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_owner_leads_tags     ON public.owner_leads USING GIN(tags);

-- ─── 2. CRM PIPELINE STAGES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  order_index  INTEGER NOT NULL DEFAULT 0,
  color        TEXT NOT NULL DEFAULT '#3B82F6',
  icon         TEXT,
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  is_won       BOOLEAN NOT NULL DEFAULT FALSE,
  is_lost      BOOLEAN NOT NULL DEFAULT FALSE,
  probability  INTEGER NOT NULL DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default stages matching current hardcoded ones
INSERT INTO public.crm_pipeline_stages (name, order_index, color, is_default, is_won, is_lost, probability)
VALUES
  ('New Lead',        1, '#1FAC63', TRUE, FALSE, FALSE, 10),
  ('Contacted',       2, '#F0A026', FALSE, FALSE, FALSE, 25),
  ('Demo Scheduled',  3, '#004B93', FALSE, FALSE, FALSE, 40),
  ('Demo Completed',  4, '#7C3AED', FALSE, FALSE, FALSE, 60),
  ('Converted',       5, '#059669', FALSE, TRUE,  FALSE, 100),
  ('Lost',            6, '#EF4444', FALSE, FALSE, TRUE,  0)
ON CONFLICT DO NOTHING;

-- Add FK from owner_leads to crm_pipeline_stages
ALTER TABLE public.owner_leads
  ADD CONSTRAINT fk_owner_leads_stage
    FOREIGN KEY (stage_id) REFERENCES public.crm_pipeline_stages(id) ON DELETE SET NULL;

-- ─── 3. LEAD ACTIVITIES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES public.owner_leads(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('call', 'email', 'note', 'meeting', 'status_change', 'stage_change', 'assignment')),
  content     TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',  -- duration, outcome, video_url, etc.
  created_by  UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead    ON public.lead_activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type    ON public.lead_activities(type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_creator ON public.lead_activities(created_by);

-- ─── 4. LEAD REMINDERS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_reminders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID NOT NULL REFERENCES public.owner_leads(id) ON DELETE CASCADE,
  assigned_to  UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN ('call', 'email', 'follow_up', 'demo', 'custom')),
  message      TEXT,
  due_at       TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_by   UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_reminders_lead      ON public.lead_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_due       ON public.lead_reminders(due_at)
  WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lead_reminders_assignee  ON public.lead_reminders(assigned_to);

-- ─── 5. LEAD ATTACHMENTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID NOT NULL REFERENCES public.owner_leads(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  url           TEXT NOT NULL,
  size_bytes    BIGINT,
  mime_type     TEXT,
  uploaded_by   UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_attachments_lead ON public.lead_attachments(lead_id);

-- ─── 6. EXTEND demos ─────────────────────────────────────────
ALTER TABLE public.demos
  ADD COLUMN IF NOT EXISTS video_link        TEXT,
  ADD COLUMN IF NOT EXISTS join_url          TEXT,
  ADD COLUMN IF NOT EXISTS reminder_sent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outcome           TEXT CHECK (outcome IN ('positive', 'neutral', 'negative')),
  ADD COLUMN IF NOT EXISTS feedback          TEXT;

-- ─── 7. TRIGGER: update last_activity_at on lead_activities insert ───
CREATE OR REPLACE FUNCTION public.update_lead_last_activity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.owner_leads
  SET last_activity_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_lead_activity ON public.lead_activities;
CREATE TRIGGER trg_update_lead_activity
  AFTER INSERT ON public.lead_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_lead_last_activity();

COMMENT ON TABLE public.crm_pipeline_stages IS
  'Custom pipeline stages for the CRM. Supports full customization including won/lost marking.';
COMMENT ON TABLE public.lead_activities IS
  'Activity log per lead: calls, emails, notes, meetings, and system events.';
COMMENT ON TABLE public.lead_reminders IS
  'Follow-up reminders attached to leads, assignable to staff members.';
