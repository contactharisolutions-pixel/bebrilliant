DO $$
DECLARE
    v_tenant_id uuid := '5cccb9be-5b4a-4143-8725-bc6061e337fa';
    v_tmpl1 uuid := 'a1111111-1111-1111-1111-111111111111';
    v_tmpl2 uuid := 'a2222222-2222-2222-2222-222222222222';
    v_tmpl3 uuid := 'a3333333-3333-3333-3333-333333333333';
    v_tmpl4 uuid := 'a4444444-4444-4444-4444-444444444444';
    
    v_sec1 uuid := 'b1111111-1111-1111-1111-111111111111';
    v_sec2 uuid := 'b2222222-2222-2222-2222-222222222222';

    v_exam1 uuid := 'e1111111-1111-1111-1111-111111111111';
    v_exam2 uuid := 'e2222222-2222-2222-2222-222222222222';
    v_exam3 uuid := 'e3333333-3333-3333-3333-333333333333';
    v_exam4 uuid := 'e4444444-4444-4444-4444-444444444444';

    v_q1 uuid := 'c1111111-1111-1111-1111-111111111111';
    v_q2 uuid := 'c2222222-2222-2222-2222-222222222222';
    v_q3 uuid := 'c3333333-3333-3333-3333-333333333333';
    v_q4 uuid := 'c4444444-4444-4444-4444-444444444444';
    v_q5 uuid := 'c5555555-5555-5555-5555-555555555555';

    v_att1 uuid := 'd1111111-1111-1111-1111-111111111111';
    v_att2 uuid := 'd2222222-2222-2222-2222-222222222222';
    v_att3 uuid := 'd3333333-3333-3333-3333-333333333333';
    v_att4 uuid := 'd4444444-4444-4444-4444-444444444444';
