-- Migration: 048_enterprise_billing.sql
-- Refactor subscription plans and tenant subscription tracking for enterprise capabilities

-- 1. Create plan addons table
CREATE TABLE IF NOT EXISTS public.plan_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    resource_type TEXT NOT NULL CHECK (resource_type IN ('students', 'teachers', 'storage_gb', 'ai_tokens')),
    resource_value INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for addons
ALTER TABLE public.plan_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of plan addons" ON public.plan_addons FOR SELECT USING (true);

-- 2. Add extra columns to plans table if not present
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER DEFAULT 50;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_ai_tokens INTEGER DEFAULT 1000000;

-- 3. Modify tenant_subscriptions table to support UUID plans reference and custom contract limits
ALTER TABLE public.tenant_subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;
ALTER TABLE public.tenant_subscriptions ADD COLUMN IF NOT EXISTS limit_overrides JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.tenant_subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;
ALTER TABLE public.tenant_subscriptions ADD COLUMN IF NOT EXISTS gateway_subscription_id TEXT;
ALTER TABLE public.tenant_subscriptions ADD COLUMN IF NOT EXISTS gateway_customer_id TEXT;
ALTER TABLE public.tenant_subscriptions ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.tenant_subscriptions ADD COLUMN IF NOT EXISTS discount_applied NUMERIC DEFAULT 0;
ALTER TABLE public.tenant_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add a unique constraint to ensure only one active subscription per tenant
CREATE UNIQUE INDEX IF NOT EXISTS tenant_subscriptions_active_uidx 
ON public.tenant_subscriptions(tenant_id) 
WHERE status = 'active';

-- 4. Create tenant purchased addons table
CREATE TABLE IF NOT EXISTS public.tenant_purchased_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    addon_id UUID REFERENCES public.plan_addons(id) ON DELETE RESTRICT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for tenant purchased addons
ALTER TABLE public.tenant_purchased_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read of own tenant purchased addons" 
    ON public.tenant_purchased_addons FOR SELECT 
    USING (auth.uid() IN (SELECT owner_id FROM public.tenants WHERE id = tenant_id));

-- 5. Add tax, discounts, and invoice tracking to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Seed some default add-ons for platform configuration
INSERT INTO public.plan_addons (name, price, billing_cycle, resource_type, resource_value)
VALUES 
('Extra Teacher Account', 199.00, 'monthly', 'teachers', 1),
('500 Extra Students Block', 499.00, 'monthly', 'students', 500),
('50GB Storage Extension', 299.00, 'monthly', 'storage_gb', 50),
('10 Million AI Tokens pack', 999.00, 'monthly', 'ai_tokens', 10000000)
ON CONFLICT DO NOTHING;
