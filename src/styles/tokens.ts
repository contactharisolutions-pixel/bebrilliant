// ══════════════════════════════════════════════════════════════════════════════
// BeBrilliant Enterprise Design Tokens — JavaScript/TypeScript Reference
// Source: assets/bebrilliant_enterprise_color_palette_theme.md
// These values mirror the CSS custom properties in globals.css :root
// ══════════════════════════════════════════════════════════════════════════════

export const P = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg:               '#F8FAFC',   // App / page background
  bgAlt:            '#F8FAFC',
  surface:          '#FFFFFF',   // Card / table surface
  card:             '#FFFFFF',   // Card surface alias
  bgCard:           '#FFFFFF',
  bgCard2:          '#F1F5F9',   // Subtle card variant
  surfaceSubtle:    '#F1F5F9',
  bgPrimaryTint:    '#F2F9FD',   // Blue-tinted section bg
  bgSuccessTint:    '#F1FBF5',   // Green-tinted section bg
  bgWarningTint:    '#FFFBEB',
  bgDangerTint:     '#FEF2F2',
  dark:             '#092746',   // Brand Navy heading / primary dark text
  hover:            '#F2F9FD',   // Primary hover surface tint

  // ── Primary Brand Blue ───────────────────────────────────────────────────
  brand:            '#0868B2',   // Primary action / navigation / links
  brandHover:       '#07549A',
  brandActive:      '#073B73',
  brandLight:       '#1687D1',
  brandTint:        '#E5F3FB',
  brandPale:        '#F2F9FD',
  brandBorder:      '#B6DCF2',
  brandBg:          'rgba(8, 104, 178, 0.08)',

  // ── Brand Navy (headings) ────────────────────────────────────────────────
  navy:             '#092746',   // H1 / dashboard titles / KPI values
  navy800:          '#0C345B',   // H2
  navy700:          '#253247',   // H3
  navy600:          '#34445A',   // H4

  // ── Brand Green (success only) ───────────────────────────────────────────
  success:          '#09834F',   // Success / completion / growth only
  successHover:     '#087347',
  successActive:    '#05603A',
  successText:      '#05603A',
  successBg:        '#DCF7E7',
  successBorder:    '#B7E8CC',
  successPale:      '#F1FBF5',

  // ── Typography ───────────────────────────────────────────────────────────
  text:             '#34445A',   // Body text (primary)
  textSecondary:    '#475569',
  muted:            '#64748B',
  disabled:         '#94A3B8',
  textLink:         '#0868B2',
  textLinkHover:    '#07549A',

  // ── Borders ──────────────────────────────────────────────────────────────
  border:           '#E2E8F0',   // Default border
  borderStrong:     '#CBD5E1',   // Input / strong border
  borderBrand:      '#B6DCF2',
  borderSuccess:    '#B7E8CC',
  borderWarning:    '#FDE68A',
  borderError:      '#FCA5A5',

  // ── Warning ──────────────────────────────────────────────────────────────
  warning:          '#D97706',
  warningDark:      '#B45309',
  warningBg:        '#FEF3C7',
  warningBorder:    '#FDE68A',

  // ── Error / Danger ───────────────────────────────────────────────────────
  error:            '#DC2626',
  errorDark:        '#B91C1C',
  errorBg:          '#FEF2F2',
  errorText:        '#B91C1C',
  errorBorder:      '#FCA5A5',

  // ── Info ─────────────────────────────────────────────────────────────────
  info:             '#0284C7',
  infoDark:         '#0369A1',
  infoBg:           '#E0F2FE',
  infoBorder:       '#BAE6FD',

  // ── Accent / Chart / Misc ────────────────────────────────────────────────
  purple:           '#7C3AED',   // Chart #3 / AI context only
  purpleBg:         '#F5F3FF',
  cyan:             '#0891B2',   // Chart #5
  orange:           '#EA580C',   // Chart #8
  pink:             '#DB2777',   // Chart #6
  amber:            '#D97706',   // Chart #4

  // ── Role Colors ───────────────────────────────────────────────────────────
  roleStudent:      '#0868B2',   // brand primary
  roleTeacher:      '#09834F',   // brand success
  roleAdmin:        '#7C3AED',   // purple
  roleParent:       '#D97706',   // warning amber

  // ── Chart Sequence (ordered by usage) ────────────────────────────────────
  // Use in order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
  chartBlue:        '#0868B2',
  chartGreen:       '#09834F',
  chartPurple:      '#7C3AED',
  chartAmber:       '#D97706',
  chartCyan:        '#0891B2',
  chartPink:        '#DB2777',
  chartSlate:       '#64748B',
  chartOrange:      '#EA580C',

  // ── KPI Card Accents ──────────────────────────────────────────────────────
  kpiPrimary:       '#0868B2',
  kpiSuccess:       '#09834F',
  kpiWarning:       '#D97706',
  kpiDanger:        '#DC2626',
  kpiNeutral:       '#64748B',

  // ── Navigation ────────────────────────────────────────────────────────────
  navBg:            '#FFFFFF',
  navBorder:        '#E2E8F0',
  navText:          '#475569',
  navActiveText:    '#0868B2',
  navActiveBg:      '#E5F3FB',
  navHoverBg:       '#F2F9FD',
  navHoverText:     '#07549A',

  // ── Footer ────────────────────────────────────────────────────────────────
  footerBg:         '#092746',
  footerText:       '#CBD5E1',
  footerLink:       '#E5F3FB',
  footerLinkHover:  '#72B9E6',
};

export const SHADOWS = {
  sm:      '0 1px 2px rgba(15, 23, 42, 0.05)',
  md:      '0 4px 12px rgba(15, 23, 42, 0.08)',
  lg:      '0 12px 30px rgba(15, 23, 42, 0.10)',
  xl:      '0 20px 40px rgba(15, 23, 42, 0.12)',
  card:    '0 1px 2px rgba(15, 23, 42, 0.05)',
  primary: '0 10px 15px -3px rgba(8, 104, 178, 0.20)',
  double:  '0 20px 40px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)',
};

export const CHART_COLORS = [
  P.chartBlue,
  P.chartGreen,
  P.chartPurple,
  P.chartAmber,
  P.chartCyan,
  P.chartPink,
  P.chartSlate,
  P.chartOrange,
];

export const BADGE_COLORS = {
  active:    { bg: '#DCF7E7', text: '#05603A', border: '#B7E8CC' },
  inactive:  { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' },
  pending:   { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  failed:    { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' },
  published: { bg: '#E5F3FB', text: '#0868B2', border: '#B6DCF2' },
  info:      { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
};

export const PROGRESS_COLORS = {
  primary: { track: '#E5F3FB', fill: '#0868B2' },
  success: { track: '#DCF7E7', fill: '#09834F' },
  warning: { track: '#FEF3C7', fill: '#D97706' },
  critical:{ track: '#FEE2E2', fill: '#DC2626' },
};

export const ACADEMIC_COLORS = {
  excellent: '#09834F',
  good:      '#1687D1',
  average:   '#D97706',
  needsHelp: '#EA580C',
  critical:  '#DC2626',
  na:        '#94A3B8',
};
