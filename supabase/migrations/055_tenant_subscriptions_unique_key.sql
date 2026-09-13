-- ============================================================
-- Migration 055 — Tenant Subscriptions Unqualified Unique Key
-- Supports ON CONFLICT (tenant_id) upserts for tenant billing/plan assignments
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS tenant_subscriptions_tenant_id_key 
ON public.tenant_subscriptions(tenant_id);
