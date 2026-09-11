-- ============================================================
-- Migration 052 — Add Separate Yearly Discounted Pricing to Plans
-- ============================================================

ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS yearly_price NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.plans.yearly_price IS 'Yearly discounted price in INR. If null, defaults to 12x monthly price or monthly only.';

-- Seed reasonable initial yearly discounted prices for existing plans (~2 months free / ~16-17% off)
UPDATE public.plans 
SET yearly_price = CASE 
    WHEN price = 1999 THEN 19990     -- Solo Tutor: save ₹3,998/yr (~17% off)
    WHEN price = 4999 THEN 49990     -- Starter: save ₹9,998/yr (~17% off)
    WHEN price = 14999 THEN 149990   -- Pro: save ₹29,998/yr (~17% off)
    WHEN price = 49999 THEN 499990   -- Enterprise: save ₹99,998/yr (~17% off)
    ELSE ROUND(price * 10)            -- Default 10 months price (2 months free)
END
WHERE yearly_price IS NULL AND price > 0;
