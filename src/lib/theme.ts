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
  primaryBlue:       '#0868B2',   // Deep navy — brand primary
  primaryBlueDark:   '#073B73',   // Deeper navy
  primaryBlueMid:    '#0868B2',   // Interactive / accent blue
  primaryBlueLight:  '#E5F3FB',   // Accent blue bg (AI blocks)
  brandGreen:        '#09834F',   // Official brand green
  brandGreenLight:   '#DCF7E7',   // Brand green light bg

  // Functional colors
  success:           '#09834F',   // Official success green
  successDark:       '#087347',
  successBg:         '#DCF7E7',
  error:             '#DC2626',   // Official error red
  errorBg:           '#FEE2E2',
  warning:           '#D97706',   // Official warning amber
  warningDark:       '#B45309',
  warningBg:         '#FEF3C7',

  // Accent
  accent:            '#0868B2',   // Interactive blue (same as primaryBlueMid)
  purple:            '#7C3AED',   // AI / premium purple (official)
  purpleLight:       '#F5F3FF',
  gold:              '#FFD486',   // Soft gold — use only for badges/highlights

  // Text
  textPrimary:       '#34445A',   // Almost black
  textSecondary:     '#64748B',   // Secondary text
  textMuted:         '#94A3B8',   // Placeholder / disabled

  // Backgrounds
  bg:                '#FFFFFF',   // Main background
  bgAlt:             '#F8FAFC',   // Secondary bg (page body)
  bgCard:            '#FFFFFF',   // Card bg
  bgCard2:           '#F8FAFC',   // Subtle card variant

  // AI Blocks
  aiBg:              '#E5F3FB',   // AI highlight block bg
  aiBorder:          '#B6DCF2',   // AI highlight block border

  // Skeleton loaders
  skeleton:          '#F1F5F9',
  skeletonShine:     '#E2E8F0',

  // Borders
  border:            '#E2E8F0',   // Official border
  borderHover:       '#CBD5E1',   // Hover border

  // Role-based accents
  roleStudent:       '#0868B2',   // Student — interactive blue
  roleTeacher:       '#09834F',   // Teacher — brand green
  roleAdmin:         '#7C3AED',   // Admin/Owner — purple
  roleParent:        '#D97706',   // Parent — warm amber
} as const

// ── Gradient ────────────────────────────────────────────────────────────────
export const GRADIENT = {
  brand: 'linear-gradient(135deg, #0868B2 0%, #09834F 100%)',
  brandDir: '135deg' as const,
  from: '#0868B2',
  to: '#09834F',
}

// ── Shadows ─────────────────────────────────────────────────────────────────
export const SHADOW = {
  card:    '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
  md:      '0 4px 12px rgba(15, 23, 42, 0.08)',
  lg:      '0 10px 24px rgba(15, 23, 42, 0.06)',
  brand:   '0 10px 15px -3px rgba(8, 104, 178, 0.20)',
  success: '0 4px 12px rgba(9, 131, 79, 0.20)',
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
