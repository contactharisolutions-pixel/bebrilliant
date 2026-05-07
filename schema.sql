/* 
Optical ERP + Ecommerce System - Base Schema 
Multi-Business (Clone Ready Setup)
*/

-- Business Entity (IMPORTANT)
CREATE TABLE business (
    business_id VARCHAR(50) PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    mobile_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    base_currency VARCHAR(10) DEFAULT 'INR',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Showroom Setup
CREATE TABLE showroom (
    showroom_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    showroom_name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    contact_number VARCHAR(20),
    manager_name VARCHAR(255),
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouse Setup
CREATE TABLE warehouse (
    warehouse_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    warehouse_name VARCHAR(255) NOT NULL,
    location TEXT,
    type VARCHAR(50) CHECK (type IN ('central', 'city', 'repair')),
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User & Roles
CREATE TABLE app_user (
    user_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    showroom_id VARCHAR(50) REFERENCES showroom(showroom_id),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('Admin', 'Manager', 'Showroom Manager', 'Cashier', 'Optometrist', 'Warehouse Staff', 'Sales')),
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Table
CREATE TABLE product (
    product_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    product_name VARCHAR(255) NOT NULL,
    brand_id VARCHAR(50),
    category_id VARCHAR(50),
    frame_type VARCHAR(100),
    gender VARCHAR(50),
    material VARCHAR(100),
    shape VARCHAR(100),
    base_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Variant Table
CREATE TABLE variant (
    variant_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES product(product_id),
    color VARCHAR(100),
    size VARCHAR(50),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Table
CREATE TABLE inventory (
    inventory_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    product_id VARCHAR(50) REFERENCES product(product_id),
    variant_id VARCHAR(50) REFERENCES variant(variant_id),
    showroom_id VARCHAR(50) REFERENCES showroom(showroom_id),
    warehouse_id VARCHAR(50) REFERENCES warehouse(warehouse_id),
    available_qty INT DEFAULT 0,
    reserved_qty INT DEFAULT 0,
    damaged_qty INT DEFAULT 0,
    in_transit_qty INT DEFAULT 0,  -- Derived from requirement: Stock Types -> In transit
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Table
CREATE TABLE customer (
    customer_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Table
CREATE TABLE customer_order (
    order_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    customer_id VARCHAR(50) REFERENCES customer(customer_id),
    showroom_id VARCHAR(50) REFERENCES showroom(showroom_id),
    order_type VARCHAR(50) CHECK (order_type IN ('POS', 'online')),
    total_amount DECIMAL(10, 2),
    payment_status VARCHAR(50),
    order_status VARCHAR(50),
    
    -- Integration ready fields placeholder
    payment_gateway_ref VARCHAR(255),  -- e.g. Razorpay
    shipping_ref VARCHAR(255),         -- e.g. Shiprocket
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
