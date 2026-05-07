-- Create business_settings table for granular control
CREATE TABLE IF NOT EXISTS business_settings (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, setting_key)
);

-- Indexing for lookup
CREATE INDEX idx_settings_business ON business_settings(business_id);
