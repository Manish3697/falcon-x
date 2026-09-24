/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        falcon: {
          bg: "#070B14",
          surface: "#0B1120",
          card: "#0F1A2E",
          cardHover: "#14223D",
          border: "#1E2C48",
          borderLight: "#2A3C5F",
          accent: "#0284C7",
          accentLight: "#38BDF8",
          accentGlow: "#0369A1",
          textMain: "#F8FAFC",
          textMuted: "#94A3B8",
          textDim: "#64748B",
          
          // Threat Severity Colors
          critical: "#EF4444",
          criticalBg: "#450A0A",
          high: "#F97316",
          highBg: "#431407",
          medium: "#EAB308",
          mediumBg: "#422006",
          low: "#10B981",
          lowBg: "#064E3B",
          info: "#38BDF8",
          infoBg: "#082F49"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
