/**
 * Casino Table Games Suite — Reference Component Specs
 *
 * This file is a visual specification document, not production code.
 * It defines the intended markup structure and className patterns for each
 * core component. Copy/adapt these into your actual component files.
 *
 * Components covered:
 *   Card, Chip, BetSpot, ActionButton, ResultBanner
 */

import React from 'react'

// ============================================================
// CARD COMPONENT
// ============================================================
//
// Size:     80px × 112px (var: --card-width / --card-height)
// Radius:   6px
// Face:     warm white (#faf8f2) with 1px border (#d4c9a8)
// Back:     deep navy (#1a2d6b) with CSS diamond pattern
// Shadow:   0 4px 12px rgba(0,0,0,0.55) — cards sit above the felt
//
// Face card approach: For J/Q/K, render a stylized initial (J, Q, K) in
// Playfair Display at ~40px centered, with suit symbol below. Do not attempt
// to render face card artwork — a clean typographic treatment is more
// maintainable and reads well at this card size.
//
// Dealing animation: animate-deal-in (defined in tailwind.config.ts)
// Flip animation: animate-card-flip (for hole card reveal)

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

interface CardProps {
  rank?: Rank
  suit?: Suit
  faceDown?: boolean
  animating?: boolean
  className?: string
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades:   '♠',
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
}

const RED_SUITS: Suit[] = ['hearts', 'diamonds']

