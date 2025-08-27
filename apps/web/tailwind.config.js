/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "pulse-slow": "pulse-slow 2s ease-in-out infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      maxWidth: {
        "2xs": "16rem",
        "8xl": "88rem",
        "9xl": "96rem",
      },
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
      backdropBlur: {
        xs: "2px",
      },
      screens: {
        "3xl": "1600px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Custom plugin for utility classes
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scrollbar-default': {
          '-ms-overflow-style': 'auto',
          'scrollbar-width': 'auto',
          '&::-webkit-scrollbar': {
            display: 'block'
          }
        },
        '.bg-mesh': {
          'background-image': `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%234F46E5' fill-opacity='0.05' fill-rule='nonzero'%3e%3ccircle cx='7' cy='7' r='7'/%3e%3ccircle cx='53' cy='7' r='7'/%3e%3ccircle cx='30' cy='30' r='7'/%3e%3ccircle cx='7' cy='53' r='7'/%3e%3ccircle cx='53' cy='53' r='7'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
