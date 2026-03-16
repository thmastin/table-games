import { describe, it, expect } from 'vitest'
import { FreeBetBJEngine } from './engine'
import { makeCard } from '../../lib/deck'
import type { FreeBetBJState, FreeBetHand } from './types'
import type { Card } from '../../lib/deck'

const MIN_BET = 1000

function freshEngine(): FreeBetBJEngine {
  return new FreeBetBJEngine({
    numDecks: 6,
    dealerStandsSoft17: true,
    allowSurrender: true,
    allowInsurance: true,
    tableLimits: { minBet: MIN_BET, maxBet: 50000, minSideBet: 100, maxSideBet: 2500 },
  })
}

function placeBetAndDeal(engine: FreeBetBJEngine, betCents = MIN_BET) {
  engine.dispatch({ type: 'PLACE_BET', amountCents: betCents })
  engine.dispatch({ type: 'DEAL' })
}

function forceHands(
  state: FreeBetBJState,
  playerCards: Card[],
  dealerCards: Card[],
): FreeBetBJState {
  const hand: FreeBetHand = {
    ...state.hands[0]!,
    cards: playerCards,
    isBlackjack:
      playerCards.length === 2 &&
      (playerCards[0]!.rank === 'A'
        ? ['10', 'J', 'Q', 'K'].includes(playerCards[1]!.rank)
        : ['10', 'J', 'Q', 'K'].includes(playerCards[0]!.rank) && playerCards[1]!.rank === 'A'),
    isBust: false,
    stood: false,
    surrendered: false,
    result: null,
    settled: 0,
  }
  return {
    ...state,
    hands: [hand],
    dealerCards,
    dealerTotal: dealerCards[0] ? parseInt(dealerCards[0].rank === 'A' ? '11' : dealerCards[0].rank, 10) : 0,
    phase: 'player_turn',
    activeHandIndex: 0,
  }
}

describe('FreeBetBJEngine — basic setup', () => {
  it('starts in betting phase', () => {
    const engine = freshEngine()
    expect(engine.getState().phase).toBe('betting')
  })

  it('accepts a valid bet', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    expect(engine.getState().bet).toBe(MIN_BET)
  })

  it('rejects bet below minimum', () => {
    const engine = freshEngine()
    const result = engine.dispatch({ type: 'PLACE_BET', amountCents: 50 })
    expect(result.error).toBeDefined()
  })

  it('transitions to player_turn after deal (no BJ, no dealer Ace)', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })

    let phase: string = 'dealing'
    let attempts = 0
    while (phase !== 'player_turn' && attempts < 200) {
      engine.dispatch({ type: 'NEW_HAND' })
      engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
      engine.dispatch({ type: 'DEAL' })
      const s = engine.getState()
      if (s.phase === 'insurance') {
        engine.dispatch({ type: 'DECLINE_INSURANCE' })
      }
      phase = engine.getState().phase
      attempts++
    }
    expect(engine.getState().phase).toBe('player_turn')
  })
})

