/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cafe: {
          dark: '#1E130D',
          espresso: '#2C1810',
          terracotta: '#C86D3B',
          amber: '#DF9B52',
          caramel: '#E68A5C',
          cream: '#FDF8F2',
          sand: '#F4EDE4',
          sage: '#3D5A45',
          forest: '#2A3F30',
          charcoal: '#2A2521',
          ash: '#7A6F68',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
      boxShadow: {
        'cafe-soft': '0 8px 30px rgba(44, 24, 16, 0.06)',
        'cafe-card': '0 12px 36px rgba(44, 24, 16, 0.08)',
        'cafe-glow': '0 0 25px rgba(200, 109, 59, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      }
    },
  },
  plugins: [],
}
