-- Phase 4 SQL Schema Update: Ecommerce Website & CMS

-- 1. Customer Addresses (For Checkout and My Account)
CREATE TABLE customer_address (
    address_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customer(customer_id),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('home', 'office', 'other')),
    default_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CMS Banner Control
CREATE TABLE cms_banner (
    banner_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    position VARCHAR(50) CHECK (position IN ('hero', 'offer', 'brand_banner')),
    image_url VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    cta_link VARCHAR(255),
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CMS Featured Products / Trending
CREATE TABLE cms_featured_product (
    featured_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    product_id VARCHAR(50) REFERENCES product(product_id),
    section_name VARCHAR(100) CHECK (section_name IN ('trending', 'combo_offer', 'new_arrival')),
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Online Cart (Pre-Order State)
CREATE TABLE online_cart (
    cart_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customer(customer_id),
    business_id VARCHAR(50) REFERENCES business(business_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE online_cart_item (
    cart_item_id VARCHAR(50) PRIMARY KEY,
    cart_id VARCHAR(50) REFERENCES online_cart(cart_id),
    product_id VARCHAR(50) REFERENCES product(product_id),
    variant_id VARCHAR(50) REFERENCES variant(variant_id),
    lens_type VARCHAR(100),
    prescription_id VARCHAR(50) REFERENCES prescription(prescription_id),
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2)
);
