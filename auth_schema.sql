-- Auth Extensions for BlinkOpticals Production

-- 1. Add Auth Credentials to app_user (ERP/Staff)
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- 2. Add Auth Credentials to customer (B2C Ecommerce)
ALTER TABLE customer ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE customer ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE customer ADD CONSTRAINT unique_customer_email UNIQUE (email);
ALTER TABLE customer ADD CONSTRAINT unique_customer_mobile UNIQUE (mobile, business_id);
