/**
 * BeBrilliant Web — Official Design Tokens
 * Source of truth: Color Theme.docx + Web UI Core Design Strategy for BeBrilliant.docx
 *
 * Mirrors the CSS variables in globals.css for use in inline React styles.
 * Always import from here — never hardcode hex values in TSX files.
 */

// ── Color Constants ─────────────────────────────────────────────────────────
export const C = {
  // Brand
  primaryBlue:       '#1E3A8A',   // Deep navy — brand primary
  primaryBlueDark:   '#152A6E',   // Deeper navy
  primaryBlueMid:    '#2563EB',   // Interactive / accent blue
  primaryBlueLight:  '#EFF6FF',   // Accent blue bg (AI blocks)
  brandGreen:        '#0CA35C',   // Official brand green
  brandGreenLight:   '#DCFCE7',   // Brand green light bg

  // Functional colors
  success:           '#16A34A',   // Official success green
  successDark:       '#15803D',
  successBg:         '#DCFCE7',
  error:             '#DC2626',   // Official error red
  errorBg:           '#FEE2E2',
  warning:           '#F59E0B',   // Official warning amber
  warningDark:       '#D97706',
  warningBg:         '#FEF3C7',

  // Accent
  accent:            '#2563EB',   // Interactive blue (same as primaryBlueMid)
  purple:            '#672AEA',   // AI / premium purple (official)
  purpleLight:       '#F5F3FF',
  gold:              '#FFD486',   // Soft gold — use only for badges/highlights

  // Text
  textPrimary:       '#111827',   // Almost black
  textSecondary:     '#6B7280',   // Secondary text
  textMuted:         '#9CA3AF',   // Placeholder / disabled

  // Backgrounds
  bg:                '#FFFFFF',   // Main background
  bgAlt:             '#F7F8FA',   // Secondary bg (page body)
  bgCard:            '#FFFFFF',   // Card bg
  bgCard2:           '#F7F8FA',   // Subtle card variant

  // AI Blocks
  aiBg:              '#EFF6FF',   // AI highlight block bg
  aiBorder:          '#BFDBFE',   // AI highlight block border

  // Skeleton loaders
  skeleton:          '#F3F4F6',
  skeletonShine:     '#E5E7EB',

  // Borders
  border:            '#E5E7EB',   // Official border
  borderHover:       '#D1D5DB',   // Hover border

  // Role-based accents
  roleStudent:       '#2563EB',   // Student — interactive blue
  roleTeacher:       '#0CA35C',   // Teacher — brand green
  roleAdmin:         '#672AEA',   // Admin/Owner — purple
  roleParent:        '#F59E0B',   // Parent — warm amber
} as const

// ── Gradient ────────────────────────────────────────────────────────────────
export const GRADIENT = {
  brand: 'linear-gradient(135deg, #1E3A8A 0%, #0CA35C 100%)',
  brandDir: '135deg' as const,
  from: '#1E3A8A',
  to: '#0CA35C',
}

// ── Shadows ─────────────────────────────────────────────────────────────────
export const SHADOW = {
  card:    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md:      '0 4px 12px rgba(0,0,0,0.08)',
  lg:      '0 10px 24px rgba(0,0,0,0.06)',
  brand:   '0 10px 15px -3px rgba(30, 58, 138, 0.20)',
  success: '0 4px 12px rgba(12, 163, 92, 0.20)',
  error:   '0 4px 12px rgba(220, 38, 38, 0.20)',
}

// ── Border Radius ───────────────────────────────────────────────────────────
export const RADIUS = {
  sm:   8,    // 8px
  md:   12,   // 12px
  lg:   16,   // 16px
  xl:   20,   // 20px
  xxl:  24,   // 24px
  full: 9999, // pill
}

// ── Typography ──────────────────────────────────────────────────────────────
export const FONT = {
  sans: "'Inter', system-ui, sans-serif",
  weight: {
    normal:    400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
    black:     900,
  },
}

// ── Role helpers ─────────────────────────────────────────────────────────────
export type Role = 'student' | 'teacher' | 'tenant_admin' | 'owner' | 'parent'

export const ROLE = {
  student: {
    accent:     C.roleStudent,
    accentBg:   C.primaryBlueLight,
    label:      'Student',
  },
  teacher: {
    accent:     C.roleTeacher,
    accentBg:   C.brandGreenLight,
    label:      'Teacher',
  },
  tenant_admin: {
    accent:     C.roleAdmin,
    accentBg:   C.purpleLight,
    label:      'Admin',
  },
  owner: {
    accent:     C.roleAdmin,
    accentBg:   C.purpleLight,
    label:      'Owner',
  },
  parent: {
    accent:     C.roleParent,
    accentBg:   C.warningBg,
    label:      'Parent',
  },
}

export function getRoleAccent(role?: string | null) {
  return ROLE[role as Role] ?? ROLE.student
}
