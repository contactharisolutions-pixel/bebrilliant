-- ============================================================
-- Migration 041: Referral Reward Trigger + Analytics Updater
-- ============================================================

-- ─── 1. UPDATE SHARE ANALYTICS ON TRACKING EVENT ─────────────────────────────
CREATE OR REPLACE FUNCTION update_share_analytics()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_affiliate_id UUID;
  v_tenant_id    UUID;
BEGIN
  -- Get affiliate from ref_code
  SELECT ar.affiliate_id, ar.tenant_id
  INTO v_affiliate_id, v_tenant_id
  FROM affiliate_referrals ar WHERE ar.ref_code = NEW.ref_code;

  IF v_affiliate_id IS NULL THEN RETURN NEW; END IF;

  -- Upsert analytics row
  INSERT INTO share_analytics (affiliate_id, tenant_id, ref_code)
  VALUES (v_affiliate_id, v_tenant_id, NEW.ref_code)
  ON CONFLICT (affiliate_id, ref_code) DO NOTHING;

  -- Increment correct counter
  IF NEW.event_type = 'click' THEN
    UPDATE share_analytics
    SET total_clicks = total_clicks + 1, updated_at = NOW()
    WHERE affiliate_id = v_affiliate_id AND ref_code = NEW.ref_code;

  ELSIF NEW.event_type = 'registration' THEN
    UPDATE share_analytics
    SET total_registrations = total_registrations + 1, updated_at = NOW()
    WHERE affiliate_id = v_affiliate_id AND ref_code = NEW.ref_code;

  ELSIF NEW.event_type = 'payment' THEN
    UPDATE share_analytics
    SET total_payments = total_payments + 1, updated_at = NOW()
    WHERE affiliate_id = v_affiliate_id AND ref_code = NEW.ref_code;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_share_analytics ON referral_tracking;
CREATE TRIGGER trg_update_share_analytics
  AFTER INSERT ON referral_tracking
  FOR EACH ROW EXECUTE FUNCTION update_share_analytics();

-- ─── 2. PROCESS AFFILIATE REWARD ON PAYMENT ───────────────────────────────────
CREATE OR REPLACE FUNCTION process_affiliate_reward(
  p_registered_user UUID,
  p_payment_id      UUID,
  p_exam_id         UUID DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tracking      referral_tracking%ROWTYPE;
  v_referral      affiliate_referrals%ROWTYPE;
  v_reward_amount NUMERIC(10,2);
BEGIN
  -- Find a pending payment-eligible tracking row for this user
  SELECT rt.* INTO v_tracking
  FROM referral_tracking rt
  JOIN affiliate_referrals ar ON ar.ref_code = rt.ref_code
  WHERE rt.registered_user = p_registered_user
    AND rt.reward_status = 'pending'
    AND rt.event_type    = 'registration'
    AND ar.is_active     = TRUE
    AND (ar.expires_at IS NULL OR ar.expires_at > NOW())
    AND (p_exam_id IS NULL OR ar.exam_id = p_exam_id)
  ORDER BY rt.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_pending_referral');
  END IF;

  -- Get referral details
  SELECT * INTO v_referral
  FROM affiliate_referrals WHERE ref_code = v_tracking.ref_code;

  -- Anti-fraud: block self-referral
  IF v_referral.affiliate_id = p_registered_user THEN
    UPDATE referral_tracking
    SET reward_status = 'fraud', fraud_reason = 'self_referral'
    WHERE id = v_tracking.id;
    RETURN jsonb_build_object('success', false, 'reason', 'self_referral_blocked');
  END IF;

  -- Only credit reward for per_payment type
  IF v_referral.reward_type = 'per_payment' THEN
    v_reward_amount := v_referral.reward_amount;

    -- Credit affiliate wallet (free credits as reward)
    IF v_reward_amount > 0 THEN
      PERFORM credit_wallet(
        v_referral.affiliate_id,
        v_reward_amount::INTEGER,
        'free',
        'affiliate_reward',
        p_payment_id,
        'Affiliate referral reward'
      );
    END IF;

    -- Update analytics total_rewards
    UPDATE share_analytics
    SET total_rewards = total_rewards + v_reward_amount,
        updated_at    = NOW()
    WHERE affiliate_id = v_referral.affiliate_id
      AND ref_code     = v_tracking.ref_code;
  END IF;

  -- Mark tracking as credited + log payment event
  UPDATE referral_tracking
  SET reward_status = 'credited', payment_id = p_payment_id
  WHERE id = v_tracking.id;

  INSERT INTO referral_tracking (ref_code, event_type, registered_user, payment_id, reward_status)
  VALUES (v_tracking.ref_code, 'payment', p_registered_user, p_payment_id, 'credited');

  RETURN jsonb_build_object(
    'success',        true,
    'affiliate_id',   v_referral.affiliate_id,
    'reward_amount',  v_reward_amount,
    'ref_code',       v_tracking.ref_code
  );
END;
$$;

-- ─── 3. REF CODE GENERATOR FUNCTION ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_ref_code(p_type TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_prefix TEXT;
  v_code   TEXT;
  v_exists BOOLEAN;
BEGIN
  v_prefix := CASE p_type
    WHEN 'teacher' THEN 'AT'
    WHEN 'student' THEN 'AS'
    ELSE 'AR'
  END;

  LOOP
    -- Generate 6 random alphanumeric chars
    v_code := v_prefix || upper(substring(md5(random()::text) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM affiliate_referrals WHERE ref_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$;

COMMENT ON FUNCTION update_share_analytics IS 'Trigger: increments share_analytics counters on each referral_tracking INSERT.';
COMMENT ON FUNCTION process_affiliate_reward IS 'Called after payment confirmation. Validates referral, runs anti-fraud, credits affiliate wallet, updates analytics.';
COMMENT ON FUNCTION generate_ref_code IS 'Generates a unique, collision-free referral code with type prefix (AT/AS).';
