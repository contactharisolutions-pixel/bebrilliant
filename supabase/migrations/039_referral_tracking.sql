-- ============================================================
-- Migration 039: Referral Tracking + Share Analytics
-- ============================================================

-- ─── 1. REFERRAL TRACKING ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_tracking (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code         TEXT NOT NULL REFERENCES affiliate_referrals(ref_code) ON DELETE CASCADE,
  event_type       TEXT NOT NULL CHECK (event_type IN ('click', 'registration', 'payment')),
  clicked_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  registered_user  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_id       UUID,      -- references wallet_transactions.id after payment
  device_fp        TEXT,      -- browser fingerprint for anti-fraud
  ip_address       TEXT,
  reward_status    TEXT NOT NULL DEFAULT 'pending'
    CHECK (reward_status IN ('pending', 'credited', 'rejected', 'fraud')),
  fraud_reason     TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_ref_code  ON referral_tracking(ref_code);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_user      ON referral_tracking(registered_user);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_payment   ON referral_tracking(payment_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_status    ON referral_tracking(reward_status);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_created   ON referral_tracking(created_at DESC);

ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;

-- Owner full access
CREATE POLICY "owner_full_tracking_access"
  ON referral_tracking FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner'
  ));

-- Affiliate can read tracking for their own ref_codes
CREATE POLICY "affiliate_reads_own_tracking"
  ON referral_tracking FOR SELECT
  USING (
    ref_code IN (
      SELECT ref_code FROM affiliate_referrals WHERE affiliate_id = auth.uid()
    )
  );

-- ─── 2. SHARE ANALYTICS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS share_analytics (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ref_code             TEXT REFERENCES affiliate_referrals(ref_code) ON DELETE SET NULL,
  total_shares         INTEGER NOT NULL DEFAULT 0,
  total_clicks         INTEGER NOT NULL DEFAULT 0,
  total_registrations  INTEGER NOT NULL DEFAULT 0,
  total_payments       INTEGER NOT NULL DEFAULT 0,
  total_rewards        NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_shared_at       TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(affiliate_id, ref_code)
);

CREATE INDEX IF NOT EXISTS idx_share_analytics_affiliate ON share_analytics(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_tenant    ON share_analytics(tenant_id);

ALTER TABLE share_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_reads_own_analytics"
  ON share_analytics FOR SELECT USING (affiliate_id = auth.uid());

CREATE POLICY "owner_full_analytics_access"
  ON share_analytics FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner'
  ));

CREATE POLICY "tenant_admin_reads_analytics"
  ON share_analytics FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

COMMENT ON TABLE referral_tracking IS 'Immutable event log for every referral click, registration, and payment tied to an affiliate ref_code.';
COMMENT ON TABLE share_analytics    IS 'Aggregated share/conversion statistics per affiliate ref_code. Updated by trigger after each tracking event.';
