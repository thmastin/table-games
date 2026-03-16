import type { Config } from 'tailwindcss'

/**
 * Casino Table Games Suite — Tailwind Configuration
 *
 * This extends Tailwind's default theme with casino-specific design tokens.
 * All color values mirror tokens.css so that Tailwind utility classes produce
 * the same result as referencing CSS variables directly.
 *
 * Usage pattern:
 *   - Prefer Tailwind utilities (bg-felt, text-gold-bright) in components
 *   - Use CSS variables directly only for dynamic theming (per-game felt swaps)
 *   - Custom utilities below handle felt texture and chip gradients
 */

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {

      // ------------------------------------------------------------------
      // COLORS
      // ------------------------------------------------------------------
      colors: {

        // Felt
        felt: {
          base:      '#1a4731',
          mid:       '#1e5438',
          highlight: '#235f40',
          shadow:    '#112e20',
          // Per-game variants — apply via className or inline style
          blackjack: '#1a4731',
          'free-bet': '#1a3f45',
          uth:       '#2a3d1a',
          baccarat:  '#1e2d4a',
          roulette:  '#1a3a1a',
        },

        // Felt print (text/lines on the felt surface)
        'felt-print': 'rgba(255, 255, 255, 0.18)',

        // Card
        card: {
          face:   '#faf8f2',
          back:   '#1a2d6b',
          border: '#d4c9a8',
        },

        // Suits
        suit: {
          red:   '#c41e3a',
          black: '#1a1a1a',
        },

        // Chips — each denomination has base/rim/band/text
        chip: {
          '1':    { base: '#e8e4dc', rim: '#f5f2ec', band: '#c8c4bc', text: '#2a2a2a' },
          '5':    { base: '#c0392b', rim: '#e74c3c', band: '#922b21', text: '#ffffff' },
          '25':   { base: '#1e8449', rim: '#27ae60', band: '#145a32', text: '#ffffff' },
          '100':  { base: '#1a1a2e', rim: '#2d2d48', band: '#0d0d1a', text: '#e8c97a' },
          '500':  { base: '#6c3483', rim: '#8e44ad', band: '#4a235a', text: '#ffffff' },
          '1000': { base: '#b8860b', rim: '#d4a017', band: '#8b6508', text: '#1a1a1a' },
        },

        // Chrome / UI frame
        chrome: {
          bg:         '#0e1117',
          panel:      '#141820',
          border:     '#2a2f3a',
          'border-dim': '#1e2330',
        },

        // Rail (mahogany table rail)
        rail: {
          bg:        '#2c1810',
          highlight: '#3d2215',
          shadow:    '#1a0e08',
        },

        // Gold accent
        gold: {
          bright: '#d4a017',
          mid:    '#b8860b',
          muted:  '#8b6914',
          pale:   '#e8c97a',
          text:   '#f0d080',
        },

        // Results
        result: {
          win:   '#27ae60',
          push:  '#d4a017',
          loss:  '#c0392b',
          bj:    '#d4a017',
        },

        // UI text
        casino: {
          primary:   '#f0ece0',
          secondary: '#a89e88',
          dim:       '#6b6456',
          gold:      '#e8c97a',
          danger:    '#e74c3c',
          success:   '#2ecc71',
        },
      },

      // ------------------------------------------------------------------
      // TYPOGRAPHY
      // ------------------------------------------------------------------
      fontFamily: {
        // Primary UI font — clean, legible at all sizes
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Card face values — needs to be slightly condensed, bold, readable small
        card: ['"Playfair Display"', 'Georgia', 'serif'],
        // Chip amounts and stat numbers — tabular figures required
        mono: ['"JetBrains Mono"', '"Fira Mono"', 'monospace'],
        // Result banners, big win text — display-weight serif
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },

      fontSize: {
        // Chip amounts
        'chip-sm':   ['10px', { lineHeight: '1', fontWeight: '700', letterSpacing: '0' }],
        'chip-md':   ['13px', { lineHeight: '1', fontWeight: '700', letterSpacing: '0' }],
        // Card rank/suit labels
        'card-sm':   ['14px', { lineHeight: '1', fontWeight: '700' }],
        'card-lg':   ['28px', { lineHeight: '1', fontWeight: '700' }],
        // Felt-printed labels (bet zone text, game labels)
        'felt-label': ['11px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '0.1em' }],
        // Result banner
        'result-sm': ['20px', { lineHeight: '1', fontWeight: '700', letterSpacing: '0.05em' }],
        'result-lg': ['32px', { lineHeight: '1', fontWeight: '800', letterSpacing: '0.08em' }],
        // Nav
        'nav':       ['14px', { lineHeight: '1', fontWeight: '500' }],
        // Stats
        'stat':      ['24px', { lineHeight: '1.1', fontWeight: '600' }],
        'stat-label':['11px', { lineHeight: '1', fontWeight: '500', letterSpacing: '0.06em' }],
      },

      // ------------------------------------------------------------------
      // SPACING
      // ------------------------------------------------------------------
      spacing: {
        'chip-sm':  '40px',
        'chip-md':  '52px',
        'chip-lg':  '64px',
        'card-w':   '80px',
        'card-h':   '112px',
        'nav':      '56px',
        'tray':     '88px',
        'action':   '96px',
      },

      // ------------------------------------------------------------------
      // BORDER RADIUS
      // ------------------------------------------------------------------
      borderRadius: {
        card:  '6px',
        chip:  '50%',
        panel: '8px',
        modal: '12px',
      },

      // ------------------------------------------------------------------
      // BOX SHADOW
      // ------------------------------------------------------------------
      boxShadow: {
        card:     '0 4px 12px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)',
        chip:     '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
        panel:    '0 8px 32px rgba(0,0,0,0.6)',
        button:   '0 2px 8px rgba(0,0,0,0.4)',
        'bet-spot': 'inset 0 2px 6px rgba(0,0,0,0.4)',
        'result-win':  '0 0 20px rgba(39,174,96,0.4)',
        'result-push': '0 0 20px rgba(212,160,23,0.35)',
        'result-loss': '0 0 16px rgba(192,57,43,0.3)',
        'gold-glow':   '0 0 24px rgba(212,160,23,0.5)',
      },

      // ------------------------------------------------------------------
      // TRANSITIONS
      // ------------------------------------------------------------------
      transitionTimingFunction: {
        deal:   'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        flip:   'cubic-bezier(0.4, 0, 0.2, 1)',
        result: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      transitionDuration: {
        '120': '120ms',
        '220': '220ms',
        '380': '380ms',
      },

      // ------------------------------------------------------------------
      // KEYFRAMES
      // ------------------------------------------------------------------
      keyframes: {

        // Card deal — slide in from shoe position
        'deal-in': {
          '0%':   { opacity: '0', transform: 'translateY(-40px) rotate(-3deg) scale(0.92)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0deg) scale(1)' },
        },

        // Card flip (hole card reveal)
        'card-flip': {
          '0%':   { transform: 'rotateY(0deg)' },
          '50%':  { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },

        // Chip drop onto bet spot
        'chip-drop': {
          '0%':   { opacity: '0', transform: 'translateY(-24px) scale(0.85)' },
          '60%':  { transform: 'translateY(3px) scale(1.04)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },

        // Result banner appear
        'result-appear': {
          '0%':   { opacity: '0', transform: 'translateY(-8px) scale(0.92)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },

        // Win — subtle pulse on bet spot
        'win-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(39,174,96,0)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(39,174,96,0.25)' },
        },

        // Chip stack shimmer
        'gold-shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },

        // Roulette wheel spin indicator
        'spin-indicator': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },

        // Subtle felt pulse on active bet zone
        'bet-active': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.7' },
        },
      },

      animation: {
        'deal-in':      'deal-in 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'card-flip':    'card-flip 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        'chip-drop':    'chip-drop 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'result-appear':'result-appear 250ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'win-pulse':    'win-pulse 1.2s ease-in-out 2',
        'gold-shimmer': 'gold-shimmer 2s linear infinite',
        'spin':         'spin-indicator 1.2s linear infinite',
        'bet-active':   'bet-active 1.5s ease-in-out infinite',
      },

    },
  },

  plugins: [
    // Felt texture utility — pure CSS, no image assets
    // Usage: class="felt-texture"
    ({ addUtilities, theme }: { addUtilities: Function, theme: Function }) => {
      addUtilities({

        '.felt-texture': {
          position: 'relative',
          backgroundColor: 'var(--felt-base, #1a4731)',
          backgroundImage: [
            // Fine fiber noise — two overlapping radial gradients at different scales
            'radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.018) 0%, transparent 50%)',
            'radial-gradient(ellipse at 80% 70%, rgba(0,0,0,0.12) 0%, transparent 50%)',
            // Woven fabric crosshatch — very subtle
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px)',
            'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px)',
          ].join(', '),
        },

        '.felt-texture-dark': {
          backgroundColor: 'var(--felt-shadow, #112e20)',
          backgroundImage: [
            'radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.01) 0%, transparent 50%)',
            'radial-gradient(ellipse at 80% 70%, rgba(0,0,0,0.2) 0%, transparent 50%)',
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.035) 3px, rgba(0,0,0,0.035) 4px)',
            'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.035) 3px, rgba(0,0,0,0.035) 4px)',
          ].join(', '),
        },

        // Card back pattern — repeating diamond/argyle
        '.card-back-pattern': {
          backgroundColor: '#1a2d6b',
          backgroundImage: [
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 12px)',
            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 12px)',
          ].join(', '),
        },

        // Rail wood grain — top/bottom horizontal band
        '.rail-texture': {
          background: 'linear-gradient(180deg, #3d2215 0%, #2c1810 40%, #231208 100%)',
        },

        // Chip CSS — base style applied alongside denomination-specific colors
        '.chip-base': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          fontWeight: '700',
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '-0.02em',
          userSelect: 'none',
          position: 'relative',
          cursor: 'pointer',
          // Outer edge ring (lighter rim)
          border: '3px solid',
          // Inset dashed ring — classic casino chip detail
          boxShadow: [
            '0 3px 8px rgba(0,0,0,0.5)',
            'inset 0 1px 0 rgba(255,255,255,0.2)',
            'inset 0 0 0 4px rgba(0,0,0,0.15)',
            'inset 0 0 0 6px rgba(255,255,255,0.1)',
          ].join(', '),
        },

        // Bet spot states
        '.bet-spot': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: '2px dashed',
          borderColor: 'rgba(255,255,255,0.22)',
          transition: 'all 220ms ease',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
        },

        '.bet-spot:hover': {
          borderColor: 'rgba(212,160,23,0.55)',
          backgroundColor: 'rgba(212,160,23,0.06)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4), 0 0 12px rgba(212,160,23,0.2)',
        },

        '.bet-spot--active': {
          borderColor: 'rgba(212,160,23,0.8)',
          borderStyle: 'solid',
          backgroundColor: 'rgba(212,160,23,0.08)',
        },

        '.bet-spot--locked': {
          borderColor: 'rgba(255,255,255,0.1)',
          cursor: 'default',
          opacity: '0.7',
          pointerEvents: 'none',
        },

        // Action buttons
        '.btn-action': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: '600',
          fontSize: '13px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          height: '44px',
          paddingLeft: '20px',
          paddingRight: '20px',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 120ms ease',
          userSelect: 'none',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          '&:focus-visible': {
            outline: '2px solid rgba(212,160,23,0.6)',
            outlineOffset: '2px',
          },
          '&:disabled': {
            opacity: '0.38',
            cursor: 'not-allowed',
            pointerEvents: 'none',
          },
        },

        '.btn-primary': {
          background: 'linear-gradient(180deg, #d4a017 0%, #b8860b 100%)',
          color: '#1a1a1a',
          '&:hover:not(:disabled)': {
            background: 'linear-gradient(180deg, #e0b020 0%, #c49010 100%)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 14px rgba(212,160,23,0.45)',
          },
          '&:active:not(:disabled)': {
            transform: 'translateY(0)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          },
        },

        '.btn-secondary': {
          background: 'linear-gradient(180deg, #2a2f3a 0%, #1e2330 100%)',
          color: '#f0ece0',
          border: '1px solid #3a3f4a',
          '&:hover:not(:disabled)': {
            background: 'linear-gradient(180deg, #343a48 0%, #272d3c 100%)',
            borderColor: '#4a5060',
            transform: 'translateY(-1px)',
          },
        },

        '.btn-danger': {
          background: 'linear-gradient(180deg, #c0392b 0%, #922b21 100%)',
          color: '#ffffff',
          '&:hover:not(:disabled)': {
            background: 'linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 14px rgba(192,57,43,0.4)',
          },
        },

      })
    },
  ],
}

export default config
