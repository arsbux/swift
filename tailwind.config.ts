import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Upwork-inspired deep green color palette
        accent: {
          DEFAULT: "#14A800", // Deep green (Upwork-style)
          hover: "#0F7D00", // Darker green on hover
          light: "#D4F4DD", // Light green for backgrounds
          dark: "#0A5D00", // Dark green
        },
        primary: {
          DEFAULT: "#1E293B", // Dark blue/charcoal for headings
          light: "#334155", // Lighter dark blue
          dark: "#0F172A", // Very dark blue
        },
        surface: {
          DEFAULT: "#F8FAFC", // Very light gray/white
          hover: "#F1F5F9", // Slightly darker on hover
        },
        text: {
          primary: "#1E293B", // Dark blue/charcoal
          secondary: "#64748B", // Medium gray
          muted: "#94A3B8", // Light gray
        },
        success: {
          DEFAULT: "#10B981", // Emerald green
          light: "#D1FAE5",
        },
        error: {
          DEFAULT: "#EF4444", // Rose red
          light: "#FEE2E2",
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 4px 16px 0 rgba(0, 0, 0, 0.06), 0 2px 4px 0 rgba(0, 0, 0, 0.08)',
        'dark': '0 4px 16px 0 rgba(0, 0, 0, 0.3), 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