export function Card({ rank, suit, faceDown = false, animating = false, className = '' }: CardProps) {
  const isRed = suit ? RED_SUITS.includes(suit) : false
  const suitColor = isRed ? 'text-[#c41e3a]' : 'text-[#1a1a1a]'

  return (
    <div
      className={[
        // Base dimensions and shape
        'relative w-[80px] h-[112px] rounded-[6px]',
        // Shadow — cards float above felt
        'shadow-card',
        // Deal animation
        animating ? 'animate-deal-in' : '',
        className,
      ].join(' ')}
      style={{ perspective: '600px' }}
    >
      {faceDown ? (
        // FACE DOWN — card back
        <div className="w-full h-full rounded-[6px] card-back-pattern border border-[#1a2d6b]">
          {/* Inner border detail */}
          <div className="absolute inset-[4px] rounded-[3px] border border-[rgba(255,255,255,0.12)]" />
        </div>
      ) : (
        // FACE UP
        <div className={[
          'w-full h-full rounded-[6px] flex flex-col',
          'bg-[#faf8f2] border border-[#d4c9a8]',
        ].join(' ')}>

          {/* Top-left rank + suit */}
          <div className={`absolute top-[5px] left-[5px] flex flex-col items-center leading-none ${suitColor}`}>
            <span className="font-[Playfair_Display] font-bold text-[14px]">{rank}</span>
            <span className="text-[11px]">{suit && SUIT_SYMBOLS[suit]}</span>
          </div>

          {/* Center — large suit or face card initial */}
          <div className={`flex-1 flex items-center justify-center ${suitColor}`}>
            {rank && ['J', 'Q', 'K'].includes(rank) ? (
              // Face card: large initial + suit
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-[Playfair_Display] font-bold text-[38px] leading-none">{rank}</span>
                <span className="text-[18px] leading-none">{suit && SUIT_SYMBOLS[suit]}</span>
              </div>
            ) : (
              // Pip card: large suit symbol
              <span className="text-[36px] leading-none">{suit && SUIT_SYMBOLS[suit]}</span>
            )}
          </div>

          {/* Bottom-right rank + suit (inverted) */}
          <div className={`absolute bottom-[5px] right-[5px] flex flex-col items-center leading-none rotate-180 ${suitColor}`}>
            <span className="font-[Playfair_Display] font-bold text-[14px]">{rank}</span>
            <span className="text-[11px]">{suit && SUIT_SYMBOLS[suit]}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// CHIP COMPONENT
// ============================================================
//
// Denominations: $1, $5, $25, $100, $500, $1000
// Sizes:
//   lg  (64px) — chip tray display, large bet display
//   md  (52px) — primary table bet spots
//   sm  (40px) — stacked chips, compact display
//
// Visual anatomy:
//   - Outer circle: base color with rim color border
//   - Dashed inner ring: 4px inset, semi-transparent white — classic chip look
//   - Center label: denomination amount in JetBrains Mono, bold
//   - Dollar sign: smaller, same font, slightly transparent
//
// Stacking: When multiple chips are in a bet spot, offset each by -8px Y
// so the stack reads naturally. Show a count badge if > 5 chips visible.

type ChipDenomination = 1 | 5 | 25 | 100 | 500 | 1000
type ChipSize = 'sm' | 'md' | 'lg'

interface ChipProps {
  denomination: ChipDenomination
  size?: ChipSize
  onClick?: () => void
  disabled?: boolean
  className?: string
}

const CHIP_STYLES: Record<ChipDenomination, {
  bg: string; border: string; text: string; label: string
}> = {
  1:    { bg: '#e8e4dc', border: '#f5f2ec', text: '#2a2a2a',  label: '1' },
  5:    { bg: '#c0392b', border: '#e74c3c', text: '#ffffff',  label: '5' },
  25:   { bg: '#1e8449', border: '#27ae60', text: '#ffffff',  label: '25' },
  100:  { bg: '#1a1a2e', border: '#2d2d48', text: '#e8c97a',  label: '100' },
  500:  { bg: '#6c3483', border: '#8e44ad', text: '#ffffff',  label: '500' },
  1000: { bg: '#b8860b', border: '#d4a017', text: '#1a1a1a',  label: '1K' },
}

const CHIP_SIZE_CLASSES: Record<ChipSize, { outer: string; fontSize: string; innerRing: string }> = {
  sm: { outer: 'w-[40px] h-[40px]',  fontSize: 'text-[10px]', innerRing: 'inset-[4px]' },
  md: { outer: 'w-[52px] h-[52px]',  fontSize: 'text-[13px]', innerRing: 'inset-[5px]' },
  lg: { outer: 'w-[64px] h-[64px]',  fontSize: 'text-[15px]', innerRing: 'inset-[6px]' },
}

export function Chip({ denomination, size = 'md', onClick, disabled = false, className = '' }: ChipProps) {
  const style = CHIP_STYLES[denomination]
  const sz    = CHIP_SIZE_CLASSES[size]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        // Shape and size
        sz.outer,
        'rounded-full relative flex items-center justify-center',
        // Base chip styles from custom utility
        'chip-base',
        // Cursor
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        // Hover/active (only when interactive)
        !disabled && onClick ? 'hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-[120ms]' : '',
        className,
      ].join(' ')}
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        color: style.text,
      }}
    >
      {/* Inner dashed ring — classic chip detail */}
      <div
        className={`absolute ${sz.innerRing} rounded-full border-2 border-dashed`}
        style={{ borderColor: `${style.text}30` }}
      />

      {/* Label */}
      <span className={`${sz.fontSize} font-mono font-bold relative z-10 leading-none`}>
        {style.label}
      </span>
    </button>
  )
}

// ============================================================
// BET SPOT COMPONENT
// ============================================================
//
// States:
//   idle    — dashed circle border, dim white, 60-80px diameter
//   hover   — gold dashed border, subtle gold background tint, gold glow
//   active  — gold solid border, chips displayed inside
//   locked  — dimmed, no interaction (cards have been dealt)
//
// Printed label below: the bet zone name in small caps, felt-print color
// (e.g., "ANTE", "PLAY", "PAIR PLUS", "TRIPS")

type BetSpotState = 'idle' | 'hover' | 'active' | 'locked'

