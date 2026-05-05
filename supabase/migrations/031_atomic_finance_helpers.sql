-- ============================================================
-- BrightBoard Phase 31 — Atomic Finance Helpers for Settlements
-- ============================================================

-- 1. MOVE TO PENDING (On Withdrawal Request)
CREATE OR REPLACE FUNCTION move_to_pending_balance(
  p_tenant_id UUID,
  p_amount NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE tenant_wallet
  SET available_balance = available_balance - p_amount,
      pending_payouts = pending_payouts + p_amount,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant wallet not found for ID %', p_tenant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. REFUND PENDING (On Rejection)
CREATE OR REPLACE FUNCTION refund_pending_balance(
  p_tenant_id UUID,
  p_amount NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE tenant_wallet
  SET available_balance = available_balance + p_amount,
      pending_payouts = pending_payouts - p_amount,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. SETTLE PENDING (On Approval/Settled)
-- Usually called when settlement is confirmed
CREATE OR REPLACE FUNCTION settle_pending_balance(
  p_tenant_id UUID,
  p_amount NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE tenant_wallet
  SET pending_payouts = pending_payouts - p_amount,
      total_withdrawn = total_withdrawn + p_amount,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