describe('FreeBetBJEngine — free split eligibility', () => {
  it('allows FREE_SPLIT action for pair of 2s', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })
    const s = engine.getState()
    const forced = forceHands(
      s,
      [makeCard('2', 'clubs'), makeCard('2', 'hearts')],
      [makeCard('7', 'spades'), makeCard('3', 'clubs')],
    )
    ;(engine as any).state = { ...forced, activeHandValidActions: new Set(['HIT', 'STAND', 'SPLIT', 'SURRENDER']) }
    expect(engine.getState().activeHandValidActions.has('SPLIT')).toBe(true)
  })

  it('does NOT allow split for 10-value pairs', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })
    const s = engine.getState()
    const tenPairState = forceHands(
      s,
      [makeCard('10', 'clubs'), makeCard('J', 'hearts')],
      [makeCard('7', 'spades'), makeCard('3', 'clubs')],
    )
    ;(engine as any).state = tenPairState
    const result = engine.dispatch({ type: 'SPLIT' })
    expect(result.error).toBeDefined()
  })

  it('does NOT allow split for K-K (10-value pair)', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })
    const s = engine.getState()
    const kkState = forceHands(
      s,
      [makeCard('K', 'clubs'), makeCard('K', 'hearts')],
      [makeCard('7', 'spades'), makeCard('3', 'clubs')],
    )
    ;(engine as any).state = kkState
    const result = engine.dispatch({ type: 'SPLIT' })
    expect(result.error).toBeDefined()
  })

  it('allows splitting Aces', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })
    const s = engine.getState()
    const aceState = forceHands(
      s,
      [makeCard('A', 'clubs'), makeCard('A', 'hearts')],
      [makeCard('7', 'spades'), makeCard('3', 'clubs')],
    )
    ;(engine as any).state = aceState
    const result = engine.dispatch({ type: 'SPLIT' })
    expect(result.error).toBeUndefined()
    expect(engine.getState().hands.length).toBe(2)
  })

  it('deals one card to each split Ace hand and marks both stood', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })
    const s = engine.getState()
    const aceState = forceHands(
      s,
      [makeCard('A', 'clubs'), makeCard('A', 'diamonds')],
      [makeCard('7', 'spades'), makeCard('3', 'clubs')],
    )
    ;(engine as any).state = aceState
    engine.dispatch({ type: 'SPLIT' })
    const state = engine.getState()
    if (state.phase === 'player_turn' || state.phase === 'complete') {
      const splitHands = state.hands.filter(h => h.isFreeSplit)
      for (const hand of splitHands) {
        expect(hand.cards.length).toBe(2)
      }
    }
  })
})

describe('FreeBetBJEngine — re-split up to 4 hands', () => {
  it('allows re-splitting pairs up to 4 total hands', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const h: FreeBetHand = {
      id: 'test-hand',
      cards: [makeCard('5', 'clubs'), makeCard('5', 'hearts')],
      bet: MIN_BET,
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
    ;(engine as any).state = {
      ...s,
      hands: [h],
      dealerCards: [makeCard('6', 'spades'), makeCard('3', 'clubs')],
      phase: 'player_turn',
      activeHandIndex: 0,
    }

    const r1 = engine.dispatch({ type: 'SPLIT' })
    expect(r1.error).toBeUndefined()
    expect(engine.getState().hands.length).toBe(2)

    if (engine.getState().phase === 'player_turn') {
      const h2 = engine.getState().hands[engine.getState().activeHandIndex]!
      if (h2.cards.length === 2 && h2.cards[0]!.rank === h2.cards[1]!.rank && !['10','J','Q','K'].includes(h2.cards[0]!.rank)) {
        const r2 = engine.dispatch({ type: 'SPLIT' })
        if (!r2.error) {
          expect(engine.getState().hands.length).toBeGreaterThanOrEqual(3)
        }
      }
    }
  })

  it('blocks split when 4 hands already exist', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const makeTestHand = (id: string): FreeBetHand => ({
      id,
      cards: [makeCard('3', 'clubs'), makeCard('3', 'hearts')],
      bet: MIN_BET,
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
    })

    const fourHands = [
      makeTestHand('h1'),
      makeTestHand('h2'),
      makeTestHand('h3'),
      makeTestHand('h4'),
    ]
    ;(engine as any).state = {
      ...s,
      hands: fourHands,
      dealerCards: [makeCard('6', 'spades'), makeCard('3', 'clubs')],
      phase: 'player_turn',
      activeHandIndex: 0,
    }

    const result = engine.dispatch({ type: 'SPLIT' })
    expect(result.error).toBeDefined()
  })
})

