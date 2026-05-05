-- Migration: 042_affiliate_teacher_student_module.sql
-- Description: Affiliate Teacher and Student Modules based on Owner-First architecture.

-- 1. Affiliate Settings per Tenant
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
    enable_affiliate_teacher BOOLEAN DEFAULT false,
    teacher_reward_type TEXT DEFAULT 'percentage' CHECK (teacher_reward_type IN ('percentage', 'flat')),
    teacher_reward_value NUMERIC(10,2) DEFAULT 0,
    teacher_level2_enabled BOOLEAN DEFAULT false,
    teacher_level2_reward_value NUMERIC(10,2) DEFAULT 0,
    teacher_min_withdrawal NUMERIC(10,2) DEFAULT 500,
    teacher_tds_percentage NUMERIC(5,2) DEFAULT 5.0,
    
    enable_affiliate_student BOOLEAN DEFAULT false,
    student_reward_credits NUMERIC(10,2) DEFAULT 0,
    student_max_reward_limit NUMERIC(10,2) DEFAULT 1000,
    student_credit_expiry_days INTEGER DEFAULT 365,
    student_usage_restriction TEXT DEFAULT 'none',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Affiliate Teachers table (Institute Only)
CREATE TABLE IF NOT EXISTS public.affiliate_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    pan_details JSONB,
    aadhar_details JSONB,
    bank_details JSONB, -- Bank Account, IFSC, UPI
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, mobile),
    UNIQUE(tenant_id, email)
);

-- 3. Affiliate Students table
CREATE TABLE IF NOT EXISTS public.affiliate_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id)
);

-- 4. Unified Affiliate Wallet
CREATE TABLE IF NOT EXISTS public.affiliate_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL UNIQUE, -- Logical linking to affiliate_teachers or affiliate_students
    affiliate_type TEXT NOT NULL CHECK (affiliate_type IN ('teacher', 'student')),
    balance NUMERIC(10,2) DEFAULT 0, 
    withdrawable NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Affiliate Transactions Flow
CREATE TABLE IF NOT EXISTS public.affiliate_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL, 
    affiliate_type TEXT NOT NULL CHECK (affiliate_type IN ('teacher', 'student')),
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0, -- original purchase amount
    reward NUMERIC(10,2) NOT NULL DEFAULT 0, -- reward calculated
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'withdrawn', 'failed')),
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Teacher Withdrawal Requests
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.affiliate_teachers(id) ON DELETE CASCADE,
    amount_requested NUMERIC(10,2) NOT NULL,
    tds_deducted NUMERIC(10,2) DEFAULT 0,
    amount_payable NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    bank_reference TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Expand based on actual RBAC logic)
CREATE POLICY "Allow read for tenant admins" ON public.affiliate_settings FOR SELECT USING (true);
CREATE POLICY "Allow read for tenant admins" ON public.affiliate_teachers FOR SELECT USING (true);
CREATE POLICY "Allow read for tenant admins" ON public.affiliate_students FOR SELECT USING (true);
CREATE POLICY "Allow read for tenant admins" ON public.affiliate_wallets FOR SELECT USING (true);
CREATE POLICY "Allow read for tenant admins" ON public.affiliate_transactions FOR SELECT USING (true);
CREATE POLICY "Allow read for tenant admins" ON public.affiliate_withdrawals FOR SELECT USING (true);
