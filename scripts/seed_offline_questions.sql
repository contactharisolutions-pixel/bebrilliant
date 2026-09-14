DO $$
DECLARE
    v_tenant_id uuid := '5cccb9be-5b4a-4143-8725-bc6061e337fa'; -- Silver Bells School
    v_exam1 uuid := '55555555-eeee-5555-eeee-555555555551';
    v_exam2 uuid := '55555555-eeee-5555-eeee-555555555552';
    v_exam3 uuid := '55555555-eeee-5555-eeee-555555555553';
    v_exam4 uuid := '55555555-eeee-5555-eeee-555555555554';

    q1 uuid := '77777777-1111-7777-1111-777777777771';
    q2 uuid := '77777777-1111-7777-1111-777777777772';
    q3 uuid := '77777777-1111-7777-1111-777777777773';
    q4 uuid := '77777777-1111-7777-1111-777777777774';
    q5 uuid := '77777777-1111-7777-1111-777777777775';
    q6 uuid := '77777777-1111-7777-1111-777777777776';
    q7 uuid := '77777777-1111-7777-1111-777777777777';
    q8 uuid := '77777777-1111-7777-1111-777777777778';
    q9 uuid := '77777777-1111-7777-1111-777777777779';
    q10 uuid := '77777777-1111-7777-1111-777777777710';
