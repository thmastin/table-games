import { createRNG } from '../../lib/rng'
import { makeShoe, dealCard, penetration } from '../../lib/deck'
import { payout } from '../../lib/chips'
import { calcSideBet, cardTotal } from './paytables'
import type {
  BlackjackState,
  BlackjackConfig,
  BlackjackCommand,
  DispatchResult,
  BlackjackEvent,
  Hand,
  SideBet,
  SideBetId,
} from './types'
import type { Card } from '../../lib/deck'

const DEFAULT_CONFIG: BlackjackConfig = {
  numDecks: 6,
  dealerStandsSoft17: true,
  allowSurrender: true,
  allowInsurance: true,
  tableLimits: {
    minBet: 1000,
    maxBet: 50000,
    minSideBet: 100,
    maxSideBet: 2500,
  },
}

function makeHandId(): string {
  return Math.random().toString(36).slice(2, 9)
}

function makeHand(betCents: number): Hand {
  return {
    id: makeHandId(),
    cards: [],
    betCents,
    doubled: false,
    surrendered: false,
    stood: false,
    isBlackjack: false,
    isBust: false,
  }
}

function isSoft(cards: Card[]): boolean {
  let total = 0
  let aces = 0
  for (const c of cards) {
    if (c.rank === 'A') {
      aces++
      total += 11
    } else if (['10', 'J', 'Q', 'K'].includes(c.rank)) {
      total += 10
    } else {
      total += parseInt(c.rank, 10)
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return aces > 0 && total <= 21
}

function isBlackjack(cards: Card[]): boolean {
  return (
    cards.length === 2 &&
    cardTotal(cards) === 21
  )
}

function isBust(cards: Card[]): boolean {
  return cardTotal(cards) > 21
}

function dealerShouldHit(cards: Card[], standsSoft17: boolean): boolean {
  const total = cardTotal(cards)
  if (total < 17) return true
  if (total === 17 && !standsSoft17 && isSoft(cards)) return true
  return false
}

function canDouble(hand: Hand): boolean {
  return hand.cards.length === 2 && !hand.stood && !hand.surrendered && !hand.isBust
}

function canSplit(hand: Hand, allHands: Hand[]): boolean {
  if (hand.cards.length !== 2) return false
  if (hand.stood || hand.surrendered || hand.isBust) return false
  if (allHands.length >= 4) return false
  const [c1, c2] = hand.cards
  return cardValue(c1!) === cardValue(c2!)
}

function cardValue(card: Card): number {
  if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 10
  if (card.rank === 'A') return 11
  return parseInt(card.rank, 10)
}

function isAce(card: Card): boolean {
  return card.rank === 'A'
}

function canSurrender(hand: Hand, config: BlackjackConfig): boolean {
  return (
    config.allowSurrender &&
    hand.cards.length === 2 &&
    !hand.doubled &&
    !hand.surrendered
  )
}

function makeInitialState(config: BlackjackConfig): BlackjackState {
  const seed = Math.floor(Math.random() * 0xffffffff)
  const rng = createRNG(seed)
  const shoe = makeShoe(config.numDecks, rng)
  return {
    phase: 'betting',
    shoe,
    rngSeed: seed,
    dealerHand: [],
    playerHands: [],
    activeHandIndex: 0,
    mainBetCents: 0,
    sideBets: [],
    insuranceBetCents: 0,
    insuranceOffered: false,
    insuranceResolved: false,
    insuranceWon: false,
    canSurrender: false,
    canInsurance: false,
    totalNetCents: 0,
    config,
  }
}

function reshuffleIfNeeded(state: BlackjackState): BlackjackState {
  if (penetration(state.shoe) >= 0.75) {
    const seed = Math.floor(Math.random() * 0xffffffff)
    const rng = createRNG(seed)
    const shoe = makeShoe(state.config.numDecks, rng)
    return { ...state, shoe, rngSeed: seed }
  }
  return state
}

function dealOne(state: BlackjackState, faceDown = false): { state: BlackjackState; card: Card } {
  const { card, shoe } = dealCard(state.shoe, faceDown)
  return { state: { ...state, shoe }, card }
}

function resolveDealerTurn(state: BlackjackState): { state: BlackjackState; events: BlackjackEvent[] } {
  const events: BlackjackEvent[] = []
  let current = { ...state }

  const revealCard = { ...current.dealerHand[1]!, faceDown: false }
  current = {
    ...current,
    dealerHand: [current.dealerHand[0]!, revealCard, ...current.dealerHand.slice(2)],
  }
  events.push({ type: 'DEALER_REVEALS', card: revealCard })

  while (dealerShouldHit(current.dealerHand, current.config.dealerStandsSoft17)) {
    const { state: next, card } = dealOne(current)
    current = { ...next, dealerHand: [...current.dealerHand, card] }
    events.push({ type: 'CARD_DEALT', card })
  }

  if (isBust(current.dealerHand)) {
    events.push({ type: 'BUST' })
  }

  return { state: current, events }
}

function resolveHands(state: BlackjackState): { state: BlackjackState; events: BlackjackEvent[] } {
  const events: BlackjackEvent[] = []
  const dealerTotal = cardTotal(state.dealerHand)
  const dealerBJ = isBlackjack(state.dealerHand)
  const dealerBust = isBust(state.dealerHand)

  let totalNet = 0

  const resolvedHands = state.playerHands.map(hand => {
    if (hand.surrendered) {
      const net = -payout(hand.betCents, 1, 2)
      totalNet += net
      events.push({ type: 'SURRENDER_RESOLVED', handId: hand.id, netCents: net })
      return { ...hand, result: 'surrender' as const, netCents: net }
    }

    if (hand.isBust) {
      const net = -hand.betCents
      totalNet += net
      events.push({ type: 'HAND_RESOLVED', handId: hand.id, netCents: net })
      return { ...hand, result: 'bust' as const, netCents: net }
    }

    const handTotal = cardTotal(hand.cards)
    const handBJ = isBlackjack(hand.cards)

    if (handBJ && dealerBJ) {
      totalNet += 0
      events.push({ type: 'PUSH', handId: hand.id, netCents: 0 })
      return { ...hand, result: 'push' as const, netCents: 0 }
    }

    if (handBJ) {
      const net = payout(hand.betCents, 3, 2)
      totalNet += net
      events.push({ type: 'BLACKJACK', handId: hand.id, netCents: net })
      return { ...hand, result: 'blackjack' as const, netCents: net }
    }

    if (dealerBJ) {
      const net = -hand.betCents
      totalNet += net
      events.push({ type: 'HAND_RESOLVED', handId: hand.id, netCents: net })
      return { ...hand, result: 'loss' as const, netCents: net }
    }

    if (dealerBust) {
      totalNet += hand.betCents
      events.push({ type: 'HAND_RESOLVED', handId: hand.id, netCents: hand.betCents })
      return { ...hand, result: 'win' as const, netCents: hand.betCents }
    }

    if (handTotal > dealerTotal) {
      totalNet += hand.betCents
      events.push({ type: 'HAND_RESOLVED', handId: hand.id, netCents: hand.betCents })
      return { ...hand, result: 'win' as const, netCents: hand.betCents }
    }

    if (handTotal === dealerTotal) {
      totalNet += 0
      events.push({ type: 'PUSH', handId: hand.id, netCents: 0 })
      return { ...hand, result: 'push' as const, netCents: 0 }
    }

    const net = -hand.betCents
    totalNet += net
    events.push({ type: 'HAND_RESOLVED', handId: hand.id, netCents: net })
    return { ...hand, result: 'loss' as const, netCents: net }
  })

  return {
    state: { ...state, playerHands: resolvedHands, totalNetCents: totalNet },
    events,
  }
}


function resolveInsurance(state: BlackjackState): { state: BlackjackState; events: BlackjackEvent[] } {
  const events: BlackjackEvent[] = []
  if (!state.insuranceResolved || state.insuranceBetCents === 0) return { state, events }

  const dealerBJ = isBlackjack(state.dealerHand)
  const net = dealerBJ
    ? payout(state.insuranceBetCents, 2, 1)
    : -state.insuranceBetCents

  events.push({ type: 'INSURANCE_RESOLVED', netCents: net })
  return {
    state: { ...state, insuranceWon: dealerBJ, totalNetCents: state.totalNetCents + net },
    events,
  }
}

function advanceActiveHand(state: BlackjackState): BlackjackState {
  for (let i = state.activeHandIndex + 1; i < state.playerHands.length; i++) {
    const h = state.playerHands[i]!
    if (!h.stood && !h.isBust && !h.surrendered) {
      return { ...state, activeHandIndex: i }
    }
  }
  return { ...state, activeHandIndex: state.playerHands.length }
}

function allHandsDone(state: BlackjackState): boolean {
  return state.playerHands.every(h => h.stood || h.isBust || h.surrendered)
}

function isSideBetEarlyResolved(id: SideBetId): boolean {
  return id !== 'bust-it'
}

export class BlackjackEngine {
  private state: BlackjackState

  constructor(config: Partial<BlackjackConfig> = {}) {
    const merged: BlackjackConfig = { ...DEFAULT_CONFIG, ...config }
    this.state = makeInitialState(merged)
  }

  getState(): BlackjackState {
    return this.state
  }

  dispatch(command: BlackjackCommand): DispatchResult {
    const events: BlackjackEvent[] = []

    try {
      switch (command.type) {
        case 'PLACE_BET': {
          if (this.state.phase !== 'betting') {
            return { state: this.state, events, error: 'Not in betting phase' }
          }
          const { minBet, maxBet } = this.state.config.tableLimits
          if (command.amountCents < minBet || command.amountCents > maxBet) {
            return { state: this.state, events, error: `Bet must be between ${minBet} and ${maxBet} cents` }
          }
          this.state = { ...this.state, mainBetCents: command.amountCents }
          break
        }

        case 'PLACE_SIDE_BET': {
          if (this.state.phase !== 'betting') {
            return { state: this.state, events, error: 'Not in betting phase' }
          }
          const { minSideBet, maxSideBet } = this.state.config.tableLimits
          if (command.amountCents < minSideBet || command.amountCents > maxSideBet) {
            return { state: this.state, events, error: `Side bet must be between ${minSideBet} and ${maxSideBet} cents` }
          }
          const existing = this.state.sideBets.find(sb => sb.id === command.id)
          if (existing) {
            this.state = {
              ...this.state,
              sideBets: this.state.sideBets.map(sb =>
                sb.id === command.id
                  ? { ...sb, amountCents: command.amountCents }
                  : sb
              ),
            }
          } else {
            const newSideBet: SideBet = {
              id: command.id,
              amountCents: command.amountCents,
              resolved: false,
              won: false,
            }
            this.state = {
              ...this.state,
              sideBets: [...this.state.sideBets, newSideBet],
            }
          }
          break
        }

        case 'DEAL': {
          if (this.state.phase !== 'betting') {
            return { state: this.state, events, error: 'Not in betting phase' }
          }
          if (this.state.mainBetCents < this.state.config.tableLimits.minBet) {
            return { state: this.state, events, error: 'Must place a bet before dealing' }
          }

          let s = reshuffleIfNeeded(this.state)

          const playerHand = makeHand(s.mainBetCents)
          let result: { state: BlackjackState; card: Card }

          result = dealOne(s)
          s = result.state
          playerHand.cards.push(result.card)
          events.push({ type: 'CARD_DEALT', handId: playerHand.id, card: result.card })

          result = dealOne(s)
          s = result.state
          s = { ...s, dealerHand: [result.card] }
          events.push({ type: 'CARD_DEALT', card: result.card })

          result = dealOne(s)
          s = result.state
          playerHand.cards.push(result.card)
          events.push({ type: 'CARD_DEALT', handId: playerHand.id, card: result.card })

          result = dealOne(s, true)
          s = result.state
          s = { ...s, dealerHand: [...s.dealerHand, result.card] }
          events.push({ type: 'CARD_DEALT', card: result.card })

          playerHand.isBlackjack = isBlackjack(playerHand.cards)

          s = {
            ...s,
            playerHands: [playerHand],
            activeHandIndex: 0,
            phase: 'dealing',
            totalNetCents: 0,
          }

          const dealerUpcard = s.dealerHand[0]!
          const offerInsurance = s.config.allowInsurance && dealerUpcard.rank === 'A'
          const dealerBJ = isBlackjack(s.dealerHand)

          if (offerInsurance) {
            s = {
              ...s,
              phase: 'insurance',
              insuranceOffered: true,
              canInsurance: true,
            }
          } else if (dealerBJ) {
            const { state: s2, events: ev2 } = resolveEarlyWhenDealerBJ(s)
            this.state = s2
            return { state: this.state, events: [...events, ...ev2] }
          } else if (playerHand.isBlackjack) {
            s = { ...s, phase: 'resolving' }
            const { state: s2, events: ev2 } = resolveSideBetsEarly(s)
            s = s2
            events.push(...ev2)
            const { state: s3, events: ev3 } = resolveHands(s)
            s = s3
            events.push(...ev3)
            s = { ...s, phase: 'complete' }
          } else {
            s = {
              ...s,
              phase: 'player_turn',
              canSurrender: canSurrender(playerHand, s.config),
            }
          }

          this.state = s
          break
        }

        case 'TAKE_INSURANCE': {
          if (this.state.phase !== 'insurance') {
            return { state: this.state, events, error: 'Insurance not available' }
          }
          const insAmt = Math.floor(this.state.mainBetCents / 2)
          let s = {
            ...this.state,
            insuranceBetCents: insAmt,
            insuranceResolved: true,
          }

          const dealerBJ = isBlackjack(s.dealerHand)
          const { state: s2, events: ev2 } = resolveInsurance(s)
          s = s2
          events.push(...ev2)

          if (dealerBJ) {
            const { state: s3, events: ev3 } = resolveEarlyWhenDealerBJ(s)
            this.state = s3
            return { state: this.state, events: [...events, ...ev3] }
          }

          const playerHand = s.playerHands[0]!
          if (playerHand.isBlackjack) {
            s = { ...s, phase: 'resolving' }
            const { state: s3, events: ev3 } = resolveSideBetsEarly(s)
            s = s3
            events.push(...ev3)
            const { state: s4, events: ev4 } = resolveHands(s)
            s = s4
            events.push(...ev4)
            s = { ...s, phase: 'complete' }
          } else {
            s = {
              ...s,
              phase: 'player_turn',
              canInsurance: false,
              canSurrender: canSurrender(playerHand, s.config),
            }
          }

          this.state = s
          break
        }

        case 'DECLINE_INSURANCE': {
          if (this.state.phase !== 'insurance') {
            return { state: this.state, events, error: 'Insurance not available' }
          }
          let s = { ...this.state, canInsurance: false }

          const dealerBJ = isBlackjack(s.dealerHand)

          if (dealerBJ) {
            const { state: s2, events: ev2 } = resolveEarlyWhenDealerBJ(s)
            this.state = s2
            return { state: this.state, events: [...events, ...ev2] }
          }

          const playerHand = s.playerHands[0]!
          if (playerHand.isBlackjack) {
            s = { ...s, phase: 'resolving' }
            const { state: s2, events: ev2 } = resolveSideBetsEarly(s)
            s = s2
            events.push(...ev2)
            const { state: s3, events: ev3 } = resolveHands(s)
            s = s3
            events.push(...ev3)
            s = { ...s, phase: 'complete' }
          } else {
            s = {
              ...s,
              phase: 'player_turn',
              canSurrender: canSurrender(playerHand, s.config),
            }
          }

          this.state = s
          break
        }

        case 'HIT': {
          if (this.state.phase !== 'player_turn') {
            return { state: this.state, events, error: 'Not player turn' }
          }
          let s = this.state
          const handIndex = s.activeHandIndex
          const hand = s.playerHands[handIndex]
          if (!hand) return { state: s, events, error: 'No active hand' }

          const { state: next, card } = dealOne(s)
          s = next
          events.push({ type: 'CARD_DEALT', handId: hand.id, card })

          const updatedCards = [...hand.cards, card]
          const bust = isBust(updatedCards)
          const updatedHand: Hand = {
            ...hand,
            cards: updatedCards,
            isBust: bust,
            canSurrender: false,
          } as Hand

          if (bust) events.push({ type: 'BUST', handId: hand.id })

          const updatedHands = s.playerHands.map((h, i) => i === handIndex ? updatedHand : h)
          s = { ...s, playerHands: updatedHands, canSurrender: false }

          if (bust || updatedCards.length > 2) {
            s = { ...s, canSurrender: false }
          }

          const bustsOrStood = bust || updatedHand.stood
          if (bustsOrStood) {
            s = advanceActiveHand(s)
          }

          if (allHandsDone(s)) {
            const { state: s2, events: ev2 } = resolveDealerTurn(s)
            s = s2
            events.push(...ev2)
            const { state: s3, events: ev3 } = resolveSideBetsEarly(s)
            s = s3
            events.push(...ev3)
            const { state: s4, events: ev4 } = resolveHands(s)
            s = s4
            events.push(...ev4)
            s = { ...s, phase: 'complete' }
          }

          this.state = s
          break
        }

        case 'STAND': {
          if (this.state.phase !== 'player_turn') {
            return { state: this.state, events, error: 'Not player turn' }
          }
          let s = this.state
          const handIndex = s.activeHandIndex
          const hand = s.playerHands[handIndex]
          if (!hand) return { state: s, events, error: 'No active hand' }

          const updatedHand = { ...hand, stood: true }
          const updatedHands = s.playerHands.map((h, i) => i === handIndex ? updatedHand : h)
          s = { ...s, playerHands: updatedHands, canSurrender: false }
          s = advanceActiveHand(s)

          if (allHandsDone(s)) {
            const { state: s2, events: ev2 } = resolveDealerTurn(s)
            s = s2
            events.push(...ev2)
            const { state: s3, events: ev3 } = resolveSideBetsEarly(s)
            s = s3
            events.push(...ev3)
            const { state: s4, events: ev4 } = resolveHands(s)
            s = s4
            events.push(...ev4)
            s = { ...s, phase: 'complete' }
          }

          this.state = s
          break
        }

        case 'DOUBLE': {
          if (this.state.phase !== 'player_turn') {
            return { state: this.state, events, error: 'Not player turn' }
          }
          let s = this.state
          const handIndex = s.activeHandIndex
          const hand = s.playerHands[handIndex]
          if (!hand) return { state: s, events, error: 'No active hand' }
          if (!canDouble(hand)) return { state: s, events, error: 'Cannot double this hand' }

          const { state: next, card } = dealOne(s)
          s = next
          events.push({ type: 'CARD_DEALT', handId: hand.id, card })

          const updatedCards = [...hand.cards, card]
          const bust = isBust(updatedCards)
          const updatedHand: Hand = {
            ...hand,
            cards: updatedCards,
            betCents: hand.betCents * 2,
            doubled: true,
            stood: true,
            isBust: bust,
          }

          if (bust) events.push({ type: 'BUST', handId: hand.id })

          const updatedHands = s.playerHands.map((h, i) => i === handIndex ? updatedHand : h)
          s = { ...s, playerHands: updatedHands, canSurrender: false }
          s = advanceActiveHand(s)

          if (allHandsDone(s)) {
            const { state: s2, events: ev2 } = resolveDealerTurn(s)
            s = s2
            events.push(...ev2)
            const { state: s3, events: ev3 } = resolveSideBetsEarly(s)
            s = s3
            events.push(...ev3)
            const { state: s4, events: ev4 } = resolveHands(s)
            s = s4
            events.push(...ev4)
            s = { ...s, phase: 'complete' }
          }

          this.state = s
          break
        }

        case 'SPLIT': {
          if (this.state.phase !== 'player_turn') {
            return { state: this.state, events, error: 'Not player turn' }
          }
          let s = this.state
          const handIndex = s.activeHandIndex
          const hand = s.playerHands[handIndex]
          if (!hand) return { state: s, events, error: 'No active hand' }
          if (!canSplit(hand, s.playerHands)) return { state: s, events, error: 'Cannot split this hand' }

          const [c1, c2] = hand.cards as [Card, Card]
          const isAceSplit = isAce(c1)

          const hand1 = makeHand(hand.betCents)
          hand1.cards = [c1]
          const hand2 = makeHand(hand.betCents)
          hand2.cards = [c2]

          let r: { state: BlackjackState; card: Card }

          r = dealOne(s)
          s = r.state
          hand1.cards.push(r.card)
          events.push({ type: 'CARD_DEALT', handId: hand1.id, card: r.card })

          if (isAceSplit) {
            hand1.stood = true
          }

          r = dealOne(s)
          s = r.state
          hand2.cards.push(r.card)
          events.push({ type: 'CARD_DEALT', handId: hand2.id, card: r.card })

          if (isAceSplit) {
            hand2.stood = true
          }

          hand1.isBust = isBust(hand1.cards)
          hand2.isBust = isBust(hand2.cards)

          const before = s.playerHands.slice(0, handIndex)
          const after = s.playerHands.slice(handIndex + 1)
          const newHands = [...before, hand1, hand2, ...after]

          s = { ...s, playerHands: newHands, activeHandIndex: handIndex, canSurrender: false }

          if (isAceSplit && allHandsDone(s)) {
            const { state: s2, events: ev2 } = resolveDealerTurn(s)
            s = s2
            events.push(...ev2)
            const { state: s3, events: ev3 } = resolveSideBetsEarly(s)
            s = s3
            events.push(...ev3)
            const { state: s4, events: ev4 } = resolveHands(s)
            s = s4
            events.push(...ev4)
            s = { ...s, phase: 'complete' }
          }

          this.state = s
          break
        }

        case 'SURRENDER': {
          if (this.state.phase !== 'player_turn') {
            return { state: this.state, events, error: 'Not player turn' }
          }
          let s = this.state
          const handIndex = s.activeHandIndex
          const hand = s.playerHands[handIndex]
          if (!hand) return { state: s, events, error: 'No active hand' }
          if (!canSurrender(hand, s.config)) return { state: s, events, error: 'Cannot surrender' }

          const updatedHand = { ...hand, surrendered: true, stood: true }
          const updatedHands = s.playerHands.map((h, i) => i === handIndex ? updatedHand : h)
          s = { ...s, playerHands: updatedHands, canSurrender: false }
          s = advanceActiveHand(s)

          if (allHandsDone(s)) {
            const { state: s2, events: ev2 } = resolveDealerTurn(s)
            s = s2
            events.push(...ev2)
            const { state: s3, events: ev3 } = resolveSideBetsEarly(s)
            s = s3
            events.push(...ev3)
            const { state: s4, events: ev4 } = resolveHands(s)
            s = s4
            events.push(...ev4)
            s = { ...s, phase: 'complete' }
          }

          this.state = s
          break
        }

        case 'NEW_HAND': {
          const config = this.state.config
          let s = makeInitialState(config)
          s = { ...s, shoe: this.state.shoe, rngSeed: this.state.rngSeed }
          s = reshuffleIfNeeded(s)
          this.state = { ...s, phase: 'betting' }
          break
        }

        default: {
          return { state: this.state, events, error: 'Unknown command' }
        }
      }
    } catch (err) {
      return { state: this.state, events, error: err instanceof Error ? err.message : 'Unknown error' }
    }

    return { state: this.state, events }
  }
}

function resolveEarlyWhenDealerBJ(state: BlackjackState): { state: BlackjackState; events: BlackjackEvent[] } {
  const events: BlackjackEvent[] = []

  let s: BlackjackState = { ...state, phase: 'resolving' as const }
  const { state: s2, events: ev2 } = resolveSideBetsEarly(s)
  s = s2
  events.push(...ev2)

  const { state: s3, events: ev3 } = resolveHands(s)
  s = s3
  events.push(...ev3)

  s = { ...s, phase: 'complete' }
  return { state: s, events }
}

function resolveSideBetsEarly(state: BlackjackState): { state: BlackjackState; events: BlackjackEvent[] } {
  const events: BlackjackEvent[] = []
  const hand = state.playerHands[0]
  if (!hand || hand.cards.length < 2) return { state, events }

  const [c1, c2] = hand.cards as [Card, Card]
  let totalNet = state.totalNetCents

  const resolvedSideBets = state.sideBets.map(sb => {
    if (sb.resolved) return sb

    if (!isSideBetEarlyResolved(sb.id) && !isBust(state.dealerHand)) {
      return sb
    }

    const winnings = calcSideBet({
      id: sb.id,
      betCents: sb.amountCents,
      playerCards: [c1, c2],
      dealerCards: state.dealerHand,
    })

    const won = winnings > 0
    const net = won ? winnings : -sb.amountCents
    totalNet += net

    events.push({ type: 'SIDE_BET_RESOLVED', sideBetId: sb.id, netCents: net })
    return { ...sb, resolved: true, won, resultMultiplier: won ? winnings / sb.amountCents : 0 }
  })

  return {
    state: { ...state, sideBets: resolvedSideBets, totalNetCents: totalNet },
    events,
  }
}