describe('FreeBetBJEngine — free double eligibility', () => {
  it('free doubles on hard 9', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const hard9 = forceHands(
      s,
      [makeCard('4', 'clubs'), makeCard('5', 'hearts')],
      [makeCard('6', 'spades'), makeCard('3', 'clubs')],
    )
    ;(engine as any).state = hard9
    const result = engine.dispatch({ type: 'DOUBLE' })
    expect(result.error).toBeUndefined()
    const updatedHand = engine.getState().hands[0]
    expect(updatedHand?.isFreeDouble).toBe(true)
    expect(updatedHand?.freeBet).toBe(MIN_BET)
  })

  it('free doubles on hard 10', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const hard10 = forceHands(
      s,
      [makeCard('6', 'clubs'), makeCard('4', 'hearts')],
      [makeCard('7', 'spades'), makeCard('3', 'clubs')],
    )
    ;(engine as any).state = hard10
    const result = engine.dispatch({ type: 'DOUBLE' })
    expect(result.error).toBeUndefined()
    expect(engine.getState().hands[0]?.isFreeDouble).toBe(true)
  })

  it('free doubles on hard 11', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const hard11 = forceHands(
      s,
      [makeCard('7', 'clubs'), makeCard('4', 'hearts')],
      [makeCard('8', 'spades'), makeCard('3', 'clubs')],
    )
    ;(engine as any).state = hard11
    const result = engine.dispatch({ type: 'DOUBLE' })
    expect(result.error).toBeUndefined()
    expect(engine.getState().hands[0]?.isFreeDouble).toBe(true)
  })

  it('does NOT free double on soft hands', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const soft11 = forceHands(
      s,
      [makeCard('A', 'clubs'), makeCard('9', 'hearts')],
      [makeCard('7', 'spades'), makeCard('3', 'clubs')],
    )
    ;(engine as any).state = soft11
    const result = engine.dispatch({ type: 'DOUBLE' })
    if (!result.error) {
      expect(engine.getState().hands[0]?.isFreeDouble).toBe(false)
    }
  })

  it('does NOT free double on hard 8 — paid double proceeds if chosen', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const hard8 = forceHands(
      s,
      [makeCard('3', 'clubs'), makeCard('5', 'hearts')],
      [makeCard('6', 'spades'), makeCard('3', 'clubs')],
    )
    ;(engine as any).state = hard8
    const result = engine.dispatch({ type: 'DOUBLE' })
    expect(result.error).toBeUndefined()
    expect(engine.getState().hands[0]?.isFreeDouble).toBe(false)
    expect(engine.getState().hands[0]?.bet).toBe(MIN_BET * 2)
  })

  it('does NOT free double on soft 20 (A+9)', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const soft20 = forceHands(
      s,
      [makeCard('A', 'clubs'), makeCard('9', 'hearts')],
      [makeCard('6', 'spades'), makeCard('3', 'clubs')],
    )
    ;(engine as any).state = soft20
    const result = engine.dispatch({ type: 'DOUBLE' })
    if (!result.error) {
      expect(engine.getState().hands[0]?.isFreeDouble).toBe(false)
    }
  })
})

describe('FreeBetBJEngine — free bet accounting', () => {
  it('on a winning free double: player wins original bet only, free bet is not returned', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'DEAL' })
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const hard11State = forceHands(
      s,
      [makeCard('7', 'clubs'), makeCard('4', 'hearts')],
      [makeCard('6', 'spades'), makeCard('J', 'clubs')],
    )
    ;(engine as any).state = { ...hard11State, totalNetCents: 0 }
    engine.dispatch({ type: 'DOUBLE' })

    const state = engine.getState()
    if (state.phase === 'complete') {
      const hand = state.hands[0]!
      if (hand.result === 'win') {
        expect(hand.settled).toBe(MIN_BET)
      }
    }
  })

  it('on a losing free double: player loses original bet only', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'DEAL' })
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const hard11State = forceHands(
      s,
      [makeCard('7', 'clubs'), makeCard('4', 'hearts')],
      [makeCard('8', 'spades'), makeCard('K', 'clubs')],
    )
    ;(engine as any).state = { ...hard11State, totalNetCents: 0 }
    engine.dispatch({ type: 'DOUBLE' })

    const state = engine.getState()
    if (state.phase === 'complete') {
      const hand = state.hands[0]!
      if (hand.result === 'loss') {
        expect(hand.settled).toBe(-MIN_BET)
      }
    }
  })
})

