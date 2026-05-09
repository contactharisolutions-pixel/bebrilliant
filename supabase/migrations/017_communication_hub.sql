-- ============================================================
-- BrightBoard Phase 6 — Communication Hub & Bulk Notifications
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── 1. MESSAGES TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- For individual messages
  recipient_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- For group/broadcast messages (e.g., "Physics-12A")
  group_id    TEXT, 
  
  content     TEXT NOT NULL,
  msg_type    TEXT NOT NULL DEFAULT 'text' CHECK (msg_type IN ('text', 'notification', 'system')),
  
  is_bulk      BOOLEAN DEFAULT FALSE,
  status       TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. ENABLE RLS ───────────────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ─── 3. SECURITY POLICIES ────────────────────────────────────────────────────

-- Anyone in the tenant can read messages they sent or were meant for them/their groups
-- Note: Simplified group check. In production, we'd check if auth.uid() belongs to group_id.
DROP POLICY IF EXISTS "tenant_read_messages" ON messages;
CREATE POLICY "tenant_read_messages" ON messages FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  AND (
    sender_id = auth.uid() 
    OR recipient_id = auth.uid() 
    OR group_id IS NOT NULL -- For now, groups are public within a tenant for read
  )
);

DROP POLICY IF EXISTS "tenant_send_messages" ON messages;
CREATE POLICY "tenant_send_messages" ON messages FOR INSERT WITH CHECK (
  tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  AND sender_id = auth.uid()
);

-- ─── 4. INDEXES ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id);
