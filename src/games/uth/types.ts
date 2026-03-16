import type { Card } from '../../lib/deck'

export type GamePhase =
  | 'idle'
  | 'betting'
  | 'preflop'
  | 'flop'
  | 'river'
  | 'resolving'
  | 'complete'

export interface UTHState {
  phase: GamePhase
  playerHole: Card[]
  dealerHole: Card[]
  community: Card[]
  ante: number
  blind: number
  play: number
  trips: number
  dealerQualifies: boolean
  playerHandRank: string | null
  dealerHandRank: string | null
  result: 'win' | 'loss' | 'push' | null
  blindResult: 'win' | 'push' | 'loss' | null
  tripsResult: { rank: string; payout: number } | null
  seed: number
  events: UTHEvent[]
  checkedPreflop: boolean
  checkedFlop: boolean
}

export type UTHCommand =
  | { type: 'PLACE_ANTE'; amount: number }
  | { type: 'PLACE_TRIPS'; amount: number }
  | { type: 'DEAL' }
  | { type: 'BET'; multiplier: 3 | 4 }
  | { type: 'CHECK' }
  | { type: 'BET_2X' }
  | { type: 'BET_1X' }
  | { type: 'FOLD' }
  | { type: 'NEW_HAND' }

export type UTHEvent =
  | { type: 'HOLE_CARDS_DEALT' }
  | { type: 'FLOP_DEALT'; cards: Card[] }
  | { type: 'RIVER_DEALT'; cards: Card[] }
  | { type: 'DEALER_REVEALED' }
  | { type: 'DEALER_QUALIFIES'; qualifies: boolean }
  | { type: 'HAND_RESOLVED'; result: 'win' | 'loss' | 'push'; playerRank: string; dealerRank: string }
  | { type: 'BLIND_RESOLVED'; result: 'win' | 'push' | 'loss'; payout: number }
  | { type: 'TRIPS_RESOLVED'; rank: string; payout: number }

export interface UTHConfig {
  tableLimits: {
    minAnte: number
    maxAnte: number
    minTrips: number
    maxTrips: number
  }
}
