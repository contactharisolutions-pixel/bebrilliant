-- ============================================================
-- BrightBoard Phase 14.4 — CRM Enterprise Evolution
-- Patching leads table with score and advanced state trackers
-- ============================================================

ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ensure statuses match the high-fidelity UI requirements
-- UI uses: lead, inquiry, enrolled, converted (lost is hidden by default)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN ('lead', 'inquiry', 'enrolled', 'converted', 'lost', 'new'));

-- Migration: Convert legacy 'new' status to 'lead' for UI consistency
UPDATE leads SET status = 'lead' WHERE status = 'new';