BEGIN
    -- 1. SEED PAPER TEMPLATES (BLUEPRINTS)
    INSERT INTO paper_templates (id, name, category, exam_type, duration_minutes, total_marks, instructions, is_active, is_global, description)
    VALUES
    (v_tmpl1, 'CBSE Class 10 Mathematics Term-1 CBT', 'board', 'objective', 90, 40, 
     '["All questions are compulsory objective MCQs.", "Section A: 20 Qs (1 mark each).", "Section B: 20 Qs (1 mark each).", "No negative marking in Term-1."]'::jsonb, 
     true, true, 'Official CBSE Term-1 standardized objective examination blueprint with dual 20-vector sections.'),
    (v_tmpl2, 'JEE Main CBT Physics Speed Drill', 'competitive', 'objective', 60, 100, 
     '["25 objective questions covering Mechanics, Electromagnetism, and Modern Physics.", "+4 marks for correct answer, -1 mark penalty for incorrect option."]'::jsonb, 
     true, true, 'High-intensity engineering entrance speed simulation with negative marking penalty.'),
    (v_tmpl3, 'National STEM & Cyber Olympiad (Stage-1)', 'olympiad', 'objective', 60, 100, 
     '["50 algorithmic, logic, and scientific problem-solving MCQs.", "Higher difficulty weighting for Higher Order Thinking Skills (HOTS)."]'::jsonb, 
     true, true, 'Pan-India inter-school STEM evaluation testing logic, algorithmic reasoning, and applied sciences.'),
    (v_tmpl4, 'NEET Biology Rapid Fire Benchmark', 'medical', 'objective', 45, 180, 
     '["45 NCERT-aligned Botany and Zoology multiple choice vectors.", "+4 marks for correct, -1 mark for negative."]'::jsonb, 
     true, true, 'Pre-medical speed testing designed to evaluate rapid NCERT conceptual recall under strict time constraint.')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, total_marks = EXCLUDED.total_marks;

    -- SEED TEMPLATE SECTIONS & RULES FOR TMPL1
    INSERT INTO template_sections (id, template_id, section_name, section_type, order_index, time_limit_minutes)
    VALUES 
    (v_sec1, v_tmpl1, 'Section A - Core Fundamentals', 'mandatory', 1, 45),
    (v_sec2, v_tmpl1, 'Section B - Applied Geometry & Algebra', 'mandatory', 2, 45)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO section_question_rules (id, section_id, question_type, num_questions, marks_per_question, negative_marks, difficulty_easy_pct, difficulty_medium_pct, difficulty_hard_pct)
    VALUES
    (gen_random_uuid(), v_sec1, 'Single Choice MCQ', 20, 1, 0, 50, 40, 10),
    (gen_random_uuid(), v_sec2, 'Single Choice MCQ', 20, 1, 0, 20, 60, 20)
    ON CONFLICT DO NOTHING;

    -- 2. SEED QUESTIONS IN QUESTIONS TABLE
    INSERT INTO questions (id, tenant_id, type, question_text, options, correct_answer, explanation, difficulty, source)
    VALUES
    (v_q1, v_tenant_id, 'objective', 
     '{"en": "What is the degree of the polynomial P(x) = 4x^4 + 0x^3 + 5x^2 + 7?"}'::jsonb, 
     '["4", "3", "2", "1"]'::jsonb, 
     to_jsonb('4'::text), 
     '{"en": "The highest exponent of the variable with a non-zero coefficient is 4, hence degree is 4."}'::jsonb, 
     'easy', 'manual'),
    (v_q2, v_tenant_id, 'objective', 
     '{"en": "If a pair of linear equations is consistent and dependent, then the lines represented by them are:"}'::jsonb, 
     '["Coincident", "Parallel", "Intersecting at one point", "None of these"]'::jsonb, 
     to_jsonb('Coincident'::text), 
     '{"en": "Dependent consistent linear equations represent identical equations whose graph is coincident lines with infinitely many solutions."}'::jsonb, 
     'medium', 'manual'),
    (v_q3, v_tenant_id, 'objective', 
     '{"en": "A machine learning model trained on historical student performance predicts exam scores. What type of machine learning task is this?"}'::jsonb, 
     '["Regression", "Classification", "Clustering", "Unsupervised Dimensionality Reduction"]'::jsonb, 
     to_jsonb('Regression'::text), 
     '{"en": "Predicting continuous numeric outcomes (e.g., examination scores) is a fundamental regression task."}'::jsonb, 
     'medium', 'manual'),
    (v_q4, v_tenant_id, 'objective', 
     '{"en": "Which sorting algorithm achieves an optimal average-case time complexity of O(n log n) while operating in-place?"}'::jsonb, 
     '["QuickSort / HeapSort", "MergeSort", "BubbleSort", "CountingSort"]'::jsonb, 
     to_jsonb('QuickSort / HeapSort'::text), 
     '{"en": "QuickSort and HeapSort operate in-place with O(n log n) average time complexity, unlike standard MergeSort which requires O(n) auxiliary space."}'::jsonb, 
     'hard', 'manual'),
    (v_q5, v_tenant_id, 'objective', 
     '{"en": "A light ray enters water (n = 1.33) from air (n = 1.00) at an angle of incidence of 30 degrees. The angle of refraction is:"}'::jsonb, 
     '["22.1 degrees", "15.5 degrees", "30.0 degrees", "45.0 degrees"]'::jsonb, 
     to_jsonb('22.1 degrees'::text), 
     '{"en": "By Snells Law: 1.0 * sin(30) = 1.33 * sin(r) => sin(r) = 0.5 / 1.33 = 0.3759 => r = 22.08 degrees."}'::jsonb, 
     'medium', 'manual')
    ON CONFLICT (id) DO NOTHING;

    -- 3. SEED ONLINE EXAMS FOR SILVER BELLS SCHOOL
    INSERT INTO online_exams (id, tenant_id, title, total_marks, duration, pricing_type, price, status, instructions, blueprint, created_at)
    VALUES
    (v_exam1, v_tenant_id, 
     'Midterm AI & Computer Science Assessment', 50, 60, 'free', 0, 'published',
     '["Strict full-screen browser lockdown enabled.", "Tab switches beyond 3 will automatically freeze and submit your attempt.", "Scientific on-screen calculator is permitted.", "Instant AI diagnostic score report upon submission."]'::jsonb,
     '{"target_class": "Class 10", "subject": "Computer Science", "mode": "cbt_proctored", "total_questions": 25, "passing_pct": 40}'::jsonb,
     NOW() - INTERVAL '2 days'),
    (v_exam2, v_tenant_id, 
     'Grade 10 Mathematics Term-1 CBT Simulation', 40, 90, 'free', 0, 'published',
     '["Standard CBSE Objective blueprint with real-time proctoring.", "Attempt all 40 questions.", "No negative marking for this session.", "Review flagged questions before the final timer expires."]'::jsonb,
     '{"target_class": "Class 10", "subject": "Mathematics", "mode": "cbt_proctored", "total_questions": 40, "passing_pct": 35}'::jsonb,
     NOW() - INTERVAL '4 days'),
    (v_exam3, v_tenant_id, 
     'National STEM & Astronomy Talent Search (Stage-1)', 100, 60, 'paid', 250.00, 'published',
     '["Official National Talent Examination.", "Each correct answer awards +4 marks; incorrect penalty -1 mark.", "Biometric web camera monitoring is enforced.", "Top 5% percentile qualifies for Stage-2 Nationals."]'::jsonb,
     '{"target_class": "Class 8-12", "subject": "STEM & Astronomy", "mode": "monetized_olympiad", "total_questions": 25, "passing_pct": 60}'::jsonb,
     NOW() - INTERVAL '10 days'),
    (v_exam4, v_tenant_id, 
     'Weekly Physics Diagnostic: Optics & Wave Mechanics', 25, 30, 'free', 0, 'published',
     '["Diagnostic speed quiz to assess concept retention.", "10 conceptual numericals and 15 theory vectors.", "Auto-grading and detailed explanation solutions available immediately."]'::jsonb,
     '{"target_class": "Class 12", "subject": "Physics", "mode": "diagnostic_drill", "total_questions": 25, "passing_pct": 50}'::jsonb,
     NOW() - INTERVAL '1 day')
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_marks = EXCLUDED.total_marks, status = EXCLUDED.status;

    -- 4. MAP QUESTIONS TO ONLINE EXAMS
    INSERT INTO online_exam_questions (id, exam_id, question_id, section_name, marks, negative_marks)
    VALUES
    (gen_random_uuid(), v_exam1, v_q3, 'Section A - AI Foundations', 2, 0),
    (gen_random_uuid(), v_exam1, v_q4, 'Section B - Algorithms & Data Structures', 2, 0),
    (gen_random_uuid(), v_exam2, v_q1, 'Section A - Polynomials & Number Systems', 1, 0),
    (gen_random_uuid(), v_exam2, v_q2, 'Section B - Linear Systems & Geometry', 1, 0),
    (gen_random_uuid(), v_exam4, v_q5, 'Section A - Optics & Refraction', 1, 0)
    ON CONFLICT DO NOTHING;

    -- 5. SEED ONLINE EXAM ATTEMPTS & TELEMETRY
    INSERT INTO online_exam_attempts (id, exam_id, student_id, start_time, end_time, score, marks_obtained, status, ip_address, device_info, tab_switches, rank_position, percentile_rank)
    VALUES
    (v_att1, v_exam1, 'b0000000-0000-0000-0000-000000000001', 
     NOW() - INTERVAL '1 hour', NOW() - INTERVAL '15 minutes', 46, 46, 'submitted', '103.212.144.18', 'Chrome 128 / Windows 11 (Secure Enclave)', 0, 1, 98.5),
    (v_att2, v_exam1, 'c1ba4bcb-fdee-43d9-9023-594aac5dc6ad', 
     NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '5 minutes', 42, 42, 'submitted', '49.36.128.92', 'Chrome 127 / macOS Sequoia', 1, 2, 92.0),
    (v_att3, v_exam1, '7099e4b5-bb9f-4ff2-8125-4d3081a7a4cd', 
     NOW() - INTERVAL '25 minutes', NULL, 0, 0, 'in_progress', '157.34.88.204', 'Edge 126 / Windows 10', 0, NULL, NULL),
    (v_att4, v_exam3, 'b0000000-0000-0000-0000-000000000001', 
     NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '48 minutes', 88, 88, 'submitted', '103.212.144.18', 'Chrome 128 / Windows 11', 0, 3, 96.4)
    ON CONFLICT (id) DO UPDATE SET score = EXCLUDED.score, status = EXCLUDED.status;

END $$;
