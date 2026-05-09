-- ============================================================
-- Migration 038: Affiliate Referrals Table
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('teacher', 'student')),
  exam_id       UUID,  -- soft reference — exams table may vary per project
  ref_code      TEXT UNIQUE NOT NULL,
  reward_type   TEXT DEFAULT 'per_payment'
    CHECK (reward_type IN ('per_click', 'per_registration', 'per_payment')),
  reward_amount NUMERIC(10,2) DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  expires_at    TIMESTAMPTZ DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate   ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_tenant      ON affiliate_referrals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_ref_code    ON affiliate_referrals(ref_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_exam        ON affiliate_referrals(exam_id);

ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Affiliate can read + insert own referrals
CREATE POLICY "affiliate_manages_own_referrals"
  ON affiliate_referrals FOR ALL
  USING (affiliate_id = auth.uid());

-- Tenant admin reads all referrals in tenant
CREATE POLICY "tenant_admin_reads_referrals"
  ON affiliate_referrals FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'owner')
    )
  );

-- Anyone authenticated can read active referrals by ref_code (for click tracking)
CREATE POLICY "public_reads_active_referral"
  ON affiliate_referrals FOR SELECT
  USING (is_active = TRUE);

COMMENT ON TABLE affiliate_referrals IS
  'Unique referral codes for affiliate teachers and students. Each code tracks a specific exam share or invite link.';
