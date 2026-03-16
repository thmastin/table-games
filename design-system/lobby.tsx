/**
 * Casino Table Games Suite — Lobby (Game Selection) Visual Spec
 *
 * The lobby is the first screen a player sees. It should feel like
 * walking into a high-end casino floor — dark, atmospheric, premium.
 * NOT a cartoon game select screen.
 *
 * Layout: Dark chrome background with a subtle felt-colored glow at center.
 * Game cards arranged in a responsive grid.
 */

import React from 'react'

// ============================================================
// LOBBY VISUAL CONCEPT
// ============================================================
//
// Background:
//   - Base: #0e1117 (chrome-bg) — nearly black
//   - Subtle radial gradient toward center: rgba(26,71,49,0.3) — the felt bleeds through
//   - Very faint grid lines (1px, 3% white) for depth — like a high-end carpet
//
// Header:
//   - Suite name centered, Playfair Display, 48px, gold
//   - Subtitle: "Select a Game" in small caps, text-secondary, 13px
//   - Player profile bar: top right — avatar initial + name + bankroll
//
// Game Grid:
//   - 3 columns at 1280px, 4 columns at 1600px+
//   - Gap: 24px
//   - Cards: 300px × 200px minimum
//
// Phase banners under game groups:
//   - Phase 1 games: no label (just show the cards)
//   - Phase 2 games: "Coming Soon" badge on the card (semi-transparent)
//   - Phase 3 games: same
//
// Footer:
//   - "Hall of Fame" link | "Profile" link | version number
//   - Centered, text-dim, 12px

interface GameInfo {
  id: string
  name: string
  tagline: string       // 1 short line — what makes this game interesting
  phase: 1 | 2 | 3
  available: boolean
  minBet: number
  maxBet: number
  tableColor: string    // felt variant hex
}

const GAMES: GameInfo[] = [
  {
    id: 'blackjack',
    name: 'Blackjack',
    tagline: 'Beat the dealer. Classic rules.',
    phase: 1, available: true, minBet: 5, maxBet: 500, tableColor: '#1a4731',
  },
  {
    id: 'free-bet-blackjack',
    name: 'Free Bet Blackjack',
    tagline: 'Free doubles and splits on qualifying hands.',
    phase: 1, available: true, minBet: 5, maxBet: 500, tableColor: '#1a3f45',
  },
  {
    id: 'uth',
    name: 'Ultimate Texas Hold\'Em',
    tagline: 'Heads-up poker against the dealer.',
    phase: 1, available: true, minBet: 5, maxBet: 200, tableColor: '#2a3d1a',
  },
  {
    id: 'three-card-poker',
    name: 'Three Card Poker',
    tagline: 'Three cards. Ante, Play, Pair Plus.',
    phase: 1, available: true, minBet: 5, maxBet: 200, tableColor: '#1a4731',
  },
  {
    id: 'baccarat',
    name: 'Baccarat',
    tagline: 'Banker, Player, or Tie. No decisions required.',
    phase: 2, available: false, minBet: 10, maxBet: 1000, tableColor: '#1e2d4a',
  },
  {
    id: 'mississippi-stud',
    name: 'Mississippi Stud',
    tagline: 'Build your hand across three streets.',
    phase: 2, available: false, minBet: 5, maxBet: 200, tableColor: '#1a4731',
  },
  {
    id: 'let-it-ride',
    name: 'Let It Ride',
    tagline: 'Hold or pull back. Three rounds of tension.',
    phase: 2, available: false, minBet: 5, maxBet: 200, tableColor: '#1a4731',
  },
  {
    id: 'roulette',
    name: 'Roulette',
    tagline: 'American double-zero. Every number pays.',
    phase: 2, available: false, minBet: 1, maxBet: 500, tableColor: '#1a3a1a',
  },
  {
    id: 'craps',
    name: 'Craps',
    tagline: 'Pass, Come, Place, Odds. The full table.',
    phase: 3, available: false, minBet: 5, maxBet: 500, tableColor: '#1a4731',
  },
]

// ============================================================
// GAME CARD SPEC
// ============================================================
//
// Size: 300px × 200px (min) — fills grid column width
// Shape: 8px radius, 1px border (chrome-border #2a2f3a)
// Background: dark panel base + felt-colored top band
//
// Structure:
//   ┌────────────────────────────────────┐
//   │  FELT BAND (72px)                  │  ← game-specific felt color, fabric texture
//   │  [felt label: game name in small   │
//   │   Playfair Display, white, centered]│
//   ├────────────────────────────────────┤
//   │  CARD BODY (128px)                 │  ← dark panel bg
//   │                                    │
//   │  Game Name         [Phase badge]   │
//   │  Tagline                           │
//   │                                    │
//   │  Min: $5    Max: $500              │
//   └────────────────────────────────────┘
//
// Hover state (available games only):
//   - Box shadow: gold glow (shadow-gold-glow)
//   - Border: gold-mid (#b8860b)
//   - Felt band: slightly brighter (brightness-110)
//   - Slight scale: 1.02 transform
//
// Unavailable state:
//   - Overall opacity: 0.55
//   - "Coming Soon" badge: top-right of felt band
//     — background: rgba(0,0,0,0.55), text: text-secondary, 10px uppercase
//   - Cursor: default (not pointer)
//
// Phase badge (shown only on unavailable):
//   - Phase 2: small tag, "Phase 2", background: #1e2330, text: #a89e88
//   - Phase 3: same structure, "Phase 3"

