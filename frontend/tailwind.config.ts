import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cs-bg": "#000000",
        "cs-bg-secondary": "#080808",
        "cs-bg-tertiary": "#111111",
        "cs-border": "#1A1A1A",
        "cs-text": "#FAFAFA",
        "cs-text-secondary": "#888888",
        "cs-text-muted": "#444444",
        "cs-accent": "#34D399", // Technical green
        "cs-accent-hover": "#6EE7B7",
        "cs-critical": "#F87171",
        "cs-high": "#FBBF24",
        "cs-medium": "#FCD34D",
        "cs-low": "#60A5FA",
        "cs-info": "#9CA3AF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        tightest: '-0.04em',
        widest: '0.2em',
        logo: '0.25em',
      },
      animation: {
        "fade-in-up": "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        }
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #111 1px, transparent 1px), linear-gradient(to bottom, #111 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
};

export default config;
