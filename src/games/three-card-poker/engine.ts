import { createRNG } from '../../lib/rng'
import { makeShoe, dealCard } from '../../lib/deck'
import { evaluate, compareResults } from '../../lib/handEvaluator'
import {
  pairPlusPayout,
  anteBonusPayout,
  sixCardBonusPayout,
} from './paytables'
import type {
  ThreeCardPokerConfig,
  ThreeCardPokerState,
  ThreeCardPokerCommand,
  ThreeCardPokerEvent,
  SideBetResults,
} from './types'
import type { Card, Shoe } from '../../lib/deck'

const DEFAULT_CONFIG: ThreeCardPokerConfig = {
  tableLimits: {
    min: 1000,
    max: 30000,
    pairPlusMin: 100,
    pairPlusMax: 10000,
  },
}

const RANK_ORDER: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
}

function dealerQualifies(cards: Card[]): boolean {
  const result = evaluate(cards, '3-card')
  if (result.rank !== 'high-card') return true
  const highCard = Math.max(...cards.map(c => RANK_ORDER[c.rank] ?? 0))
  return highCard >= 12
}

function makeInitialState(seed: number): ThreeCardPokerState {
  return {
    phase: 'idle',
    playerCards: [],
    dealerCards: [],
    dealerCardRevealed: false,
    ante: 0,
    play: 0,
    pairPlus: 0,
    sixCardBonus: 0,
    anteBonus: 0,
    dealerQualifies: false,
    result: null,
    sideBetResults: null,
    seed,
    events: [],
  }
}

export class ThreeCardPokerEngine {
  private config: ThreeCardPokerConfig
  private state: ThreeCardPokerState
  private shoe: Shoe

  constructor(config?: Partial<ThreeCardPokerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    const seed = Date.now() ^ (Math.random() * 0x100000000)
    const rng = createRNG(seed)
    this.shoe = makeShoe(1, rng)
    this.state = makeInitialState(seed)
  }

  getState(): ThreeCardPokerState {
    return { ...this.state, events: [...this.state.events] }
  }

  _testInjectDeal(playerCards: Card[], dealerCards: Card[]): void {
    const faceUpPlayer = playerCards.map(c => ({ ...c, faceDown: false }))
    const faceDownDealer = dealerCards.map(c => ({ ...c, faceDown: true }))
    this.state = {
      ...this.state,
      phase: 'player_decision',
      playerCards: faceUpPlayer,
      dealerCards: faceDownDealer,
      dealerCardRevealed: false,
    }
  }

  dispatch(command: ThreeCardPokerCommand): {
    state: ThreeCardPokerState
    events: ThreeCardPokerEvent[]
    error?: string
  } {
    const events: ThreeCardPokerEvent[] = []

    try {
      this.state = this.reduce(command, events)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error'
      return { state: this.getState(), events: [], error }
    }

    this.state = { ...this.state, events }
    return { state: this.getState(), events }
  }

