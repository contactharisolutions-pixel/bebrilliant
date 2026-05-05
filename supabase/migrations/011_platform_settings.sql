-- ============================================================
-- BrightBoard Phase 11 — Global Platform Settings
-- Run this in the Supabase SQL Editor AFTER Phase 10
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed default settings
INSERT INTO platform_settings (key, value) VALUES
  ('general', '{"platform_name": "BrightBoard Enterprise", "support_email": "support@brightboard.io", "timezone": "Asia/Kolkata", "maintenance_mode": false}'),
  ('security', '{"require_2fa_admins": true, "session_timeout_mins": 120, "max_login_attempts": 5, "password_policy": "strict"}'),
  ('integrations', '{"stripe_public": "pk_test_brightboard", "openai_model": "gpt-4o", "sendgrid_active": true, "zoom_active": false}'),
  ('billing', '{"default_currency": "INR", "trial_days": 14, "tax_rate": 18, "invoice_prefix": "BB-"}')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_manage_settings" ON platform_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "public_read_general_settings" ON platform_settings
  FOR SELECT USING (key IN ('general', 'billing'));
