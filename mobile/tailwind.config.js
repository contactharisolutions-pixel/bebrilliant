/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── PRIMARY BRAND SYSTEM ─────────────────────────────────────────
        // Official: #1E3A8A (Deep Blue) → #0CA35C (Brand Green) gradient
        primary: {
          DEFAULT: '#1E3A8A',       // deep navy — brand anchor
          dark:    '#162D6E',       // hover / pressed state
          mid:     '#2563EB',       // interactive accent blue
          light:   '#EFF6FF',       // AI blocks, chip backgrounds
          bg:      '#EEF4FF',       // card tints for primary sections
        },

        // ── BRAND GREEN (from logo) ──────────────────────────────────────
        brand: {
          DEFAULT: '#0CA35C',       // brand green — CTA gradient endpoint
          dark:    '#098049',       // hover / pressed state
          light:   '#DCFCE7',       // success backgrounds
        },

        // ── PURPLE ACCENT (AI / Premium) ────────────────────────────────
        purple: {
          DEFAULT: '#672AEA',       // UI Strategy: AI & premium sections
          dark:    '#5420C0',
          light:   '#F5F0FE',
        },

        // ── SUCCESS / CORRECT ANSWER ─────────────────────────────────────
        success: {
          DEFAULT: '#16A34A',       // official: correct, present, pass
          dark:    '#15803D',
          bg:      '#DCFCE7',       // official success bg
        },

        // ── ERROR / WRONG ANSWER ─────────────────────────────────────────
        error: {
          DEFAULT: '#DC2626',       // official: wrong, fail, absent
          dark:    '#B91C1C',
          bg:      '#FEE2E2',       // official error bg
        },

        // ── WARNING ──────────────────────────────────────────────────────
        warning: {
          DEFAULT: '#F59E0B',       // official: pending, late
          dark:    '#D97706',
          bg:      '#FEF3C7',       // official warning bg
        },

        // ── BACKGROUND SYSTEM ────────────────────────────────────────────
        bg: {
          DEFAULT:  '#FFFFFF',      // main bg — white-first principle
          alt:      '#F7F8FA',      // secondary/list backgrounds
          card:     '#FFFFFF',      // card backgrounds
          section:  '#F1F1F1',      // section dividers
          skeleton: '#F3F4F6',      // skeleton loaders
        },

        // ── BORDER & LINE SYSTEM ─────────────────────────────────────────
        border: {
          DEFAULT: '#E5E7EB',       // official default border
          hover:   '#D1D5DB',       // hover state border
          dark:    '#1F2937',
        },

        // ── TEXT HIERARCHY ───────────────────────────────────────────────
        text: {
          primary:   '#111827',     // official: almost black, easy on eyes
          secondary: '#6B7280',     // official: body text
          muted:     '#9CA3AF',     // official: disabled / placeholder
        },

        // ── AI BLOCK SYSTEM ──────────────────────────────────────────────
        ai: {
          bg:     '#EFF6FF',        // AI highlight block bg (official)
          border: '#2563EB',        // AI block accent border
          text:   '#1E40AF',
        },

        // ── SOFT GOLD (Badges / Premium Highlights) ──────────────────────
        gold: '#FFD486',            // official: badges, highlights — use sparingly
      }
    },
  },
  plugins: [],
}
