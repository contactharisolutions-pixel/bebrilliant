/* 
Master Data Management Schema — BlinkOpticals ERP
Phases M1 & M2: Tables and Relations
*/

-- 1. Brands
CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'brnd_' || floor(random() * 1000000)::text,
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    logo TEXT,
    description TEXT,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'cat_' || floor(random() * 1000000)::text,
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    parent_category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- 3. Genders
CREATE TABLE IF NOT EXISTS genders (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'gen_' || floor(random() * 1000000)::text,
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- 4. Frame Types
CREATE TABLE IF NOT EXISTS frame_types (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'ft_' || floor(random() * 1000000)::text,
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- 5. Shapes
CREATE TABLE IF NOT EXISTS shapes (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'sh_' || floor(random() * 1000000)::text,
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- 6. Materials
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'mat_' || floor(random() * 1000000)::text,
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- 7. Frame Colors
CREATE TABLE IF NOT EXISTS frame_colors (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'fc_' || floor(random() * 1000000)::text,
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    color_code VARCHAR(50), -- Hex Code
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- 8. Lens Colors
CREATE TABLE IF NOT EXISTS lens_colors (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'lc_' || floor(random() * 1000000)::text,
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- PHASE M2: Relation with Products
-- Update Product Table Columns
ALTER TABLE product 
    ADD COLUMN IF NOT EXISTS brand_id VARCHAR(50) REFERENCES brands(id),
    ADD COLUMN IF NOT EXISTS category_id VARCHAR(50) REFERENCES categories(id),
    ADD COLUMN IF NOT EXISTS gender_id VARCHAR(50) REFERENCES genders(id),
    ADD COLUMN IF NOT EXISTS frame_type_id VARCHAR(50) REFERENCES frame_types(id),
    ADD COLUMN IF NOT EXISTS shape_id VARCHAR(50) REFERENCES shapes(id),
    ADD COLUMN IF NOT EXISTS material_id VARCHAR(50) REFERENCES materials(id);

-- Variants with Colors
ALTER TABLE variant
    ADD COLUMN IF NOT EXISTS frame_color_id VARCHAR(50) REFERENCES frame_colors(id),
    ADD COLUMN IF NOT EXISTS lens_color_id VARCHAR(50) REFERENCES lens_colors(id);
