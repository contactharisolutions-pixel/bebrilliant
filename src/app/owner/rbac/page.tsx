"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield, Users, Key, Lock, RefreshCw, Search, X, Loader2,
  CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight,
  UserCheck, UserX, Crown, User, Activity, Building2, ClipboardList,
  Eye, Pencil, ToggleLeft, ToggleRight, Download, Mail, Plus,
  MoreHorizontal, Clock, Ban, Unlock, RotateCcw, Filter,
  ChevronDown, Send, Trash2, Monitor, Laptop, Smartphone,
} from "lucide-react";

// ── PALETTE ──────────────────────────────────────────────────────────────────
const P = {
  bg: "#F7F8FA", card: "#FEFEFE", border: "#E8E8E8",
  brand: "#004B93", brandBg: "#EEF4FF", brandLight: "#DBEAFE",
  cta: "#F0A026", ctaBg: "#FFF7E6",
  dark: "#1B1D21", text: "#5A5A5A", muted: "#A5A2A6", hover: "#F1F2F4",
  success: "#059669", successBg: "#ECFDF5",
  warning: "#D97706", warningBg: "#FFFBEB",
  error: "#DC2626", errorBg: "#FEF2F2",
  info: "#2563EB", infoBg: "#EFF6FF",
  purple: "#7C3AED", purpleBg: "#F5F3FF",
};

// ── ROLE CONFIG ───────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; badge: string }> = {
  owner:            { label: "Platform Owner",        color: P.brand,   bg: P.brandBg,   badge: "👑" },
  platform_staff:   { label: "Platform Staff",        color: P.brand,   bg: P.brandBg,   badge: "🛡️" },
  sales_exec:       { label: "Sales Executive",       color: P.purple,  bg: P.purpleBg,  badge: "💼" },
  demo_exec:        { label: "Demo Executive",        color: P.info,    bg: P.infoBg,    badge: "📺" },
  onboarding_spec:  { label: "Onboarding Specialist", color: P.success, bg: P.successBg, badge: "🚀" },
  tenant_admin:     { label: "Tenant Admin",          color: P.cta,     bg: P.ctaBg,     badge: "🏢" },
  teacher:          { label: "Teacher",               color: P.info,    bg: P.infoBg,    badge: "📚" },
  teacher_pending:  { label: "Teacher (Pending)",     color: P.warning, bg: P.warningBg, badge: "⏳" },
  student:          { label: "Student",               color: P.success, bg: P.successBg, badge: "🎓" },
  parent:           { label: "Parent",                color: P.muted,   bg: P.hover,     badge: "👪" },
};

const PLATFORM_STAFF_ROLES = ["owner", "platform_staff", "sales_exec", "demo_exec", "onboarding_spec"];
const ALL_ROLES = Object.keys(ROLE_CONFIG);

