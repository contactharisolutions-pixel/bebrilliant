-- 1. ONLINE EXAM QUESTIONS MAPPING
CREATE TABLE IF NOT EXISTS public.online_exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    section_name TEXT,
    marks NUMERIC NOT NULL DEFAULT 1,
    negative_marks NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, question_id)
);

-- 2. STUDENT ATTEMPTS
CREATE TABLE IF NOT EXISTS public.online_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.online_exams(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    score NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'evaluated')),
    ip_address TEXT,
    device_info TEXT,
    tab_switches INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENT ANSWERS
CREATE TABLE IF NOT EXISTS public.online_exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.online_exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option TEXT, -- e.g. 'A'
    is_correct BOOLEAN,
    time_taken_seconds INTEGER, -- For time-based ranking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- 4. RLS
ALTER TABLE public.online_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exam_answers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "tenant_read_online_exam_qs" ON public.online_exam_questions FOR SELECT USING (true); -- Public/Tenant controlled by app
CREATE POLICY "student_manage_own_attempts" ON public.online_exam_attempts FOR ALL USING (student_id = auth.uid());
CREATE POLICY "teacher_read_attempts" ON public.online_exam_attempts FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('teacher', 'tenant_admin', 'owner')));
CREATE POLICY "student_manage_own_answers" ON public.online_exam_answers FOR ALL USING (attempt_id IN (SELECT id FROM online_exam_attempts WHERE student_id = auth.uid()));
