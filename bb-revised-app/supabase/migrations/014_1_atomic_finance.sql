-- ============================================================
-- BrightBoard Phase 14.1 — Atomic Finance Operations
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION process_payment_atomic(
  p_payment_id      UUID,
  p_razorpay_id     TEXT,
  p_owner_amount    NUMERIC,
  p_tenant_amount   NUMERIC,
  p_commission_pct  NUMERIC,
  p_tenant_id       UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Update Payment Status & IDs
    UPDATE payments 
    SET status = 'success',
        razorpay_payment_id = p_razorpay_id,
        updated_at = NOW()
    WHERE id = p_payment_id;

    -- 2. Record Transaction Split
    INSERT INTO payment_splits (payment_id, owner_amount, tenant_amount, commission_percentage)
    VALUES (p_payment_id, p_owner_amount, p_tenant_amount, p_commission_pct);

    -- 3. Update Owner Wallet (Total Rev + Commission)
    UPDATE owner_wallet
    SET total_balance = total_balance + (p_owner_amount + p_tenant_amount),
        commission_earned = commission_earned + p_owner_amount,
        updated_at = NOW();

    -- 4. Update Tenant Wallet (Available for payout)
    -- This handles the split where tenant gets the remainder
    INSERT INTO tenant_wallet (tenant_id, available_balance, last_updated)
    VALUES (p_tenant_id, p_tenant_amount, NOW())
    ON CONFLICT (tenant_id) DO UPDATE
    SET available_balance = tenant_wallet.available_balance + EXCLUDED.available_balance,
        last_updated = NOW();
END;
$$;
