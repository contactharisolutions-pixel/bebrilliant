-- Phase 6 SQL Schema Update: Advanced CMS, Media Library & Public Control

-- Drop phase 4 CMS components cleanly to upgrade to full robust CMS framework
DROP TABLE IF EXISTS cms_banner CASCADE;
DROP TABLE IF EXISTS cms_featured_product CASCADE;

-- 1. Media Library Server
CREATE TABLE media_library (
    media_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,  -- Cloudpath
    file_type VARCHAR(50),
    folder VARCHAR(100) CHECK (folder IN ('Homepage', 'Brand', 'Products', 'Campaign', 'Blog')),
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CMS Pages Framework (With SEO constraints)
CREATE TABLE cms_pages (
    page_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    page_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    page_type VARCHAR(50) CHECK (page_type IN ('home', 'brand', 'landing', 'blog')),
    meta_title VARCHAR(255),
    meta_description TEXT,
    keywords TEXT,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CMS Sections Builder (Content Node mapping)
CREATE TABLE cms_sections (
    section_id VARCHAR(50) PRIMARY KEY,
    page_id VARCHAR(50) REFERENCES cms_pages(page_id),
    section_type VARCHAR(100) CHECK (section_type IN ('Hero banner', 'Product slider', 'Brand slider', 'Offer banner', 'Text block', 'Video block')),
    position INT NOT NULL,
    content_json JSONB,  -- Dynamic flexible storage for payload configurations
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Global Banners & Popups
CREATE TABLE cms_banners (
    banner_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    title VARCHAR(255),
    image VARCHAR(50) REFERENCES media_library(media_id), -- Direct mapping logic 
    link VARCHAR(255),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    banner_type VARCHAR(50) CHECK (banner_type IN ('Homepage banner', 'Popup banner', 'Offer banner', 'Category banner')),
    active_status BOOLEAN DEFAULT TRUE
);

-- 5. CMS Brand Hero Arrays
CREATE TABLE cms_brand_hero (
    hero_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    brand_id VARCHAR(50) REFERENCES brand(brand_id),
    banner_image VARCHAR(50) REFERENCES media_library(media_id),
    banner_video VARCHAR(50) REFERENCES media_library(media_id),
    category VARCHAR(100),
    gender VARCHAR(50),
    priority INT DEFAULT 0
);

-- 6. Blog Framework
CREATE TABLE blog (
    blog_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT,
    image VARCHAR(50) REFERENCES media_library(media_id),
    meta_title VARCHAR(255),
    meta_description TEXT,
    keywords TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. CMS Popups logic
CREATE TABLE popup (
    popup_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    popup_type VARCHAR(50) CHECK (popup_type IN ('Welcome popup', 'Offer popup', 'Exit popup')),
    trigger_logic VARCHAR(100) CHECK (trigger_logic IN ('Time delay', 'Exit intent', 'First visit')),
    content_json JSONB,
    active_status BOOLEAN DEFAULT TRUE
);
