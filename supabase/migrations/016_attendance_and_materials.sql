-- ============================================================
-- BrightBoard Phase 5 — Attendance & Study Material Vault
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── 1. ATTENDANCE LOGS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  recorded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- ─── 2. STUDY MATERIALS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_materials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('pdf', 'video', 'notes', 'assignment')),
  subject     TEXT,
  class_name  TEXT,
  file_url    TEXT NOT NULL,
  file_size   TEXT,
  created_by  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. ENABLE RLS ───────────────────────────────────────────────────────────
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- ─── 4. SECURITY POLICIES ────────────────────────────────────────────────────

-- Attendance: Members read their tenant's logs; Staff manage
DROP POLICY IF EXISTS "tenant_read_attendance" ON attendance_logs;
CREATE POLICY "tenant_read_attendance" ON attendance_logs FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "staff_manage_attendance" ON attendance_logs;
CREATE POLICY "staff_manage_attendance" ON attendance_logs FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'teacher', 'owner'))
);

-- Study Materials: Members read; Staff manage
DROP POLICY IF EXISTS "tenant_read_material" ON study_materials;
CREATE POLICY "tenant_read_material" ON study_materials FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "staff_manage_material" ON study_materials;
CREATE POLICY "staff_manage_material" ON study_materials FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'teacher', 'owner'))
);

-- ─── 5. INDEXES ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_material_tenant ON study_materials(tenant_id);
