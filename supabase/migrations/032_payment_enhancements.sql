-- ============================================================
-- BrightBoard Phase 32 — Payment Schema Enhancements
-- ============================================================

-- 1. ADD WALLET TO PAYMENTS TYPE & METADATA COLUMN
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_type_check CHECK (type IN ('subscription', 'syllabus', 'exam', 'marketplace', 'wallet'));

ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. UPDATE COMMISSION RULES TABLE
ALTER TABLE commission_rules DROP CONSTRAINT IF EXISTS commission_rules_type_check;
ALTER TABLE commission_rules ADD CONSTRAINT commission_rules_type_check CHECK (type IN ('subscription', 'exam', 'syllabus', 'marketplace', 'wallet', 'global'));

-- 3. SEED WALLET COMMISSION RULE
INSERT INTO commission_rules (type, category, percentage, tenant_id)
VALUES ('wallet', 'student_recharge', 15.0, NULL)
ON CONFLICT (type, tenant_id) DO UPDATE SET percentage = EXCLUDED.percentage;
