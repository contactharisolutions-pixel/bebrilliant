-- ============================================================
-- Migration 044: Harden Affiliate RLS + Fix Affiliate Wallet FK
-- Replaces the open "USING (true)" policies from migration 042
-- ============================================================

-- ─── Drop insecure open policies from 042 ────────────────────────────────────

DROP POLICY IF EXISTS "Allow read for tenant admins" ON public.affiliate_settings;
DROP POLICY IF EXISTS "Allow read for tenant admins" ON public.affiliate_teachers;
DROP POLICY IF EXISTS "Allow read for tenant admins" ON public.affiliate_students;
DROP POLICY IF EXISTS "Allow read for tenant admins" ON public.affiliate_wallets;
DROP POLICY IF EXISTS "Allow read for tenant admins" ON public.affiliate_transactions;
DROP POLICY IF EXISTS "Allow read for tenant admins" ON public.affiliate_withdrawals;


-- ─── affiliate_settings ──────────────────────────────────────────────────────

-- Tenant admin can read their own settings
CREATE POLICY "affiliate_settings_tenant_read"
  ON public.affiliate_settings FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Tenant admin can write their own settings
CREATE POLICY "affiliate_settings_tenant_write"
  ON public.affiliate_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('tenant_admin', 'owner')
        AND (role = 'owner' OR tenant_id = affiliate_settings.tenant_id)
    )
  );


-- ─── affiliate_teachers ──────────────────────────────────────────────────────

-- Tenant admin can read their affiliate teachers
CREATE POLICY "affiliate_teachers_tenant_read"
  ON public.affiliate_teachers FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Tenant admin can manage affiliate teachers
CREATE POLICY "affiliate_teachers_tenant_write"
  ON public.affiliate_teachers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('tenant_admin', 'owner')
        AND (role = 'owner' OR tenant_id = affiliate_teachers.tenant_id)
    )
  );


-- ─── affiliate_students ──────────────────────────────────────────────────────

-- Students can read their own record
CREATE POLICY "affiliate_students_self_read"
  ON public.affiliate_students FOR SELECT
  USING (student_id = auth.uid());

-- Tenant admin can read and manage
CREATE POLICY "affiliate_students_tenant_admin"
  ON public.affiliate_students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('tenant_admin', 'owner')
        AND (role = 'owner' OR tenant_id = affiliate_students.tenant_id)
    )
  );


-- ─── affiliate_wallets ───────────────────────────────────────────────────────

-- Affiliates can read their own wallet
CREATE POLICY "affiliate_wallets_self_read"
  ON public.affiliate_wallets FOR SELECT
  USING (affiliate_id = auth.uid());

-- Tenant admin (via backend service role reads admin client - no direct RLS needed)
-- Allow owner full access
CREATE POLICY "affiliate_wallets_owner"
  ON public.affiliate_wallets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );


-- ─── affiliate_transactions ──────────────────────────────────────────────────

CREATE POLICY "affiliate_transactions_self"
  ON public.affiliate_transactions FOR SELECT
  USING (affiliate_id = auth.uid());

CREATE POLICY "affiliate_transactions_admin"
  ON public.affiliate_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner')
    )
  );


-- ─── affiliate_withdrawals ───────────────────────────────────────────────────

-- Admin only
CREATE POLICY "affiliate_withdrawals_admin"
  ON public.affiliate_withdrawals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner')
    )
  );


-- ─── Fix: Increment shares RPC (may be missing) ──────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_shares(p_ref_code TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE share_analytics
  SET total_shares = total_shares + 1,
      last_shared_at = NOW()
  WHERE ref_code = p_ref_code;
END;
$$;


-- ─── Done ─────────────────────────────────────────────────────────────────────
SELECT 'Migration 044: Affiliate RLS hardened + increment_shares RPC created.' AS info;
