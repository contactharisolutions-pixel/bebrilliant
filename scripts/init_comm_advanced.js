/**
 * Initialize Advanced Communication Module Schema
 */
const { Pool } = require('pg');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const schema = `
DROP TABLE IF EXISTS campaign_logs;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS customer_group_members;
DROP TABLE IF EXISTS customer_groups;

-- 1. Customer Groups (Segments)
CREATE TABLE IF NOT EXISTS customer_groups (
    group_id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    filter_rules JSONB, -- Logic for auto-segmentation
    is_manual BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Group Members (For manual groups)
CREATE TABLE IF NOT EXISTS customer_group_members (
    group_id TEXT REFERENCES customer_groups(group_id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    PRIMARY KEY (group_id, customer_id)
);

-- 3. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    campaign_id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    channel TEXT NOT NULL, -- 'WhatsApp', 'SMS', 'Email'
    type TEXT NOT NULL, -- 'Promotional', 'Marketing', 'Engagement'
    group_id TEXT REFERENCES customer_groups(group_id),
    template_id TEXT,
    status TEXT DEFAULT 'Draft', -- 'Draft', 'Scheduled', 'Running', 'Completed', 'Failed'
    scheduled_for TIMESTAMP,
    metadata JSONB, -- Product IDs, links, custom content
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Campaign Logs (Tracking)
CREATE TABLE IF NOT EXISTS campaign_logs (
    log_id SERIAL PRIMARY KEY,
    campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
    customer_id TEXT,
    mobile TEXT,
    email TEXT,
    status TEXT, -- 'Sent', 'Delivered', 'Read', 'Clicked', 'Failed'
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

-- 5. Extend customer table if needed for segmentation flags
-- (Assuming we use existing columns for now)
`;

async function init() {
    try {
        console.log('--- Initializing Advanced Communication Schema ---');
        await pool.query(schema);
        console.log('Tables created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Initialization failed:', err.message);
        process.exit(1);
    }
}

init();