interface BetSpotProps {
  label?: string
  state?: BetSpotState
  amount?: number        // total amount bet in this spot
  minBet?: number
  maxBet?: number
  onClick?: () => void
  size?: number          // diameter in px, default 80
  children?: React.ReactNode
  className?: string
}

export function BetSpot({
  label,
  state = 'idle',
  amount,
  onClick,
  size = 80,
  children,
  className = '',
}: BetSpotProps) {

  const stateClasses: Record<BetSpotState, string> = {
    idle:   'border-dashed border-[rgba(255,255,255,0.22)] hover:border-[rgba(212,160,23,0.55)] hover:bg-[rgba(212,160,23,0.06)] hover:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),0_0_12px_rgba(212,160,23,0.2)]',
    hover:  'border-dashed border-[rgba(212,160,23,0.55)] bg-[rgba(212,160,23,0.06)]',
    active: 'border-solid border-[rgba(212,160,23,0.8)] bg-[rgba(212,160,23,0.08)]',
    locked: 'border-dashed border-[rgba(255,255,255,0.1)] opacity-70 pointer-events-none',
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={state !== 'locked' ? onClick : undefined}
        className={[
          'relative flex items-center justify-center rounded-full',
          'border-2 cursor-pointer transition-all duration-[220ms]',
          'shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]',
          stateClasses[state],
          className,
        ].join(' ')}
        style={{ width: size, height: size }}
      >
        {children}

        {/* Amount display when no chip children */}
        {!children && amount && amount > 0 && (
          <span className="font-mono font-bold text-[13px] text-[#f0ece0]">
            ${amount}
          </span>
        )}

        {/* Empty state hint */}
        {!children && (!amount || amount === 0) && state === 'idle' && (
          <span className="text-[rgba(255,255,255,0.18)] text-[10px] font-mono uppercase tracking-widest text-center leading-tight px-1">
            bet
          </span>
        )}
      </div>

      {/* Zone label — printed on felt */}
      {label && (
        <span className="text-[rgba(255,255,255,0.3)] text-[10px] font-semibold uppercase tracking-[0.12em] select-none">
          {label}
        </span>
      )}
    </div>
  )
}

// ============================================================
// ACTION BUTTON COMPONENT
// ============================================================
//
// Variants:
//   primary   — gold gradient, dark text — main action (Deal, Hit, etc.)
//   secondary — dark panel, light text — secondary action (Stand, Check)
//   danger    — red gradient, white text — destructive (Fold, Clear Bets)
//
// Sizes:
//   sm  — compact inline buttons (side actions, chip tray)
//   md  — standard table action buttons (44px height)
//   lg  — primary deal button (52px height, wider)
//
// All buttons: uppercase text, 0.06em letter-spacing, 600 weight, 6px radius
// Disabled: opacity 38%, no pointer-events

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ActionButtonProps {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  onClick?: () => void
  disabled?: boolean
  className?: string
}

const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-gradient-to-b from-[#d4a017] to-[#b8860b] text-[#1a1a1a] hover:from-[#e0b020] hover:to-[#c49010] hover:shadow-[0_4px_14px_rgba(212,160,23,0.45)]',
  secondary: 'bg-gradient-to-b from-[#2a2f3a] to-[#1e2330] text-[#f0ece0] border border-[#3a3f4a] hover:from-[#343a48] hover:to-[#272d3c] hover:border-[#4a5060]',
  danger:    'bg-gradient-to-b from-[#c0392b] to-[#922b21] text-white hover:from-[#e74c3c] hover:to-[#c0392b] hover:shadow-[0_4px_14px_rgba(192,57,43,0.4)]',
}

const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-[36px] px-[14px] text-[11px]',
  md: 'h-[44px] px-[20px] text-[13px]',
  lg: 'h-[52px] px-[32px] text-[14px]',
}

