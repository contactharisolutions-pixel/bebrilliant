/**
 * Create syllabus tables via Supabase Management / pg client
 * Run: node scripts/create-syllabus-db.mjs
 */
import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://postgres:Life%4020242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres'

const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

const SQL = `
CREATE TABLE IF NOT EXISTS syllabus_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('board','class','subject','chapter','topic')) NOT NULL,
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  order_index INT DEFAULT 0,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_engine_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS syllabus_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Unnamed Plan',
  pricing_type TEXT CHECK (pricing_type IN ('one-time','subscription')) DEFAULT 'one-time',
  price NUMERIC DEFAULT 0,
  validity_days INT DEFAULT 365,
  features JSONB DEFAULT '{"ai_mapping": true, "adaptive_learning": true, "board_comparison": false}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS syllabus_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  version INT NOT NULL,
  changes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS concept_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  weightage NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS syllabus_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES syllabus_nodes(id) ON DELETE SET NULL,
  target_id UUID REFERENCES syllabus_nodes(id) ON DELETE SET NULL,
  analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  master_syllabus_id UUID REFERENCES syllabus_nodes(id) ON DELETE SET NULL,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE syllabus_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_engine_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_syllabus ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_owner() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner');
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "owner_all_syllabus_nodes" ON syllabus_nodes;
CREATE POLICY "owner_all_syllabus_nodes" ON syllabus_nodes FOR ALL USING (is_owner());
DROP POLICY IF EXISTS "public_read_syllabus" ON syllabus_nodes;
CREATE POLICY "public_read_syllabus" ON syllabus_nodes FOR SELECT USING (true);

DROP POLICY IF EXISTS "owner_all_ai_config" ON ai_engine_config;
CREATE POLICY "owner_all_ai_config" ON ai_engine_config FOR ALL USING (is_owner());

DROP POLICY IF EXISTS "owner_all_syllabus_plans" ON syllabus_plans;
CREATE POLICY "owner_all_syllabus_plans" ON syllabus_plans FOR ALL USING (is_owner());
DROP POLICY IF EXISTS "public_read_plans" ON syllabus_plans;
CREATE POLICY "public_read_plans" ON syllabus_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "owner_all_versions" ON syllabus_versions;
CREATE POLICY "owner_all_versions" ON syllabus_versions FOR ALL USING (is_owner());

DROP POLICY IF EXISTS "owner_all_tags" ON concept_tags;
CREATE POLICY "owner_all_tags" ON concept_tags FOR ALL USING (is_owner());

DROP POLICY IF EXISTS "owner_all_comparisons" ON syllabus_comparisons;
CREATE POLICY "owner_all_comparisons" ON syllabus_comparisons FOR ALL USING (is_owner());

DROP POLICY IF EXISTS "owner_all_tenant_syllabus" ON tenant_syllabus;
CREATE POLICY "owner_all_tenant_syllabus" ON tenant_syllabus FOR ALL USING (is_owner());

DROP POLICY IF EXISTS "tenant_read_own_ts" ON tenant_syllabus;
CREATE POLICY "tenant_read_own_ts" ON tenant_syllabus FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
);

INSERT INTO ai_engine_config (parameter, value) VALUES
  ('auto_tagging_threshold', '"0.85"'),
  ('gap_detection_enabled', 'true'),
  ('max_topics_per_chapter', '20'),
  ('adaptive_weight_bump', '"2.0"'),
  ('adaptive_weight_drop', '"0.5"')
ON CONFLICT (parameter) DO NOTHING;
`

async function main() {
    await client.connect()
    console.log('✅ Connected to database')

    await client.query(SQL)
    console.log('✅ All syllabus tables created / verified')

    // Verify
    const tables = ['syllabus_nodes', 'ai_engine_config', 'syllabus_plans', 'concept_tags', 'syllabus_comparisons', 'tenant_syllabus']
    for (const t of tables) {
        const res = await client.query(`SELECT COUNT(*) FROM ${t}`)
        console.log(`  📋 ${t}: ${res.rows[0].count} rows`)
    }

    await client.end()
    console.log('✅ Done!')
}

main().catch(e => {
    console.error('❌ Error:', e.message)
    process.exit(1)
})
