-- ============================================================
-- BeBrilliant — Lifecycle Phase 1 + Phase 2 Migration
-- Run this in your Supabase SQL Editor or via psql
-- ============================================================

-- 1. CALL LOGS — Structured call activity per lead
CREATE TABLE IF NOT EXISTS lead_call_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id         UUID NOT NULL REFERENCES owner_leads(id) ON DELETE CASCADE,
    staff_id        UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    call_number     INTEGER NOT NULL DEFAULT 1,
    call_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_mins   INTEGER,
    outcome         TEXT NOT NULL CHECK (outcome IN (
                        'connected','not_reachable','call_back_later',
                        'not_interested','qualified','demo_required',
                        'follow_up_required','invalid_lead'
                    )),
    notes           TEXT,
    customer_requirement TEXT,
    demo_interest   BOOLEAN DEFAULT FALSE,
    preferred_demo_date DATE,
    preferred_demo_time TEXT,
    demo_type       TEXT CHECK (demo_type IN ('online','on_site')),
    next_followup_date DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON lead_call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_staff_id ON lead_call_logs(staff_id);

-- 2. DEMO REQUESTS — Created when a lead is qualified and demo is required
CREATE TABLE IF NOT EXISTS lead_demo_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id         UUID NOT NULL REFERENCES owner_leads(id) ON DELETE CASCADE,
    call_log_id     UUID REFERENCES lead_call_logs(id) ON DELETE SET NULL,
    demo_type       TEXT NOT NULL DEFAULT 'online' CHECK (demo_type IN ('online','on_site')),
    preferred_date  DATE,
    preferred_time  TEXT,
    customer_city   TEXT,
    customer_state  TEXT,
    customer_pincode TEXT,
    customer_address TEXT,
    status          TEXT NOT NULL DEFAULT 'pending_assignment' CHECK (status IN (
                        'pending_assignment','staff_suggested','confirmed',
                        'scheduled','completed','missed','cancelled'
                    )),
    -- Staff assignment (proposed by system, confirmed by manager)
    suggested_staff_id  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_staff_id   UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    assignment_score    INTEGER,
    assignment_reason   TEXT,
    confirmed_by        UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    confirmed_at        TIMESTAMPTZ,
    -- Scheduling
    scheduled_at        TIMESTAMPTZ,
    meeting_link        TEXT,
    -- SLA (24hr to schedule)
    sla_deadline        TIMESTAMPTZ,
    sla_breached        BOOLEAN DEFAULT FALSE,
    -- Completion
    completed_at        TIMESTAMPTZ,
    outcome             TEXT CHECK (outcome IN (
                            'highly_interested','interested','follow_up_required',
                            'proposal_required','closed_won','closed_lost','rescheduled'
                        )),
    interest_level      INTEGER CHECK (interest_level BETWEEN 1 AND 5),
    demo_notes          TEXT,
    deal_probability    INTEGER CHECK (deal_probability BETWEEN 0 AND 100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_demo_requests_lead_id ON lead_demo_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON lead_demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_staff ON lead_demo_requests(assigned_staff_id);

-- 3. PLATFORM TASKS — Universal task engine
CREATE TABLE IF NOT EXISTS platform_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type       TEXT NOT NULL CHECK (task_type IN (
                        'call','follow_up','demo_scheduling','demo_execution',
                        'onboarding','training','go_live','general'
                    )),
    title           TEXT NOT NULL,
    description     TEXT,
    -- References
    lead_id         UUID REFERENCES owner_leads(id) ON DELETE CASCADE,
    demo_request_id UUID REFERENCES lead_demo_requests(id) ON DELETE SET NULL,
    -- Assignment
    assigned_to     UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_by      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    -- Scheduling
    due_at          TIMESTAMPTZ,
    priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
    -- SLA
    sla_minutes     INTEGER,
    sla_breached    BOOLEAN DEFAULT FALSE,
    -- Status
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending','in_progress','completed','overdue','cancelled'
                    )),
    completed_at    TIMESTAMPTZ,
    completion_notes TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_platform_tasks_lead_id ON platform_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_platform_tasks_assigned_to ON platform_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_platform_tasks_status ON platform_tasks(status);
CREATE INDEX IF NOT EXISTS idx_platform_tasks_due_at ON platform_tasks(due_at);

-- 4. SLA RULES — Configurable per lifecycle stage (managed in Settings)
CREATE TABLE IF NOT EXISTS sla_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage           TEXT NOT NULL UNIQUE,
    label           TEXT NOT NULL,
    breach_minutes  INTEGER NOT NULL,
    escalate_to_role TEXT NOT NULL DEFAULT 'owner',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Seed default SLA rules
INSERT INTO sla_rules (stage, label, breach_minutes, escalate_to_role) VALUES
    ('new_inquiry',         'First Response to New Inquiry',       30,   'admin'),
    ('demo_scheduling',     'Demo Must Be Scheduled',              1440, 'admin'),
    ('onboarding_start',    'Onboarding Must Start After Deal Won',2880, 'owner'),
    ('training_start',      'Training Must Start After Onboarding',10080,'owner')
ON CONFLICT (stage) DO NOTHING;

-- 5. LIFECYCLE TIMELINE — Every event recorded per lead
CREATE TABLE IF NOT EXISTS lifecycle_timeline (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id         UUID NOT NULL REFERENCES owner_leads(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,   -- e.g. 'inquiry_received','call_logged','demo_requested','deal_closed'
    event_label     TEXT NOT NULL,
    description     TEXT,
    staff_id        UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_timeline_lead_id ON lifecycle_timeline(lead_id);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON lifecycle_timeline(created_at DESC);

-- 6. STAFF AREA ASSIGNMENTS — For demo staff geo-matching
CREATE TABLE IF NOT EXISTS staff_area_assignments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    city        TEXT,
    state       TEXT,
    pincode     TEXT,
    radius_km   INTEGER DEFAULT 50,
    demo_type   TEXT NOT NULL DEFAULT 'both' CHECK (demo_type IN ('online','on_site','both')),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_area_staff_id ON staff_area_assignments(staff_id);

-- 7. Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_demo_requests_updated ON lead_demo_requests;
CREATE TRIGGER trg_demo_requests_updated
    BEFORE UPDATE ON lead_demo_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_platform_tasks_updated ON platform_tasks;
CREATE TRIGGER trg_platform_tasks_updated
    BEFORE UPDATE ON platform_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
