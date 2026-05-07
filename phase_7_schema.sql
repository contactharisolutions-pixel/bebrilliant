-- Phase 7 SQL Schema Update: Offers, Coupons, Campaigns & Automation

-- 1. Unified Offers Engine
CREATE TABLE offer (
    offer_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    offer_name VARCHAR(255) NOT NULL,
    offer_type VARCHAR(100) CHECK (offer_type IN ('Flat discount', 'Percentage discount', 'Buy 1 Get 1', 'Frame + lens combo', 'Second pair discount')),
    discount_value DECIMAL(10,2),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    apply_on VARCHAR(50) CHECK (apply_on IN ('Product', 'Category', 'Brand', 'Full cart')),
    target_id VARCHAR(50), -- Flexible linking strictly mapping to the apply_on condition
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Coupons Architecture
CREATE TABLE coupon (
    code VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    coupon_type VARCHAR(100) CHECK (coupon_type IN ('Welcome coupon', 'Festival coupon', 'Loyalty coupon', 'Eye test coupon')),
    discount_type VARCHAR(50) CHECK (discount_type IN ('Flat', 'Percentage')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    usage_limit INT,
    used_count INT DEFAULT 0,
    expiry_date TIMESTAMP,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Message Templates Library
CREATE TABLE message_template (
    template_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    template_name VARCHAR(255) NOT NULL,
    channel VARCHAR(50) CHECK (channel IN ('WhatsApp', 'Email', 'Push notification', 'SMS')),
    message_content TEXT NOT NULL,
    variables JSONB, -- Array mapping e.g ["Customer name", "Order ID", "Amount", "Showroom name"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Campaign Orchestrator
CREATE TABLE campaign (
    campaign_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) CHECK (campaign_type IN ('WhatsApp', 'SMS', 'Email', 'Push notification')),
    target_segment VARCHAR(100) CHECK (target_segment IN ('All customers', 'High value', 'Frequent buyers', 'No visit 6 months', 'Recent buyers', 'Sunglass buyers')),
    message TEXT NOT NULL,
    status VARCHAR(50) CHECK (status IN ('Draft', 'Scheduled', 'Running', 'Completed', 'Paused')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Automation Trigger Engine
CREATE TABLE automation_rule (
    rule_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    trigger_event VARCHAR(100) CHECK (trigger_event IN ('After purchase', 'Cart abandoned', 'No visit 90 days', 'Birthday', 'Eye test due')),
    template_id VARCHAR(50) REFERENCES message_template(template_id),
    active_status BOOLEAN DEFAULT TRUE
);

-- 6. Communication Tracking & Deliverability Log
CREATE TABLE communication_log (
    log_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    customer_id VARCHAR(50) REFERENCES customer(customer_id),
    campaign_id VARCHAR(50), -- Soft link for broadcasts
    channel VARCHAR(50),
    status VARCHAR(50) CHECK (status IN ('Sent', 'Delivered', 'Read', 'Click', 'Failed')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
