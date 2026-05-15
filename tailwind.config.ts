import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Custom FlashQF tokens
        "bg-primary": "#0B1120",
        "bg-secondary": "#0f172a",
        "bg-tertiary": "#1e293b",
        "bg-quaternary": "#334155",
        "text-primary": "#f8fafc",
        "text-secondary": "#94a3b8",
        "text-muted": "#64748b",
        "accent-indigo": "#6366f1",
        "accent-purple": "#8b5cf6",
        "accent-green": "#22c55e",
        "accent-teal": "#14b8a6",
        "accent-orange": "#f97316",
        "accent-red": "#ef4444",
        "accent-gold": "#f59e0b",
        "card-surface": "#f8fafc",
        "border-subtle": "rgba(148, 163, 184, 0.1)",
        "border-active": "rgba(99, 102, 241, 0.4)",
        "glow-indigo": "rgba(99, 102, 241, 0.15)",
        // Difficulty colors
        "diff-none": "#94a3b8",
        "diff-easy": "#22c55e",
        "diff-good": "#14b8a6",
        "diff-hard": "#f97316",
        "diff-super-hard": "#ef4444",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0, 0, 0, 0.3)",
        elevated: "0 8px 40px rgba(0, 0, 0, 0.4)",
        flashcard:
          "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        "glow-sm": "0 0 20px rgba(99, 102, 241, 0.15)",
        "glow-green": "0 0 24px rgba(34, 197, 94, 0.3)",
        "glow-red": "0 0 24px rgba(239, 68, 68, 0.3)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        pulse: "pulse 2s ease-in-out infinite",
        "pulse-fast": "pulse 0.6s ease-in-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