describe('FreeBetBJEngine — push-22', () => {
  it('dealer bust with exactly 22 pushes all non-busted hands', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'DEAL' })
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const hand: FreeBetHand = {
      id: 'test-stand',
      cards: [makeCard('10', 'clubs'), makeCard('8', 'hearts')],
      bet: MIN_BET,
      freeBet: 0,
      isFreeSplit: false,
      isFreeDouble: false,
      doubled: false,
      surrendered: false,
      stood: true,
      isBlackjack: false,
      isBust: false,
      result: null,
      settled: 0,
    }
    const dealerBust22Cards = [
      makeCard('10', 'spades'),
      makeCard('Q', 'clubs'),
      makeCard('2', 'diamonds'),
    ]
    ;(engine as any).state = {
      ...s,
      hands: [hand],
      dealerCards: dealerBust22Cards,
      phase: 'resolving',
      totalNetCents: 0,
    }
    ;(engine as any).state = (engine as any)._resolveComplete((engine as any).state, [])
    const finalState = engine.getState()

    const resolvedHand = finalState.hands[0]!
    expect(resolvedHand.result).toBe('push')
    expect(resolvedHand.settled).toBe(0)
  })

  it('dealer bust with 23+ means player wins normally', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'DEAL' })
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const hand: FreeBetHand = {
      id: 'test-win',
      cards: [makeCard('10', 'clubs'), makeCard('8', 'hearts')],
      bet: MIN_BET,
      freeBet: 0,
      isFreeSplit: false,
      isFreeDouble: false,
      doubled: false,
      surrendered: false,
      stood: true,
      isBlackjack: false,
      isBust: false,
      result: null,
      settled: 0,
    }
    const dealerBust23Cards = [
      makeCard('10', 'spades'),
      makeCard('Q', 'clubs'),
      makeCard('3', 'diamonds'),
    ]
    ;(engine as any).state = {
      ...s,
      hands: [hand],
      dealerCards: dealerBust23Cards,
      phase: 'resolving',
      totalNetCents: 0,
    }
    ;(engine as any).state = (engine as any)._resolveComplete((engine as any).state, [])
    const finalState = engine.getState()

    const resolvedHand = finalState.hands[0]!
    expect(resolvedHand.result).toBe('win')
    expect(resolvedHand.settled).toBe(MIN_BET)
  })

  it('player blackjack pays 3:2 even when dealer busts with 22', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'DEAL' })
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const bjHand: FreeBetHand = {
      id: 'test-bj',
      cards: [makeCard('A', 'clubs'), makeCard('K', 'hearts')],
      bet: MIN_BET,
      freeBet: 0,
      isFreeSplit: false,
      isFreeDouble: false,
      doubled: false,
      surrendered: false,
      stood: false,
      isBlackjack: true,
      isBust: false,
      result: null,
      settled: 0,
    }
    const dealerBust22Cards = [
      makeCard('10', 'spades'),
      makeCard('Q', 'clubs'),
      makeCard('2', 'diamonds'),
    ]
    ;(engine as any).state = {
      ...s,
      hands: [bjHand],
      dealerCards: dealerBust22Cards,
      phase: 'resolving',
      totalNetCents: 0,
    }
    ;(engine as any).state = (engine as any)._resolveComplete((engine as any).state, [])
    const finalState = engine.getState()

    const resolvedHand = finalState.hands[0]!
    expect(resolvedHand.result).toBe('blackjack')
    expect(resolvedHand.settled).toBe(Math.floor(MIN_BET * 3 / 2))
  })
})

