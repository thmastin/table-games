import { createRNG } from '../../lib/rng'
import { makeDeck, shuffle, dealCard } from '../../lib/deck'
import { evaluate, compareResults } from '../../lib/handEvaluator'
import { payout } from '../../lib/chips'
import { blindPayout, blindPushes, tripsPayout, tripsWins } from './paytables'
import type { UTHState, UTHCommand, UTHEvent, UTHConfig } from './types'
import type { Card, Shoe } from '../../lib/deck'
import type { HandResult, HandRank } from '../../lib/handEvaluator'

const DEFAULT_CONFIG: UTHConfig = {
  tableLimits: {
    minAnte: 1000,
    maxAnte: 10000,
    minTrips: 100,
    maxTrips: 10000,
  },
}

function makeDeckShoe(rng: ReturnType<typeof createRNG>): Shoe {
  const cards = makeDeck()
  const shuffled = shuffle(cards, rng)
  return { cards: shuffled, numDecks: 1, dealtCount: 0 }
}

function dealOne(shoe: Shoe, faceDown = false): { card: Card; shoe: Shoe } {
  return dealCard(shoe, faceDown)
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  const withFirst = combinations(rest, k - 1).map(combo => [first!, ...combo])
  const withoutFirst = combinations(rest, k)
  return [...withFirst, ...withoutFirst]
}

function bestFiveOfSeven(cards: Card[]): HandResult {
  const combos = combinations(cards, 5)
  let best: HandResult | null = null
  for (const combo of combos) {
    const result = evaluate(combo, '5-card')
    if (!best || compareResults(result, best) > 0) {
      best = result
    }
  }
  return best!
}

function qualifies(result: HandResult): boolean {
  return result.value >= 2
}

function makeInitialState(config: UTHConfig, seed: number): UTHState {
  return {
    phase: 'idle',
    playerHole: [],
    dealerHole: [],
    community: [],
    ante: 0,
    blind: 0,
    play: 0,
    trips: 0,
    dealerQualifies: false,
    playerHandRank: null,
    dealerHandRank: null,
    result: null,
    blindResult: null,
    tripsResult: null,
    checkedPreflop: false,
    checkedFlop: false,
    seed,
    events: [],
  }
}

function resolveHand(state: UTHState): { state: UTHState; events: UTHEvent[] } {
  const events: UTHEvent[] = []

  const revealedDealerHole = state.dealerHole.map(c => ({ ...c, faceDown: false }))
  events.push({ type: 'DEALER_REVEALED' })

  const allPlayerCards = [...state.playerHole, ...state.community]
  const allDealerCards = [...revealedDealerHole, ...state.community]

  const playerBest = bestFiveOfSeven(allPlayerCards)
  const dealerBest = bestFiveOfSeven(allDealerCards)

  const dealerQual = qualifies(dealerBest)
  events.push({ type: 'DEALER_QUALIFIES', qualifies: dealerQual })

  const comparison = compareResults(playerBest, dealerBest)

  let result: 'win' | 'loss' | 'push'
  if (comparison > 0) result = 'win'
  else if (comparison < 0) result = 'loss'
  else result = 'push'

  events.push({
    type: 'HAND_RESOLVED',
    result,
    playerRank: playerBest.rank,
    dealerRank: dealerBest.rank,
  })

  let blindResult: 'win' | 'push' | 'loss'
  let blindNet = 0

  if (result === 'loss') {
    blindResult = 'loss'
    blindNet = -state.blind
  } else if (result === 'push') {
    blindResult = 'push'
    blindNet = 0
  } else {
    if (blindPushes(playerBest.rank as HandRank)) {
      blindResult = 'push'
      blindNet = 0
    } else {
      blindResult = 'win'
      blindNet = blindPayout(state.blind, playerBest.rank as HandRank)
    }
  }

  events.push({ type: 'BLIND_RESOLVED', result: blindResult, payout: blindNet })

  let tripsResult: { rank: string; payout: number } | null = null
  if (state.trips > 0) {
    const rank = playerBest.rank
    if (tripsWins(rank as HandRank)) {
      const tripsNet = tripsPayout(state.trips, rank as HandRank)
      tripsResult = { rank, payout: tripsNet }
    } else {
      tripsResult = { rank, payout: -state.trips }
    }
    events.push({ type: 'TRIPS_RESOLVED', rank, payout: tripsResult.payout })
  }

  const nextState: UTHState = {
    ...state,
    phase: 'complete',
    dealerHole: revealedDealerHole,
    dealerQualifies: dealerQual,
    playerHandRank: playerBest.rank,
    dealerHandRank: dealerBest.rank,
    result,
    blindResult,
    tripsResult,
    events,
  }

  return { state: nextState, events }
}