BEGIN
    -- 1. Insert rich bilingual questions across multiple subjects
    INSERT INTO questions (id, tenant_id, type, sub_type, difficulty, question_text, options, correct_answer, explanation, marks, source, created_by, created_at)
    VALUES
    (q1, v_tenant_id, 'objective', 'mcq', 'easy',
     '{"en": "What is the discriminant of the quadratic equation 2x² - 4x + 3 = 0?", "gu": "દ્વિઘાત સમીકરણ 2x² - 4x + 3 = 0 નો વિવેચક કેટલો થાય?"}'::jsonb,
     '{"A": "-8", "B": "8", "C": "-4", "D": "12"}'::jsonb,
     '"A"'::jsonb,
     '{"en": "D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8. Since D < 0, the equation has no real roots."}'::jsonb,
     1, 'manual', NULL, NOW()),

    (q2, v_tenant_id, 'objective', 'mcq', 'medium',
     '{"en": "The sum of the first n terms of an AP is given by Sn = 3n² + 5n. Find its 10th term.", "gu": "જો સમાંતર શ્રેણીના પ્રથમ n પદોનો સરવાળો Sn = 3n² + 5n હોય, તો તેનું 10મું પદ શોધો."}'::jsonb,
     '{"A": "58", "B": "62", "C": "64", "D": "56"}'::jsonb,
     '"B"'::jsonb,
     '{"en": "a_n = S_n - S_{n-1} = (3n² + 5n) - (3(n-1)² + 5(n-1)) = 6n + 2. For n = 10, a_10 = 6(10) + 2 = 62."}'::jsonb,
     2, 'manual', NULL, NOW()),

    (q3, v_tenant_id, 'subjective', 'descriptive', 'medium',
     '{"en": "Prove that √5 is an irrational number using the method of contradiction.", "gu": "વિરોધાભાસની રીતથી સાબિત કરો કે √5 અસંમેય સંખ્યા છે."}'::jsonb,
     '{}'::jsonb,
     '"Proof"'::jsonb,
     '{"en": "Assume √5 = a/b where a and b are co-prime integers. Squaring both sides yields 5b² = a², meaning 5 divides a² and hence 5 divides a."}'::jsonb,
     4, 'manual', NULL, NOW()),

    (q4, v_tenant_id, 'subjective', 'descriptive', 'hard',
     '{"en": "State and prove Thales Theorem (Basic Proportionality Theorem) for triangles.", "gu": "ત્રિકોણ માટે થેલ્સનું પ્રમેય (મૂળભૂત સમપ્રમાણતાનું પ્રમેય) લખો અને સાબિત કરો."}'::jsonb,
     '{}'::jsonb,
     '"Proof"'::jsonb,
     '{"en": "If a line is drawn parallel to one side of a triangle intersecting the other two sides in distinct points, then the other two sides are divided in the same ratio."}'::jsonb,
     5, 'manual', NULL, NOW()),

    (q5, v_tenant_id, 'objective', 'mcq', 'easy',
     '{"en": "What is the SI unit of electric potential difference?", "gu": "વિદ્યુત સ્થિતિમાનના તફાવતનો SI એકમ કયો છે?"}'::jsonb,
     '{"A": "Ampere", "B": "Volt", "C": "Ohm", "D": "Joule"}'::jsonb,
     '"B"'::jsonb,
     '{"en": "The SI unit of electric potential difference is Volt (V), named after Alessandro Volta."}'::jsonb,
     1, 'manual', NULL, NOW()),

    (q6, v_tenant_id, 'subjective', 'descriptive', 'medium',
     '{"en": "State Ohm''s Law and derive the formula for equivalent resistance of two resistors connected in parallel.", "gu": "ઓહ્મનો નિયમ લખો અને સમાંતર જોડાણમાં જોડેલા બે અવરોધોના સમતુલ્ય અવરોધનું સૂત્ર તારવો."}'::jsonb,
     '{}'::jsonb,
     '"Derivation"'::jsonb,
     '{"en": "V = IR at constant temperature. For parallel resistors, 1/Rp = 1/R1 + 1/R2."}'::jsonb,
     3, 'manual', NULL, NOW()),

    (q7, v_tenant_id, 'objective', 'mcq', 'medium',
     '{"en": "Which gas is evolved when zinc granules react with dilute sulphuric acid?", "gu": "જ્યારે ઝિંકના દાણા મંદ સલ્ફ્યુરિક એસિડ સાથે પ્રક્રિયા કરે છે ત્યારે કયો વાયુ ઉત્પન્ન થાય છે?"}'::jsonb,
     '{"A": "Oxygen", "B": "Hydrogen", "C": "Sulphur Dioxide", "D": "Carbon Dioxide"}'::jsonb,
     '"B"'::jsonb,
     '{"en": "Zn + H₂SO₄ → ZnSO₄ + H₂↑. Hydrogen gas is evolved and burns with a pop sound."}'::jsonb,
     1, 'manual', NULL, NOW()),

    (q8, v_tenant_id, 'subjective', 'descriptive', 'hard',
     '{"en": "Explain the working principle of an AC Electric Generator with a neatly labeled diagram.", "gu": "સ્વચ્છ નામનિર્દેશિત આકૃતિ સાથે AC ઇલેક્ટ્રિક જનરેટરનો કાર્યકારી સિદ્ધાંત સમજાવો."}'::jsonb,
     '{}'::jsonb,
     '"Descriptive"'::jsonb,
     '{"en": "Principle: Works on Electromagnetic Induction. Rotating coil in a magnetic field produces alternating induced EMF according to Faraday''s Laws."}'::jsonb,
     5, 'manual', NULL, NOW()),

    (q9, v_tenant_id, 'objective', 'mcq', 'easy',
     '{"en": "The process of copying genetic information from one strand of DNA into RNA is known as:", "gu": "DNA ના એક તંતુમાંથી આનુવંશિક માહિતીને RNA માં નકલ કરવાની પ્રક્રિયાને શું કહે છે?"}'::jsonb,
     '{"A": "Translation", "B": "Transcription", "C": "Replication", "D": "Transformation"}'::jsonb,
     '"B"'::jsonb,
     '{"en": "Transcription is the synthesis of RNA from a DNA template mediated by RNA polymerase."}'::jsonb,
     1, 'manual', NULL, NOW()),

    (q10, v_tenant_id, 'subjective', 'descriptive', 'medium',
     '{"en": "Differentiate between Biodegradable and Non-Biodegradable substances with two examples of each.", "gu": "વિઘટનીય અને અવિઘટનીય કચરા વચ્ચેનો તફાવત આપો અને બંનેના બે ઉદાહરણ આપો."}'::jsonb,
     '{}'::jsonb,
     '"Descriptive"'::jsonb,
     '{"en": "Biodegradable substances are decomposed naturally by bacteria/fungi (food waste, paper). Non-biodegradable persist for centuries causing environmental damage (plastics, DDT)."}'::jsonb,
     3, 'manual', NULL, NOW())
    ON CONFLICT (id) DO UPDATE SET question_text = EXCLUDED.question_text, options = EXCLUDED.options, explanation = EXCLUDED.explanation;

    -- 2. Map questions into offline_exam_questions for all 4 seeded offline examinations
    DELETE FROM offline_exam_questions WHERE exam_id IN (v_exam1, v_exam2, v_exam3, v_exam4);

    -- Exam 1: Mathematics OMR Assessment
    INSERT INTO offline_exam_questions (id, exam_id, question_id, question_order, section, is_optional)
    VALUES
    (gen_random_uuid(), v_exam1, q1, 1, 'Section A (Objective)', false),
    (gen_random_uuid(), v_exam1, q2, 2, 'Section A (Objective)', false),
    (gen_random_uuid(), v_exam1, q3, 3, 'Section B (Short Answer)', false),
    (gen_random_uuid(), v_exam1, q4, 4, 'Section C (Long Proof)', false);

    -- Exam 2: STEM & Cyber Talent Search
    INSERT INTO offline_exam_questions (id, exam_id, question_id, question_order, section, is_optional)
    VALUES
    (gen_random_uuid(), v_exam2, q5, 1, 'Section 1: Physics Fundamentals', false),
    (gen_random_uuid(), v_exam2, q6, 2, 'Section 1: Physics Analytical', false),
    (gen_random_uuid(), v_exam2, q7, 3, 'Section 2: Chemistry Insights', false),
    (gen_random_uuid(), v_exam2, q9, 4, 'Section 3: Biological Sciences', false);

    -- Exam 3: CBSE Science Term-1 Mock Paper
    INSERT INTO offline_exam_questions (id, exam_id, question_id, question_order, section, is_optional)
    VALUES
    (gen_random_uuid(), v_exam3, q5, 1, 'Section A: Multiple Choice', false),
    (gen_random_uuid(), v_exam3, q7, 2, 'Section A: Multiple Choice', false),
    (gen_random_uuid(), v_exam3, q6, 3, 'Section B: Short Theory', false),
    (gen_random_uuid(), v_exam3, q8, 4, 'Section C: Extended Diagrammatic', false),
    (gen_random_uuid(), v_exam3, q10, 5, 'Section D: Environmental Science', false);

    -- Exam 4: Senior Physics Weekly Diagnostic
    INSERT INTO offline_exam_questions (id, exam_id, question_id, question_order, section, is_optional)
    VALUES
    (gen_random_uuid(), v_exam4, q5, 1, 'Section A: Core Concepts', false),
    (gen_random_uuid(), v_exam4, q6, 2, 'Section B: Mathematical Derivations', false),
    (gen_random_uuid(), v_exam4, q8, 3, 'Section C: Electromagnetic Systems', false);

END $$;
