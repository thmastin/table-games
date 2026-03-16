import { createRNG } from '../../lib/rng'
import { makeShoe, dealCard, penetration } from '../../lib/deck'
import { payout } from '../../lib/chips'
import { cardTotal, calcPotOfGold } from './paytables'
import type {
  FreeBetBJState,
  FreeBetBJConfig,
  FreeBetBJCommand,
  DispatchResult,
  FreeBetBJEvent,
  FreeBetHand,
  HandResult,
  GamePhase,
} from './types'
import type { Card, Shoe } from '../../lib/deck'

const DEFAULT_CONFIG: FreeBetBJConfig = {
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

let handIdCounter = 0
function makeHandId(): string {
  handIdCounter++
  return `fbj-hand-${handIdCounter}`
}

function makeHand(bet: number): FreeBetHand {
  return {
    id: makeHandId(),
    cards: [],
    bet,
    freeBet: 0,
    isFreeSplit: false,
    isFreeDouble: false,
    doubled: false,
    surrendered: false,
    stood: false,
    isBlackjack: false,
    isBust: false,
    result: null,
    settled: 0,
  }
}

function cardValue(card: Card): number {
  if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 10
  if (card.rank === 'A') return 11
  return parseInt(card.rank, 10)
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
  return cards.length === 2 && cardTotal(cards) === 21
}

function isBust(cards: Card[]): boolean {
  return cardTotal(cards) > 21
}

function isTenValue(card: Card): boolean {
  return ['10', 'J', 'Q', 'K'].includes(card.rank)
}

function isAce(card: Card): boolean {
  return card.rank === 'A'
}

function canFreeSplit(hand: FreeBetHand, allHands: FreeBetHand[]): boolean {
  if (hand.cards.length !== 2) return false
  if (hand.stood || hand.surrendered || hand.isBust) return false
  if (allHands.length >= 4) return false
  const [c1, c2] = hand.cards as [Card, Card]
  if (isTenValue(c1) || isTenValue(c2)) return false
  if (isAce(c1) && isAce(c2)) return true
  return cardValue(c1) === cardValue(c2) && !isTenValue(c1)
}

function canSplitAces(hand: FreeBetHand, allHands: FreeBetHand[]): boolean {
  if (hand.cards.length !== 2) return false
  if (hand.isFreeSplit) return false
  const [c1, c2] = hand.cards as [Card, Card]
  return isAce(c1) && isAce(c2) && allHands.length < 4
}

function canFreeDouble(hand: FreeBetHand): boolean {
  if (hand.cards.length !== 2) return false
  if (hand.stood || hand.surrendered || hand.isBust || hand.doubled) return false
  if (isSoft(hand.cards)) return false
  const total = cardTotal(hand.cards)
  return total === 9 || total === 10 || total === 11
}

function canPaidDouble(hand: FreeBetHand): boolean {
  return (
    hand.cards.length === 2 &&
    !hand.stood &&
    !hand.surrendered &&
    !hand.isBust &&
    !hand.doubled
  )
}

function canSurrender(hand: FreeBetHand, config: FreeBetBJConfig): boolean {
  return (
    config.allowSurrender &&
    hand.cards.length === 2 &&
    !hand.doubled &&
    !hand.surrendered
  )
}

function dealerShouldHit(cards: Card[], standsSoft17: boolean): boolean {
  const total = cardTotal(cards)
  if (total < 17) return true
  if (total === 17 && !standsSoft17 && isSoft(cards)) return true
  return false
}

function computeValidActions(
  hand: FreeBetHand,
  allHands: FreeBetHand[],
  config: FreeBetBJConfig,
): Set<string> {
  const actions = new Set<string>(['HIT', 'STAND'])
  if (canFreeSplit(hand, allHands) || canSplitAces(hand, allHands)) {
    actions.add('SPLIT')
  }
  if (canFreeDouble(hand)) {
    actions.add('FREE_DOUBLE')
  }
  if (canPaidDouble(hand)) {
    actions.add('DOUBLE')
  }
  if (canSurrender(hand, config)) {
    actions.add('SURRENDER')
  }
  return actions
}

function makeInitialState(config: FreeBetBJConfig): FreeBetBJState {
  const seed = Math.floor(Math.random() * 0xffffffff)
  const rng = createRNG(seed)
  const shoe = makeShoe(config.numDecks, rng)
  return {
    phase: 'betting',
    shoe,
    rngSeed: seed,
    hands: [],
    activeHandIndex: 0,
    dealerCards: [],
    dealerTotal: 0,
    bet: 0,
    potOfGold: 0,
    insurance: 0,
    insuranceOffered: false,
    insuranceResolved: false,
    insuranceWon: false,
    canSurrender: false,
    canInsurance: false,
    result: null,
    totalNetCents: 0,
    config,
    events: [],
    activeHandValidActions: new Set(),
  }
}

function reshuffleIfNeeded(
  shoe: Shoe,
  config: FreeBetBJConfig,
  currentSeed: number,
): { shoe: Shoe; seed: number } {
  if (penetration(shoe) >= 0.75) {
    const seed = Math.floor(Math.random() * 0xffffffff)
    const rng = createRNG(seed)
    return { shoe: makeShoe(config.numDecks, rng), seed }
  }
  return { shoe, seed: currentSeed }
}

function dealOne(shoe: Shoe, faceDown = false): { card: Card; shoe: Shoe } {
  return dealCard(shoe, faceDown)
}

function advanceActiveHand(hands: FreeBetHand[], currentIndex: number): number {
  for (let i = currentIndex + 1; i < hands.length; i++) {
    const h = hands[i]!
    if (!h.stood && !h.isBust && !h.surrendered) {
      return i
    }
  }
  return hands.length
}

function allHandsDone(hands: FreeBetHand[]): boolean {
  return hands.every(h => h.stood || h.isBust || h.surrendered)
}

function resolveDealerTurn(
  shoe: Shoe,
  dealerCards: Card[],
  config: FreeBetBJConfig,
): { shoe: Shoe; dealerCards: Card[]; events: FreeBetBJEvent[] } {
  const events: FreeBetBJEvent[] = []

  const revealCard = { ...dealerCards[1]!, faceDown: false }
  let current = [dealerCards[0]!, revealCard, ...dealerCards.slice(2)]
  let currentShoe = shoe

  events.push({ type: 'DEALER_REVEALS', card: revealCard })

  while (dealerShouldHit(current, config.dealerStandsSoft17)) {
    const { card, shoe: nextShoe } = dealOne(currentShoe)
    current = [...current, card]
    currentShoe = nextShoe
    events.push({ type: 'CARD_DEALT', card })
  }

  if (isBust(current)) {
    events.push({ type: 'BUST' })
  }

  return { shoe: currentShoe, dealerCards: current, events }
}

function resolveHandsAfterDealer(
  hands: FreeBetHand[],
  dealerCards: Card[],
): { hands: FreeBetHand[]; totalNet: number; events: FreeBetBJEvent[] } {
  const events: FreeBetBJEvent[] = []
  const dealerTotal = cardTotal(dealerCards)
  const dealerBJ = isBlackjack(dealerCards)
  const dealerBust = isBust(dealerCards)
  const dealerBustExactly22 = dealerBust && dealerTotal === 22

  let totalNet = 0

  const resolved = hands.map(hand => {
    if (hand.surrendered) {
      const net = -payout(hand.bet, 1, 2)
      totalNet += net
      events.push({ type: 'SURRENDER_RESOLVED', handId: hand.id, netCents: net })
      return { ...hand, result: 'surrender' as HandResult, settled: net }
    }

    if (hand.isBust) {
      const net = -hand.bet
      totalNet += net
      events.push({ type: 'HAND_RESOLVED', handId: hand.id, netCents: net })
      return { ...hand, result: 'bust' as HandResult, settled: net }
    }

    const handTotal = cardTotal(hand.cards)
    const handBJ = isBlackjack(hand.cards)

    if (handBJ && dealerBJ) {
      events.push({ type: 'PUSH', handId: hand.id, netCents: 0 })
      return { ...hand, result: 'push' as HandResult, settled: 0 }
    }

    if (handBJ) {
      const net = payout(hand.bet, 3, 2)
      totalNet += net
      events.push({ type: 'BLACKJACK', handId: hand.id, netCents: net })
      return { ...hand, result: 'blackjack' as HandResult, settled: net }
    }

    if (dealerBJ) {
      const net = -hand.bet
      totalNet += net
      events.push({ type: 'HAND_RESOLVED', handId: hand.id, netCents: net })
      return { ...hand, result: 'loss' as HandResult, settled: net }
    }

    if (dealerBustExactly22) {
      events.push({ type: 'PUSH_22', handId: hand.id, netCents: 0 })
      return { ...hand, result: 'push' as HandResult, settled: 0 }
    }

    if (dealerBust) {
      const net = hand.bet
      totalNet += net
      events.push({ type: 'HAND_RESOLVED', handId: hand.id, netCents: net })
      return { ...hand, result: 'win' as HandResult, settled: net }
    }

    if (handTotal > dealerTotal) {
      const net = hand.bet
      totalNet += net
      events.push({ type: 'HAND_RESOLVED', handId: hand.id, netCents: net })
      return { ...hand, result: 'win' as HandResult, settled: net }
    }

    if (handTotal === dealerTotal) {
      events.push({ type: 'PUSH', handId: hand.id, netCents: 0 })
      return { ...hand, result: 'push' as HandResult, settled: 0 }
    }

    const net = -hand.bet
    totalNet += net
    events.push({ type: 'HAND_RESOLVED', handId: hand.id, netCents: net })
    return { ...hand, result: 'loss' as HandResult, settled: net }
  })

  return { hands: resolved, totalNet, events }
}

function resolveInsurance(
  insuranceBet: number,
  dealerCards: Card[],
): { net: number; won: boolean; event: FreeBetBJEvent } {
  const dealerBJ = isBlackjack(dealerCards)
  const net = dealerBJ ? payout(insuranceBet, 2, 1) : -insuranceBet
  return { net, won: dealerBJ, event: { type: 'INSURANCE_RESOLVED', netCents: net } }
}

function resolvePotOfGold(
  ace1: Card,
  ace2: Card,
  sideBetCents: number,
): { netCents: number; isJackpot: boolean; events: FreeBetBJEvent[] } {
  const events: FreeBetBJEvent[] = []
  const { netCents, isJackpot } = calcPotOfGold(ace1, ace2, sideBetCents)

  if (isJackpot) {
    events.push({ type: 'POT_OF_GOLD_TRIGGERED' })
  } else {
    const paidOut = netCents > 0 ? netCents : -sideBetCents
    events.push({ type: 'POT_OF_GOLD_RESOLVED', netCents: paidOut, potOfGoldPayout: paidOut })
  }

  return { netCents: isJackpot ? 0 : (netCents > 0 ? netCents : -sideBetCents), isJackpot, events }
}

export class FreeBetBJEngine {
  private state: FreeBetBJState

  constructor(config: Partial<FreeBetBJConfig> = {}) {
    const merged: FreeBetBJConfig = { ...DEFAULT_CONFIG, ...config }
    this.state = makeInitialState(merged)
  }

  getState(): FreeBetBJState {
    return this.state
  }

  dispatch(command: FreeBetBJCommand): DispatchResult {
    const events: FreeBetBJEvent[] = []

    try {
      switch (command.type) {
        case 'PLACE_BET': {
          if (this.state.phase !== 'betting') {
            return { state: this.state, events, error: 'Not in betting phase' }
          }
          const { minBet, maxBet } = this.state.config.tableLimits
          if (command.amountCents < minBet || command.amountCents > maxBet) {
            return {
              state: this.state,
              events,
              error: `Bet must be between ${minBet} and ${maxBet} cents`,
            }
          }
          this.state = { ...this.state, bet: command.amountCents }
          break
        }

        case 'PLACE_POT_OF_GOLD': {
          if (this.state.phase !== 'betting') {
            return { state: this.state, events, error: 'Not in betting phase' }
          }
          const { minSideBet, maxSideBet } = this.state.config.tableLimits
          if (command.amountCents < minSideBet || command.amountCents > maxSideBet) {
            return {
              state: this.state,
              events,
              error: `Side bet must be between ${minSideBet} and ${maxSideBet} cents`,
            }
          }
          this.state = { ...this.state, potOfGold: command.amountCents }
          break
        }

        case 'DEAL': {
          if (this.state.phase !== 'betting') {
            return { state: this.state, events, error: 'Not in betting phase' }
          }
          if (this.state.bet < this.state.config.tableLimits.minBet) {
            return { state: this.state, events, error: 'Must place a bet before dealing' }
          }

          const reshuffled = reshuffleIfNeeded(this.state.shoe, this.state.config, this.state.rngSeed)
          let shoe = reshuffled.shoe
          const rngSeed = reshuffled.seed

          const playerHand = makeHand(this.state.bet)

          let r = dealOne(shoe)
          shoe = r.shoe
          playerHand.cards.push(r.card)
          events.push({ type: 'CARD_DEALT', handId: playerHand.id, card: r.card })

          r = dealOne(shoe)
          shoe = r.shoe
          const dealerCard1 = r.card
          events.push({ type: 'CARD_DEALT', card: dealerCard1 })

          r = dealOne(shoe)
          shoe = r.shoe
          playerHand.cards.push(r.card)
          events.push({ type: 'CARD_DEALT', handId: playerHand.id, card: r.card })

          const holeResult = dealOne(shoe, true)
          shoe = holeResult.shoe
          const dealerCard2 = holeResult.card

          playerHand.isBlackjack = isBlackjack(playerHand.cards)
          const dealerCards = [dealerCard1, dealerCard2]

          let s: FreeBetBJState = {
            ...this.state,
            shoe,
            rngSeed,
            hands: [playerHand],
            dealerCards,
            dealerTotal: cardTotal([dealerCard1]),
            activeHandIndex: 0,
            phase: 'dealing' as GamePhase,
            totalNetCents: 0,
            insurance: 0,
            insuranceResolved: false,
            insuranceWon: false,
            insuranceOffered: false,
            canInsurance: false,
            canSurrender: false,
            result: null,
          }

          const dealerUpcard = dealerCard1
          const offerInsurance = s.config.allowInsurance && dealerUpcard.rank === 'A'
          const dealerBJ = isBlackjack(dealerCards)

          if (offerInsurance) {
            s = { ...s, phase: 'insurance', insuranceOffered: true, canInsurance: true }
          } else if (dealerBJ) {
            s = this._resolveEarlyDealerBJ(s, events)
          } else if (playerHand.isBlackjack) {
            s = { ...s, phase: 'resolving' }
            s = this._resolveComplete(s, events)
          } else {
            s = {
              ...s,
              phase: 'player_turn',
              canSurrender: canSurrender(playerHand, s.config),
              activeHandValidActions: computeValidActions(playerHand, [playerHand], s.config),
            }
          }

          this.state = s
          break
        }

        case 'TAKE_INSURANCE': {
          if (this.state.phase !== 'insurance') {
            return { state: this.state, events, error: 'Insurance not available' }
          }
          const insAmt = Math.floor(this.state.bet / 2)
          let s = { ...this.state, insurance: insAmt, insuranceResolved: true }

          const { net, won, event } = resolveInsurance(insAmt, s.dealerCards)
          events.push(event)
          s = {
            ...s,
            insuranceWon: won,
            totalNetCents: s.totalNetCents + net,
          }

          const dealerBJ = isBlackjack(s.dealerCards)
          if (dealerBJ) {
            s = this._resolveEarlyDealerBJ(s, events)
          } else {
            const playerHand = s.hands[0]!
            if (playerHand.isBlackjack) {
              s = { ...s, phase: 'resolving' }
              s = this._resolveComplete(s, events)
            } else {
              s = {
                ...s,
                phase: 'player_turn',
                canInsurance: false,
                canSurrender: canSurrender(playerHand, s.config),
                activeHandValidActions: computeValidActions(playerHand, s.hands, s.config),
              }
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
          const dealerBJ = isBlackjack(s.dealerCards)

          if (dealerBJ) {
            s = this._resolveEarlyDealerBJ(s, events)
          } else {
            const playerHand = s.hands[0]!
            if (playerHand.isBlackjack) {
              s = { ...s, phase: 'resolving' }
              s = this._resolveComplete(s, events)
            } else {
              s = {
                ...s,
                phase: 'player_turn',
                canSurrender: canSurrender(playerHand, s.config),
                activeHandValidActions: computeValidActions(playerHand, s.hands, s.config),
              }
            }
          }

          this.state = s
          break
        }

        case 'HIT': {
          if (this.state.phase !== 'player_turn') {
            return { state: this.state, events, error: 'Not player turn' }
          }
          let s = { ...this.state }
          const handIndex = s.activeHandIndex
          const hand = s.hands[handIndex]
          if (!hand) return { state: s, events, error: 'No active hand' }

          const { card, shoe } = dealOne(s.shoe)
          s = { ...s, shoe }
          events.push({ type: 'CARD_DEALT', handId: hand.id, card })

          const updatedCards = [...hand.cards, card]
          const bust = isBust(updatedCards)
          const updatedHand: FreeBetHand = { ...hand, cards: updatedCards, isBust: bust }

          if (bust) events.push({ type: 'BUST', handId: hand.id })

          const updatedHands = s.hands.map((h, i) => (i === handIndex ? updatedHand : h))
          s = { ...s, hands: updatedHands, canSurrender: false }

          if (bust) {
            const nextIdx = advanceActiveHand(updatedHands, handIndex)
            s = { ...s, activeHandIndex: nextIdx }
          }

          if (allHandsDone(s.hands)) {
            s = this._resolveComplete(s, events)
          } else {
            const nextHand = s.hands[s.activeHandIndex]
            if (nextHand) {
              s = {
                ...s,
                activeHandValidActions: computeValidActions(nextHand, s.hands, s.config),
              }
            }
          }

          this.state = s
          break
        }

        case 'STAND': {
          if (this.state.phase !== 'player_turn') {
            return { state: this.state, events, error: 'Not player turn' }
          }
          let s = { ...this.state }
          const handIndex = s.activeHandIndex
          const hand = s.hands[handIndex]
          if (!hand) return { state: s, events, error: 'No active hand' }

          const updatedHand = { ...hand, stood: true }
          const updatedHands = s.hands.map((h, i) => (i === handIndex ? updatedHand : h))
          const nextIdx = advanceActiveHand(updatedHands, handIndex)
          s = { ...s, hands: updatedHands, activeHandIndex: nextIdx, canSurrender: false }

          if (allHandsDone(s.hands)) {
            s = this._resolveComplete(s, events)
          } else {
            const nextHand = s.hands[s.activeHandIndex]
            if (nextHand) {
              s = {
                ...s,
                activeHandValidActions: computeValidActions(nextHand, s.hands, s.config),
              }
            }
          }

          this.state = s
          break
        }

        case 'DOUBLE': {
          if (this.state.phase !== 'player_turn') {
            return { state: this.state, events, error: 'Not player turn' }
          }
          let s = { ...this.state }
          const handIndex = s.activeHandIndex
          const hand = s.hands[handIndex]
          if (!hand) return { state: s, events, error: 'No active hand' }
          if (!canPaidDouble(hand)) return { state: s, events, error: 'Cannot double this hand' }

          const isFree = canFreeDouble(hand)
          const { card, shoe } = dealOne(s.shoe)
          s = { ...s, shoe }
          events.push({ type: 'CARD_DEALT', handId: hand.id, card })

          const updatedCards = [...hand.cards, card]
          const bust = isBust(updatedCards)

          let updatedHand: FreeBetHand
          if (isFree) {
            events.push({ type: 'FREE_DOUBLE', handId: hand.id })
            updatedHand = {
              ...hand,
              cards: updatedCards,
              freeBet: hand.bet,
              isFreeDouble: true,
              doubled: true,
              stood: true,
              isBust: bust,
            }
          } else {
            updatedHand = {
              ...hand,
              cards: updatedCards,
              bet: hand.bet * 2,
              doubled: true,
              stood: true,
              isBust: bust,
            }
          }

          if (bust) events.push({ type: 'BUST', handId: hand.id })

          const updatedHands = s.hands.map((h, i) => (i === handIndex ? updatedHand : h))
          const nextIdx = advanceActiveHand(updatedHands, handIndex)
          s = { ...s, hands: updatedHands, activeHandIndex: nextIdx, canSurrender: false }

          if (allHandsDone(s.hands)) {
            s = this._resolveComplete(s, events)
          } else {
            const nextHand = s.hands[s.activeHandIndex]
            if (nextHand) {
              s = {
                ...s,
                activeHandValidActions: computeValidActions(nextHand, s.hands, s.config),
              }
            }
          }

          this.state = s
          break
        }

        case 'SPLIT': {
          if (this.state.phase !== 'player_turn') {
            return { state: this.state, events, error: 'Not player turn' }
          }
          let s = { ...this.state }
          const handIndex = s.activeHandIndex
          const hand = s.hands[handIndex]
          if (!hand) return { state: s, events, error: 'No active hand' }

          const eligible = canFreeSplit(hand, s.hands) || canSplitAces(hand, s.hands)
          if (!eligible) return { state: s, events, error: 'Cannot split this hand' }

          const [c1, c2] = hand.cards as [Card, Card]
          const aceSplit = isAce(c1) && isAce(c2)

          const hand1 = makeHand(hand.bet)
          hand1.cards = [c1]
          hand1.isFreeSplit = true
          hand1.freeBet = hand.bet

          const hand2 = makeHand(hand.bet)
          hand2.cards = [c2]
          hand2.isFreeSplit = true
          hand2.freeBet = hand.bet

          events.push({ type: 'FREE_SPLIT', handId: hand.id })

          let r = dealOne(s.shoe)
          s = { ...s, shoe: r.shoe }
          hand1.cards.push(r.card)
          events.push({ type: 'CARD_DEALT', handId: hand1.id, card: r.card })

          if (aceSplit) {
            hand1.stood = true
          }

          r = dealOne(s.shoe)
          s = { ...s, shoe: r.shoe }
          hand2.cards.push(r.card)
          events.push({ type: 'CARD_DEALT', handId: hand2.id, card: r.card })

          if (aceSplit) {
            hand2.stood = true
          }

          hand1.isBust = isBust(hand1.cards)
          hand2.isBust = isBust(hand2.cards)

          const before = s.hands.slice(0, handIndex)
          const after = s.hands.slice(handIndex + 1)
          const newHands = [...before, hand1, hand2, ...after]

          s = { ...s, hands: newHands, activeHandIndex: handIndex, canSurrender: false }

          if (aceSplit && s.potOfGold > 0) {
            const { netCents, isJackpot, events: pogEvents } = resolvePotOfGold(c1, c2, s.potOfGold)
            events.push(...pogEvents)
            if (!isJackpot) {
              s = { ...s, totalNetCents: s.totalNetCents + netCents + s.potOfGold }
            }
          }

          if (allHandsDone(s.hands)) {
            s = this._resolveComplete(s, events)
          } else {
            const activeHand = s.hands[s.activeHandIndex]
            if (activeHand) {
              s = {
                ...s,
                activeHandValidActions: computeValidActions(activeHand, s.hands, s.config),
              }
            }
          }

          this.state = s
          break
        }

        case 'SURRENDER': {
          if (this.state.phase !== 'player_turn') {
            return { state: this.state, events, error: 'Not player turn' }
          }
          let s = { ...this.state }
          const handIndex = s.activeHandIndex
          const hand = s.hands[handIndex]
          if (!hand) return { state: s, events, error: 'No active hand' }
          if (!canSurrender(hand, s.config)) return { state: s, events, error: 'Cannot surrender' }

          const updatedHand = { ...hand, surrendered: true, stood: true }
          const updatedHands = s.hands.map((h, i) => (i === handIndex ? updatedHand : h))
          const nextIdx = advanceActiveHand(updatedHands, handIndex)
          s = { ...s, hands: updatedHands, activeHandIndex: nextIdx, canSurrender: false }

          if (allHandsDone(s.hands)) {
            s = this._resolveComplete(s, events)
          } else {
            const nextHand = s.hands[s.activeHandIndex]
            if (nextHand) {
              s = {
                ...s,
                activeHandValidActions: computeValidActions(nextHand, s.hands, s.config),
              }
            }
          }

          this.state = s
          break
        }

        case 'NEW_HAND': {
          const config = this.state.config
          const reshuffled = reshuffleIfNeeded(this.state.shoe, config, this.state.rngSeed)
          const freshState = makeInitialState(config)
          this.state = {
            ...freshState,
            shoe: reshuffled.shoe,
            rngSeed: reshuffled.seed,
            phase: 'betting',
          }
          break
        }

        default: {
          return { state: this.state, events, error: 'Unknown command' }
        }
      }
    } catch (err) {
      return {
        state: this.state,
        events,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }

    return { state: this.state, events }
  }

  private _resolveEarlyDealerBJ(s: FreeBetBJState, events: FreeBetBJEvent[]): FreeBetBJState {
    s = { ...s, phase: 'resolving' }
    return this._resolveComplete(s, events)
  }

  private _resolveComplete(s: FreeBetBJState, events: FreeBetBJEvent[]): FreeBetBJState {
    const { shoe, dealerCards, events: dealerEvents } = resolveDealerTurn(
      s.shoe,
      s.dealerCards,
      s.config,
    )
    events.push(...dealerEvents)
    s = { ...s, shoe, dealerCards, dealerTotal: cardTotal(dealerCards) }

    const { hands, totalNet, events: handEvents } = resolveHandsAfterDealer(s.hands, dealerCards)
    events.push(...handEvents)
    s = { ...s, hands, totalNetCents: s.totalNetCents + totalNet, phase: 'complete' }

    return s
  }
}
