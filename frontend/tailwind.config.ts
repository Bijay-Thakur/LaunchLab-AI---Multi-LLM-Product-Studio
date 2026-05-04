import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05060d",
          900: "#0a0c1a",
          800: "#0f1226",
          700: "#161a35",
        },
        accent: {
          violet: "#8b5cf6",
          blue: "#38bdf8",
          cyan: "#22d3ee",
          peach: "#fda4af",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(80% 60% at 20% 0%, rgba(139,92,246,0.25) 0%, rgba(5,6,13,0) 60%), radial-gradient(60% 50% at 100% 30%, rgba(56,189,248,0.18) 0%, rgba(5,6,13,0) 60%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 10px 40px -10px rgba(56,189,248,0.25)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
