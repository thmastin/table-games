import type { Card } from '../../lib/deck'

export type GamePhase = 'idle' | 'betting' | 'dealing' | 'complete'

export interface BaccaratConfig {
  variant: 'standard' | 'ez'
  tableLimits: { min: number; max: number }
}

export interface BaccaratState {
  phase: GamePhase
  variant: 'standard' | 'ez'
  playerCards: Card[]
  bankerCards: Card[]
  playerTotal: number
  bankerTotal: number
  result: 'player' | 'banker' | 'tie' | null
  isNatural: boolean
  isDragonHand: boolean
  playerBet: number
  bankerBet: number
  tieBet: number
  dragonBonus: { side: 'player' | 'banker' | null; amount: number }
  panda8: number
  playerBetResult: number | null
  bankerBetResult: number | null
  tieBetResult: number | null
  dragonBonusResult: number | null
  panda8Result: number | null
  seed: number
}

export type BaccaratCommand =
  | { type: 'PLACE_BET'; bet: 'player' | 'banker' | 'tie'; amount: number }
  | { type: 'PLACE_DRAGON_BONUS'; side: 'player' | 'banker'; amount: number }
  | { type: 'PLACE_PANDA_8'; amount: number }
  | { type: 'DEAL' }
  | { type: 'NEW_HAND' }

export type BaccaratEvent =
  | { type: 'CARD_DEALT'; card: Card; target: 'player' | 'banker'; index: number }
  | { type: 'NATURAL'; side: 'player' | 'banker'; total: number }
  | { type: 'PLAYER_DRAWS'; card: Card }
  | { type: 'BANKER_DRAWS'; card: Card }
  | { type: 'DRAGON_HAND' }
  | { type: 'RESULT'; winner: 'player' | 'banker' | 'tie'; playerTotal: number; bankerTotal: number }
  | { type: 'PAYOUT'; bet: string; netCents: number }

export interface DispatchResult {
  state: BaccaratState
  events: BaccaratEvent[]
  error?: string
}
