-- Phase 5 SQL Schema Update: CRM, Leads, Follow-ups, and Tasks

-- 1. Alter Customer Table adding CRM enhancements
ALTER TABLE customer ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE customer ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE customer ADD COLUMN IF NOT EXISTS preferred_showroom VARCHAR(50) REFERENCES showroom(showroom_id);
-- Ensure uniqueness of mobile number per business (Rules: No duplicate mobile numbers)
ALTER TABLE customer DROP CONSTRAINT IF EXISTS unique_mobile_per_business;
ALTER TABLE customer ADD CONSTRAINT unique_mobile_per_business UNIQUE (business_id, mobile);

-- 2. Lead Management Table
CREATE TABLE lead (
    lead_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    source VARCHAR(100) CHECK (source IN ('Website inquiry', 'Demo request', 'Walk-in', 'WhatsApp', 'Call')),
    interest TEXT,
    assigned_to VARCHAR(50) REFERENCES app_user(user_id),
    status VARCHAR(50) CHECK (status IN ('New', 'Contacted', 'Trial done', 'Converted', 'Lost')) DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Follow-up Tracking Table
CREATE TABLE follow_up (
    followup_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    customer_id VARCHAR(50) REFERENCES customer(customer_id),
    lead_id VARCHAR(50) REFERENCES lead(lead_id),
    followup_date TIMESTAMP NOT NULL,
    note TEXT,
    assigned_to VARCHAR(50) REFERENCES app_user(user_id),
    status VARCHAR(50) CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CRM Task Management
CREATE TABLE task (
    task_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    title VARCHAR(255) NOT NULL,
    task_type VARCHAR(100) CHECK (task_type IN ('Call customer', 'Follow-up', 'Appointment reminder', 'Repair update')),
    assigned_to VARCHAR(50) REFERENCES app_user(user_id),
    due_date TIMESTAMP,
    status VARCHAR(50) CHECK (status IN ('pending', 'in-progress', 'completed', 'canceled')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