export function ActionButton({
  label,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        // Base
        'inline-flex items-center justify-center',
        'rounded-[6px] font-semibold uppercase tracking-[0.06em]',
        'transition-all duration-[120ms] cursor-pointer shadow-button',
        'select-none',
        // Focus ring — gold
        'focus-visible:outline-2 focus-visible:outline-[rgba(212,160,23,0.6)] focus-visible:outline-offset-2',
        // Hover lift (overridden per variant)
        !disabled ? 'hover:-translate-y-px active:translate-y-0' : '',
        // Disabled
        disabled ? 'opacity-[0.38] cursor-not-allowed pointer-events-none' : '',
        // Variant
        BUTTON_VARIANT_CLASSES[variant],
        // Size
        BUTTON_SIZE_CLASSES[size],
        className,
      ].join(' ')}
    >
      {label}
    </button>
  )
}

// ============================================================
// RESULT BANNER COMPONENT
// ============================================================
//
// Positioning: absolute, centered horizontally over the player's card zone,
// vertically centered between player cards and the action bar.
// z-index: above cards, below modals.
//
// Animation: animate-result-appear (slight spring scale + fade)
// Auto-dismiss: after 2.5s, fade out (handle in parent with setTimeout)
//
// Content:
//   win        — "WIN" or "YOU WIN $X"
//   blackjack  — "BLACKJACK" (gold, larger)
//   push       — "PUSH" or "TIE"
//   loss       — "LOSE" or empty (loss is least prominent)
//
// Payout line: smaller text below the main result label, e.g. "+$150 (3:2)"

type ResultType = 'win' | 'blackjack' | 'push' | 'loss'

interface ResultBannerProps {
  result: ResultType
  amount?: number
  payout?: string    // e.g. "3:2", "2:1"
  visible?: boolean
  className?: string
}

const RESULT_STYLES: Record<ResultType, {
  bg: string; border: string; shadow: string; textColor: string; label: string
}> = {
  win:       {
    bg: 'rgba(39,174,96,0.15)',
    border: 'rgba(39,174,96,0.5)',
    shadow: '0 0 20px rgba(39,174,96,0.4)',
    textColor: '#2ecc71',
    label: 'WIN',
  },
  blackjack: {
    bg: 'rgba(212,160,23,0.18)',
    border: 'rgba(212,160,23,0.6)',
    shadow: '0 0 28px rgba(212,160,23,0.5)',
    textColor: '#e8c97a',
    label: 'BLACKJACK',
  },
  push: {
    bg: 'rgba(212,160,23,0.12)',
    border: 'rgba(212,160,23,0.45)',
    shadow: '0 0 20px rgba(212,160,23,0.35)',
    textColor: '#d4a017',
    label: 'PUSH',
  },
  loss: {
    bg: 'rgba(192,57,43,0.12)',
    border: 'rgba(192,57,43,0.45)',
    shadow: '0 0 16px rgba(192,57,43,0.3)',
    textColor: '#e74c3c',
    label: 'LOSE',
  },
}

export function ResultBanner({ result, amount, payout, visible = true, className = '' }: ResultBannerProps) {
  const style = RESULT_STYLES[result]

  if (!visible) return null

  return (
    <div
      className={[
        'animate-result-appear',
        'px-8 py-4 rounded-[8px]',
        'border flex flex-col items-center gap-1',
        'pointer-events-none select-none',
        className,
      ].join(' ')}
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        boxShadow: style.shadow,
      }}
    >
      {/* Main result label */}
      <span
        className="font-[Playfair_Display] font-bold tracking-[0.1em] leading-none"
        style={{
          color: style.textColor,
          fontSize: result === 'blackjack' ? '32px' : '26px',
        }}
      >
        {style.label}
      </span>

      {/* Payout detail */}
      {(amount !== undefined || payout) && (
        <span className="text-[#f0ece0] font-mono text-[13px] font-medium opacity-90">
          {amount !== undefined && amount > 0 && `+$${amount.toLocaleString()}`}
          {payout && <span className="text-[#a89e88] ml-1">({payout})</span>}
        </span>
      )}
    </div>
  )
}
