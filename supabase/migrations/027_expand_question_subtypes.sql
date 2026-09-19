-- Migration: Expand allowed sub_types on public.questions table
-- To support modern Board exam formats (True/False, Assertion Reason, Fill in Blanks, Diagram-based, etc.)

DO $$
BEGIN
    -- Drop existing sub_type constraint if it exists
    ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_sub_type_check;

    -- Re-create constraint with all standard academic question sub_types
    ALTER TABLE public.questions ADD CONSTRAINT questions_sub_type_check 
    CHECK (sub_type = ANY (ARRAY[
        'mcq'::text, 
        'numerical'::text, 
        'descriptive'::text,
        'true_false'::text,
        'assertion_reason'::text,
        'fill_blank'::text,
        'short_answer'::text,
        'long_answer'::text,
        'diagram_based'::text,
        'case_based'::text
    ]));
END $$;
