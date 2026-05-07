-- Phase 3 SQL Schema Update: POS + Billing + Payments

-- 1. Prescription Table
CREATE TABLE prescription (
    prescription_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    customer_id VARCHAR(50) REFERENCES customer(customer_id),
    right_sph VARCHAR(20),
    right_cyl VARCHAR(20),
    right_axis VARCHAR(20),
    right_add VARCHAR(20),
    left_sph VARCHAR(20),
    left_cyl VARCHAR(20),
    left_axis VARCHAR(20),
    left_add VARCHAR(20),
    pd VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Extend Customer Order for POS Accounting
ALTER TABLE customer_order ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customer_order ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customer_order ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customer_order ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customer_order ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customer_order ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100) UNIQUE;

-- 3. Order Item (Cart Lines + Lens/Frame relation)
CREATE TABLE order_item (
    item_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES customer_order(order_id),
    product_id VARCHAR(50) REFERENCES product(product_id),
    variant_id VARCHAR(50) REFERENCES variant(variant_id),
    item_type VARCHAR(50) CHECK (item_type IN ('frame', 'lens', 'accessory', 'service')),
    lens_type VARCHAR(100),  -- 'Single vision', 'Bifocal', 'Progressive', etc.
    prescription_id VARCHAR(50) REFERENCES prescription(prescription_id),
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2),
    discount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Processing'
);

-- 4. Payment Tracking (Split Payments)
CREATE TABLE payment (
    payment_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES customer_order(order_id),
    business_id VARCHAR(50) REFERENCES business(business_id),
    amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(50) CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Payment link')),
    transaction_ref VARCHAR(255),
    status VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