function resolveFold(state: UTHState): { state: UTHState; events: UTHEvent[] } {
  const events: UTHEvent[] = []

  const revealedDealerHole = state.dealerHole.map(c => ({ ...c, faceDown: false }))
  events.push({ type: 'DEALER_REVEALED' })

  let tripsResult: { rank: string; payout: number } | null = null
  if (state.trips > 0) {
    const allPlayerCards = [...state.playerHole, ...state.community]
    const playerBest = bestFiveOfSeven(allPlayerCards)
    const rank = playerBest.rank
    if (tripsWins(rank as HandRank)) {
      const tripsNet = tripsPayout(state.trips, rank as HandRank)
      tripsResult = { rank, payout: tripsNet }
    } else {
      tripsResult = { rank, payout: -state.trips }
    }
    events.push({ type: 'TRIPS_RESOLVED', rank, payout: tripsResult.payout })
  }

  const nextState: UTHState = {
    ...state,
    phase: 'complete',
    dealerHole: revealedDealerHole,
    result: 'loss',
    blindResult: 'loss',
    tripsResult,
    events,
  }

  return { state: nextState, events }
}

export class UTHEngine {
  private config: UTHConfig
  private state: UTHState
  private shoe: Shoe

  constructor(config?: Partial<UTHConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    const seed = (Date.now() ^ (Math.random() * 0x100000000)) >>> 0
    const rng = createRNG(seed)
    this.shoe = makeDeckShoe(rng)
    this.state = makeInitialState(this.config, seed)
  }

  getState(): UTHState {
    return { ...this.state, events: [...this.state.events] }
  }

  dispatch(command: UTHCommand): { state: UTHState; events: UTHEvent[]; error?: string } {
    const events: UTHEvent[] = []

    try {
      this.state = this.reduce(command, events)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error'
      return { state: this.getState(), events: [], error }
    }

    this.state = { ...this.state, events }
    return { state: this.getState(), events }
  }

