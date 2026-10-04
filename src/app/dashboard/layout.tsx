"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  ClipboardList,
  BookOpen,
  BrainCircuit,
  LayoutGrid,
  ScanLine,
  Edit3,
  Headset,
  Wallet,
  CreditCard,
  Share2,
  Globe,
  BellRing,
  BarChart2,
  BarChart3,
  PieChart,
  TrendingUp,
  Settings,
  Zap,
  LogOut,
  MessagesSquare,
  Calendar,
  UserCircle,
  GraduationCap,
  School,
  AlertCircle,
  Printer,
  SlidersHorizontal,
  Layers,
  Activity,
  FileText,
  FileBarChart2,
  ChevronDown,
} from "lucide-react";
import { IdentityProvider, useIdentity } from "@/contexts/IdentityContext";
import { C, GRADIENT, getRoleAccent } from "@/lib/theme";
// NAVIGATION STRUCTURE
const NAV_GROUPS = [
  {
    title: "",
    roles: ["tenant_admin", "owner"],
    items: [
      {
        label: "Admin Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        roles: ["tenant_admin", "owner"],
      },
    ],
  },
  {
    title: "Create Exams",
    roles: ["tenant_admin", "owner", "teacher"],
    items: [
      {
        label: "Create Offline Exams",
        icon: Printer,
        href: "/dashboard/exams/offline",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Create OMR Sheets",
        icon: ScanLine,
        href: "/dashboard/exams/omr",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Create Online Exams",
        icon: Zap,
        href: "/dashboard/exams/online",
        roles: ["tenant_admin", "owner", "teacher"],
      },
    ],
  },
  {
    title: "Exam Master",
    roles: ["tenant_admin", "owner", "teacher"],
    items: [
      {
        label: "Exam Patterns",
        icon: SlidersHorizontal,
        href: "/dashboard/exams/templates",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Course Syllabus",
        icon: BookOpen,
        href: "/dashboard/syllabus",
        roles: ["tenant_admin", "owner", "teacher"],
      },
    ],
  },
  {
    title: "Student Zone",
    roles: ["tenant_admin", "owner", "teacher"],
    items: [
      {
        label: "Student List",
        icon: Users,
        href: "/dashboard/students",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Student Migration",
        icon: Calendar,
        href: "/dashboard/tenant/academic-year",
        roles: ["tenant_admin", "owner"],
      },
    ],
  },
  {
    title: "Teacher Zone",
    roles: ["tenant_admin", "owner", "teacher"],
    items: [
      {
        label: "Teacher List",
        icon: UsersRound,
        href: "/dashboard/teachers",
        roles: ["tenant_admin", "owner"],
        tenantTypes: ["institute", "school"],
      },
      {
        label: "Notes & Homework",
        icon: BookOpen,
        href: "/dashboard/material",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Grade Answer Sheets",
        icon: Edit3,
        href: "/dashboard/faculty/answer-grading",
        roles: ["tenant_admin", "owner", "teacher"],
      },
    ],
  },
  {
    title: "Communication",
    roles: ["tenant_admin", "owner", "teacher"],
    items: [
      {
        label: "Notice Board",
        icon: BellRing,
        href: "/dashboard/messages",
        roles: ["tenant_admin", "owner", "teacher"],
      },
    ],
  },
  {
    title: "Revenue and Payments",
    roles: ["tenant_admin", "owner"],
    items: [
      {
        label: "Payments & Fees",
        icon: Wallet,
        href: "/dashboard/wallet",
        roles: ["tenant_admin", "owner"],
      },
    ],
  },
  {
    title: "Reports & Analytics",
    roles: ["tenant_admin", "owner", "teacher"],
    items: [
      {
        label: "Results Analytics",
        icon: BarChart3,
        href: "/dashboard/faculty/analytics/results-360",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Students Report",
        icon: GraduationCap,
        href: "/dashboard/reports?type=students",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Teacher Report",
        icon: UsersRound,
        href: "/dashboard/reports?type=teachers",
        roles: ["tenant_admin", "owner"],
      },
      {
        label: "Class Report",
        icon: Layers,
        href: "/dashboard/reports?type=class",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Subject Report",
        icon: BookOpen,
        href: "/dashboard/reports?type=subject",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Chapter & Topic Analytic",
        icon: PieChart,
        href: "/dashboard/reports?type=chapters",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "School Performance Report",
        icon: Activity,
        href: "/dashboard/reports?type=performance",
        roles: ["tenant_admin", "owner"],
      },
    ],
  },
  {
    title: "School/Institute Setup",
    roles: ["tenant_admin", "owner"],
    items: [
      {
        label: "Academy Setup",
        icon: School,
        href: "/dashboard/academy",
        roles: ["tenant_admin", "owner"],
      },
      {
        label: "Subscription",
        icon: CreditCard,
        href: "/dashboard/subscription",
        roles: ["tenant_admin", "owner"],
      },
      {
        label: "Institute Settings",
        icon: Settings,
        href: "/dashboard/settings",
        roles: ["tenant_admin", "owner"],
      },
    ],
  },
  {
    title: "My Referrals",
    roles: ["teacher", "student"],
    tenantTypes: ["institute"],
    items: [
      {
        label: "Affiliate Hub",
        icon: Share2,
        href: "/dashboard/affiliates/hub",
        roles: ["teacher", "student"],
      },
    ],
  },
  {
    title: "My Studies",
    roles: ["student", "parent"],
    items: [
      {
        label: "My Exams",
        icon: ClipboardList,
        href: "/dashboard/student/exams",
        roles: ["student", "parent"],
      },
      {
        label: "Course Syllabus",
        icon: LayoutGrid,
        href: "/dashboard/syllabus",
        roles: ["student", "parent"],
      },
      {
        label: "Notes & Homework",
        icon: BookOpen,
        href: "/dashboard/student/materials",
        roles: ["student", "parent"],
      },
    ],
  },
  {
    title: "My Progress",
    roles: ["student", "parent"],
    items: [
      {
        label: "My Report Card",
        icon: BarChart3,
        href: "/dashboard/student/analytics",
        roles: ["student", "parent"],
      },
      {
        label: "Practice Tests",
        icon: BrainCircuit,
        href: "/dashboard/student/custom-exam",
        roles: ["student"],
      },
    ],
  },
  {
    title: "Fees & Profile",
    roles: ["student", "parent"],
    items: [
      {
        label: "Fees & Wallet",
        icon: Wallet,
        href: "/dashboard/student/wallet",
        roles: ["student", "parent"],
      },
      {
        label: "Notice Board",
        icon: Share2,
        href: "/dashboard/student/messages",
        roles: ["student", "parent"],
      },
      {
        label: "My Profile",
        icon: UserCircle,
        href: "/dashboard/student/profile",
        roles: ["student"],
      },
    ],
  },
];
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAttemptMode = pathname.includes("/exams/attempt/");
  const [role, setRole] = useState<string | null>(null);
  const [identityLocal, setIdentityLocal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const { identity, setIdentity } = useIdentity();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSearchQuery(window.location.search);
      const onPop = () => setSearchQuery(window.location.search);
      window.addEventListener("popstate", onPop);
      return () => window.removeEventListener("popstate", onPop);
    }
  }, [pathname]);
  useEffect(() => {
    const fetchMe = async () => {
      const timeout = setTimeout(() => {
        if (loading) {
          setError("Loading timed out. Please refresh.");
          setLoading(false);
        }
      }, 5000);
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        if (!res.ok) throw new Error(`API failure: ${res.status}`);
        const data = await res.json();
        clearTimeout(timeout);
        if (data.is_first_login) {
          router.push("/auth/change-password?first=true");
          return;
        }
        setRole(data.role);
        setIdentityLocal(data);
        setIdentity(data); // ← share with child pages via context (eliminates duplicate fetch)
        setReady(true);
      } catch (err: any) {
        clearTimeout(timeout);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [router, setIdentity]);
  const handleSignout = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/auth/login";
  };
  const logoUrl =
    identityLocal?.tenant?.logo_url ||
    "/logo.png";
  const instituteName =
    identityLocal?.tenant?.name || (identityLocal ? "Hub" : "Loading...");
  const userName =
    identityLocal?.fullName || (identityLocal ? "Member" : "Loading...");
  const userRole = (identityLocal?.role || role || "admin").toLowerCase();
  const roleBadgeConfig: Record<string, { label: string; bg: string; color: string; border: string }> = {
    teacher: { label: "TEACHER", bg: "#ECFDF5", color: "#09834F", border: "#A7F3D0" },
    student: { label: "STUDENT", bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    parent: { label: "PARENT", bg: "#F0FDFA", color: "#0D9488", border: "#99F6E4" },
    owner: { label: "OWNER", bg: "#EEF2FF", color: "#4F46E5", border: "#E0E7FF" },
    tenant_admin: { label: "ADMIN", bg: "#E5F3FB", color: "#0868B2", border: "#DBEAFE" },
    admin: { label: "ADMIN", bg: "#E5F3FB", color: "#0868B2", border: "#DBEAFE" },
  };
  const currentBadge = roleBadgeConfig[userRole] || {
    label: userRole.toUpperCase(),
    bg: "#E5F3FB",
    color: "#0868B2",
    border: "#DBEAFE",
  };
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--color-bg)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* ── SIDEBAR ── */}
      {!isAttemptMode && (
        <aside
          style={{
            width: 280,
            minWidth: 280,
            background: "var(--color-bg-card)",
            borderRight: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "var(--shadow-card)",
            zIndex: 20,
          }}
        >
          {/* ── BRAND ── */}
          <div
            style={{
              height: 140,
              padding: "0 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderBottom: "1px solid var(--color-border)",
              flexShrink: 0,
              gap: 12,
            }}
          >
            <img
              src={logoUrl}
              alt="Institute Logo"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png' }}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: 50,
                objectFit: "contain",
                alignSelf: "flex-end",
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: C.primaryBlue,                  /* official: #0868B2 */
                  textAlign: "left",
                  lineHeight: 1.3,
                }}
              >
                {instituteName}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.textSecondary,
                    textTransform: "uppercase",
                  }}
                >
                  {userName}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 4,
                    background: currentBadge.bg,
                    color: currentBadge.color,
                    border: `1px solid ${currentBadge.border}`,
                  }}
                >
                  {currentBadge.label}
                </span>
              </div>
            </div>
          </div>
          {/* ── NAV ITEMS ── */}
          <nav
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {loading ? (
              <div
                style={{
                  padding: "20px 12px",
                  color: "var(--color-text-muted)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Loading Workspace...
              </div>
            ) : (
              NAV_GROUPS.filter((group: any) => {
                const roleMatch =
                  !group.roles || group.roles.includes(role || "");
                const typeMatch =
                  !group.tenantTypes ||
                  group.tenantTypes.includes(
                    identity?.tenant?.tenant_type || "institute",
                  );
                return roleMatch && typeMatch;
              }).map((group: any, gid) => {
                const validItems = group.items.filter((item: any) => {
                  const roleMatch =
                    !item.roles || item.roles.includes(role || "");
                  const typeMatch =
                    !item.tenantTypes ||
                    item.tenantTypes.includes(
                      identity?.tenant?.tenant_type || "institute",
                    );
                  return roleMatch && typeMatch;
                });
                if (validItems.length === 0 && group.title !== "Platform Core")
                  return null;
                const hasGroupTitle = Boolean(group.title && group.title.trim().length > 0);
                const isExpanded = !hasGroupTitle || expandedGroup === group.title;

                return (
                  <div key={gid} style={{ marginBottom: hasGroupTitle ? 8 : 4 }}>
                    {hasGroupTitle && (
                      <button
                        type="button"
                        onClick={() => setExpandedGroup(expandedGroup === group.title ? null : group.title)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: isExpanded ? "rgba(8, 104, 178, 0.05)" : "transparent",
                          border: "none",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#092746",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: 4,
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) (e.currentTarget as HTMLButtonElement).style.background = "rgba(8, 104, 178, 0.03)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        }}
                      >
                        <span style={{ color: "#092746", fontWeight: 800 }}>{group.title}</span>
                        <ChevronDown
                          size={14}
                          style={{
                            color: "#64748B",
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                            flexShrink: 0,
                          }}
                        />
                      </button>
                    )}
                    {isExpanded && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: hasGroupTitle ? 4 : 0 }}>
                        {validItems.map((item: any) => {
                          const active = (() => {
                            if (item.href === "/dashboard") return pathname === "/dashboard";
                            const [base, query] = item.href.split("?");
                            if (query) {
                              return pathname === base && searchQuery === `?${query}`;
                            }
                            return pathname === base || (base !== "/dashboard" && pathname.startsWith(base + "/"));
                          })();
                          // Specialized Labeling for Dashboards
                          let displayLabel = item.label;
                          if (
                            item.href === "/dashboard" ||
                            item.href === "/dashboard/"
                          ) {
                            if (role === "parent")
                              displayLabel = "Parent Dashboard";
                            else if (role === "student")
                              displayLabel = "Student Dashboard";
                            else if (role === "teacher")
                              displayLabel = "Teacher Dashboard";
                            else if (role === "tenant_admin" || role === "owner")
                              displayLabel = "Admin Dashboard";
                          }
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => {
                                const [, q] = item.href.split("?");
                                setSearchQuery(q ? `?${q}` : "");
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "10px 14px",
                                borderRadius: 10,
                                textDecoration: "none",
                                background: active
                                  ? "#E5F3FB"
                                  : "transparent",
                                color: active
                                  ? "#0868B2"
                                  : "#475569",
                                border: active
                                  ? "1px solid #B6DCF2"
                                  : "1px solid transparent",
                                fontWeight: active ? 700 : 500,
                                fontSize: 13,
                                transition: "all 0.15s ease",
                                marginBottom: 2,
                              }}
                              onMouseEnter={(e) => {
                                if (!active) {
                                  (
                                    e.currentTarget as HTMLAnchorElement
                                  ).style.background = "#F2F9FD";
                                  (
                                    e.currentTarget as HTMLAnchorElement
                                  ).style.color = "#07549A";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!active) {
                                  (
                                    e.currentTarget as HTMLAnchorElement
                                  ).style.background = "transparent";
                                  (
                                    e.currentTarget as HTMLAnchorElement
                                  ).style.color = "#475569";
                                }
                              }}
                            >
                              <item.icon
                                size={18}
                                strokeWidth={active ? 2.5 : 2}
                                style={{
                                  color: active
                                    ? "#0868B2"
                                    : "#64748B",
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {displayLabel}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #E2E8F0",
              background: "#FFFFFF",
            }}
          >
            <button
              onClick={handleSignout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #E2E8F0",
                background: "#FFFFFF",
                color: "#475569",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2";
                (e.currentTarget as HTMLButtonElement).style.color = "#DC2626";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#FCA5A5";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF";
                (e.currentTarget as HTMLButtonElement).style.color = "#475569";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0";
              }}
            >
              <LogOut size={16} strokeWidth={2} /> Logout
            </button>
          </div>
        </aside>
      )}
      {/* ── MAIN CONTENT ── */}
      <main
        style={{
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {ready ? (
          children
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              flexDirection: "column",
              gap: 16,
              background: "var(--color-bg)",
            }}
          >
            {error ? (
              <div style={{ textAlign: "center" }}>
                <AlertCircle
                  size={48}
                  color="var(--color-danger)"
                  style={{ marginBottom: 16 }}
                />
                <p style={{ color: "var(--color-danger)", fontWeight: 800 }}>
                  {error}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    marginTop: 16,
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--color-primary)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: `3px solid var(--color-primary)`,
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontWeight: 700,
                    fontSize: 13,
                    margin: 0,
                  }}
                >
                  Preparing your workspace…
                </p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IdentityProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </IdentityProvider>
  );
}
