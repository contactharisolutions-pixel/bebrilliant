-- ============================================================
-- BeBrilliant — Lifecycle Phase 3 (Onboarding) + Phase 4 (Training) Migration
-- ============================================================

-- 1. ONBOARDING CASES — 8 Structured Stages
CREATE TABLE IF NOT EXISTS onboarding_cases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id             UUID REFERENCES owner_leads(id) ON DELETE SET NULL,
    organization_name   TEXT NOT NULL,
    contact_name        TEXT,
    contact_email       TEXT,
    contact_phone       TEXT,
    
    -- Staff Assignment
    assigned_staff_id   UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_at         TIMESTAMPTZ,
    
    -- Stage Lifecycle (8 stages)
    stage               TEXT NOT NULL DEFAULT 'assigned' CHECK (stage IN (
                            'assigned', 'kickoff', 'account_setup', 'data_setup',
                            'configuration', 'quality_check', 'customer_review',
                            'ready_for_training', 'completed'
                        )),
    stage_progress_pct  INTEGER NOT NULL DEFAULT 12,
    
    -- Target & SLA (Default SLA = 30 days or configurable)
    target_completion_date DATE,
    sla_deadline        TIMESTAMPTZ,
    sla_breached        BOOLEAN DEFAULT FALSE,
    
    -- Completion & Hand-off
    completed_at        TIMESTAMPTZ,
    completed_by        UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    notes               TEXT,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_tenant ON onboarding_cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_stage ON onboarding_cases(stage);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_staff ON onboarding_cases(assigned_staff_id);

-- 2. ONBOARDING STAGE CHECKLISTS — Individual tasks per stage
CREATE TABLE IF NOT EXISTS onboarding_checklists (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    stage               TEXT NOT NULL,
    task_name           TEXT NOT NULL,
    is_completed        BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at        TIMESTAMPTZ,
    completed_by        UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_chk_case ON onboarding_checklists(case_id);

-- 3. TRAINING CASES — Training Lifecycle
CREATE TABLE IF NOT EXISTS training_cases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    onboarding_case_id  UUID REFERENCES onboarding_cases(id) ON DELETE SET NULL,
    tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id             UUID REFERENCES owner_leads(id) ON DELETE SET NULL,
    organization_name   TEXT NOT NULL,
    
    -- Trainer Assignment
    assigned_trainer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Status Flow
    status              TEXT NOT NULL DEFAULT 'pending_trainer' CHECK (status IN (
                            'pending_trainer', 'trainer_assigned', 'scheduled',
                            'in_progress', 'completed', 'cancelled'
                        )),
    training_type       TEXT NOT NULL DEFAULT 'admin' CHECK (training_type IN (
                            'admin', 'staff', 'teacher', 'management', 'full_pack'
                        )),
    
    -- Dates & SLA
    scheduled_at        TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    sla_deadline        TIMESTAMPTZ,
    
    -- Rating & Feedback Summary
    feedback_rating     INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_comments   TEXT,
    
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_training_cases_tenant ON training_cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_cases_trainer ON training_cases(assigned_trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_cases_status ON training_cases(status);

-- 4. TRAINING SESSIONS — Log of training delivery sessions
CREATE TABLE IF NOT EXISTS training_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID NOT NULL REFERENCES training_cases(id) ON DELETE CASCADE,
    session_no          INTEGER NOT NULL DEFAULT 1,
    topic               TEXT NOT NULL,
    conducted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_mins       INTEGER DEFAULT 60,
    attendees_count     INTEGER DEFAULT 1,
    meeting_link        TEXT,
    notes               TEXT,
    conducted_by        UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_training_sessions_case ON training_sessions(case_id);

-- 5. STAFF CAPACITY RULES — Max workload limits
CREATE TABLE IF NOT EXISTS staff_capacity (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id            UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    max_active_onboarding INTEGER NOT NULL DEFAULT 5,
    max_daily_demos     INTEGER NOT NULL DEFAULT 4,
    max_weekly_trainings INTEGER NOT NULL DEFAULT 6,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_onboarding_cases_updated ON onboarding_cases;
CREATE TRIGGER trg_onboarding_cases_updated
    BEFORE UPDATE ON onboarding_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_training_cases_updated ON training_cases;
CREATE TRIGGER trg_training_cases_updated
    BEFORE UPDATE ON training_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
