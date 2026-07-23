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
} from "lucide-react";
import { IdentityProvider, useIdentity } from "@/contexts/IdentityContext";
// NAVIGATION STRUCTURE
const NAV_GROUPS = [
  {
    title: "Academic Records",
    roles: ["tenant_admin", "owner", "teacher"],
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        roles: ["tenant_admin", "owner", "teacher", "student", "parent"],
      },
      {
        label: "Online Exam Portal",
        icon: Zap,
        href: "/dashboard/exams/online",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "OMR Scanner Hub",
        icon: ScanLine,
        href: "/dashboard/exams/omr",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Offline Paper Engine",
        icon: Printer,
        href: "/dashboard/exams/offline",
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
    title: "Evaluation Hub",
    roles: ["tenant_admin", "owner", "teacher"],
    items: [
      {
        label: "Grade Answer Sheets",
        icon: Edit3,
        href: "/dashboard/faculty/answer-grading",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Result Analytics",
        icon: BarChart3,
        href: "/dashboard/faculty/analytics/results-360",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "AI Question Gen",
        icon: BrainCircuit,
        href: "/dashboard/ai",
        roles: ["tenant_admin", "owner", "teacher"],
      },
    ],
  },
  {
    title: "Student Directory",
    roles: ["tenant_admin", "owner", "teacher"],
    items: [
      {
        label: "Student List",
        icon: Users,
        href: "/dashboard/students",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Notes & Homework",
        icon: BookOpen,
        href: "/dashboard/material",
        roles: ["tenant_admin", "owner", "teacher"],
      },
      {
        label: "Notice Board",
        icon: Share2,
        href: "/dashboard/messages",
        roles: ["tenant_admin", "owner", "teacher"],
      },
    ],
  },
  {
    title: "Academy Management",
    roles: ["tenant_admin", "owner"],
    items: [
      {
        label: "Academy Setup",
        icon: School,
        href: "/dashboard/academy",
        roles: ["tenant_admin", "owner"],
      },
      {
        label: "Academic Lifecycle",
        icon: Calendar,
        href: "/dashboard/tenant/academic-year",
        roles: ["tenant_admin", "owner"],
      },
      {
        label: "Teacher List",
        icon: UsersRound,
        href: "/dashboard/teachers",
        roles: ["tenant_admin", "owner"],
        tenantTypes: ["institute", "school"],
      },
      {
        label: "Payments & Fees",
        icon: Wallet,
        href: "/dashboard/wallet",
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
    title: "Affiliate Network",
    roles: ["tenant_admin", "owner"],
    tenantTypes: ["institute"],
    items: [
      {
        label: "Affiliate Hub",
        icon: Share2,
        href: "/dashboard/affiliates/hub",
        roles: ["tenant_admin", "owner"],
      },
      {
        label: "Partner Teachers",
        icon: Users,
        href: "/dashboard/affiliates/teachers",
        roles: ["tenant_admin", "owner"],
      },
      {
        label: "Student Referrals",
        icon: GraduationCap,
        href: "/dashboard/affiliates/students",
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
  const { identity, setIdentity } = useIdentity();
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
    "https://bfzlkdurgggzytegvvrw.supabase.co/storage/v1/object/public/bebrilliant/Logo2.jpeg";
  const instituteName =
    identityLocal?.tenant?.name || (identityLocal ? "Hub" : "Loading...");
  const userName =
    identityLocal?.fullName || (identityLocal ? "Member" : "Loading...");
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
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#004B93",
                  textAlign: "right",
                }}
              >
                {instituteName}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#EF4444",
                  textTransform: "uppercase",
                  textAlign: "right",
                }}
              >
                {userName}
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
                return (
                  <div key={gid} style={{ marginBottom: 16 }}>
                    {group.title && (
                      <p
                        style={{
                          padding: "0 12px",
                          fontSize: 10,
                          fontWeight: 800,
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: 8,
                        }}
                      >
                        {group.title}
                      </p>
                    )}
                    {validItems.map((item: any) => {
                      const active =
                        pathname === item.href ||
                        (item.href !== "/dashboard" &&
                          pathname.startsWith(item.href));
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
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 14px",
                            borderRadius: 10,
                            textDecoration: "none",
                            background: active
                              ? "var(--color-primary-gradient)"
                              : "transparent",
                            color: active
                              ? "#fff"
                              : "var(--color-text-secondary)",
                            fontWeight: active ? 800 : 700,
                            fontSize: 13,
                            transition: "all 0.1s",
                            marginBottom: 4,
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              (
                                e.currentTarget as HTMLAnchorElement
                              ).style.background = "var(--color-bg-card2)";
                              (
                                e.currentTarget as HTMLAnchorElement
                              ).style.color = "var(--color-text-primary)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              (
                                e.currentTarget as HTMLAnchorElement
                              ).style.background = "transparent";
                              (
                                e.currentTarget as HTMLAnchorElement
                              ).style.color = "var(--color-text-secondary)";
                            }
                          }}
                        >
                          <item.icon
                            size={18}
                            strokeWidth={active ? 2.5 : 2}
                            style={{
                              color: active
                                ? "#fff"
                                : "var(--color-text-muted)",
                            }}
                          />
                          {displayLabel}
                        </Link>
                      );
                    })}
                  </div>
                );
              })
            )}
          </nav>
          <div
            style={{
              padding: "20px",
              borderTop: "1px solid var(--color-border)",
              background: "var(--color-bg-card)",
            }}
          >
            <button
              onClick={handleSignout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px",
                borderRadius: 12,
                border: "none",
                background: "#FEF2F2",
                color: "#EF4444",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.1s",
              }}
            >
              <LogOut size={16} strokeWidth={2.5} /> Logout
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