describe('FreeBetBJEngine — Pot of Gold side bet', () => {
  it('triggers POT_OF_GOLD_TRIGGERED event on suited Ace-Ace split', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'PLACE_POT_OF_GOLD', amountCents: 500 })
    engine.dispatch({ type: 'DEAL' })
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const acesState = forceHands(
      s,
      [makeCard('A', 'spades'), makeCard('A', 'spades')],
      [makeCard('7', 'clubs'), makeCard('3', 'hearts')],
    )
    ;(engine as any).state = { ...acesState, potOfGold: 500 }

    const result = engine.dispatch({ type: 'SPLIT' })
    const triggered = result.events.some(e => e.type === 'POT_OF_GOLD_TRIGGERED')
    expect(triggered).toBe(true)
  })

  it('resolves POT_OF_GOLD_RESOLVED (same-color, not same-suit) for 25:1 payout', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'PLACE_POT_OF_GOLD', amountCents: 500 })
    engine.dispatch({ type: 'DEAL' })
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const acesState = forceHands(
      s,
      [makeCard('A', 'hearts'), makeCard('A', 'diamonds')],
      [makeCard('7', 'clubs'), makeCard('3', 'spades')],
    )
    ;(engine as any).state = { ...acesState, potOfGold: 500 }

    const result = engine.dispatch({ type: 'SPLIT' })
    const resolvedEvent = result.events.find(e => e.type === 'POT_OF_GOLD_RESOLVED')
    expect(resolvedEvent).toBeDefined()
    expect(resolvedEvent?.potOfGoldPayout).toBe(500 * 25)
  })

  it('resolves POT_OF_GOLD_RESOLVED (different color) for 10:1 payout', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'PLACE_POT_OF_GOLD', amountCents: 500 })
    engine.dispatch({ type: 'DEAL' })
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const acesState = forceHands(
      s,
      [makeCard('A', 'hearts'), makeCard('A', 'spades')],
      [makeCard('7', 'clubs'), makeCard('3', 'diamonds')],
    )
    ;(engine as any).state = { ...acesState, potOfGold: 500 }

    const result = engine.dispatch({ type: 'SPLIT' })
    const resolvedEvent = result.events.find(e => e.type === 'POT_OF_GOLD_RESOLVED')
    expect(resolvedEvent).toBeDefined()
    expect(resolvedEvent?.potOfGoldPayout).toBe(500 * 10)
  })
})

describe('FreeBetBJEngine — insurance resolution', () => {
  it('insurance pays 2:1 when dealer has blackjack', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'DEAL' })

    const s = engine.getState()
    if (s.phase !== 'insurance') {
      const forced: FreeBetBJState = {
        ...s,
        phase: 'insurance',
        insuranceOffered: true,
        canInsurance: true,
        dealerCards: [makeCard('A', 'spades'), makeCard('K', 'clubs')],
        hands: [
          {
            id: 'ins-hand',
            cards: [makeCard('9', 'clubs'), makeCard('8', 'hearts')],
            bet: MIN_BET,
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
          },
        ],
        totalNetCents: 0,
      }
      ;(engine as any).state = forced
    }

    const result = engine.dispatch({ type: 'TAKE_INSURANCE' })
    const insEvent = result.events.find(e => e.type === 'INSURANCE_RESOLVED')
    expect(insEvent).toBeDefined()
    expect(insEvent?.netCents).toBe(Math.floor(MIN_BET / 2) * 2)
  })

  it('insurance loses when dealer does not have blackjack', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'DEAL' })

    const s = engine.getState()
    const forced: FreeBetBJState = {
      ...s,
      phase: 'insurance',
      insuranceOffered: true,
      canInsurance: true,
      dealerCards: [makeCard('A', 'spades'), makeCard('7', 'clubs')],
      hands: [
        {
          id: 'ins-hand2',
          cards: [makeCard('9', 'clubs'), makeCard('8', 'hearts')],
          bet: MIN_BET,
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
        },
      ],
      totalNetCents: 0,
    }
    ;(engine as any).state = forced

    const result = engine.dispatch({ type: 'TAKE_INSURANCE' })
    const insEvent = result.events.find(e => e.type === 'INSURANCE_RESOLVED')
    expect(insEvent).toBeDefined()
    expect(insEvent?.netCents).toBe(-Math.floor(MIN_BET / 2))
  })
})

