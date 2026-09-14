DO $$
DECLARE
    v_tenant_id uuid := '5cccb9be-5b4a-4143-8725-bc6061e337fa'; -- Silver Bells School
    v_class1 uuid := '07e6c35c-3376-4ced-befb-72f6d292e7cf'; -- Grade 10
    v_class2 uuid := '15c98142-9793-4f64-9fe4-1dbc8111fe81'; -- Grade 12
    v_subject1 uuid := 'cd06490d-f472-4c54-904a-f8be41b078a9'; -- Math
    v_subject2 uuid := 'b99574e6-6795-4536-9e8b-e06d712a4aae'; -- Physics
    v_admin uuid := 'f848f0e5-45f2-43a9-a90e-5f2ef4a4e33e'; -- Divyesh Solanki (Tenant Admin)
    v_ay uuid := '2eb4c558-220d-48df-b588-7b91e96f4e35'; -- 2026-27

    v_tmpl1 uuid := '11111111-aaaa-1111-aaaa-111111111111';
    v_tmpl2 uuid := '22222222-bbbb-2222-bbbb-222222222222';
    v_tmpl3 uuid := '33333333-cccc-3333-cccc-333333333333';
    v_tmpl4 uuid := '44444444-dddd-4444-dddd-444444444444';

    v_exam1 uuid := '55555555-eeee-5555-eeee-555555555551';
    v_exam2 uuid := '55555555-eeee-5555-eeee-555555555552';
    v_exam3 uuid := '55555555-eeee-5555-eeee-555555555553';
    v_exam4 uuid := '55555555-eeee-5555-eeee-555555555554';

    v_upload1 uuid := '66666666-ffff-6666-ffff-666666666661';
    v_upload2 uuid := '66666666-ffff-6666-ffff-666666666662';

    v_student1 uuid := 'b1000000-0000-0000-0000-000000000001'; -- Aarav
    v_student2 uuid := 'b1000000-0000-0000-0000-000000000002'; -- Diya
    v_student3 uuid := 'b1000000-0000-0000-0000-000000000003'; -- Rohan
    v_student4 uuid := 'b1000000-0000-0000-0000-000000000004'; -- Ananya
BEGIN
    -- 1. SEED OMR TEMPLATES (STANDARDIZED BLUEPRINTS)
    INSERT INTO omr_templates (id, tenant_id, name, total_questions, options_per_question, layout_config, is_active)
    VALUES
    (v_tmpl1, v_tenant_id, 'Standard 50-Question Dual Column (CBSE / State Boards)', 50, 4,
     '{"columns": 2, "roll_digits": 8, "has_subject_code": true, "marker_type": "corner_black_squares", "barcode_enabled": true}'::jsonb,
     true),
    (v_tmpl2, v_tenant_id, 'CBSE Class 10 Term-1 40-Bubble Precision Sheet', 40, 4,
     '{"columns": 2, "roll_digits": 7, "has_subject_code": true, "sections": ["Section A (20 Qs)", "Section B (20 Qs)"]}'::jsonb,
     true),
    (v_tmpl3, v_tenant_id, 'JEE Advanced 60-Bubble Multi-Section Matrix', 60, 4,
     '{"columns": 3, "roll_digits": 8, "has_negative_marking": true, "sections": ["Physics (20)", "Chemistry (20)", "Mathematics (20)"]}'::jsonb,
     true),
    (v_tmpl4, v_tenant_id, 'NEET 180-Question Speed Sheet (PCB)', 180, 4,
     '{"columns": 3, "roll_digits": 9, "sections": ["Physics (45)", "Chemistry (45)", "Botany (45)", "Zoology (45)"]}'::jsonb,
     true)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, layout_config = EXCLUDED.layout_config;

    -- 2. SEED PHYSICAL EXAMINATIONS (offline_exams)
    INSERT INTO offline_exams (id, tenant_id, academic_year_id, title, class_id, subject_id, total_questions, omr_template_id, duration, created_by, status, created_at)
    VALUES
    (v_exam1, v_tenant_id, v_ay, 'Grade 10 Midterm Mathematics OMR Assessment', v_class1, v_subject1, 50, v_tmpl1, 90, v_admin, 'published', NOW() - INTERVAL '3 days'),
    (v_exam2, v_tenant_id, v_ay, 'All-India STEM & Cyber Talent Search Bubble Examination', v_class1, v_subject1, 60, v_tmpl3, 60, v_admin, 'completed', NOW() - INTERVAL '5 days'),
    (v_exam3, v_tenant_id, v_ay, 'CBSE Science Term-1 Mock Paper (Physical Sheet)', v_class1, v_subject2, 40, v_tmpl2, 90, v_admin, 'published', NOW() - INTERVAL '1 day'),
    (v_exam4, v_tenant_id, v_ay, 'Senior Physics Weekly Diagnostic OMR Drill', v_class2, v_subject2, 25, v_tmpl1, 30, v_admin, 'completed', NOW() - INTERVAL '7 days')
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_questions = EXCLUDED.total_questions, status = EXCLUDED.status;

    -- 3. SEED OMR UPLOADS (BATCHES)
    INSERT INTO omr_uploads (id, tenant_id, exam_id, uploaded_by, file_url, status, processed_sheets, failed_sheets, error_log, source, template_id, created_at)
    VALUES
    (v_upload1, v_tenant_id, v_exam2, v_admin, 'https://bebrilliant.in/storage/omr_batches/stem_talent_batch_01.pdf', 'completed', 76, 0, '[]'::jsonb, 'bulk', v_tmpl3, NOW() - INTERVAL '4 days'),
    (v_upload2, v_tenant_id, v_exam4, v_admin, 'https://bebrilliant.in/storage/omr_batches/physics_drill_batch_02.pdf', 'completed', 52, 0, '[]'::jsonb, 'mobile', v_tmpl1, NOW() - INTERVAL '6 days')
    ON CONFLICT (id) DO UPDATE SET processed_sheets = EXCLUDED.processed_sheets, status = EXCLUDED.status;

    -- 4. SEED SAMPLE SCANNED OMR SHEETS
    INSERT INTO omr_sheets (id, tenant_id, exam_id, student_id, seat_number, barcode, shuffle_seed, created_at)
    VALUES
    (gen_random_uuid(), v_tenant_id, v_exam2, v_student1, 'SEAT-101', 'BC-STEM-101', 'SEED_A', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), v_tenant_id, v_exam2, v_student2, 'SEAT-102', 'BC-STEM-102', 'SEED_B', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), v_tenant_id, v_exam2, v_student3, 'SEAT-103', 'BC-STEM-103', 'SEED_C', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), v_tenant_id, v_exam4, v_student1, 'SEAT-201', 'BC-PHY-201', 'SEED_A', NOW() - INTERVAL '6 days')
    ON CONFLICT DO NOTHING;

    -- 5. SEED OMR RESPONSES & MARKS
    INSERT INTO omr_responses (id, tenant_id, exam_id, student_id, question_no, selected_option, is_correct, confidence, marks, created_at)
    VALUES
    (gen_random_uuid(), v_tenant_id, v_exam2, v_student1, 1, 'B', true, 99.6, 4, NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), v_tenant_id, v_exam2, v_student1, 2, 'A', true, 99.8, 4, NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), v_tenant_id, v_exam2, v_student1, 3, 'C', true, 99.4, 4, NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), v_tenant_id, v_exam2, v_student2, 1, 'B', true, 99.2, 4, NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), v_tenant_id, v_exam2, v_student2, 2, 'C', false, 98.9, -1, NOW() - INTERVAL '4 days')
    ON CONFLICT DO NOTHING;

END $$;
