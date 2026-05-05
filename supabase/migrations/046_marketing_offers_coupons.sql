-- ============================================================
-- Migration 046: Marketing Offers & Coupons Module
-- ============================================================

-- 1. OFFERS TABLE
-- Defines the logic for discounts
CREATE TABLE IF NOT EXISTS marketing_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL means Global (Owner controlled)
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FLAT')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_purchase_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC, -- Max cap for percentage discounts
  applies_to TEXT NOT NULL CHECK (applies_to IN ('EXAM', 'PLAN', 'WALLET', 'ALL')),
  specific_item_id UUID, -- Optional: ID of the specific exam/plan
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COUPONS TABLE
-- Unique codes that link to an offer
CREATE TABLE IF NOT EXISTS marketing_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  offer_id UUID NOT NULL REFERENCES marketing_offers(id) ON DELETE CASCADE,
  max_uses INTEGER DEFAULT 0, -- 0 means unlimited
  current_uses INTEGER DEFAULT 0,
  user_limit INTEGER DEFAULT 1, -- Max uses per user
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(tenant_id, code) -- Code must be unique per tenant
);

-- 3. RLS POLICIES
ALTER TABLE marketing_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_coupons ENABLE ROW LEVEL SECURITY;

-- Offers: Anyone can read active offers, Owners/Admins manage
CREATE POLICY "anyone_read_active_offers" ON marketing_offers
  FOR SELECT USING (is_active = TRUE AND (end_date IS NULL OR end_date > NOW()));

CREATE POLICY "owner_manage_offers" ON marketing_offers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('owner', 'tenant_admin'))
  );

-- Coupons: Authenticated can read (checking validity happens in RPC/API), Owners/Admins manage
CREATE POLICY "authenticated_read_coupons" ON marketing_coupons
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "owner_manage_coupons" ON marketing_coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('owner', 'tenant_admin'))
  );

-- 4. FUNCTIONS: APPLY COUPON logic (To be called from API)
-- This function will be called to validate a coupon and return the discount amount
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_tenant_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_item_type TEXT,
  p_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
  v_offer RECORD;
  v_discount NUMERIC := 0;
  v_user_uses INTEGER;
BEGIN
  -- 1. Find the coupon
  SELECT * INTO v_coupon 
  FROM marketing_coupons 
  WHERE code = p_code 
    AND (tenant_id = p_tenant_id OR tenant_id IS NULL)
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'Invalid or expired coupon code');
  END IF;

  -- 2. Check global use limit
  IF v_coupon.max_uses > 0 AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'Coupon use limit reached');
  END IF;

  -- 3. Check user use limit (Mock: logic would query a usage table, here we assume 1 for now)
  -- For production, we'd need a coupon_redemptions table.
  
  -- 4. Get the offer
  SELECT * INTO v_offer FROM marketing_offers WHERE id = v_coupon.offer_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'Coupon configuration error');
  END IF;

  -- 5. Validate applicability
  IF v_offer.applies_to != 'ALL' AND v_offer.applies_to != p_item_type THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'Coupon not applicable to this item type');
  END IF;

  IF v_offer.specific_item_id IS NOT NULL AND v_offer.specific_item_id != p_item_id THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'Coupon not applicable to this specific item');
  END IF;

  IF p_amount < v_offer.min_purchase_amount THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'Minimum purchase of ' || v_offer.min_purchase_amount || ' required');
  END IF;

  -- 6. Calculate discount
  IF v_offer.discount_type = 'PERCENTAGE' THEN
    v_discount := (p_amount * v_offer.discount_value) / 100;
    IF v_offer.max_discount_amount IS NOT NULL AND v_discount > v_offer.max_discount_amount THEN
      v_discount := v_offer.max_discount_amount;
    END IF;
  ELSE
    v_discount := v_offer.discount_value;
  END IF;

  -- Ensure discount doesn't exceed amount
  IF v_discount > p_amount THEN
    v_discount := p_amount;
  END IF;

  RETURN jsonb_build_object(
    'valid', TRUE,
    'discount_amount', v_discount,
    'offer_name', v_offer.name,
    'coupon_id', v_coupon.id
  );
END;
$$;
