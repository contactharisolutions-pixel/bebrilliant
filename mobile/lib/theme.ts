/**
 * BeBrilliant — Official Design Token System
 *
 * Source: Color Theme.docx + UI Core Design Strategy for BeBrilliant.docx
 *
 * Use this file for all StyleSheet.create() based components.
 * NativeWind/Tailwind classes use tailwind.config.js (kept in sync).
 */

// ── PRIMARY BRAND GRADIENT ──────────────────────────────────────────────────
// Official: #1E3A8A (Deep Blue) → #0CA35C (Brand Green)
// Use for: Primary CTA buttons, progress bars, chart accents
export const GRADIENT = {
  colors:     ['#1E3A8A', '#0CA35C'] as const,
  start:      { x: 0, y: 0 },
  end:        { x: 1, y: 0 },
  // Vertical variant (top → bottom)
  colorsV:    ['#1E3A8A', '#0F5B3A'] as const,
  startV:     { x: 0, y: 0 },
  endV:       { x: 0, y: 1 },
} as const

// ── BRAND COLORS ────────────────────────────────────────────────────────────
export const C = {
  // Primary blue anchor (logo deep blue)
  primaryBlue:      '#1E3A8A',
  primaryBlueDark:  '#162D6E',
  primaryBlueMid:   '#2563EB',     // interactive/link blue
  primaryBlueLight: '#EFF6FF',     // AI blocks, chip tints

  // Brand green (logo green)
  brandGreen:       '#0CA35C',
  brandGreenDark:   '#098049',
  brandGreenLight:  '#DCFCE7',

  // Purple accent (AI & premium sections only)
  purple:           '#672AEA',
  purpleDark:       '#5420C0',
  purpleLight:      '#F5F0FE',

  // ── SEMANTIC COLORS ────────────────────────────────────────────────────
  // Success / Correct / Present
  success:          '#16A34A',
  successDark:      '#15803D',
  successBg:        '#DCFCE7',

  // Error / Wrong / Absent / Danger
  error:            '#DC2626',
  errorDark:        '#B91C1C',
  errorBg:          '#FEE2E2',

  // Warning / Pending / Late
  warning:          '#F59E0B',
  warningDark:      '#D97706',
  warningBg:        '#FEF3C7',

  // ── BACKGROUND SYSTEM ──────────────────────────────────────────────────
  bgMain:           '#FFFFFF',     // main app background — white-first
  bgAlt:            '#F7F8FA',     // secondary/list bg
  bgCard:           '#FFFFFF',     // all card backgrounds
  bgSection:        '#F1F1F1',     // section dividers
  bgSkeleton:       '#F3F4F6',     // skeleton loader base

  // ── BORDER SYSTEM ──────────────────────────────────────────────────────
  border:           '#E5E7EB',     // default all borders
  borderHover:      '#D1D5DB',
  borderFocus:      '#2563EB',

  // ── TEXT HIERARCHY ──────────────────────────────────────────────────────
  textPrimary:      '#111827',     // headings (almost black)
  textSecondary:    '#6B7280',     // body text
  textMuted:        '#9CA3AF',     // placeholder / disabled
  textWhite:        '#FFFFFF',

  // ── AI BLOCK SYSTEM ────────────────────────────────────────────────────
  aiBg:             '#EFF6FF',     // AI insight block bg
  aiBorder:         '#2563EB',     // AI block border accent
  aiText:           '#1E40AF',

  // ── GOLD (Badges / Streaks / Premium Highlights) ────────────────────────
  gold:             '#FFD486',     // use sparingly — badges, rank highlights

  // ── EXAM SCREEN (CRITICAL — ultra clean) ───────────────────────────────
  // Keep exam UI pristine. Only these 3 semantic colors allowed.
  examCorrect:      '#16A34A',     // = success (correct answer)
  examWrong:        '#DC2626',     // = error (wrong answer)
  examSelected:     '#2563EB',     // = primaryBlueMid (selected option)
  examBg:           '#FFFFFF',
  examText:         '#111827',

  // ── DARK MODE (Future) ──────────────────────────────────────────────────
  darkBg:           '#0B1220',
  darkCard:         '#111827',
  darkCard2:        '#1F2937',
  darkText:         '#F9FAFB',
  darkTextMuted:    '#6B7280',
  darkBorder:       '#1F2937',
} as const

