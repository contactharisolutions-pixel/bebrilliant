-- Script to ensure Owner Published Master Syllabuses (CBSE, GSEB, ICSE)
-- Published by Platform Owner (tenant_id IS NULL, type = 'board')

DO $$
DECLARE
    cbse_board_id UUID;
    icse_board_id UUID;
    class_id UUID;
    subject_id UUID;
    chapter_id UUID;
BEGIN
    -- 1. Check if CBSE Master Board exists, if not create it
    SELECT id INTO cbse_board_id FROM public.syllabus_nodes WHERE type = 'board' AND tenant_id IS NULL AND name ILIKE '%CBSE%' LIMIT 1;
    
    IF cbse_board_id IS NULL THEN
        INSERT INTO public.syllabus_nodes (name, type, tenant_id, is_active, order_index)
        VALUES ('Central Board of Secondary Education (CBSE)', 'board', NULL, true, 1)
        RETURNING id INTO cbse_board_id;
        
        -- Seed Class 9 & Class 10 CBSE Core Subjects
        -- Class 9
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Class 9', 'class', cbse_board_id, NULL, true, 9)
        RETURNING id INTO class_id;
        
        -- Mathematics
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Mathematics', 'subject', class_id, NULL, true, 1)
        RETURNING id INTO subject_id;
        
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Number Systems', 'chapter', subject_id, NULL, true, 1) RETURNING id INTO chapter_id;
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Real Numbers and their Decimal Expansions', 'topic', chapter_id, NULL, true, 1);
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Operations on Real Numbers & Laws of Exponents', 'topic', chapter_id, NULL, true, 2);

        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Polynomials', 'chapter', subject_id, NULL, true, 2) RETURNING id INTO chapter_id;
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Polynomials in One Variable & Factor Theorem', 'topic', chapter_id, NULL, true, 1);
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Algebraic Identities and Factorisation', 'topic', chapter_id, NULL, true, 2);

        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Linear Equations in Two Variables', 'chapter', subject_id, NULL, true, 3) RETURNING id INTO chapter_id;
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Solutions of a Linear Equation', 'topic', chapter_id, NULL, true, 1);

        -- Science
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Science', 'subject', class_id, NULL, true, 2)
        RETURNING id INTO subject_id;
        
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Matter in Our Surroundings', 'chapter', subject_id, NULL, true, 1) RETURNING id INTO chapter_id;
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Physical Nature of Matter & States of Matter', 'topic', chapter_id, NULL, true, 1);
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Evaporation and Cooling Effects', 'topic', chapter_id, NULL, true, 2);

        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('The Fundamental Unit of Life', 'chapter', subject_id, NULL, true, 2) RETURNING id INTO chapter_id;
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Plasma Membrane and Cell Wall', 'topic', chapter_id, NULL, true, 1);
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Cell Organelles: Nucleus, Mitochondria, Plastids', 'topic', chapter_id, NULL, true, 2);

        -- Class 10
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Class 10', 'class', cbse_board_id, NULL, true, 10)
        RETURNING id INTO class_id;

        -- Mathematics
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Mathematics', 'subject', class_id, NULL, true, 1)
        RETURNING id INTO subject_id;

        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Quadratic Equations', 'chapter', subject_id, NULL, true, 1) RETURNING id INTO chapter_id;
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Standard Form and Solution by Factorisation', 'topic', chapter_id, NULL, true, 1);
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Quadratic Formula and Nature of Roots', 'topic', chapter_id, NULL, true, 2);

        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Arithmetic Progressions', 'chapter', subject_id, NULL, true, 2) RETURNING id INTO chapter_id;
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('nth Term of an AP and Common Difference', 'topic', chapter_id, NULL, true, 1);
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Sum of First n Terms of an AP', 'topic', chapter_id, NULL, true, 2);

        -- Science
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Science', 'subject', class_id, NULL, true, 2)
        RETURNING id INTO subject_id;

        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Chemical Reactions and Equations', 'chapter', subject_id, NULL, true, 1) RETURNING id INTO chapter_id;
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Balancing Chemical Equations', 'topic', chapter_id, NULL, true, 1);
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Types of Reactions: Combination, Decomposition, Redox', 'topic', chapter_id, NULL, true, 2);

        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Light - Reflection and Refraction', 'chapter', subject_id, NULL, true, 2) RETURNING id INTO chapter_id;
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Spherical Mirrors and Ray Diagrams', 'topic', chapter_id, NULL, true, 1);
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Refraction by Spherical Lenses and Lens Formula', 'topic', chapter_id, NULL, true, 2);
    END IF;

    -- 2. Check if ICSE Master Board exists, if not create it
    SELECT id INTO icse_board_id FROM public.syllabus_nodes WHERE type = 'board' AND tenant_id IS NULL AND name ILIKE '%ICSE%' LIMIT 1;
    
    IF icse_board_id IS NULL THEN
        INSERT INTO public.syllabus_nodes (name, type, tenant_id, is_active, order_index)
        VALUES ('Council for the Indian School Certificate Examinations (ICSE)', 'board', NULL, true, 2)
        RETURNING id INTO icse_board_id;
        
        -- Class 10 ICSE
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Class 10', 'class', icse_board_id, NULL, true, 10)
        RETURNING id INTO class_id;

        -- Physics
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Physics', 'subject', class_id, NULL, true, 1)
        RETURNING id INTO subject_id;

        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Force, Work, Power and Energy', 'chapter', subject_id, NULL, true, 1) RETURNING id INTO chapter_id;
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Turning Forces and Uniform Circular Motion', 'topic', chapter_id, NULL, true, 1);
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Kinetic and Potential Energy with Conservation', 'topic', chapter_id, NULL, true, 2);

        -- Chemistry
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Chemistry', 'subject', class_id, NULL, true, 2)
        RETURNING id INTO subject_id;

        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index)
        VALUES ('Periodic Properties and Variations', 'chapter', subject_id, NULL, true, 1) RETURNING id INTO chapter_id;
        INSERT INTO public.syllabus_nodes (name, type, parent_id, tenant_id, is_active, order_index) VALUES ('Periodic Trends in Atomic Size, Ionisation Potential', 'topic', chapter_id, NULL, true, 1);
    END IF;

    RAISE NOTICE 'Owner published master boards verified.';
END $$;
