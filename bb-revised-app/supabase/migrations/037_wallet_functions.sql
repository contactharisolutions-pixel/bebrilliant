-- ============================================================
-- Migration 037: Enrollment Wallet Credit Trigger + Deduction RPC
-- ============================================================

-- ─── 1. AUTO-ASSIGN CREDITS ON STUDENT ENROLLMENT ───────────────────────────
CREATE OR REPLACE FUNCTION assign_enrollment_wallet_credits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_type     TEXT;
  v_free_credits    INTEGER;
  v_first_time_only BOOLEAN;
  v_wallet_exists   BOOLEAN;
BEGIN
  -- Only fires for new student profiles
  IF NEW.role <> 'student' OR NEW.tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get tenant_type
  SELECT tenant_type INTO v_tenant_type
  FROM tenants WHERE id = NEW.tenant_id;

  -- Get credit config for this tenant type
  SELECT free_wallet_credits, COALESCE(first_time_only, TRUE)
  INTO v_free_credits, v_first_time_only
  FROM tenant_type_config
  WHERE tenant_type = v_tenant_type AND is_active = TRUE;

  -- No free credits configured — nothing to do
  IF v_free_credits IS NULL OR v_free_credits <= 0 THEN
    RETURN NEW;
  END IF;

  -- First-time-only guard
  IF v_first_time_only THEN
    SELECT EXISTS (
      SELECT 1 FROM student_wallets WHERE student_id = NEW.id
    ) INTO v_wallet_exists;

    IF v_wallet_exists THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Create or update wallet
  INSERT INTO student_wallets (student_id, tenant_id, free_credits, paid_credits)
  VALUES (NEW.id, NEW.tenant_id, v_free_credits, 0)
  ON CONFLICT (student_id) DO UPDATE
    SET free_credits = student_wallets.free_credits + EXCLUDED.free_credits,
        updated_at   = NOW();

  -- Audit transaction
  INSERT INTO wallet_transactions
    (student_id, tenant_id, credit_type, txn_type, amount, balance_after, source)
  VALUES
    (NEW.id, NEW.tenant_id, 'free', 'credit', v_free_credits, v_free_credits, 'enrollment');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_enrollment_credits ON user_profiles;
CREATE TRIGGER trg_assign_enrollment_credits
  AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION assign_enrollment_wallet_credits();

-- ─── 2. WALLET DEDUCTION RPC (FREE-FIRST PRIORITY) ───────────────────────────
CREATE OR REPLACE FUNCTION deduct_wallet_credits(
  p_student_id UUID,
  p_amount     INTEGER,
  p_source     TEXT    DEFAULT 'exam_fee',
  p_reference  UUID    DEFAULT NULL,
  p_notes      TEXT    DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_wallet      student_wallets%ROWTYPE;
  v_free_deduct INTEGER := 0;
  v_paid_deduct INTEGER := 0;
  v_new_balance INTEGER;
BEGIN
  SELECT * INTO v_wallet
  FROM student_wallets WHERE student_id = p_student_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF v_wallet.total_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient wallet balance',
      'balance', v_wallet.total_balance,
      'required', p_amount
    );
  END IF;

  -- Free-first deduction
  v_free_deduct := LEAST(v_wallet.free_credits, p_amount);
  v_paid_deduct := p_amount - v_free_deduct;
  v_new_balance := v_wallet.total_balance - p_amount;

  -- Update wallet
  UPDATE student_wallets
  SET free_credits = free_credits - v_free_deduct,
      paid_credits = paid_credits - v_paid_deduct,
      updated_at   = NOW()
  WHERE student_id = p_student_id;

  -- Audit free deduction
  IF v_free_deduct > 0 THEN
    INSERT INTO wallet_transactions
      (student_id, tenant_id, credit_type, txn_type, amount, balance_after, source, reference_id, notes)
    VALUES
      (p_student_id, v_wallet.tenant_id, 'free', 'debit',
       v_free_deduct, v_new_balance + v_paid_deduct, p_source, p_reference, p_notes);
  END IF;

  -- Audit paid deduction
  IF v_paid_deduct > 0 THEN
    INSERT INTO wallet_transactions
      (student_id, tenant_id, credit_type, txn_type, amount, balance_after, source, reference_id, notes)
    VALUES
      (p_student_id, v_wallet.tenant_id, 'paid', 'debit',
       v_paid_deduct, v_new_balance, p_source, p_reference, p_notes);
  END IF;

  RETURN jsonb_build_object(
    'success',       true,
    'free_deducted', v_free_deduct,
    'paid_deducted', v_paid_deduct,
    'balance_after', v_new_balance
  );
END;
$$;

-- ─── 3. CREDIT TOPUP RPC (for recharges) ──────────────────────────────────────
CREATE OR REPLACE FUNCTION credit_wallet(
  p_student_id  UUID,
  p_amount      INTEGER,
  p_credit_type TEXT    DEFAULT 'paid',   -- 'paid' for recharges, 'free' for manual grants
  p_source      TEXT    DEFAULT 'recharge',
  p_reference   UUID    DEFAULT NULL,
  p_notes       TEXT    DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id   UUID;
  v_new_balance INTEGER;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM student_wallets WHERE student_id = p_student_id;

  IF NOT FOUND THEN
    -- Auto-create wallet if missing
    SELECT tenant_id INTO v_tenant_id FROM user_profiles WHERE id = p_student_id;
    INSERT INTO student_wallets (student_id, tenant_id, free_credits, paid_credits)
    VALUES (p_student_id, v_tenant_id, 0, 0);
  END IF;

  -- Credit the right balance
  IF p_credit_type = 'free' THEN
    UPDATE student_wallets
    SET free_credits = free_credits + p_amount, updated_at = NOW()
    WHERE student_id = p_student_id
    RETURNING total_balance INTO v_new_balance;
  ELSE
    UPDATE student_wallets
    SET paid_credits = paid_credits + p_amount, updated_at = NOW()
    WHERE student_id = p_student_id
    RETURNING total_balance INTO v_new_balance;
  END IF;

  INSERT INTO wallet_transactions
    (student_id, tenant_id, credit_type, txn_type, amount, balance_after, source, reference_id, notes)
  VALUES
    (p_student_id, v_tenant_id, p_credit_type, 'credit', p_amount, v_new_balance, p_source, p_reference, p_notes);

  RETURN jsonb_build_object('success', true, 'balance_after', v_new_balance);
END;
$$;

COMMENT ON FUNCTION assign_enrollment_wallet_credits IS
  'Trigger function: auto-assigns free wallet credits to new students based on their tenant type config.';
COMMENT ON FUNCTION deduct_wallet_credits IS
  'Deducts credits from a student wallet using free-first priority. Returns split of free vs paid deducted.';
COMMENT ON FUNCTION credit_wallet IS
  'Adds free or paid credits to a student wallet and logs the transaction.';
