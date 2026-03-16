import type { Card } from '../../lib/deck'
import type { HandResult } from '../../lib/handEvaluator'

export type GamePhase =
  | 'idle'
  | 'betting'
  | 'dealing'
  | 'player_decision'
  | 'resolving'
  | 'complete'

export interface ThreeCardPokerConfig {
  tableLimits: {
    min: number
    max: number
    pairPlusMin: number
    pairPlusMax: number
  }
}

export interface SideBetResults {
  pairPlus: number | null
  sixCardBonus: number | null
  anteBonus: number | null
}

export interface ThreeCardPokerState {
  phase: GamePhase
  playerCards: Card[]
  dealerCards: Card[]
  dealerCardRevealed: boolean
  ante: number
  play: number
  pairPlus: number
  sixCardBonus: number
  anteBonus: number
  dealerQualifies: boolean
  result: HandResult | null
  sideBetResults: SideBetResults | null
  seed: number
  events: ThreeCardPokerEvent[]
}

export type ThreeCardPokerCommand =
  | { type: 'PLACE_BET'; bet: 'ante' | 'pairPlus' | 'sixCardBonus'; amount: number }
  | { type: 'DEAL' }
  | { type: 'PLAY' }
  | { type: 'FOLD' }
  | { type: 'NEW_HAND' }

export type ThreeCardPokerEvent =
  | { type: 'CARD_DEALT'; card: Card; target: 'player' | 'dealer'; index: number }
  | { type: 'DEALER_REVEALED' }
  | { type: 'DEALER_QUALIFIES'; qualifies: boolean }
  | { type: 'HAND_RESOLVED'; result: HandResult }
  | { type: 'SIDE_BET_RESOLVED'; bet: string; payout: number }
  | { type: 'ANTE_BONUS_PAID'; amount: number }