function GameCard({ game }: { game: GameInfo }) {
  const isAvailable = game.available

  return (
    <div
      className={[
        'relative flex flex-col rounded-[8px] overflow-hidden',
        'border border-[#2a2f3a]',
        'transition-all duration-[220ms]',
        isAvailable
          ? 'cursor-pointer hover:scale-[1.02] hover:border-[#b8860b] hover:shadow-gold-glow'
          : 'opacity-55 cursor-default',
      ].join(' ')}
      style={{ minWidth: '300px', minHeight: '200px' }}
    >
      {/* Felt band — top section */}
      <div
        className="felt-texture relative flex items-center justify-center"
        style={{ height: '72px', backgroundColor: game.tableColor }}
      >
        <span
          className="font-[Playfair_Display] font-bold text-[#f0ece0] text-[18px] tracking-[0.04em]"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
        >
          {game.name}
        </span>

        {/* Coming Soon badge */}
        {!isAvailable && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded bg-[rgba(0,0,0,0.55)]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a89e88]">
              Coming Soon
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex-1 flex flex-col bg-[#141820] px-4 py-3 gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] text-[#a89e88] leading-snug flex-1">
            {game.tagline}
          </p>
          {!isAvailable && (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6b6456] bg-[#1e2330] px-2 py-1 rounded">
              Phase {game.phase}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center gap-4 pt-2 border-t border-[#1e2330]">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[#6b6456] font-semibold">Min Bet</span>
            <span className="text-[13px] font-mono font-semibold text-[#f0ece0]">${game.minBet}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[#6b6456] font-semibold">Max Bet</span>
            <span className="text-[13px] font-mono font-semibold text-[#f0ece0]">${game.maxBet}</span>
          </div>
          {isAvailable && (
            <div className="ml-auto">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#d4a017]">
                Play &rarr;
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Lobby() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(26,71,49,0.22) 0%, #0e1117 65%)',
        // Subtle carpet grid
        backgroundImage: [
          'radial-gradient(ellipse at 50% 40%, rgba(26,71,49,0.22) 0%, #0e1117 65%)',
          'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.015) 39px, rgba(255,255,255,0.015) 40px)',
          'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.015) 39px, rgba(255,255,255,0.015) 40px)',
        ].join(', '),
      }}
    >
      {/* Nav */}
      <nav className="h-[56px] flex items-center justify-between px-8 border-b border-[#2a2f3a] bg-[#0e1117]">
        <span className="font-[Playfair_Display] font-bold text-[20px] text-[#e8c97a] tracking-[0.06em]">
          THE FLOOR
        </span>
        <div className="flex items-center gap-6">
          <a href="#hall-of-fame" className="text-[13px] text-[#a89e88] hover:text-[#f0ece0] transition-colors">
            Hall of Fame
          </a>
          <div className="flex items-center gap-3 pl-6 border-l border-[#2a2f3a]">
            {/* Profile initial avatar */}
            <div className="w-8 h-8 rounded-full bg-[#1a4731] border border-[#27ae60] flex items-center justify-center">
              <span className="text-[12px] font-bold text-[#f0ece0]">T</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-[#f0ece0] leading-tight">Player</span>
              <span className="text-[11px] font-mono text-[#e8c97a] leading-tight">$1,000</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-8 py-12 gap-10">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-[Playfair_Display] font-bold text-[48px] text-[#e8c97a] leading-tight tracking-[0.02em]">
            Select a Game
          </h1>
          <p className="text-[14px] text-[#6b6456] uppercase tracking-[0.12em] font-semibold">
            Table Minimum Displayed Below Each Game
          </p>
        </div>

        {/* Divider */}
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#b8860b] to-transparent" />

        {/* Available games group */}
        <section className="w-full max-w-[1200px] flex flex-col gap-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6456]">
            Open Tables
          </h2>
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {GAMES.filter(g => g.available).map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        {/* Coming soon group */}
        <section className="w-full max-w-[1200px] flex flex-col gap-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6456]">
            Coming Soon
          </h2>
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {GAMES.filter(g => !g.available).map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center gap-8 py-4 border-t border-[#1e2330]">
        <span className="text-[11px] text-[#3a3f4a] font-mono">v0.1.0</span>
        <span className="text-[11px] text-[#3a3f4a]">No real money. For entertainment only.</span>
      </footer>
    </div>
  )
}

export { GAMES }
export type { GameInfo }
