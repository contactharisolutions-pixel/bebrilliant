-- ============================================================
-- BrightBoard Phase 22 — Student Wallet & Custom Exam Engine
-- ============================================================

-- 1. STUDENT WALLETS
CREATE TABLE IF NOT EXISTS public.student_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, tenant_id)
);

-- 2. WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.student_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  credits NUMERIC NOT NULL,
  reference_type TEXT, -- 'custom_exam', 'subscription', 'admin_topup'
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENT CUSTOM EXAMS
CREATE TABLE IF NOT EXISTS public.student_custom_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  chapter TEXT,
  topic TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  question_count INTEGER NOT NULL,
  credits_used NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'failed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GENERATED QUESTIONS
CREATE TABLE IF NOT EXISTS public.student_custom_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.student_custom_exams(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL, -- MCQ, subjective
  options JSONB,
  answer TEXT,
  marks NUMERIC DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS POLICIES
ALTER TABLE public.student_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_custom_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_custom_exam_questions ENABLE ROW LEVEL SECURITY;

-- Students can only view their own wallet
CREATE POLICY "student_wallet_self_read" ON public.student_wallets
  FOR SELECT USING (auth.uid() = student_id);

-- Students can view their own transactions
CREATE POLICY "student_transactions_self_read" ON public.student_wallet_transactions
  FOR SELECT USING (auth.uid() = student_id);

-- Students can manage their own custom exams
CREATE POLICY "student_exams_self_manage" ON public.student_custom_exams
  FOR ALL USING (auth.uid() = student_id);

-- Students can read questions for their own exams
CREATE POLICY "student_exam_questions_read" ON public.student_custom_exam_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.student_custom_exams
      WHERE id = student_custom_exam_questions.exam_id
      AND student_id = auth.uid()
    )
  );

-- 6. INDEXING
CREATE INDEX IF NOT EXISTS idx_wallet_student ON public.student_wallets(student_id);
CREATE INDEX IF NOT EXISTS idx_trans_student ON public.student_wallet_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_custom_exam_student ON public.student_custom_exams(student_id);
CREATE INDEX IF NOT EXISTS idx_custom_exam_questions ON public.student_custom_exam_questions(exam_id);
