/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#004B93',
          dark: '#00366A',
          light: '#336FA9',
          bg: '#EBF3FC',
        },
        success: {
          DEFAULT: '#1FAC63',
          dark: '#178A4F',
          bg: '#ECFDF5',
        },
        bg: {
          DEFAULT: '#FFFFFF',
          card: '#FFFFFF',
          card2: '#F8FAFC',
          dark: '#0B1220',
          darkCard: '#111827',
          darkCard2: '#1F2937',
        },
        border: {
          DEFAULT: '#F1F5F9',
          dark: '#1F2937',
        },
        text: {
          primary: '#111827',
          secondary: '#4B5563',
          muted: '#9CA3AF',
          darkPrimary: '#F9FAFB',
          darkSecondary: '#9CA3AF',
          darkMuted: '#6B7280',
        }
      }
    },
  },
  plugins: [],
}
