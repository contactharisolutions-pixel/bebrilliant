/**
 * Setup Syllabus Tables
 * Run: node scripts/setup-syllabus-tables.mjs
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env manually
const envPath = path.join(__dirname, '../.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
    const [k, ...v] = line.split('=')
    if (k && v.length) env[k.trim()] = v.join('=').trim()
}

const SUPABASE_URL = env['SUPABASE_URL'] || env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const SQL = `
-- ── SYLLABUS NODES (Master Tree) ────────────────────────────────
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

-- ── AI ENGINE CONFIG ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_engine_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SYLLABUS PLANS (Marketplace) ────────────────────────────────
CREATE TABLE IF NOT EXISTS syllabus_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pricing_type TEXT CHECK (pricing_type IN ('one-time','subscription')) DEFAULT 'one-time',
  price NUMERIC DEFAULT 0,
  validity_days INT DEFAULT 365,
  features JSONB DEFAULT '{"ai_mapping": true, "adaptive_learning": true, "board_comparison": false}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SYLLABUS VERSIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS syllabus_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  version INT NOT NULL,
  changes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONCEPT TAGS (AI Layer) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS concept_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES syllabus_nodes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  weightage NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SYLLABUS COMPARISONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS syllabus_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES syllabus_nodes(id) ON DELETE SET NULL,
  target_id UUID REFERENCES syllabus_nodes(id) ON DELETE SET NULL,
  analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TENANT SYLLABUS DISTRIBUTION ────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  master_syllabus_id UUID REFERENCES syllabus_nodes(id) ON DELETE SET NULL,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE syllabus_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_engine_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_syllabus ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION is_owner() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner');
$$ LANGUAGE sql SECURITY DEFINER;

-- Owner: full access
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

-- Seed AI Config defaults
INSERT INTO ai_engine_config (parameter, value) VALUES
  ('auto_tagging_threshold', '"0.85"'),
  ('gap_detection_enabled', 'true'),
  ('max_topics_per_chapter', '20'),
  ('adaptive_weight_bump', '2.0'),
  ('adaptive_weight_drop', '0.5')
ON CONFLICT (parameter) DO NOTHING;
`

async function runSQL() {
    console.log('🔄 Setting up syllabus tables...')

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: SQL })
    })

    if (!response.ok) {
        // Try via pg directly
        console.log('Direct RPC not available, using individual table checks...')
    }

    // Verify by selecting from each table
    const tables = ['syllabus_nodes', 'ai_engine_config', 'syllabus_plans', 'syllabus_versions', 'concept_tags']

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('id').limit(1)
        if (error) {
            console.error(`❌ ${table}: ${error.message}`)
        } else {
            console.log(`✅ ${table}: OK`)
        }
    }
}

runSQL()
