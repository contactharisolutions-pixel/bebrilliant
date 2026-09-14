-- Setup and Seed Data for Answer Sheet Checking & Grading Hub
-- Tenant: 5cccb9be-5b4a-4143-8725-bc6061e337fa

ALTER TABLE public.answer_sheet_uploads DROP CONSTRAINT IF EXISTS answer_sheet_uploads_status_check;
ALTER TABLE public.answer_sheet_uploads ADD CONSTRAINT answer_sheet_uploads_status_check 
    CHECK (status = ANY (ARRAY['pending'::text, 'review'::text, 'processing'::text, 'completed'::text, 'failed'::text]));

DO $$
DECLARE
    tid UUID := '5cccb9be-5b4a-4143-8725-bc6061e337fa';
    exam_math UUID := '55555555-eeee-5555-eeee-555555555551';
    exam_science UUID := '55555555-eeee-5555-eeee-555555555553';
    exam_physics UUID := '55555555-eeee-5555-eeee-555555555554';
    
    student_aarav UUID := 'b1000000-0000-0000-0000-000000000001';
    student_diya UUID := 'b1000000-0000-0000-0000-000000000002';
    student_rohan UUID := 'b1000000-0000-0000-0000-000000000003';
    student_ananya UUID := 'b1000000-0000-0000-0000-000000000004';
    student_siddharth UUID := 'b1000000-0000-0000-0000-000000000005';
    
    up1 UUID := 'a1111111-0000-0000-0000-000000000001';
    up2 UUID := 'a1111111-0000-0000-0000-000000000002';
    up3 UUID := 'a1111111-0000-0000-0000-000000000003';
    up4 UUID := 'a1111111-0000-0000-0000-000000000004';
    up5 UUID := 'a1111111-0000-0000-0000-000000000005';
BEGIN
    -- 1. Ensure answer_sheet_uploads table has required helper columns
    ALTER TABLE public.answer_sheet_uploads 
        ADD COLUMN IF NOT EXISTS awarded_marks NUMERIC(6, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS max_marks NUMERIC(6, 2) DEFAULT 50,
        ADD COLUMN IF NOT EXISTS percentage NUMERIC(5, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS grade_badge VARCHAR(10) DEFAULT 'Pending',
        ADD COLUMN IF NOT EXISTS teacher_remarks TEXT,
        ADD COLUMN IF NOT EXISTS evaluated_by VARCHAR(100),
        ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS student_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS class_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS subject_name VARCHAR(100);

    -- 2. Clear previous test uploads for clean state
    DELETE FROM public.answer_sheet_uploads WHERE tenant_id = tid;

    -- 3. Insert realistic answer sheet submissions for the school
    -- Submission 1: Rohan Gupta - Math Exam - AWAITING CHECKING (pending)
    INSERT INTO public.answer_sheet_uploads (
        id, tenant_id, exam_id, student_id, file_url, total_pages, status, processed,
        awarded_marks, max_marks, percentage, grade_badge, teacher_remarks,
        student_name, roll_number, class_name, subject_name, created_at
    ) VALUES (
        up1, tid, exam_math, student_rohan,
        '/assets/images/dashboard/sample_answersheet_math.jpg', 4, 'pending', false,
        0, 50, 0, 'Pending', '',
        'Rohan Gupta', 'Roll 201', 'Grade 10 - Matriculation Board', 'Pure Mathematics & Calculus',
        NOW() - INTERVAL '2 hours'
    );

    -- Submission 2: Ananya Iyer - Math Exam - DRAFTING / IN REVIEW (review)
    INSERT INTO public.answer_sheet_uploads (
        id, tenant_id, exam_id, student_id, file_url, total_pages, status, processed,
        awarded_marks, max_marks, percentage, grade_badge, teacher_remarks,
        evaluated_by, evaluated_at,
        student_name, roll_number, class_name, subject_name, created_at
    ) VALUES (
        up2, tid, exam_math, student_ananya,
        '/assets/images/dashboard/sample_answersheet_math.jpg', 4, 'review', false,
        41.5, 50, 83.0, 'A', 'Good algebraic working. Steps in Question 3 need clearer factorization.',
        'Mrs. Sunita Rao (Senior Mathematics Faculty)', NOW() - INTERVAL '45 minutes',
        'Ananya Iyer', 'Roll 202', 'Grade 10 - Matriculation Board', 'Pure Mathematics & Calculus',
        NOW() - INTERVAL '4 hours'
    );

    -- Submission 3: Aarav Sharma - Science Term-1 - CHECKED & GRADED (completed)
    INSERT INTO public.answer_sheet_uploads (
        id, tenant_id, exam_id, student_id, file_url, total_pages, status, processed,
        awarded_marks, max_marks, percentage, grade_badge, teacher_remarks,
        evaluated_by, evaluated_at,
        student_name, roll_number, class_name, subject_name, created_at
    ) VALUES (
        up3, tid, exam_science, student_aarav,
        '/assets/images/dashboard/sample_answersheet_science.jpg', 6, 'completed', true,
        38.0, 40, 95.0, 'A+', 'Exceptional answer paper! Clear diagrammatic representations and complete chemical equations.',
        'Dr. Rajesh Mehta (Head of Science)', NOW() - INTERVAL '1 hour',
        'Aarav Sharma', 'Roll 101', 'Grade 9 - Foundation Science & Humanities', 'Classical & Quantum Mechanics',
        NOW() - INTERVAL '1 day'
    );

    -- Submission 4: Diya Kapoor - Science Term-1 - CHECKED & GRADED (completed)
    INSERT INTO public.answer_sheet_uploads (
        id, tenant_id, exam_id, student_id, file_url, total_pages, status, processed,
        awarded_marks, max_marks, percentage, grade_badge, teacher_remarks,
        evaluated_by, evaluated_at,
        student_name, roll_number, class_name, subject_name, created_at
    ) VALUES (
        up4, tid, exam_science, student_diya,
        '/assets/images/dashboard/sample_answersheet_science.jpg', 5, 'completed', true,
        34.5, 40, 86.25, 'A', 'Very well attempted. Revise Newton third law derivation and units consistency.',
        'Dr. Rajesh Mehta (Head of Science)', NOW() - INTERVAL '3 hours',
        'Diya Kapoor', 'Roll 102', 'Grade 9 - Foundation Science & Humanities', 'Classical & Quantum Mechanics',
        NOW() - INTERVAL '1 day'
    );

    -- Submission 5: Siddharth Nair - Senior Physics - AWAITING CHECKING (pending)
    INSERT INTO public.answer_sheet_uploads (
        id, tenant_id, exam_id, student_id, file_url, total_pages, status, processed,
        awarded_marks, max_marks, percentage, grade_badge, teacher_remarks,
        student_name, roll_number, class_name, subject_name, created_at
    ) VALUES (
        up5, tid, exam_physics, student_siddharth,
        '/assets/images/dashboard/sample_answersheet_physics.jpg', 3, 'pending', false,
        0, 25, 0, 'Pending', '',
        'Siddharth Nair', 'Roll 401', 'Grade 12 - Senior Scholars & Competitive', 'Classical & Quantum Mechanics',
        NOW() - INTERVAL '5 hours'
    );

    RAISE NOTICE 'Answer sheet grading seed data created successfully.';
END $$;
