/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lumin: {
          // Electric Lime Accent
          lime: '#D4FF00',
          'lime-hover': '#C6F500',
          'lime-glow': 'rgba(212, 255, 0, 0.35)',
          'lime-muted': '#A4C600',
          
          // Light Mode Canvas & Bento Cards
          bg: '#F4F6F8',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          'card-subtle': '#F0F2F5',
          border: 'rgba(0, 0, 0, 0.07)',
          text: '#0E1116',
          'text-muted': '#6B7280',
          
          // Dark Pro Canvas & Bento Cards
          'dark-bg': '#0B0D10',
          'dark-surface': '#12151B',
          'dark-card': '#181B22',
          'dark-card-elevated': '#1F242D',
          'dark-border': 'rgba(255, 255, 255, 0.08)',
          'dark-text': '#F3F4F6',
          'dark-text-muted': '#9CA3AF',
        },
        space: {
          950: '#04060A',
          900: '#07090E',
          850: '#0A0D14',
          800: '#0F1420',
          750: '#141A29',
          700: '#1A2236',
          600: '#26334D',
          500: '#384869',
        },
        cyber: {
          cyan: '#00F0FF',
          blue: '#3B82F6',
          purple: '#A855F7',
          gold: '#FFD700',
          green: '#10B981',
          orange: '#F97316',
          pink: '#EC4899',
          red: '#EF4444',
          lime: '#D4FF00',
        },
        // Vault 6 Taxonomy Branches
        branch: {
          nucleus: '#FFD700',      // Master Root Gold
          certs: '#10B981',        // Certifications Green
          coding: '#3B82F6',       // Coding Projects Blue
          aios: '#A855F7',         // AI OS Purple
          kb: '#F97316',           // Knowledge Base Orange
          templates: '#EC4899',    // Templates Pink
        }
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '32px',
        'pill': '9999px',
      },
      boxShadow: {
        'lumin-glow': '0 0 25px rgba(212, 255, 0, 0.25)',
        'lumin-subtle': '0 4px 20px rgba(0, 0, 0, 0.04)',
        'lumin-card': '0 10px 30px -10px rgba(0, 0, 0, 0.08)',
        'dark-glow': '0 0 30px rgba(212, 255, 0, 0.18)',
        'glow-cyan': '0 0 20px -3px rgba(0, 240, 255, 0.4), 0 0 8px -1px rgba(0, 240, 255, 0.2)',
        'glow-gold': '0 0 25px -3px rgba(255, 215, 0, 0.45), 0 0 10px -1px rgba(255, 215, 0, 0.25)',
        'glow-green': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'glow-blue': '0 0 20px -3px rgba(59, 130, 246, 0.4)',
        'glow-purple': '0 0 20px -3px rgba(168, 85, 247, 0.4)',
        'glow-orange': '0 0 20px -3px rgba(249, 115, 22, 0.4)',
        'glow-pink': '0 0 20px -3px rgba(236, 72, 153, 0.4)',
        'glass-panel': '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'glass-glow': '0 8px 32px 0 rgba(212, 255, 0, 0.15), inset 0 1px 1px 0 rgba(212, 255, 0, 0.25)',
      },
      backgroundImage: {
        'cyber-grid': "radial-gradient(circle, rgba(212, 255, 0, 0.08) 1px, transparent 1px)",
        'hud-scanline': "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)",
        'radial-vignette': "radial-gradient(circle at center, transparent 30%, rgba(4, 6, 10, 0.8) 100%)",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2.5s ease-in-out infinite alternate',
        'radar-sweep': 'radar 6s linear infinite',
        'scan': 'scanline 8s linear infinite',
        'wave-pulse': 'wave 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { filter: 'drop-shadow(0 0 4px rgba(212, 255, 0, 0.3))' },
          '100%': { filter: 'drop-shadow(0 0 16px rgba(212, 255, 0, 0.8))' },
        },
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        wave: {
          '0%': { transform: 'scaleY(0.3)' },
          '100%': { transform: 'scaleY(1.2)' },
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', '"JetBrains Mono"', 'Consolas', 'monospace'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
