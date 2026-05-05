-- ============================================================
-- BrightBoard Phase 14.5 — Supplemental Tenant Matrix
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Add subdomain to tenants for multi-tenant routing
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS logo_url TEXT; -- Matching the UI's preference for 'url' suffix

-- Sync existing names to subdomains for uniqueness if null
UPDATE tenants 
SET subdomain = LOWER(REPLACE(name, ' ', '-')) 
WHERE subdomain IS NULL;
