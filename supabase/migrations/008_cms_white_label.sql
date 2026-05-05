-- ============================================================
-- BrightBoard Phase 8 — White Label, CMS & Theme Engine
-- Run this in the Supabase SQL Editor AFTER Phase 7
-- ============================================================

-- ─── 1. OWNER PUBLIC WEBSITE (Lead Gen) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'new', -- Tracked by CRM
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. CMS SYSTEM (Core Public Content Strategy) ────────────────────────────
CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL refers to Platform Owner Pages
  page_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('hero', 'features', 'testimonials', 'text', 'cta', 'exam_list', 'achievers')),
  content JSONB NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE
);

-- ─── 3. THEME & PALETTE ENGINE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS theme_palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  background TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#18181A',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_theme (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  palette_id UUID REFERENCES theme_palettes(id) ON DELETE SET NULL,
  custom_config JSONB DEFAULT '{}'::jsonb, -- Custom hexadecimal overrides
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. ENTERPRISE WHITE LABEL SYSTEM ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_branding (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  logo TEXT,           -- URL to logo asset
  favicon TEXT,        -- URL to favicon asset
  brand_name TEXT NOT NULL,
  email_sender TEXT,   -- e.g. "Admissions @ MyAcademy"
  custom_domain TEXT UNIQUE, -- e.g. "student.myacademy.com"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_theme ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;

-- ─── 6. SECURITY POLICIES ────────────────────────────────────────────────────

-- Demo Requests: Public can insert. Owner/Sales can read.
DROP POLICY IF EXISTS "public_insert_demos" ON demo_requests;
CREATE POLICY "public_insert_demos" ON demo_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "owner_read_demos" ON demo_requests;
CREATE POLICY "owner_read_demos" ON demo_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('owner', 'sales_exec'))
);

-- CMS Public Access (Everyone can read published pages)
DROP POLICY IF EXISTS "public_read_cms_pages" ON cms_pages;
CREATE POLICY "public_read_cms_pages" ON cms_pages FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "public_read_cms_sections" ON cms_sections;
CREATE POLICY "public_read_cms_sections" ON cms_sections FOR SELECT USING (
  is_visible = true AND EXISTS (SELECT 1 FROM cms_pages WHERE id = cms_sections.page_id AND is_published = true)
);

-- CMS Modification (Only specific Tenant Admins/Owners)
DROP POLICY IF EXISTS "tenant_modify_cms" ON cms_pages;
CREATE POLICY "tenant_modify_cms" ON cms_pages FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()) 
  OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
);

DROP POLICY IF EXISTS "tenant_modify_sections" ON cms_sections;
CREATE POLICY "tenant_modify_sections" ON cms_sections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM cms_pages 
    JOIN user_profiles up ON up.id = auth.uid() 
    WHERE cms_pages.id = cms_sections.page_id AND (cms_pages.tenant_id = up.tenant_id OR up.role = 'owner')
  )
);

-- Theming & Branding (Public read, Tenant Admin/Owner modify)
DROP POLICY IF EXISTS "public_read_themes" ON tenant_theme;
CREATE POLICY "public_read_themes" ON tenant_theme FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_branding" ON tenant_branding;
CREATE POLICY "public_read_branding" ON tenant_branding FOR SELECT USING (true);

-- ─── 7. INITIAL THEME SEED ───────────────────────────────────────────────────
INSERT INTO theme_palettes (name, primary_color, secondary_color, background, text_color) VALUES 
('Brilliant Default', '#672AEA', '#F0A026', '#F8F9FA', '#18181A'),
('Ocean Depth', '#0284C7', '#38BDF8', '#F0F9FF', '#0C4A6E'),
('Forest Edge', '#16A34A', '#4ADE80', '#F0FDF4', '#14532D')
ON CONFLICT (name) DO NOTHING;
