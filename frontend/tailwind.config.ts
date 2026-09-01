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
        "cs-bg": "#0A0A0A",
        "cs-bg-secondary": "#141414",
        "cs-bg-tertiary": "#1A1A1A",
        "cs-border": "#2A2A2A",
        "cs-text": "#F5F0EB",
        "cs-text-secondary": "#9A9590",
        "cs-text-muted": "#6B6560",
        "cs-accent": "#C8E64A",
        "cs-accent-hover": "#D4EF5A",
        "cs-critical": "#E84855",
        "cs-high": "#E88548",
        "cs-medium": "#E8C848",
        "cs-low": "#48A8E8",
        "cs-info": "#9A9590",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        tightest: '-0.04em',
        widest: '0.2em',
        logo: '0.3em',
      },
      animation: {
        "fade-in-up": "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
