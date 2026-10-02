/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#0B1020',
          secondary: '#111827',
          surface: '#151D32',
          elevated: '#1C263D',
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          light: '#A78BFA',
        },
        cyan: {
          DEFAULT: '#06B6D4',
          accent: '#0891B2',
          light: '#22D3EE',
        },
        success: {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
          dark: '#16A34A',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#F87171',
        },
        border: {
          DEFAULT: '#273449',
          light: '#374763',
          focus: '#6366F1',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'JetBrains Mono', 'Menlo', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'soft-glow': '0 0 25px -5px rgba(99, 102, 241, 0.25)',
        'cyan-glow': '0 0 25px -5px rgba(6, 182, 212, 0.25)',
        'card': '0 8px 30px rgba(0, 0, 0, 0.35)',
      }
    },
  },
  plugins: [],
}
