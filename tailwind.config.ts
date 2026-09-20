import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Warm palette
        coral: {
          50: "#FFF5F0",
          100: "#FFE8DB",
          200: "#FFCDB3",
          300: "#FFB088",
          400: "#FF8C42",
          500: "#FF6B35",
          600: "#E5552A",
          700: "#CC4422",
          800: "#993318",
          900: "#66220F",
        },
        peach: {
          50: "#FFF8F0",
          100: "#FFEED9",
          200: "#FFE0C0",
          300: "#FFD0A0",
          400: "#FFBC7C",
          500: "#F7931E",
        },
        lavender: {
          50: "#F8F5FF",
          100: "#F0E6FF",
          200: "#E4D4FB",
          300: "#D4BFF7",
          400: "#C8A8E9",
          500: "#A78BFA",
          600: "#8B5CF6",
        },
        cream: {
          50: "#FEFCF9",
          100: "#FDF9F3",
          200: "#FBF4EA",
          300: "#F5EDE0",
        },
        // Legacy compatibility
        brand: {
          50: "#FFF5F0",
          100: "#FFE8DB",
          500: "#FF6B35",
          600: "#E5552A",
          700: "#CC4422",
          900: "#66220F",
        },
        authority: {
          50: "#FEFCF9",
          100: "#FDF9F3",
          200: "#FBF4EA",
          700: "#5A5470",
          800: "#3D3852",
          900: "#1A1A2E",
          950: "#0F0F1A",
        },
        gold: {
          400: "#FFB347",
          500: "#FF8C42",
          600: "#F7931E",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
        mono: ["var(--font-space-grotesk)", "monospace"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-8px) rotate(2deg)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