// ── SHADOW PRESETS ──────────────────────────────────────────────────────────
export const SHADOW = {
  // Soft card shadow (official: shadow-sm)
  card: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  4,
    elevation:     2,
  },
  // Medium shadow for modals, FABs
  md: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  12,
    elevation:     6,
  },
  // Strong shadow for FABs and floating elements
  lg: {
    shadowColor:   '#1E3A8A',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius:  20,
    elevation:     12,
  },
  // Brand gradient shadow (for gradient buttons)
  brand: {
    shadowColor:   '#1E3A8A',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius:  14,
    elevation:     10,
  },
  // Purple accent shadow
  purple: {
    shadowColor:   '#672AEA',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius:  14,
    elevation:     10,
  },
  // Success shadow
  success: {
    shadowColor:   '#16A34A',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius:  10,
    elevation:     6,
  },
  // Error shadow
  error: {
    shadowColor:   '#DC2626',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius:  10,
    elevation:     6,
  },
} as const

// ── BORDER RADIUS SYSTEM ────────────────────────────────────────────────────
export const RADIUS = {
  xs:   8,
  sm:   12,
  md:   16,
  lg:   20,
  xl:   24,
  xxl:  32,
  pill: 999,
} as const

// ── SPACING ──────────────────────────────────────────────────────────────────
export const SPACE = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
} as const

// ── TYPOGRAPHY SIZES ────────────────────────────────────────────────────────
// UI Strategy: Bold headings, high-readability body, avoid decorative fonts
export const FONT = {
  // Display (hero headings)
  display:    { fontSize: 28, fontWeight: '900' as const, color: C.textPrimary },
  h1:         { fontSize: 22, fontWeight: '900' as const, color: C.textPrimary },
  h2:         { fontSize: 18, fontWeight: '800' as const, color: C.textPrimary },
  h3:         { fontSize: 16, fontWeight: '800' as const, color: C.textPrimary },
  h4:         { fontSize: 14, fontWeight: '800' as const, color: C.textPrimary },
  // Body
  bodyLg:     { fontSize: 15, fontWeight: '500' as const, color: C.textSecondary },
  body:       { fontSize: 13, fontWeight: '500' as const, color: C.textSecondary },
  bodySm:     { fontSize: 12, fontWeight: '500' as const, color: C.textSecondary },
  // Labels
  label:      { fontSize: 12, fontWeight: '700' as const, color: C.textSecondary },
  labelSm:    { fontSize: 10, fontWeight: '700' as const, color: C.textMuted },
  caption:    { fontSize: 9,  fontWeight: '900' as const, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' as const },
} as const

// ── CHART COLOR PALETTE ─────────────────────────────────────────────────────
// UI Strategy: 2–3 colors max, clean, insight-focused
export const CHART = {
  primary:  C.primaryBlueMid,       // main data line / bar
  success:  C.brandGreen,           // performance / green metric
  warning:  C.warning,              // caution zone
  error:    C.error,                // below threshold
  purple:   C.purple,               // AI / predicted
  grid:     '#F1F5F9',
  label:    C.textMuted,
  // Area chart fills
  primaryFill: 'rgba(37,99,235,0.15)',
  successFill: 'rgba(12,163,92,0.15)',
  purpleFill:  'rgba(103,42,234,0.12)',
} as const

// ── ROLE IDENTITY COLORS (kept per-panel for visual differentiation) ─────────
// Primary CTA buttons use brand gradient globally.
// These are used only for panel-specific accents (hero cards, tab highlights).
export const ROLE = {
  teacher: {
    accent:  '#1E3A8A',    // deep blue — Educator authority
    light:   '#EFF6FF',
    shadow:  '#1E3A8A',
  },
  student: {
    accent:  '#0CA35C',    // brand green — Growth & learning
    light:   '#DCFCE7',
    shadow:  '#0CA35C',
  },
  parent: {
    accent:  '#0CA35C',    // brand green — Nurturing oversight
    light:   '#DCFCE7',
    shadow:  '#0CA35C',
  },
  ai: {
    accent:  '#672AEA',    // purple — AI / Intelligence layer
    light:   '#F5F0FE',
    shadow:  '#672AEA',
  },
} as const
