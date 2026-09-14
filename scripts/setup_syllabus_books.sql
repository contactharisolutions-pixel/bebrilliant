-- 1. Create syllabus_books table for Prescribed Textbooks & Bookstore Guides
CREATE TABLE IF NOT EXISTS public.syllabus_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    board_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    publisher TEXT NOT NULL,
    edition TEXT DEFAULT 'Latest 2026 Edition',
    isbn TEXT,
    chapters_count INT DEFAULT 14,
    cover_image_url TEXT,
    pdf_url TEXT,
    price NUMERIC(10,2) DEFAULT 0.00,
    buy_url TEXT,
    is_prescribed BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy queries by tenant and class
CREATE INDEX IF NOT EXISTS idx_syllabus_books_tenant_class ON public.syllabus_books(tenant_id, class_name);

-- 2. Seed Standard Textbooks for Tenant '5cccb9be-5b4a-4143-8725-bc6061e337fa'
DELETE FROM public.syllabus_books WHERE tenant_id = '5cccb9be-5b4a-4143-8725-bc6061e337fa';

INSERT INTO public.syllabus_books 
(tenant_id, board_name, class_name, subject_name, title, author, publisher, edition, isbn, chapters_count, pdf_url, price, buy_url, is_prescribed, is_active)
VALUES
('5cccb9be-5b4a-4143-8725-bc6061e337fa', 'Gujarat Board', 'Class 8', 'Mathematics', 'Gujarat Board Standard Mathematics Class 8', 'Dr. P. K. Sharma', 'Gujarat State Board of School Textbooks (GSEB)', '2026 Revised Edition', '978-93-87291-01-2', 16, 'https://gseb.org/textbooks/math8.pdf', 120.00, 'https://gsebbooks.org/math-8', true, true),
('5cccb9be-5b4a-4143-8725-bc6061e337fa', 'Gujarat Board', 'Class 8', 'Science', 'Exploring Science & Environment - Grade 8', 'Prof. N. K. Patel', 'Gujarat State Board of School Textbooks (GSEB)', '2026 Edition', '978-93-87291-02-9', 18, 'https://gseb.org/textbooks/science8.pdf', 140.00, 'https://gsebbooks.org/sci-8', true, true),
('5cccb9be-5b4a-4143-8725-bc6061e337fa', 'Gujarat Board', 'Class 8', 'English', 'Honeydew English Course Reader Class 8', 'Editorial Board', 'NCERT / GSEB Affiliated', 'Golden Jubilee Edition', '978-81-7450-812-1', 10, 'https://ncert.nic.in/textbook/pdf/hehd1dd.pdf', 85.00, 'https://ncertbooks.org/eng-8', true, true),
('5cccb9be-5b4a-4143-8725-bc6061e337fa', 'Gujarat Board', 'Class 8', 'Hindi', 'Vasant Hindi Textbook Part 3', 'Dr. Namwar Singh', 'NCERT / GSEB Affiliated', 'Latest Reprint', '978-81-7450-819-0', 18, 'https://ncert.nic.in/textbook/pdf/hhvs1dd.pdf', 90.00, 'https://ncertbooks.org/hindi-8', true, true),
('5cccb9be-5b4a-4143-8725-bc6061e337fa', 'Gujarat Board', 'Class 8', 'Social Science', 'Our Pasts, Resources & Society - Class 8', 'Dr. Romila Thapar', 'GSEB Academic Press', '2026 Academic Edition', '978-93-87291-05-0', 14, 'https://gseb.org/textbooks/ss8.pdf', 110.00, 'https://gsebbooks.org/ss-8', true, true),
('5cccb9be-5b4a-4143-8725-bc6061e337fa', 'Gujarat Board', 'Class 8', 'Mathematics', 'Secondary School Mathematics Reference (R.D. Sharma)', 'R.D. Sharma', 'Dhanpat Rai Publications', '32nd Edition', '978-81-93664-10-8', 22, '', 495.00, 'https://amazon.in/dp/8193664108', false, true),
('5cccb9be-5b4a-4143-8725-bc6061e337fa', 'Gujarat Board', 'Class 8', 'Science', 'Science Foundations Question Bank (Lakhmir Singh)', 'Lakhmir Singh & Manjit Kaur', 'S. Chand Publishing', 'Latest Edition', '978-93-52831-20-4', 18, '', 380.00, 'https://amazon.in/dp/9352831204', false, true);

-- 3. Connect Tenant to Master Gujarat Board English Medium Hierarchy
-- If empty duplicate 'ac002372-5187-4b29-a22c-28a17061efcf' exists, remove or deactivate it
DELETE FROM public.tenant_syllabus 
WHERE tenant_id = '5cccb9be-5b4a-4143-8725-bc6061e337fa' 
  AND master_syllabus_id = 'ac002372-5187-4b29-a22c-28a17061efcf';

DELETE FROM public.syllabus_nodes 
WHERE id = 'ac002372-5187-4b29-a22c-28a17061efcf';

-- Subscribe tenant to the real master board '067e1719-8eea-4556-bdc8-cc1fe7d1a8b7'
INSERT INTO public.tenant_syllabus (tenant_id, master_syllabus_id, is_active, version, access_level)
VALUES ('5cccb9be-5b4a-4143-8725-bc6061e337fa', '067e1719-8eea-4556-bdc8-cc1fe7d1a8b7', true, 1, 'full')
ON CONFLICT (tenant_id, master_syllabus_id) 
DO UPDATE SET is_active = true, updated_at = NOW();

-- Also ensure '067e1719-8eea-4556-bdc8-cc1fe7d1a8b7' has parent_id NULL or is recognized as root board
UPDATE public.syllabus_nodes
SET is_active = true
WHERE id = '067e1719-8eea-4556-bdc8-cc1fe7d1a8b7';
