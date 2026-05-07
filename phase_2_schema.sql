-- Phase 2 SQL Schema Update

-- Drop existing tables related to products and inventory safely
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS variant CASCADE;
DROP TABLE IF EXISTS product CASCADE;

-- 1. Brands Table
CREATE TABLE brand (
    brand_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    brand_name VARCHAR(255) NOT NULL,
    logo VARCHAR(255),
    description TEXT,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE category (
    category_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    category_name VARCHAR(255) NOT NULL,
    parent_category_id VARCHAR(50) REFERENCES category(category_id),
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE product (
    product_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    product_name VARCHAR(255) NOT NULL,
    brand_id VARCHAR(50) REFERENCES brand(brand_id),
    category_id VARCHAR(50) REFERENCES category(category_id),
    frame_type VARCHAR(100),
    gender VARCHAR(50),
    material VARCHAR(100),
    shape VARCHAR(100),
    description TEXT,
    base_price DECIMAL(10, 2),
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Variants Table
CREATE TABLE variant (
    variant_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES product(product_id),
    color VARCHAR(100),
    size VARCHAR(50),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Inventory Table
CREATE TABLE inventory (
    inventory_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    product_id VARCHAR(50) REFERENCES product(product_id),
    variant_id VARCHAR(50) REFERENCES variant(variant_id),
    showroom_id VARCHAR(50),  -- Soft relation / can be null if warehouse
    warehouse_id VARCHAR(50), -- Soft relation / can be null if showroom
    available_qty INT DEFAULT 0,
    reserved_qty INT DEFAULT 0,
    damaged_qty INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Stock Movements
CREATE TABLE stock_movement (
    movement_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    product_id VARCHAR(50) REFERENCES product(product_id),
    variant_id VARCHAR(50) REFERENCES variant(variant_id),
    from_location VARCHAR(50),
    to_location VARCHAR(50),
    quantity INT NOT NULL,
    movement_type VARCHAR(50) CHECK (movement_type IN ('Purchase', 'Sale', 'Transfer', 'Return', 'Damage')),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Stock Transfer Table
CREATE TABLE stock_transfer (
    transfer_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    from_location VARCHAR(50),
    to_location VARCHAR(50),
    status VARCHAR(50) CHECK (status IN ('pending', 'shipped', 'received')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
