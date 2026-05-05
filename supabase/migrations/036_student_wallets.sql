-- ============================================================
-- Migration 036: Student Wallets + Wallet Transactions Tables
-- ============================================================

-- ─── 1. STUDENT WALLETS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_wallets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  free_credits  INTEGER NOT NULL DEFAULT 0 CHECK (free_credits >= 0),
  paid_credits  INTEGER NOT NULL DEFAULT 0 CHECK (paid_credits >= 0),
  total_balance INTEGER GENERATED ALWAYS AS (free_credits + paid_credits) STORED,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was created by a previous migration (Phase 22)
ALTER TABLE student_wallets ADD COLUMN IF NOT EXISTS free_credits INTEGER NOT NULL DEFAULT 0 CHECK (free_credits >= 0);
ALTER TABLE student_wallets ADD COLUMN IF NOT EXISTS paid_credits INTEGER NOT NULL DEFAULT 0 CHECK (paid_credits >= 0);
ALTER TABLE student_wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Handle student_id unique constraint if it was missing (it was UNIQUE(student_id, tenant_id) in Phase 22)
ALTER TABLE student_wallets DROP CONSTRAINT IF EXISTS student_wallets_student_id_tenant_id_key;
ALTER TABLE student_wallets DROP CONSTRAINT IF EXISTS student_wallets_student_id_key;
ALTER TABLE student_wallets ADD CONSTRAINT student_wallets_student_id_key UNIQUE (student_id);

-- Drop legacy balance column if it exists
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_wallets' AND column_name='balance') THEN
    ALTER TABLE student_wallets DROP COLUMN balance;
  END IF;
END $$;

-- Handle total_balance if it's missing (generated column)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_wallets' AND column_name='total_balance') THEN
    ALTER TABLE student_wallets ADD COLUMN total_balance INTEGER GENERATED ALWAYS AS (free_credits + paid_credits) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_student_wallets_student ON student_wallets(student_id);
CREATE INDEX IF NOT EXISTS idx_student_wallets_tenant  ON student_wallets(tenant_id);

-- ─── 2. WALLET TRANSACTIONS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  credit_type   TEXT NOT NULL CHECK (credit_type IN ('free', 'paid')),
  txn_type      TEXT NOT NULL CHECK (txn_type IN ('credit', 'debit')),
  amount        INTEGER NOT NULL CHECK (amount > 0),
  balance_after INTEGER NOT NULL,
  source        TEXT CHECK (source IN ('enrollment', 'exam_fee', 'manual_topup', 'recharge', 'refund', 'expiry')),
  reference_id  UUID,    -- exam_id, order_id, etc.
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_txns_student ON wallet_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_tenant  ON wallet_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_created ON wallet_transactions(created_at DESC);

-- ─── 3. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE student_wallets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Student: read own wallet
CREATE POLICY "student_reads_own_wallet"
  ON student_wallets FOR SELECT
  USING (student_id = auth.uid());

-- Student: read own transactions
CREATE POLICY "student_reads_own_txns"
  ON wallet_transactions FOR SELECT
  USING (student_id = auth.uid());

-- Tenant admin: read all wallets in their tenant
CREATE POLICY "tenant_admin_reads_wallets"
  ON student_wallets FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner')
    )
  );

-- Tenant admin: read all transactions in their tenant
CREATE POLICY "tenant_admin_reads_txns"
  ON wallet_transactions FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin', 'owner')
    )
  );

-- Owner: full access
CREATE POLICY "owner_full_wallet_access"
  ON student_wallets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner'
  ));

CREATE POLICY "owner_full_txn_access"
  ON wallet_transactions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner'
  ));

COMMENT ON TABLE student_wallets IS
  'Dual-balance wallet per student. free_credits from enrollment; paid_credits from recharges. Free credits are always consumed first.';

COMMENT ON TABLE wallet_transactions IS
  'Immutable audit log of all wallet credit and debit events. credit_type distinguishes free vs paid to drive commission logic.';
