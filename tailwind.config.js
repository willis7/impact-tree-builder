/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
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
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        // Node type colors
        node: {
          business: {
            DEFAULT: "hsl(var(--node-business))",
            secondary: "hsl(var(--node-business-secondary))",
          },
          product: {
            DEFAULT: "hsl(var(--node-product))",
            secondary: "hsl(var(--node-product-secondary))",
          },
          initiative: {
            DEFAULT: "hsl(var(--node-initiative))",
            secondary: "hsl(var(--node-initiative-secondary))",
          },
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 hsl(var(--shadow-color) / 0.04), 0 1px 2px -1px hsl(var(--shadow-color) / 0.04)",
        "card-hover":
          "0 4px 6px -1px hsl(var(--shadow-color) / 0.06), 0 2px 4px -2px hsl(var(--shadow-color) / 0.06)",
        elevated:
          "0 10px 15px -3px hsl(var(--shadow-color) / 0.08), 0 4px 6px -4px hsl(var(--shadow-color) / 0.08)",
        "node-glow-business": "0 0 20px hsl(var(--node-business) / 0.3)",
        "node-glow-product": "0 0 20px hsl(var(--node-product) / 0.3)",
        "node-glow-initiative": "0 0 20px hsl(var(--node-initiative) / 0.3)",
      },
      animation: {
        "ring-pulse": "ring-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in 200ms ease-out",
        "slide-in": "slide-in 200ms ease-out",
        "scale-in": "scale-in 150ms ease-out",
        "accordion-down": "accordion-down 200ms ease-out",
        "accordion-up": "accordion-up 200ms ease-out",
      },
      keyframes: {
        "ring-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-collapsible-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-collapsible-content-height)" },
          to: { height: "0" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
