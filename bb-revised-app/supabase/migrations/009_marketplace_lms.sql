-- ============================================================
-- BrightBoard Phase 9 — Marketplace, LMS & Final Ecosystem
-- Run this in the Supabase SQL Editor AFTER Phase 8
-- ============================================================

-- ─── 1. TEST SERIES MARKETPLACE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Vendor
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_exams (
  product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, exam_id)
);

CREATE TABLE IF NOT EXISTS student_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  payment_id UUID REFERENCES payments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. LIVE CLASSES SYSTEM (Zoom / WebRTC) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,      -- Expected duration in minutes
  meeting_link TEXT NOT NULL,     -- e.g. Zoom URL
  meeting_password TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Teacher
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. VIDEO LMS (Course Platform) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,                 -- M3U8 HLS / MP4 CDN Link
  duration INTEGER NOT NULL,      -- seconds
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  watch_time INTEGER DEFAULT 0,
  last_watched TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- ─── 4. DOUBT SOLVING MARKETPLACE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doubts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  question TEXT NOT NULL,
  attachment_url TEXT,            -- Optional image diagram
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  bounty_amount NUMERIC DEFAULT 0, -- Paid doubt ecosystem
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doubt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doubt_id UUID NOT NULL REFERENCES doubts(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  attachment_url TEXT,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. AFFILIATE INTEGRATION ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  commission_rate NUMERIC DEFAULT 10.0, -- Default 10%
  total_earnings NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. SECURITY POLICIES / RLS ──────────────────────────────────────────────
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

-- Select generic policies mapping:
-- Public can view active products and courses.
CREATE POLICY "public_read_products" ON marketplace_products FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_courses" ON courses FOR SELECT USING (true);
CREATE POLICY "public_read_lessons" ON course_lessons FOR SELECT USING (true);

-- Students can read their own purchases, progress, doubts
CREATE POLICY "student_read_purchases" ON student_purchases FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "student_read_progress" ON lesson_progress FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "student_modify_doubts" ON doubts FOR ALL USING (student_id = auth.uid());
CREATE POLICY "user_read_doubts" ON doubts FOR SELECT USING (true);
CREATE POLICY "user_read_answers" ON doubt_answers FOR SELECT USING (true);

-- End of Phase 9 Architecture Deployment.
