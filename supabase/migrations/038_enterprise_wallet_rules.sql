-- ============================================================
-- Migration 038: Enterprise Wallet Credit Rules & FIFO Grants
-- ============================================================

-- Alter wallet_transactions constraint to support manual_bulk and expiry_reclaim sources
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_source_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_source_check 
  CHECK (source IN ('enrollment', 'exam_fee', 'manual_topup', 'recharge', 'refund', 'expiry', 'manual_bulk', 'expiry_reclaim'));

-- ─── 1. RULES DEFINITIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_credit_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('tenant_type', 'specific_tenant', 'syllabus_enrollment', 'promotional')),
    match_value TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
    expiry_days INTEGER CHECK (expiry_days > 0 OR expiry_days IS NULL),
    first_time_only BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed defaults from tenant_type_config
INSERT INTO public.wallet_credit_rules (name, rule_type, match_value, credits, expiry_days, first_time_only, is_active)
VALUES
  ('Default School Enrollment Grant', 'tenant_type', 'school', 0, NULL, TRUE, TRUE),
  ('Default Institute Enrollment Grant', 'tenant_type', 'institute', 500, NULL, TRUE, TRUE),
  ('Default Independent Teacher Enrollment Grant', 'tenant_type', 'independent_teacher', 200, NULL, TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- ─── 2. FIFO CREDIT GRANT BUCKETS ────────────────────────────
CREATE TABLE IF NOT EXISTS public.free_credit_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.wallet_credit_rules(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    amount_remaining INTEGER NOT NULL CHECK (amount_remaining >= 0),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_free_credit_grants_student_expiry 
  ON public.free_credit_grants(student_id, expires_at);

-- ─── 3. REDEFINE TRIGGERS AND FUNCTIONS ──────────────────────

-- Redefine: assign_enrollment_wallet_credits
CREATE OR REPLACE FUNCTION assign_enrollment_wallet_credits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_type     TEXT;
  v_rule            RECORD;
  v_wallet_exists   BOOLEAN;
  v_expires_at      TIMESTAMPTZ;
  v_total_granted   INTEGER := 0;
BEGIN
  -- Only fires for new student profiles
  IF NEW.role <> 'student' OR NEW.tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get tenant_type
  SELECT tenant_type INTO v_tenant_type
  FROM tenants WHERE id = NEW.tenant_id;

  -- Loop through matching active rules
  FOR v_rule IN 
    SELECT id, name, credits, expiry_days, first_time_only 
    FROM wallet_credit_rules
    WHERE is_active = TRUE 
      AND (
        (rule_type = 'tenant_type' AND match_value = v_tenant_type) OR
        (rule_type = 'specific_tenant' AND match_value = NEW.tenant_id::TEXT)
      )
  LOOP
    -- Skip if credits is zero
    IF v_rule.credits <= 0 THEN
      CONTINUE;
    END IF;

    -- Check first_time_only guard
    IF v_rule.first_time_only THEN
      SELECT EXISTS (
        SELECT 1 FROM free_credit_grants 
        WHERE student_id = NEW.id AND rule_id = v_rule.id
      ) INTO v_wallet_exists;

      IF v_wallet_exists THEN
        CONTINUE;
      END IF;
    END IF;

    -- Calculate expires_at
    v_expires_at := NULL;
    IF v_rule.expiry_days IS NOT NULL THEN
      v_expires_at := NOW() + (v_rule.expiry_days || ' days')::INTERVAL;
    END IF;

    -- Insert free credit grant bucket
    INSERT INTO free_credit_grants (student_id, rule_id, amount, amount_remaining, expires_at)
    VALUES (NEW.id, v_rule.id, v_rule.credits, v_rule.credits, v_expires_at);

    -- Accumulate total credits granted
    v_total_granted := v_total_granted + v_rule.credits;

    -- Audit transaction
    INSERT INTO wallet_transactions
      (student_id, tenant_id, credit_type, txn_type, amount, balance_after, source, notes)
    VALUES
      (NEW.id, NEW.tenant_id, 'free', 'credit', v_rule.credits, 
       COALESCE((SELECT total_balance FROM student_wallets WHERE student_id = NEW.id), 0) + v_rule.credits, 
       'enrollment', 'Granted via rule: ' || v_rule.name);
  END LOOP;

  -- If we granted credits, update or create student_wallets
  IF v_total_granted > 0 THEN
    INSERT INTO student_wallets (student_id, tenant_id, free_credits, paid_credits)
    VALUES (NEW.id, NEW.tenant_id, v_total_granted, 0)
    ON CONFLICT (student_id) DO UPDATE
      SET free_credits = student_wallets.free_credits + EXCLUDED.free_credits,
          updated_at   = NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_enrollment_credits ON user_profiles;
CREATE TRIGGER trg_assign_enrollment_credits
  AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION assign_enrollment_wallet_credits();


-- Redefine: deduct_wallet_credits
CREATE OR REPLACE FUNCTION deduct_wallet_credits(
  p_student_id UUID,
  p_amount     INTEGER,
  p_source     TEXT    DEFAULT 'exam_fee',
  p_reference  UUID    DEFAULT NULL,
  p_notes      TEXT    DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_wallet          student_wallets%ROWTYPE;
  v_free_deduct     INTEGER := 0;
  v_paid_deduct     INTEGER := 0;
  v_needed          INTEGER := p_amount;
  v_grant           RECORD;
  v_bucket_deduct   INTEGER;
  v_new_balance     INTEGER;
  v_available_free  INTEGER := 0;
BEGIN
  -- Lock the wallet row
  SELECT * INTO v_wallet
  FROM student_wallets WHERE student_id = p_student_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Calculate actual available free credits (excluding expired buckets)
  SELECT COALESCE(SUM(amount_remaining), 0) INTO v_available_free
  FROM free_credit_grants
  WHERE student_id = p_student_id 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND amount_remaining > 0;

  -- Verify overall balance (active free + paid)
  IF (v_available_free + v_wallet.paid_credits) < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient wallet balance (expired credits excluded)',
      'balance', v_available_free + v_wallet.paid_credits,
      'required', p_amount
    );
  END IF;

  -- 1. Deduct from active free credits buckets in FIFO order (nulls last)
  FOR v_grant IN
    SELECT id, amount_remaining, expires_at
    FROM free_credit_grants
    WHERE student_id = p_student_id
      AND (expires_at IS NULL OR expires_at > NOW())
      AND amount_remaining > 0
    ORDER BY expires_at ASC NULLS LAST
  LOOP
    IF v_needed <= 0 THEN
      EXIT;
    END IF;

    v_bucket_deduct := LEAST(v_grant.amount_remaining, v_needed);
    
    UPDATE free_credit_grants
    SET amount_remaining = amount_remaining - v_bucket_deduct
    WHERE id = v_grant.id;

    v_free_deduct := v_free_deduct + v_bucket_deduct;
    v_needed := v_needed - v_bucket_deduct;
  END LOOP;

  -- 2. Deduct remaining from paid credits
  IF v_needed > 0 THEN
    v_paid_deduct := v_needed;
    v_needed := 0;
  END IF;

  v_new_balance := (v_available_free + v_wallet.paid_credits) - p_amount;

  -- Update student wallet balance cache
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


-- Redefine: credit_wallet (with custom expiry)
CREATE OR REPLACE FUNCTION credit_wallet(
  p_student_id  UUID,
  p_amount      INTEGER,
  p_credit_type TEXT    DEFAULT 'paid',   -- 'paid' or 'free'
  p_source      TEXT    DEFAULT 'recharge',
  p_reference   UUID    DEFAULT NULL,
  p_notes       TEXT    DEFAULT NULL,
  p_expiry_days INTEGER DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id   UUID;
  v_new_balance INTEGER;
  v_expires_at  TIMESTAMPTZ := NULL;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM student_wallets WHERE student_id = p_student_id;

  IF NOT FOUND THEN
    -- Auto-create wallet if missing
    SELECT tenant_id INTO v_tenant_id FROM user_profiles WHERE id = p_student_id;
    INSERT INTO student_wallets (student_id, tenant_id, free_credits, paid_credits)
    VALUES (p_student_id, v_tenant_id, 0, 0);
  END IF;

  -- If free credits, insert a grant bucket
  IF p_credit_type = 'free' THEN
    IF p_expiry_days IS NOT NULL THEN
      v_expires_at := NOW() + (p_expiry_days || ' days')::INTERVAL;
    END IF;

    INSERT INTO free_credit_grants (student_id, rule_id, amount, amount_remaining, expires_at)
    VALUES (p_student_id, NULL, p_amount, p_amount, v_expires_at);

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


-- New Function: reclaim_expired_wallet_credits
CREATE OR REPLACE FUNCTION reclaim_expired_wallet_credits()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_grant           RECORD;
  v_reclaimed       INTEGER := 0;
  v_total_reclaimed INTEGER := 0;
  v_new_balance     INTEGER;
  v_tenant_id       UUID;
BEGIN
  -- Loop through expired buckets that still have remaining credits
  FOR v_grant IN
    SELECT id, student_id, amount_remaining
    FROM free_credit_grants
    WHERE expires_at <= NOW() AND amount_remaining > 0
  LOOP
    -- Get tenant_id
    SELECT tenant_id INTO v_tenant_id
    FROM student_wallets WHERE student_id = v_grant.student_id;

    -- Deduct from grant remaining
    UPDATE free_credit_grants
    SET amount_remaining = 0
    WHERE id = v_grant.id;

    -- Update student wallet balance cache
    UPDATE student_wallets
    SET free_credits = GREATEST(0, free_credits - v_grant.amount_remaining),
        updated_at   = NOW()
    WHERE student_id = v_grant.student_id
    RETURNING total_balance INTO v_new_balance;

    -- Audit transaction
    INSERT INTO wallet_transactions
      (student_id, tenant_id, credit_type, txn_type, amount, balance_after, source, notes)
    VALUES
      (v_grant.student_id, v_tenant_id, 'free', 'debit', v_grant.amount_remaining, 
       v_new_balance, 'expiry_reclaim', 'Reclaimed expired free credits from grant ' || v_grant.id);

    v_total_reclaimed := v_total_reclaimed + v_grant.amount_remaining;
    v_reclaimed := v_reclaimed + 1;
  END LOOP;

  RETURN v_total_reclaimed;
END;
$$;

COMMENT ON FUNCTION reclaim_expired_wallet_credits IS
  'Scans free_credit_grants for expired credits, deducts them from wallets, and records the transactions.';