  private reduce(
    command: ThreeCardPokerCommand,
    events: ThreeCardPokerEvent[],
  ): ThreeCardPokerState {
    const s = this.state

    switch (command.type) {
      case 'PLACE_BET': {
        if (s.phase !== 'idle' && s.phase !== 'betting') {
          throw new Error(`Cannot place bet in phase: ${s.phase}`)
        }

        const { bet, amount } = command
        if (amount <= 0) throw new Error('Bet amount must be positive')

        const { min, max, pairPlusMin, pairPlusMax } = this.config.tableLimits

        if (bet === 'ante') {
          if (amount < min || amount > max) {
            throw new Error(`Ante must be between ${min} and ${max} cents`)
          }
          return { ...s, phase: 'betting', ante: amount, events }
        }

        if (bet === 'pairPlus') {
          if (amount < pairPlusMin || amount > pairPlusMax) {
            throw new Error(`Pair Plus must be between ${pairPlusMin} and ${pairPlusMax} cents`)
          }
          return { ...s, phase: s.phase === 'idle' ? 'betting' : s.phase, pairPlus: amount, events }
        }

        if (bet === 'sixCardBonus') {
          if (amount < pairPlusMin || amount > pairPlusMax) {
            throw new Error(`Six Card Bonus must be between ${pairPlusMin} and ${pairPlusMax} cents`)
          }
          return { ...s, phase: s.phase === 'idle' ? 'betting' : s.phase, sixCardBonus: amount, events }
        }

        throw new Error(`Unknown bet type: ${(command as { bet: string }).bet}`)
      }

      case 'DEAL': {
        if (s.phase !== 'betting') {
          throw new Error(`Cannot deal in phase: ${s.phase}`)
        }
        if (s.ante === 0 && s.pairPlus === 0) {
          throw new Error('Must place at least one bet before dealing')
        }

        const seed = Date.now() ^ (Math.random() * 0x100000000)
        const rng = createRNG(seed)
        this.shoe = makeShoe(1, rng)

        const playerCards: Card[] = []
        const dealerCards: Card[] = []

        for (let i = 0; i < 3; i++) {
          const pResult = dealCard(this.shoe, false)
          this.shoe = pResult.shoe
          playerCards.push(pResult.card)
          events.push({ type: 'CARD_DEALT', card: pResult.card, target: 'player', index: i })

          const dResult = dealCard(this.shoe, true)
          this.shoe = dResult.shoe
          dealerCards.push(dResult.card)
          events.push({ type: 'CARD_DEALT', card: dResult.card, target: 'dealer', index: i })
        }

        return {
          ...s,
          phase: 'player_decision',
          playerCards,
          dealerCards,
          dealerCardRevealed: false,
          play: 0,
          result: null,
          sideBetResults: null,
          seed,
          events,
        }
      }

      case 'PLAY': {
        if (s.phase !== 'player_decision') {
          throw new Error(`Cannot play in phase: ${s.phase}`)
        }
        if (s.ante === 0) {
          throw new Error('Must have placed ante to play')
        }

        const playBet = s.ante
        const revealedDealerCards = s.dealerCards.map(c => ({ ...c, faceDown: false }))
        events.push({ type: 'DEALER_REVEALED' })

        const qualifies = dealerQualifies(revealedDealerCards)
        events.push({ type: 'DEALER_QUALIFIES', qualifies })

        const playerResult = evaluate(s.playerCards, '3-card')
        const dealerResult = evaluate(revealedDealerCards, '3-card')
        events.push({ type: 'HAND_RESOLVED', result: playerResult })

        const comparison = compareResults(playerResult, dealerResult)

        if (!qualifies) {
          // ante pays 1:1, play returns — hook derives net
        } else if (comparison > 0) {
          // ante + play both pay 1:1 — hook derives net
        } else if (comparison === 0) {
          // both push — hook derives net
        } else {
          // both lose — hook derives net
        }

        const anteBonusAmount = anteBonusPayout(s.ante, playerResult.rank)
        if (anteBonusAmount > 0) {
          events.push({ type: 'ANTE_BONUS_PAID', amount: anteBonusAmount })
        }

        const sideBetResults = resolveSideBets(
          s.playerCards,
          revealedDealerCards,
          s.pairPlus,
          s.sixCardBonus,
          events,
        )

        return {
          ...s,
          phase: 'complete',
          dealerCards: revealedDealerCards,
          dealerCardRevealed: true,
          play: playBet,
          dealerQualifies: qualifies,
          result: playerResult,
          anteBonus: anteBonusAmount,
          sideBetResults,
          events,
        }
      }

      case 'FOLD': {
        if (s.phase !== 'player_decision') {
          throw new Error(`Cannot fold in phase: ${s.phase}`)
        }

        const revealedDealerCards = s.dealerCards.map(c => ({ ...c, faceDown: false }))
        events.push({ type: 'DEALER_REVEALED' })

        const playerResult = evaluate(s.playerCards, '3-card')
        events.push({ type: 'HAND_RESOLVED', result: playerResult })

        const sideBetResults = resolveSideBets(
          s.playerCards,
          revealedDealerCards,
          s.pairPlus,
          0,
          events,
        )

        return {
          ...s,
          phase: 'complete',
          dealerCards: revealedDealerCards,
          dealerCardRevealed: true,
          play: 0,
          result: playerResult,
          anteBonus: 0,
          sideBetResults,
          events,
        }
      }

      case 'NEW_HAND': {
        if (s.phase !== 'complete') {
          throw new Error(`Cannot start new hand in phase: ${s.phase}`)
        }

        const seed = Date.now() ^ (Math.random() * 0x100000000)
        const rng = createRNG(seed)
        this.shoe = makeShoe(1, rng)

        return {
          ...makeInitialState(seed),
          events,
        }
      }

      default: {
        const exhaustive: never = command
        throw new Error(`Unknown command: ${(exhaustive as { type: string }).type}`)
      }
    }
  }
}

function resolveSideBets(
  playerCards: Card[],
  dealerCards: Card[],
  pairPlusBet: number,
  sixCardBonusBet: number,
  events: ThreeCardPokerEvent[],
): SideBetResults {
  let pairPlusResult: number | null = null
  let sixCardResult: number | null = null

  if (pairPlusBet > 0) {
    const playerResult = evaluate(playerCards, '3-card')
    const winAmount = pairPlusPayout(pairPlusBet, playerResult.rank)
    pairPlusResult = winAmount > 0 ? winAmount : -pairPlusBet
    events.push({ type: 'SIDE_BET_RESOLVED', bet: 'pairPlus', payout: pairPlusResult })
  }

  if (sixCardBonusBet > 0) {
    const combined = [...playerCards, ...dealerCards]
    const bestResult = evaluate(combined, 'best-of-6')
    const winAmount = sixCardBonusPayout(sixCardBonusBet, bestResult.rank)
    sixCardResult = winAmount > 0 ? winAmount : -sixCardBonusBet
    events.push({ type: 'SIDE_BET_RESOLVED', bet: 'sixCardBonus', payout: sixCardResult })
  }

  return {
    pairPlus: pairPlusResult,
    sixCardBonus: sixCardResult,
    anteBonus: null,
  }
}
