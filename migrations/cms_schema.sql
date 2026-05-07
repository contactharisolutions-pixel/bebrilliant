-- CMS Module Schema Migration
-- Tables: pages, page_sections, page_seo

-- 1. Create pages table
CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL DEFAULT 'biz_blink_001',
    page_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    page_type TEXT NOT NULL DEFAULT 'custom', -- home / landing / policy / custom
    status TEXT NOT NULL DEFAULT 'draft', -- draft / published
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create page_sections table
CREATE TABLE IF NOT EXISTS page_sections (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL, -- hero / banner / grid / text / product / brand_carousel / etc
    section_order INTEGER NOT NULL DEFAULT 0,
    content_json JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create page_seo table
CREATE TABLE IF NOT EXISTS page_seo (
    page_id TEXT PRIMARY KEY REFERENCES pages(id) ON DELETE CASCADE,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_pages_business ON pages(business_id);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_page_sections_page ON page_sections(page_id);
