-- Communication & Notification Module Schema — BlinkOpticals ERP
-- Supports Templates, Logs, Campaigns, and Automation Triggers

-- 1. Message Templates
CREATE TABLE IF NOT EXISTS message_templates (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    channel VARCHAR(20) CHECK (channel IN ('whatsapp', 'sms', 'email', 'push')),
    message_content TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- List of supported variables e.g. ["name", "order_id"]
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Message Logs (Tracking)
CREATE TABLE IF NOT EXISTS message_logs (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    customer_id VARCHAR(50) REFERENCES customer(customer_id),
    channel VARCHAR(20),
    message TEXT,
    status VARCHAR(20) DEFAULT 'queued', -- queued, sent, delivered, failed, read
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Campaigns (Bulk Marketing)
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) DEFAULT 'marketing', -- marketing, announcement
    target_group VARCHAR(50), -- all, high_value, inactive_90d
    message_template_id INT REFERENCES message_templates(id),
    schedule_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sent
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Automation Rules
CREATE TABLE IF NOT EXISTS automation_rules (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    trigger_event VARCHAR(100) NOT NULL, -- order_placed, order_ready, birthday
    template_id INT REFERENCES message_templates(id),
    channel VARCHAR(20),
    delay_minutes INT DEFAULT 0,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX idx_logs_business ON message_logs(business_id);
CREATE INDEX idx_logs_customer ON message_logs(customer_id);
CREATE INDEX idx_templates_business ON message_templates(business_id);
