-- ============================================================
-- BrightBoard Phase 23 — Student Wallet Recharge (Razorpay)
-- ============================================================

-- 1. CREDIT PACKAGES
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  credits NUMERIC NOT NULL,
  bonus NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WALLET RECHARGE ORDERS
CREATE TABLE IF NOT EXISTS public.wallet_recharge_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.credit_packages(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  credits NUMERIC NOT NULL,
  razorpay_order_id TEXT UNIQUE,
  payment_id TEXT UNIQUE,
  signature TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'captured', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. UPDATE WALLET TRIGGER
ALTER TABLE public.student_wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. RLS POLICIES
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_recharge_orders ENABLE ROW LEVEL SECURITY;

-- Everyone can read active credit packages
CREATE POLICY "public_read_active_packages" ON public.credit_packages
  FOR SELECT USING (is_active = true);

-- Students can read their own recharge orders
CREATE POLICY "student_read_self_orders" ON public.wallet_recharge_orders
  FOR SELECT USING (auth.uid() = student_id);

-- 5. INDEXING
CREATE INDEX IF NOT EXISTS idx_recharge_student ON public.wallet_recharge_orders(student_id);
CREATE INDEX IF NOT EXISTS idx_recharge_order_id ON public.wallet_recharge_orders(razorpay_order_id);

-- 6. SEED PACKAGES
INSERT INTO public.credit_packages (name, price, credits, bonus) VALUES
  ('Starter', 99, 100, 0),
  ('Basic', 199, 220, 20),
  ('Pro', 499, 600, 100),
  ('Premium', 999, 1300, 300)
ON CONFLICT DO NOTHING;
