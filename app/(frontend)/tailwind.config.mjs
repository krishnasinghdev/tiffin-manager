import typography from "@tailwindcss/typography"
import tailwindcssAnimate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./payload/**/*.{ts,tsx}", "./app/(frontend)/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  plugins: [tailwindcssAnimate, typography],
  prefix: "",
  safelist: [
    "lg:col-span-4",
    "lg:col-span-6",
    "lg:col-span-8",
    "lg:col-span-12",
    "border-border",
    "bg-card",
    "border-error",
    "bg-error/30",
    "border-success",
    "bg-success/30",
    "border-warning",
    "bg-warning/30",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "2.5rem",
        xl: "3rem",
        "2xl": "4rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        background: "var(--background)",
        border: "var(--border)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        foreground: "var(--foreground)",
        input: "var(--input)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        ring: "var(--ring)",
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        success: "var(--success)",
        error: "var(--error)",
        warning: "var(--warning)",
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)"],
        sans: ["var(--font-geist-sans)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      typography: () => ({
        DEFAULT: {
          css: [
            {
              "--tw-prose-body": "var(--text)",
              "--tw-prose-headings": "var(--text)",
              h1: {
                fontWeight: "normal",
                marginBottom: "0.25em",
              },
            },
          ],
        },
        base: {
          css: [
            {
              h1: {
                fontSize: "2.5rem",
              },
              h2: {
                fontSize: "1.25rem",
                fontWeight: 600,
              },
            },
          ],
        },
        md: {
          css: [
            {
              h1: {
                fontSize: "3.5rem",
              },
              h2: {
                fontSize: "1.5rem",
              },
            },
          ],
        },
      }),
    },
  },
}

export default config