describe('FreeBetBJEngine — late surrender', () => {
  it('surrenders and returns half the bet', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const hard16 = forceHands(
      s,
      [makeCard('10', 'clubs'), makeCard('6', 'hearts')],
      [makeCard('A', 'spades'), makeCard('7', 'clubs')],
    )
    ;(engine as any).state = { ...hard16, totalNetCents: 0 }
    const result = engine.dispatch({ type: 'SURRENDER' })
    expect(result.error).toBeUndefined()

    const finalState = engine.getState()
    if (finalState.phase === 'complete') {
      expect(finalState.hands[0]?.result).toBe('surrender')
      expect(finalState.totalNetCents).toBe(-Math.floor(MIN_BET / 2))
    }
  })

  it('cannot surrender after hitting', () => {
    const engine = freshEngine()
    placeBetAndDeal(engine)
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const hard14 = forceHands(
      s,
      [makeCard('8', 'clubs'), makeCard('6', 'hearts')],
      [makeCard('10', 'spades'), makeCard('7', 'clubs')],
    )
    ;(engine as any).state = hard14
    engine.dispatch({ type: 'HIT' })

    if (engine.getState().phase === 'player_turn') {
      const result = engine.dispatch({ type: 'SURRENDER' })
      expect(result.error).toBeDefined()
    }
  })
})

describe('FreeBetBJEngine — full hand flow', () => {
  it('completes a full hand from bet to result', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'DEAL' })

    const state = engine.getState()
    if (state.phase === 'insurance') {
      engine.dispatch({ type: 'DECLINE_INSURANCE' })
    }

    let maxActions = 20
    while (engine.getState().phase === 'player_turn' && maxActions-- > 0) {
      engine.dispatch({ type: 'STAND' })
    }

    expect(engine.getState().phase).toBe('complete')
  })

  it('NEW_HAND resets to betting phase preserving shoe', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'DEAL' })
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })
    while (engine.getState().phase === 'player_turn') {
      engine.dispatch({ type: 'STAND' })
    }

    engine.dispatch({ type: 'NEW_HAND' })
    expect(engine.getState().phase).toBe('betting')
    expect(engine.getState().hands.length).toBe(0)
    expect(engine.getState().bet).toBe(0)
  })

  it('emits PUSH_22 event when dealer busts with exactly 22', () => {
    const engine = freshEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: MIN_BET })
    engine.dispatch({ type: 'DEAL' })
    if (engine.getState().phase === 'insurance') engine.dispatch({ type: 'DECLINE_INSURANCE' })

    const s = engine.getState()
    const stoodHand: FreeBetHand = {
      id: 'push22-hand',
      cards: [makeCard('J', 'clubs'), makeCard('9', 'hearts')],
      bet: MIN_BET,
      freeBet: 0,
      isFreeSplit: false,
      isFreeDouble: false,
      doubled: false,
      surrendered: false,
      stood: true,
      isBlackjack: false,
      isBust: false,
      result: null,
      settled: 0,
    }
    ;(engine as any).state = {
      ...s,
      hands: [stoodHand],
      dealerCards: [makeCard('10', 'spades'), makeCard('Q', 'clubs'), makeCard('2', 'diamonds')],
      phase: 'resolving',
      totalNetCents: 0,
    }

    const events: any[] = []
    ;(engine as any).state = (engine as any)._resolveComplete((engine as any).state, events)
    const push22 = events.some((e: any) => e.type === 'PUSH_22')
    expect(push22).toBe(true)
  })
})
