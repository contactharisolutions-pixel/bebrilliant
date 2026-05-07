-- Advanced Tax Rules Schema — BlinkOpticals ERP
-- Handles multi-state GST (India), CGST, SGST, IGST

-- 1. Tax Rules Table
CREATE TABLE IF NOT EXISTS tax_rules (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    tax_name VARCHAR(100) NOT NULL, -- e.g. "GST 12%", "GST 18%"
    tax_percentage DECIMAL(5, 2) NOT NULL, -- e.g. 12.00
    applicable_on VARCHAR(50) DEFAULT 'product', -- product, category, lens
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Product Tax Mapping
CREATE TABLE IF NOT EXISTS product_tax_mapping (
    product_id VARCHAR(50) REFERENCES product(product_id) ON DELETE CASCADE,
    tax_rule_id INT REFERENCES tax_rules(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tax_rule_id)
);

-- 3. Category Tax Mapping
CREATE TABLE IF NOT EXISTS category_tax_mapping (
    category_id VARCHAR(100), -- Assuming category ID/name from catalog
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    tax_rule_id INT REFERENCES tax_rules(id) ON DELETE CASCADE,
    PRIMARY KEY (category_id, business_id)
);

-- 4. Order Item Tax Details (Breakdown for Invoicing)
CREATE TABLE IF NOT EXISTS order_item_tax (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES customer_order(order_id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES product(product_id),
    tax_percentage DECIMAL(5, 2),
    cgst_amount DECIMAL(10, 2) DEFAULT 0,
    sgst_amount DECIMAL(10, 2) DEFAULT 0,
    igst_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0, -- Total tax for this item
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for lookup
CREATE INDEX idx_tax_business ON tax_rules(business_id);
CREATE INDEX idx_item_tax_order ON order_item_tax(order_id);