const SEVERITY_CONFIG = {
  info:     { color: P.info,    bg: P.infoBg,    label: "Info" },
  warning:  { color: P.warning, bg: P.warningBg, label: "Warning" },
  critical: { color: P.error,   bg: P.errorBg,   label: "Critical" },
};

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ background: bg, color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color, bg }: any) {
  return (
    <div style={{ background: P.card, border: "1px solid " + P.border, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: P.dark, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: P.muted, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, background: ok ? P.success : P.error, color: "#fff", borderRadius: 12, padding: "12px 20px", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", zIndex: 9999, animation: "slideUp 0.3s ease" }}>
      {ok ? <CheckCircle size={16} /> : <XCircle size={16} />} {msg}
    </div>
  );
}

// ── INVITE MODAL ──────────────────────────────────────────────────────────────
function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", role: "sales_exec" });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch("/api/owner/rbac/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
      onDone();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: P.card, borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: P.brandBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mail size={18} color={P.brand} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>Invite Platform Staff</div>
            <div style={{ fontSize: 12, color: P.muted }}>Account will be created and welcome email sent</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", display: "flex" }}><X size={18} color={P.muted} /></button>
        </div>

        {result ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle size={48} color={P.success} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: P.dark, marginBottom: 6 }}>Staff Account Created!</div>
            <div style={{ fontSize: 13, color: P.text, marginBottom: 16 }}>{result.message}</div>
            {result.temp_password && (
              <div style={{ background: P.warningBg, border: "1px solid " + P.warning, borderRadius: 10, padding: 14, fontSize: 13, textAlign: "left" }}>
                <div style={{ fontWeight: 700, color: P.warning, marginBottom: 4 }}>⚠️ Temporary Password</div>
                <code style={{ fontFamily: "monospace", fontSize: 15, color: P.dark }}>{result.temp_password}</code>
                <div style={{ fontSize: 11, color: P.muted, marginTop: 6 }}>Share securely — user will be prompted to change on first login.</div>
              </div>
            )}
            <button onClick={onClose} style={{ marginTop: 20, background: P.brand, color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Done</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: P.muted, display: "block", marginBottom: 6 }}>First Name</label>
                <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="John" style={{ width: "100%", padding: "9px 12px", border: "1px solid " + P.border, borderRadius: 9, fontSize: 13, background: P.bg, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: P.muted, display: "block", marginBottom: 6 }}>Last Name</label>
                <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Smith" style={{ width: "100%", padding: "9px 12px", border: "1px solid " + P.border, borderRadius: 9, fontSize: 13, background: P.bg, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: P.muted, display: "block", marginBottom: 6 }}>Email Address *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john.smith@company.com" style={{ width: "100%", padding: "9px 12px", border: "1px solid " + P.border, borderRadius: 9, fontSize: 13, background: P.bg, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: P.muted, display: "block", marginBottom: 6 }}>Role *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ width: "100%", padding: "9px 12px", border: "1px solid " + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: "none", fontWeight: 600 }}>
                {PLATFORM_STAFF_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_CONFIG[r]?.badge} {ROLE_CONFIG[r]?.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "10px 0", border: "1px solid " + P.border, borderRadius: 10, fontWeight: 700, cursor: "pointer", background: P.bg, fontSize: 13, color: P.text }}>Cancel</button>
              <button onClick={submit} disabled={saving || !form.email || !form.role} style={{ flex: 2, padding: "10px 0", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", background: P.brand, color: "#fff", fontSize: 13, opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {saving ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Creating...</> : <><Send size={14} /> Create & Send Invite</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SUSPEND MODAL ─────────────────────────────────────────────────────────────
function SuspendModal({ user, onClose, onDone }: { user: any; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!reason.trim()) return alert("Please enter a reason.");
    setSaving(true);
    try {
      const res = await fetch(`/api/owner/rbac/users/${user.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, duration_days: duration ? parseInt(duration) : undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onDone();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: P.card, borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: P.errorBg, display: "flex", alignItems: "center", justifyContent: "center" }}><Ban size={18} color={P.error} /></div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: P.dark }}>Suspend User</div>
            <div style={{ fontSize: 12, color: P.muted }}>{user.first_name} {user.last_name} • {user.email}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}><X size={18} color={P.muted} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: P.muted, display: "block", marginBottom: 6 }}>Suspension Reason *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Describe the reason for suspension..." style={{ width: "100%", padding: "9px 12px", border: "1px solid " + P.border, borderRadius: 9, fontSize: 13, resize: "none", boxSizing: "border-box", outline: "none", background: P.bg }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: P.muted, display: "block", marginBottom: 6 }}>Duration (days, optional)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Leave blank for indefinite" min={1} style={{ width: "100%", padding: "9px 12px", border: "1px solid " + P.border, borderRadius: 9, fontSize: 13, background: P.bg, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px 0", border: "1px solid " + P.border, borderRadius: 10, fontWeight: 700, cursor: "pointer", background: P.bg, fontSize: 13 }}>Cancel</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, padding: "10px 0", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", background: P.error, color: "#fff", fontSize: 13, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Suspending..." : "Confirm Suspend"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function RBACPage() {
  const [tab, setTab] = useState<"users" | "roles" | "invites" | "audit" | "sessions">("users");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // User Directory state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");

  // Permissions state
  const [permData, setPermData] = useState<any>(null);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState<Record<string, boolean>>({});

  // Invites state
  const [invites, setInvites] = useState<any[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditFilter, setAuditFilter] = useState("all");
  const [auditSeverity, setAuditSeverity] = useState("all");

  // Modals
  const [suspendTarget, setSuspendTarget] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params = new URLSearchParams({
        search, role: roleFilter, tenant: tenantFilter, page: String(page)
      });
      const res = await fetch(`/api/owner/rbac?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [search, roleFilter, tenantFilter, page]);

  const fetchPermissions = useCallback(async () => {
    setPermLoading(true);
    try {
      const res = await fetch("/api/owner/rbac/permissions");
      if (res.ok) setPermData(await res.json());
    } finally { setPermLoading(false); }
  }, []);

  const fetchInvites = useCallback(async () => {
    setInvitesLoading(true);
    try {
      const res = await fetch("/api/owner/rbac/invites");
      if (res.ok) { const d = await res.json(); setInvites(d.invites ?? []); }
    } finally { setInvitesLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (tab === "roles") fetchPermissions(); }, [tab, fetchPermissions]);
  useEffect(() => { if (tab === "invites") fetchInvites(); }, [tab, fetchInvites]);
  useEffect(() => {
    if (data?.auditLogs) setAuditLogs(data.auditLogs);
  }, [data]);

  async function handleToggleActive(user: any) {
    try {
      await fetch(`/api/owner/rbac/users/${user.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active })
      });
      showToast(user.is_active ? "User suspended" : "User activated", !user.is_active);
      fetchData(true);
    } catch { showToast("Action failed", false); }
  }

  async function handlePasswordReset(userId: string, email: string) {
    try {
      const res = await fetch(`/api/owner/rbac/users/${userId}/reset-password`, { method: "POST" });
      if (!res.ok) throw new Error();
      showToast(`Password reset email sent to ${email}`);
    } catch { showToast("Failed to send reset email", false); }
  }

  async function handlePermissionToggle(roleId: string, permId: string, currentlyGranted: boolean) {
    const key = `${roleId}-${permId}`;
    setPermSaving(s => ({ ...s, [key]: true }));
    try {
      await fetch("/api/owner/rbac/permissions", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: roleId, permission_id: permId, grant: !currentlyGranted })
      });
      fetchPermissions();
      showToast(!currentlyGranted ? "Permission granted" : "Permission revoked");
    } catch { showToast("Failed to update permission", false); }
    finally { setPermSaving(s => ({ ...s, [key]: false })); }
  }

  async function handleRevokeInvite(id: string) {
    if (!confirm("Revoke this invitation?")) return;
    await fetch(`/api/owner/rbac/invites/${id}`, { method: "DELETE" });
    showToast("Invite revoked");
    fetchInvites();
  }

  async function exportUsers() {
    const params = new URLSearchParams({ search, role: roleFilter, tenant: tenantFilter });
    window.open(`/api/owner/rbac/users/export?${params}`, "_blank");
  }

  const users = data?.users ?? [];
  const stats = data?.stats ?? {};
  const s = stats;

  const filteredLogs = auditLogs
    .filter(l => auditSeverity === "all" || l.severity === auditSeverity)
    .filter(l => auditFilter === "all" || l.module === auditFilter);

  const totalPages = Math.ceil((data?.usersTotal ?? 0) / 25);

  const TABS: { key: string; label: string; icon: any; count?: number }[] = [
    { key: "users",   label: "User Directory",   icon: Users,    count: data?.usersTotal },
    { key: "roles",   label: "Role Manager",      icon: Shield },
    { key: "invites", label: "Staff Invites",     icon: Mail,     count: invites.filter(i => i.status === "pending").length || undefined },
    { key: "audit",   label: "Activity Audit",    icon: Activity, count: filteredLogs.length || undefined },
    { key: "sessions",label: "Sessions",           icon: Monitor },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={36} color={P.brand} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <div style={{ color: P.muted, fontWeight: 600 }}>Loading users & permissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: P.bg, padding: "28px 32px", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } * { box-sizing: border-box; }`}</style>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} onDone={() => { setShowInviteModal(false); fetchData(true); showToast("Staff account created successfully!"); }} />}
      {suspendTarget && <SuspendModal user={suspendTarget} onClose={() => setSuspendTarget(null)} onDone={() => { setSuspendTarget(null); fetchData(true); showToast("User suspended"); }} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: P.dark, letterSpacing: "-0.5px" }}>Users & Permissions</div>
          <div style={{ fontSize: 14, color: P.muted, marginTop: 4 }}>Enterprise RBAC — manage staff, roles, permissions and activity</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => fetchData(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: P.card, border: "1px solid " + P.border, borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, color: P.text }}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} /> Refresh
          </button>
          <button onClick={exportUsers} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: P.card, border: "1px solid " + P.border, borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, color: P.text }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setShowInviteModal(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: P.brand, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#fff" }}>
            <Plus size={14} /> Invite Staff
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <MetricCard icon={Users}     label="Total Users"  value={s.totalUsers ?? 0} sub={(s.activeUsers ?? 0) + " active"} color={P.brand}   bg={P.brandBg} />
        <MetricCard icon={UserCheck} label="Active"       value={s.activeUsers ?? 0} color={P.success} bg={P.successBg} />
        <MetricCard icon={UserX}     label="Suspended"    value={(s.totalUsers ?? 0) - (s.activeUsers ?? 0)} color={P.error} bg={P.errorBg} />
        <MetricCard icon={Shield}    label="Roles Defined" value={s.totalRoles ?? 0} color={P.purple} bg={P.purpleBg} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid " + P.border }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 20px", background: "none", border: "none",
              cursor: "pointer", fontWeight: 700, fontSize: 13,
              color: tab === t.key ? P.brand : P.muted,
              borderBottom: tab === t.key ? "2px solid " + P.brand : "2px solid transparent",
              marginBottom: -2, transition: "all 0.15s",
            }}
          >
            <t.icon size={15} />
            {t.label}
            {t.count != null && t.count > 0 && (
              <span style={{ background: tab === t.key ? P.brand : P.border, color: tab === t.key ? "#fff" : P.muted, borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: USER DIRECTORY ─────────────────────────────────── */}
      {tab === "users" && (
        <div>
          {/* Role Distribution Quick Filter */}
          {(data?.roleDistribution ?? []).some((r: any) => r.count > 0) && (
            <div style={{ background: P.card, border: "1px solid " + P.border, borderRadius: 14, padding: "14px 18px", marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: P.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Filter by role:</span>
              {(data?.roleDistribution ?? []).filter((r: any) => r.count > 0).map((row: any) => {
                const cfg = ROLE_CONFIG[row.role] ?? ROLE_CONFIG.student;
                return (
                  <button key={row.role} onClick={() => { setRoleFilter(row.role); setPage(1); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid " + (roleFilter === row.role ? cfg.color : P.border), background: roleFilter === row.role ? cfg.bg : "transparent", cursor: "pointer", fontSize: 12, fontWeight: 700, color: cfg.color }}>
                    {cfg.badge} {cfg.label} <span style={{ background: cfg.color, color: "#fff", borderRadius: 10, padding: "0px 5px", fontSize: 10 }}>{row.count}</span>
                  </button>
                );
              })}
              {roleFilter !== "all" && (
                <button onClick={() => { setRoleFilter("all"); setPage(1); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px dashed " + P.border, background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 700, color: P.muted }}>
                  <X size={11} /> Clear
                </button>
              )}
            </div>
          )}

          {/* Search & Filters */}
          <div style={{ background: P.card, border: "1px solid " + P.border, borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
              <Search size={14} color={P.muted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email..." style={{ width: "100%", paddingLeft: 33, paddingRight: search ? 30 : 12, paddingTop: 8, paddingBottom: 8, border: "1px solid " + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: "none", color: P.dark }} />
              {search && <button onClick={() => { setSearch(""); setPage(1); }} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><X size={12} color={P.muted} /></button>}
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "8px 11px", border: "1px solid " + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: "none", fontWeight: 600, color: P.dark }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <select value={tenantFilter} onChange={e => { setTenantFilter(e.target.value); setPage(1); }} style={{ padding: "8px 11px", border: "1px solid " + P.border, borderRadius: 9, fontSize: 13, background: P.bg, outline: "none", fontWeight: 600, color: P.dark }}>
              <option value="all">All Tenants</option>
              {(data?.tenants ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{data?.usersTotal ?? 0} users</span>
          </div>

          {/* Bulk Actions Bar */}
          {selected.size > 0 && (
            <div style={{ background: P.brand, borderRadius: 12, padding: "11px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{selected.size} selected</span>
              <button onClick={() => { /* bulk suspend */ showToast("Bulk action coming soon"); }} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "6px 14px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Suspend All</button>
              <button onClick={() => { /* bulk activate */ showToast("Bulk action coming soon"); }} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "6px 14px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Activate All</button>
              <button onClick={() => setSelected(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", display: "flex" }}><X size={16} /></button>
            </div>
          )}

          {/* Users Table */}
          <div style={{ background: P.card, border: "1px solid " + P.border, borderRadius: 16, overflow: "hidden" }}>
            {users.length === 0 ? (
              <div style={{ padding: 80, textAlign: "center" }}>
                <Users size={48} color={P.border} style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>No users found</div>
                <div style={{ fontSize: 13, color: P.muted, marginTop: 6 }}>Adjust filters or search terms.</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                  <thead>
                    <tr style={{ background: P.bg, borderBottom: "1px solid " + P.border }}>
                      <th style={{ padding: "11px 16px", width: 40 }}>
                        <input type="checkbox" checked={selected.size === users.length && users.length > 0}
                          onChange={e => setSelected(e.target.checked ? new Set(users.map((u: any) => u.id)) : new Set())}
                          style={{ cursor: "pointer" }} />
                      </th>
                      {["User", "Role", "Tenant", "Status", "Joined", "Actions"].map(h => (
                        <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: P.muted, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any, i: number) => {
                      const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.student;
                      return (
                        <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? "1px solid " + P.border : "none", transition: "background 0.1s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = P.hover)}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "13px 16px" }}>
                            <input type="checkbox" checked={selected.has(u.id)}
                              onChange={e => setSelected(s => { const ns = new Set(s); e.target.checked ? ns.add(u.id) : ns.delete(u.id); return ns; })}
                              style={{ cursor: "pointer" }} />
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{cfg.badge}</div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>{[u.first_name, u.last_name].filter(Boolean).join(" ") || "Unnamed"}</div>
                                <div style={{ fontSize: 11, color: P.muted }}>{u.email ?? u.id.slice(0, 18) + "…"}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <Pill label={cfg.badge + " " + cfg.label} color={cfg.color} bg={cfg.bg} />
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{ fontSize: 12, color: P.muted }}>{(u.tenants as any)?.name ?? (u.tenant_id ? "Tenant" : "Platform")}</span>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <Pill label={u.is_active ? "Active" : "Suspended"} color={u.is_active ? P.success : P.error} bg={u.is_active ? P.successBg : P.errorBg} />
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <div style={{ fontSize: 12, color: P.muted }}>{new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <button title={u.is_active ? "Suspend" : "Activate"} onClick={() => u.is_active ? setSuspendTarget(u) : handleToggleActive(u)}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid " + (u.is_active ? P.errorBg : P.successBg), background: u.is_active ? P.errorBg : P.successBg, cursor: "pointer", fontSize: 11, fontWeight: 700, color: u.is_active ? P.error : P.success }}>
                                {u.is_active ? <><Ban size={11} /> Suspend</> : <><Unlock size={11} /> Activate</>}
                              </button>
                              <button title="Reset Password" onClick={() => handlePasswordReset(u.id, u.email)}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid " + P.border, background: P.bg, cursor: "pointer", fontSize: 11, fontWeight: 700, color: P.text }}>
                                <RotateCcw size={11} /> Reset
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 20 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "7px 14px", borderRadius: 9, border: "1px solid " + P.border, background: P.card, cursor: page === 1 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, color: page === 1 ? P.muted : P.dark, opacity: page === 1 ? 0.5 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "7px 14px", borderRadius: 9, border: "1px solid " + P.border, background: P.card, cursor: page === totalPages ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, color: page === totalPages ? P.muted : P.dark, opacity: page === totalPages ? 0.5 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ROLE MANAGER / PERMISSIONS MATRIX ──────────────── */}
      {tab === "roles" && (
        <div>
          <div style={{ background: P.card, border: "1px solid " + P.border, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid " + P.border, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: P.dark }}>Permission Matrix</div>
                <div style={{ fontSize: 12, color: P.muted }}>Toggle checkboxes to grant or revoke permissions per role</div>
              </div>
              {permLoading && <Loader2 size={16} color={P.brand} style={{ animation: "spin 1s linear infinite" }} />}
            </div>
            {permData ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: P.bg }}>
                      <th style={{ padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: P.muted, textTransform: "uppercase", minWidth: 200 }}>Permission</th>
                      {(permData.roles ?? []).map((r: any) => (
                        <th key={r.id} style={{ padding: "12px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, color: P.brand, textTransform: "uppercase", minWidth: 100 }}>
                          {ROLE_CONFIG[r.name]?.badge} {ROLE_CONFIG[r.name]?.label ?? r.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(permData.matrix ?? []).map((group: any) => (
                      <React.Fragment key={group.module}>
                        <tr>
                          <td colSpan={(permData.roles?.length ?? 0) + 1} style={{ padding: "8px 18px", background: P.brandBg, fontSize: 10, fontWeight: 800, color: P.brand, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {group.module}
                          </td>
                        </tr>
                        {group.permissions.map((perm: any) => (
                          <tr key={perm.id} style={{ borderBottom: "1px solid " + P.border }}
                            onMouseEnter={e => (e.currentTarget.style.background = P.hover)}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td style={{ padding: "10px 18px" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: P.dark }}>{perm.action}</div>
                              <div style={{ fontSize: 11, color: P.muted }}>{perm.description}</div>
                            </td>
                            {(permData.roles ?? []).map((role: any) => {
                              const granted = perm.assignedRoles.includes(role.name);
                              const key = `${role.id}-${perm.id}`;
                              const saving = permSaving[key];
                              return (
                                <td key={role.id} style={{ padding: "10px 14px", textAlign: "center" }}>
                                  {saving ? (
                                    <Loader2 size={14} color={P.brand} style={{ animation: "spin 1s linear infinite" }} />
                                  ) : (
                                    <button onClick={() => handlePermissionToggle(role.id, perm.id, granted)}
                                      style={{ width: 24, height: 24, borderRadius: 6, border: "2px solid " + (granted ? P.success : P.border), background: granted ? P.success : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", margin: "auto", transition: "all 0.15s" }}>
                                      {granted && <CheckCircle size={12} color="#fff" />}
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 60, textAlign: "center" }}>
                <Loader2 size={32} color={P.brand} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
                <div style={{ color: P.muted, fontWeight: 600 }}>Loading permissions matrix...</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: STAFF INVITES ──────────────────────────────────── */}
      {tab === "invites" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: P.dark }}>Staff Invitations</div>
            <button onClick={() => setShowInviteModal(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: P.brand, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#fff" }}>
              <Plus size={14} /> New Invite
            </button>
          </div>

          <div style={{ background: P.card, border: "1px solid " + P.border, borderRadius: 16, overflow: "hidden" }}>
            {invitesLoading ? (
              <div style={{ padding: 60, textAlign: "center" }}><Loader2 size={28} color={P.brand} style={{ animation: "spin 1s linear infinite" }} /></div>
            ) : invites.length === 0 ? (
              <div style={{ padding: 80, textAlign: "center" }}>
                <Mail size={48} color={P.border} style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>No staff invitations yet</div>
                <div style={{ fontSize: 13, color: P.muted, marginTop: 6 }}>Click "New Invite" to onboard a team member.</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: P.bg, borderBottom: "1px solid " + P.border }}>
                    {["Staff Member", "Role", "Status", "Invited", "Expires", "Actions"].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: P.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invites.map((inv: any, i) => {
                    const cfg = ROLE_CONFIG[inv.role] ?? ROLE_CONFIG.student;
                    const statusColors: any = { pending: { color: P.warning, bg: P.warningBg }, accepted: { color: P.success, bg: P.successBg }, expired: { color: P.muted, bg: P.hover }, revoked: { color: P.error, bg: P.errorBg } };
                    const sc = statusColors[inv.status] ?? statusColors.pending;
                    return (
                      <tr key={inv.id} style={{ borderBottom: i < invites.length - 1 ? "1px solid " + P.border : "none" }}
                        onMouseEnter={e => (e.currentTarget.style.background = P.hover)}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>{[inv.first_name, inv.last_name].filter(Boolean).join(" ") || "—"}</div>
                          <div style={{ fontSize: 11, color: P.muted }}>{inv.email}</div>
                        </td>
                        <td style={{ padding: "13px 16px" }}><Pill label={cfg.badge + " " + cfg.label} color={cfg.color} bg={cfg.bg} /></td>
                        <td style={{ padding: "13px 16px" }}><Pill label={inv.status} color={sc.color} bg={sc.bg} /></td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: P.muted }}>{new Date(inv.created_at).toLocaleDateString("en-IN")}</td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: P.muted }}>{inv.expires_at ? new Date(inv.expires_at).toLocaleDateString("en-IN") : "—"}</td>
                        <td style={{ padding: "13px 16px" }}>
                          {inv.status === "pending" && (
                            <button onClick={() => handleRevokeInvite(inv.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid " + P.errorBg, background: P.errorBg, cursor: "pointer", fontSize: 11, fontWeight: 700, color: P.error }}>
                              <Trash2 size={11} /> Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: ACTIVITY AUDIT ─────────────────────────────────── */}
      {tab === "audit" && (
        <div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
            <select value={auditSeverity} onChange={e => setAuditSeverity(e.target.value)} style={{ padding: "8px 12px", border: "1px solid " + P.border, borderRadius: 9, fontSize: 13, background: P.card, outline: "none", fontWeight: 600 }}>
              <option value="all">All Severity</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <select value={auditFilter} onChange={e => setAuditFilter(e.target.value)} style={{ padding: "8px 12px", border: "1px solid " + P.border, borderRadius: 9, fontSize: 13, background: P.card, outline: "none", fontWeight: 600 }}>
              <option value="all">All Modules</option>
              {[...new Set(auditLogs.map(l => l.module))].filter(Boolean).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginLeft: "auto" }}>{filteredLogs.length} events</span>
          </div>

          <div style={{ background: P.card, border: "1px solid " + P.border, borderRadius: 16, overflow: "hidden" }}>
            {filteredLogs.length === 0 ? (
              <div style={{ padding: 80, textAlign: "center" }}>
                <Activity size={48} color={P.border} style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>No audit events</div>
              </div>
            ) : (
              <div>
                {filteredLogs.map((log: any, i) => {
                  const sev = SEVERITY_CONFIG[log.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info;
                  return (
                    <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderBottom: i < filteredLogs.length - 1 ? "1px solid " + P.border : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = P.hover)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: sev.color, marginTop: 4, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: P.dark }}>{log.action.replace(/_/g, " ")}</span>
                          <Pill label={log.module} color={P.brand} bg={P.brandBg} />
                          <Pill label={sev.label} color={sev.color} bg={sev.bg} />
                        </div>
                        {log.details && (
                          <div style={{ fontSize: 11, color: P.muted, fontFamily: "monospace", background: P.bg, borderRadius: 6, padding: "3px 8px", display: "inline-block" }}>
                            {JSON.stringify(log.details).slice(0, 120)}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: P.muted, whiteSpace: "nowrap" }}>
                        {new Date(log.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: SESSIONS ──────────────────────────────────────── */}
      {tab === "sessions" && (
        <div style={{ background: P.card, border: "1px solid " + P.border, borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
          <Monitor size={48} color={P.border} style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 800, color: P.dark, marginBottom: 8 }}>Active Session Manager</div>
          <div style={{ fontSize: 13, color: P.muted }}>Session visibility requires Supabase Auth session API integration.</div>
          <div style={{ marginTop: 16, background: P.infoBg, border: "1px solid " + P.info, borderRadius: 10, padding: "12px 18px", display: "inline-block", textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: P.info, marginBottom: 4 }}>Coming in next phase</div>
            <div style={{ fontSize: 12, color: P.text }}>Will show device, browser, IP, last activity and force-logout controls.</div>
          </div>
        </div>
      )}
    </div>
  );
}
