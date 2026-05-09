-- Add tenant_id to syllabus_nodes for private syllabuses
ALTER TABLE syllabus_nodes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Update RLS for syllabus_nodes
DROP POLICY IF EXISTS "public_read_syllabus" ON syllabus_nodes;
CREATE POLICY "public_read_syllabus" ON syllabus_nodes FOR SELECT 
USING (tenant_id IS NULL OR tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "owner_all_syllabus_nodes" ON syllabus_nodes;
CREATE POLICY "owner_all_syllabus_nodes" ON syllabus_nodes FOR ALL 
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'owner' 
  OR 
  (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
);
