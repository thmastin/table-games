import type { Card } from '../../lib/deck'

export type GamePhase =
  | 'idle'
  | 'betting'
  | 'dealing'
  | 'insurance'
  | 'player_turn'
  | 'dealer_turn'
  | 'resolving'
  | 'complete'

export type HandResult = 'win' | 'blackjack' | 'push' | 'loss' | 'surrender' | 'bust'

export type SideBetId =
  | 'perfect-pairs'
  | '21plus3'
  | 'lucky-ladies'
  | 'bust-it'
  | 'match-the-dealer'
  | 'royal-match'

export type SideBet = {
  id: SideBetId
  amountCents: number
  resultMultiplier?: number
  resolved: boolean
  won: boolean
}

export type Hand = {
  id: string
  cards: Card[]
  betCents: number
  doubled: boolean
  surrendered: boolean
  stood: boolean
  result?: HandResult
  netCents?: number
  isBlackjack: boolean
  isBust: boolean
}

export type BlackjackConfig = {
  numDecks: number
  dealerStandsSoft17: boolean
  allowSurrender: boolean
  allowInsurance: boolean
  tableLimits: {
    minBet: number
    maxBet: number
    minSideBet: number
    maxSideBet: number
  }
}

export type BlackjackEventType =
  | 'CARD_DEALT'
  | 'HAND_RESOLVED'
  | 'DEALER_REVEALS'
  | 'SIDE_BET_RESOLVED'
  | 'INSURANCE_RESOLVED'
  | 'BUST'
  | 'BLACKJACK'
  | 'PUSH'
  | 'SURRENDER_RESOLVED'

export type BlackjackEvent = {
  type: BlackjackEventType
  handId?: string
  card?: Card
  sideBetId?: SideBetId
  netCents?: number
  message?: string
}

export type BlackjackState = {
  phase: GamePhase
  shoe: import('../../lib/deck').Shoe
  rngSeed: number
  dealerHand: Card[]
  playerHands: Hand[]
  activeHandIndex: number
  mainBetCents: number
  sideBets: SideBet[]
  insuranceBetCents: number
  insuranceOffered: boolean
  insuranceResolved: boolean
  insuranceWon: boolean
  canSurrender: boolean
  canInsurance: boolean
  totalNetCents: number
  config: BlackjackConfig
}

export type BlackjackCommand =
  | { type: 'PLACE_BET'; amountCents: number }
  | { type: 'PLACE_SIDE_BET'; id: SideBetId; amountCents: number }
  | { type: 'DEAL' }
  | { type: 'HIT' }
  | { type: 'STAND' }
  | { type: 'DOUBLE' }
  | { type: 'SPLIT' }
  | { type: 'SURRENDER' }
  | { type: 'TAKE_INSURANCE' }
  | { type: 'DECLINE_INSURANCE' }
  | { type: 'NEW_HAND' }

export type DispatchResult = {
  state: BlackjackState
  events: BlackjackEvent[]
  error?: string
}