  private reduce(command: UTHCommand, events: UTHEvent[]): UTHState {
    const s = this.state

    switch (command.type) {
      case 'PLACE_ANTE': {
        if (s.phase !== 'idle' && s.phase !== 'betting') {
          throw new Error(`Cannot place ante in phase: ${s.phase}`)
        }
        const { minAnte, maxAnte } = this.config.tableLimits
        if (command.amount < minAnte || command.amount > maxAnte) {
          throw new Error(`Ante must be between ${minAnte} and ${maxAnte} cents`)
        }
        return {
          ...s,
          phase: 'betting',
          ante: command.amount,
          blind: command.amount,
          events,
        }
      }

      case 'PLACE_TRIPS': {
        if (s.phase !== 'idle' && s.phase !== 'betting') {
          throw new Error(`Cannot place trips bet in phase: ${s.phase}`)
        }
        const { minTrips, maxTrips } = this.config.tableLimits
        if (command.amount < minTrips || command.amount > maxTrips) {
          throw new Error(`Trips bet must be between ${minTrips} and ${maxTrips} cents`)
        }
        return {
          ...s,
          phase: s.phase === 'idle' ? 'betting' : s.phase,
          trips: command.amount,
          events,
        }
      }

      case 'DEAL': {
        if (s.phase !== 'betting') {
          throw new Error(`Cannot deal in phase: ${s.phase}`)
        }
        if (s.ante === 0) {
          throw new Error('Must place ante before dealing')
        }

        const seed = (Date.now() ^ (Math.random() * 0x100000000)) >>> 0
        const rng = createRNG(seed)
        this.shoe = makeDeckShoe(rng)

        let shoe = this.shoe

        let r: { card: Card; shoe: Shoe }

        r = dealOne(shoe, false); const p1 = r.card; shoe = r.shoe
        r = dealOne(shoe, false); const p2 = r.card; shoe = r.shoe
        r = dealOne(shoe, true);  const d1 = r.card; shoe = r.shoe
        r = dealOne(shoe, true);  const d2 = r.card; shoe = r.shoe

        this.shoe = shoe
        events.push({ type: 'HOLE_CARDS_DEALT' })

        return {
          ...s,
          phase: 'preflop',
          playerHole: [p1, p2],
          dealerHole: [d1, d2],
          community: [],
          play: 0,
          result: null,
          blindResult: null,
          tripsResult: null,
          checkedPreflop: false,
          checkedFlop: false,
          seed,
          events,
        }
      }

      case 'BET': {
        if (s.phase !== 'preflop') {
          throw new Error(`BET (3x/4x) only valid in preflop phase, got: ${s.phase}`)
        }
        const { multiplier } = command
        if (multiplier !== 3 && multiplier !== 4) {
          throw new Error('Preflop bet multiplier must be 3 or 4')
        }
        const playAmount = payout(s.ante, multiplier, 1)

        const flopCards = this.dealNCards(3)
        events.push({ type: 'FLOP_DEALT', cards: flopCards })

        const riverCards = this.dealNCards(2)
        events.push({ type: 'RIVER_DEALT', cards: riverCards })

        const community = [...flopCards, ...riverCards]

        const stateWithPlay: UTHState = {
          ...s,
          phase: 'resolving',
          play: playAmount,
          community,
          events,
        }

        const { state: resolved, events: resolveEvents } = resolveHand(stateWithPlay)
        events.push(...resolveEvents)
        return { ...resolved, events }
      }

      case 'CHECK': {
        if (s.phase === 'preflop') {
          const flopCards = this.dealNCards(3)
          events.push({ type: 'FLOP_DEALT', cards: flopCards })

          return {
            ...s,
            phase: 'flop',
            community: flopCards,
            checkedPreflop: true,
            events,
          }
        }

        if (s.phase === 'flop') {
          const riverCards = this.dealNCards(2)
          events.push({ type: 'RIVER_DEALT', cards: riverCards })

          const community = [...s.community, ...riverCards]

          return {
            ...s,
            phase: 'river',
            community,
            checkedFlop: true,
            events,
          }
        }

        throw new Error(`CHECK only valid in preflop or flop phase, got: ${s.phase}`)
      }

      case 'BET_2X': {
        if (s.phase !== 'flop') {
          throw new Error(`BET_2X only valid in flop phase, got: ${s.phase}`)
        }
        const playAmount = payout(s.ante, 2, 1)

        const riverCards = this.dealNCards(2)
        events.push({ type: 'RIVER_DEALT', cards: riverCards })

        const community = [...s.community, ...riverCards]

        const stateWithPlay: UTHState = {
          ...s,
          phase: 'resolving',
          play: playAmount,
          community,
          events,
        }

        const { state: resolved, events: resolveEvents } = resolveHand(stateWithPlay)
        events.push(...resolveEvents)
        return { ...resolved, events }
      }

      case 'BET_1X': {
        if (s.phase !== 'river') {
          throw new Error(`BET_1X only valid in river phase, got: ${s.phase}`)
        }
        const playAmount = s.ante

        const stateWithPlay: UTHState = {
          ...s,
          phase: 'resolving',
          play: playAmount,
          events,
        }

        const { state: resolved, events: resolveEvents } = resolveHand(stateWithPlay)
        events.push(...resolveEvents)
        return { ...resolved, events }
      }

      case 'FOLD': {
        if (s.phase !== 'river') {
          throw new Error(`FOLD only valid in river phase, got: ${s.phase}`)
        }

        const { state: resolved, events: resolveEvents } = resolveFold(s)
        events.push(...resolveEvents)
        return { ...resolved, events }
      }

      case 'NEW_HAND': {
        if (s.phase !== 'complete') {
          throw new Error(`Cannot start new hand in phase: ${s.phase}`)
        }

        const seed = (Date.now() ^ (Math.random() * 0x100000000)) >>> 0
        const rng = createRNG(seed)
        this.shoe = makeDeckShoe(rng)

        return {
          ...makeInitialState(this.config, seed),
          events,
        }
      }

      default: {
        const exhaustive: never = command
        throw new Error(`Unknown command: ${(exhaustive as { type: string }).type}`)
      }
    }
  }

  private dealNCards(n: number): Card[] {
    const cards: Card[] = []
    for (let i = 0; i < n; i++) {
      const r = dealOne(this.shoe, false)
      cards.push(r.card)
      this.shoe = r.shoe
    }
    return cards
  }
}
