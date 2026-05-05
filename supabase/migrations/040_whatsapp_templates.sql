-- ============================================================
-- Migration 040: WhatsApp Templates + Seeds
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = platform default
  template_key  TEXT NOT NULL,
  template_text TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, template_key)
);

ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Owner manages global (tenant_id IS NULL) templates
CREATE POLICY "owner_manages_global_templates"
  ON whatsapp_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner'
  ));

-- Tenant admin manages own tenant templates
CREATE POLICY "tenant_admin_manages_templates"
  ON whatsapp_templates FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin','owner'))
  );

-- Anyone authenticated can read active templates (for message generation)
CREATE POLICY "auth_reads_active_templates"
  ON whatsapp_templates FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- ─── SEED PLATFORM DEFAULT TEMPLATES ─────────────────────────────────────────
INSERT INTO whatsapp_templates (tenant_id, template_key, template_text) VALUES

(NULL, 'teacher_exam_share',
E'🎓 *Online Exam Available*\n\n📘 Exam: {exam_name}\n🏫 Institute: {institute_name}\n💰 Fee: ₹{exam_fee}\n\n📲 Register & Attempt:\n{referral_link}\n\n⚡ Limited seats. Attempt now!'),

(NULL, 'student_exam_share',
E'📝 *Try this Online Exam*\n\n📘 Exam: {exam_name}\n🏫 Institute: {institute_name}\n\n🔗 Attempt here:\n{referral_link}\n\n🎁 Earn rewards after completion!'),

(NULL, 'teacher_invite',
E'🤝 *Join as Affiliate Teacher*\n\n🏫 Institute: {institute_name}\n\n💸 Earn rewards by referring students to our exams.\n\n👇 Register here:\n{affiliate_signup_link}'),

(NULL, 'institute_exam_promo',
E'🏫 *{institute_name} — New Exam Alert*\n\n📘 Exam: {exam_name}\n💰 Fee: ₹{exam_fee}\n\n📲 Register now:\n{referral_link}\n\n📞 Contact us for details.')

ON CONFLICT (tenant_id, template_key) DO NOTHING;

COMMENT ON TABLE whatsapp_templates IS
  'Owner-controlled and tenant-overridable WhatsApp message templates. tenant_id = NULL means platform default used when tenant has no override.';
