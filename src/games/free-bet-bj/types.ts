import type { Card, Shoe } from '../../lib/deck'

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

export type FreeBetHand = {
  id: string
  cards: Card[]
  bet: number
  freeBet: number
  isFreeSplit: boolean
  isFreeDouble: boolean
  doubled: boolean
  surrendered: boolean
  stood: boolean
  isBlackjack: boolean
  isBust: boolean
  result: HandResult | null
  settled: number
}

export type FreeBetBJConfig = {
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

export type FreeBetBJEventType =
  | 'CARD_DEALT'
  | 'HAND_RESOLVED'
  | 'DEALER_REVEALS'
  | 'INSURANCE_RESOLVED'
  | 'BUST'
  | 'BLACKJACK'
  | 'PUSH'
  | 'SURRENDER_RESOLVED'
  | 'FREE_SPLIT'
  | 'FREE_DOUBLE'
  | 'PUSH_22'
  | 'POT_OF_GOLD_TRIGGERED'
  | 'POT_OF_GOLD_RESOLVED'

export type FreeBetBJEvent = {
  type: FreeBetBJEventType
  handId?: string
  card?: Card
  netCents?: number
  message?: string
  potOfGoldPayout?: number
}

export type FreeBetBJState = {
  phase: GamePhase
  shoe: Shoe
  rngSeed: number
  hands: FreeBetHand[]
  activeHandIndex: number
  dealerCards: Card[]
  dealerTotal: number
  bet: number
  potOfGold: number
  insurance: number
  insuranceOffered: boolean
  insuranceResolved: boolean
  insuranceWon: boolean
  canSurrender: boolean
  canInsurance: boolean
  result: string | null
  totalNetCents: number
  config: FreeBetBJConfig
  events: FreeBetBJEvent[]
  activeHandValidActions: Set<string>
}

export type FreeBetBJCommand =
  | { type: 'PLACE_BET'; amountCents: number }
  | { type: 'PLACE_POT_OF_GOLD'; amountCents: number }
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
  state: FreeBetBJState
  events: FreeBetBJEvent[]
  error?: string
}
