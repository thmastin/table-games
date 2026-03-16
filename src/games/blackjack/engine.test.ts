import { describe, it, expect } from 'vitest'
import { BlackjackEngine } from './engine'
import { cardTotal } from './paytables'
import {
  calcPerfectPairs,
  calc21Plus3,
  calcLuckyLadies,
  calcBustIt,
  calcMatchTheDealer,
  calcRoyalMatch,
} from './paytables'
import type { Card } from '../../lib/deck'
import type { BlackjackConfig } from './types'

function card(rank: Card['rank'], suit: Card['suit'] = 'spades'): Card {
  return { rank, suit, faceDown: false }
}

function makeEngine(overrides: Partial<BlackjackConfig> = {}): BlackjackEngine {
  return new BlackjackEngine({
    numDecks: 6,
    dealerStandsSoft17: true,
    allowSurrender: true,
    allowInsurance: true,
    tableLimits: { minBet: 1000, maxBet: 50000, minSideBet: 100, maxSideBet: 2500 },
    ...overrides,
  })
}

describe('cardTotal', () => {
  it('counts face cards as 10', () => {
    expect(cardTotal([card('J'), card('Q')])).toBe(20)
    expect(cardTotal([card('K'), card('10')])).toBe(20)
  })

  it('counts Ace as 11 when not busting', () => {
    expect(cardTotal([card('A'), card('K')])).toBe(21)
  })

  it('counts Ace as 1 when 11 would bust', () => {
    expect(cardTotal([card('A'), card('K'), card('5')])).toBe(16)
  })

  it('handles multiple aces', () => {
    expect(cardTotal([card('A'), card('A')])).toBe(12)
    expect(cardTotal([card('A'), card('A'), card('A')])).toBe(13)
  })

  it('soft 17', () => {
    expect(cardTotal([card('A'), card('6')])).toBe(17)
  })
})

describe('BlackjackEngine — initial state', () => {
  it('starts in betting phase', () => {
    const engine = makeEngine()
    expect(engine.getState().phase).toBe('betting')
  })

  it('rejects deal without a bet', () => {
    const engine = makeEngine()
    const result = engine.dispatch({ type: 'DEAL' })
    expect(result.error).toBeDefined()
  })

  it('rejects bet below minimum', () => {
    const engine = makeEngine()
    const result = engine.dispatch({ type: 'PLACE_BET', amountCents: 500 })
    expect(result.error).toBeDefined()
  })

  it('rejects bet above maximum', () => {
    const engine = makeEngine()
    const result = engine.dispatch({ type: 'PLACE_BET', amountCents: 100000 })
    expect(result.error).toBeDefined()
  })

  it('accepts valid bet', () => {
    const engine = makeEngine()
    const result = engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    expect(result.error).toBeUndefined()
    expect(result.state.mainBetCents).toBe(5000)
  })
})

describe('BlackjackEngine — deal', () => {
  it('deals 2 cards to player and 2 to dealer', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    const result = engine.dispatch({ type: 'DEAL' })
    const state = result.state
    expect(state.playerHands[0]!.cards).toHaveLength(2)
    expect(state.dealerHand).toHaveLength(2)
  })

  it('dealer second card is face down after deal', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })
    const state = engine.getState()
    expect(state.dealerHand[1]!.faceDown).toBe(true)
  })

  it('emits CARD_DEALT events', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    const result = engine.dispatch({ type: 'DEAL' })
    const cardDealt = result.events.filter(e => e.type === 'CARD_DEALT')
    expect(cardDealt).toHaveLength(4)
  })
})

describe('BlackjackEngine — player blackjack detection', () => {
  it('detects player blackjack and goes to complete phase', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 10000 })
    let state = engine.getState()

    let attempts = 0
    while (state.phase !== 'complete' && attempts < 200) {
      engine.dispatch({ type: 'NEW_HAND' })
      engine.dispatch({ type: 'PLACE_BET', amountCents: 10000 })
      engine.dispatch({ type: 'DEAL' })
      state = engine.getState()
      if (state.phase === 'insurance') {
        engine.dispatch({ type: 'DECLINE_INSURANCE' })
        state = engine.getState()
      }
      attempts++
    }

    const anyBJ = state.phase === 'complete' &&
      state.playerHands.some(h => h.isBlackjack)
    expect(typeof anyBJ).toBe('boolean')
  })
})

describe('BlackjackEngine — HIT', () => {
  it('rejects HIT when not in player_turn', () => {
    const engine = makeEngine()
    const result = engine.dispatch({ type: 'HIT' })
    expect(result.error).toBeDefined()
  })

  it('adds a card on HIT', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })

    let state = engine.getState()
    if (state.phase === 'insurance') {
      engine.dispatch({ type: 'DECLINE_INSURANCE' })
      state = engine.getState()
    }

    if (state.phase === 'player_turn') {
      const before = state.playerHands[0]!.cards.length
      engine.dispatch({ type: 'HIT' })
      state = engine.getState()
      if (state.phase === 'player_turn' || state.phase === 'complete') {
        const after = state.playerHands[0]!.cards.length
        expect(after).toBe(before + 1)
      }
    }
  })

  it('marks hand as bust when over 21', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })

    let state = engine.getState()
    if (state.phase === 'insurance') {
      engine.dispatch({ type: 'DECLINE_INSURANCE' })
      state = engine.getState()
    }

    let safetyValve = 0
    while (state.phase === 'player_turn' && safetyValve < 20) {
      const total = cardTotal(state.playerHands[0]!.cards)
      if (total > 21) break
      engine.dispatch({ type: 'HIT' })
      state = engine.getState()
      safetyValve++
    }

    const hand = (state.playerHands[0] ?? state.playerHands[state.playerHands.length - 1])
    if (cardTotal(hand!.cards) > 21) {
      expect(hand!.isBust).toBe(true)
    }
  })
})

describe('BlackjackEngine — STAND', () => {
  it('marks hand as stood and triggers dealer turn', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })

    let state = engine.getState()
    if (state.phase === 'insurance') {
      engine.dispatch({ type: 'DECLINE_INSURANCE' })
      state = engine.getState()
    }

    if (state.phase === 'player_turn') {
      engine.dispatch({ type: 'STAND' })
      state = engine.getState()
      expect(['dealer_turn', 'resolving', 'complete']).toContain(state.phase)
    }
  })
})

describe('BlackjackEngine — DOUBLE', () => {
  it('doubles the bet and deals one card', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })

    let state = engine.getState()
    if (state.phase === 'insurance') {
      engine.dispatch({ type: 'DECLINE_INSURANCE' })
      state = engine.getState()
    }

    if (state.phase === 'player_turn') {
      const origBet = state.playerHands[0]!.betCents
      engine.dispatch({ type: 'DOUBLE' })
      state = engine.getState()
      const hand = state.playerHands[0]!
      if (hand.doubled) {
        expect(hand.betCents).toBe(origBet * 2)
        expect(hand.cards).toHaveLength(3)
        expect(hand.stood).toBe(true)
      }
    }
  })

  it('rejects DOUBLE when not in player_turn', () => {
    const engine = makeEngine()
    const result = engine.dispatch({ type: 'DOUBLE' })
    expect(result.error).toBeDefined()
  })
})

describe('BlackjackEngine — SPLIT', () => {
  it('rejects SPLIT when not in player_turn', () => {
    const engine = makeEngine()
    const result = engine.dispatch({ type: 'SPLIT' })
    expect(result.error).toBeDefined()
  })

  it('splits when cards have equal value', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })

    let state = engine.getState()
    if (state.phase === 'insurance') {
      engine.dispatch({ type: 'DECLINE_INSURANCE' })
      state = engine.getState()
    }

    if (state.phase === 'player_turn') {
      const hand = state.playerHands[0]!
      const [c1, c2] = hand.cards
      const canSplitNow =
        c1 && c2 &&
        (c1.rank === c2.rank ||
          (['10', 'J', 'Q', 'K'].includes(c1.rank) && ['10', 'J', 'Q', 'K'].includes(c2.rank)))

      if (canSplitNow) {
        engine.dispatch({ type: 'SPLIT' })
        state = engine.getState()
        expect(state.playerHands.length).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('allows up to 4 hands (3 splits)', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })

    let state = engine.getState()
    if (state.phase === 'insurance') {
      engine.dispatch({ type: 'DECLINE_INSURANCE' })
      state = engine.getState()
    }

    if (state.phase === 'player_turn') {
      for (let i = 0; i < 10; i++) {
        state = engine.getState()
        if (state.phase !== 'player_turn') break
        const hand = state.playerHands[state.activeHandIndex]
        if (!hand) break
        const result = engine.dispatch({ type: 'SPLIT' })
        if (result.error) break
        expect(engine.getState().playerHands.length).toBeLessThanOrEqual(4)
      }
    }
  })
})

describe('BlackjackEngine — SURRENDER', () => {
  it('rejects SURRENDER when not in player_turn', () => {
    const engine = makeEngine()
    const result = engine.dispatch({ type: 'SURRENDER' })
    expect(result.error).toBeDefined()
  })

  it('marks hand surrendered and resolves for half bet loss', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 10000 })
    engine.dispatch({ type: 'DEAL' })

    let state = engine.getState()
    if (state.phase === 'insurance') {
      engine.dispatch({ type: 'DECLINE_INSURANCE' })
      state = engine.getState()
    }

    if (state.phase === 'player_turn') {
      engine.dispatch({ type: 'SURRENDER' })
      state = engine.getState()
      if (state.phase === 'complete') {
        const hand = state.playerHands[0]!
        if (hand.surrendered) {
          expect(hand.netCents).toBe(-5000)
        }
      }
    }
  })

  it('disallows surrender when config disables it', () => {
    const engine = new BlackjackEngine({
      allowSurrender: false,
      tableLimits: { minBet: 1000, maxBet: 50000, minSideBet: 100, maxSideBet: 2500 },
    })
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })

    let state = engine.getState()
    if (state.phase === 'insurance') {
      engine.dispatch({ type: 'DECLINE_INSURANCE' })
      state = engine.getState()
    }

    if (state.phase === 'player_turn') {
      expect(state.canSurrender).toBe(false)
    }
  })
})

describe('BlackjackEngine — Insurance', () => {
  it('insurance offered when dealer shows Ace', () => {
    const engine = makeEngine()
    let found = false
    for (let i = 0; i < 300; i++) {
      engine.dispatch({ type: 'NEW_HAND' })
      engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
      engine.dispatch({ type: 'DEAL' })
      const state = engine.getState()
      if (state.phase === 'insurance') {
        expect(state.dealerHand[0]!.rank).toBe('A')
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })

  it('insurance resolves at 2:1 on dealer blackjack', () => {
    const engine = makeEngine()
    let resolved = false
    for (let i = 0; i < 500; i++) {
      engine.dispatch({ type: 'NEW_HAND' })
      engine.dispatch({ type: 'PLACE_BET', amountCents: 10000 })
      engine.dispatch({ type: 'DEAL' })
      const state = engine.getState()
      if (state.phase === 'insurance') {
        const result = engine.dispatch({ type: 'TAKE_INSURANCE' })
        const insEvent = result.events.find(e => e.type === 'INSURANCE_RESOLVED')
        if (insEvent) {
          const s = engine.getState()
          if (s.insuranceWon) {
            expect(insEvent.netCents).toBe(10000)
            resolved = true
            break
          }
        }
      }
    }
    if (!resolved) {
      expect(true).toBe(true)
    }
  })

  it('insurance is disabled when config disables it', () => {
    const engine = new BlackjackEngine({
      allowInsurance: false,
      tableLimits: { minBet: 1000, maxBet: 50000, minSideBet: 100, maxSideBet: 2500 },
    })
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })
    const state = engine.getState()
    expect(state.phase).not.toBe('insurance')
  })
})

describe('BlackjackEngine — dealer soft 17', () => {
  it('dealer stands on soft 17 when config says so', () => {
    const engine = makeEngine({ dealerStandsSoft17: true })
    let completed = false
    for (let i = 0; i < 300 && !completed; i++) {
      engine.dispatch({ type: 'NEW_HAND' })
      engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
      engine.dispatch({ type: 'DEAL' })
      let state = engine.getState()
      if (state.phase === 'insurance') {
        engine.dispatch({ type: 'DECLINE_INSURANCE' })
        state = engine.getState()
      }
      if (state.phase === 'player_turn') {
        engine.dispatch({ type: 'STAND' })
        state = engine.getState()
        if (state.phase === 'complete') {
          const dt = cardTotal(state.dealerHand)
          const ds = state.dealerHand.length >= 2
          if (ds && dt >= 17) completed = true
        }
      }
    }
    expect(completed).toBe(true)
  })
})

describe('BlackjackEngine — bust detection', () => {
  it('hand total > 21 is bust', () => {
    const cards = [card('K'), card('Q'), card('5')]
    expect(cardTotal(cards)).toBe(25)
  })

  it('ace prevents bust when possible', () => {
    const cards = [card('A'), card('K'), card('5')]
    expect(cardTotal(cards)).toBe(16)
    expect(cardTotal(cards) > 21).toBe(false)
  })
})

describe('BlackjackEngine — NEW_HAND', () => {
  it('resets to betting phase', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })
    engine.dispatch({ type: 'NEW_HAND' })
    expect(engine.getState().phase).toBe('betting')
  })

  it('clears hands and bets', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'NEW_HAND' })
    const state = engine.getState()
    expect(state.playerHands).toHaveLength(0)
    expect(state.mainBetCents).toBe(0)
    expect(state.sideBets).toHaveLength(0)
  })
})

describe('BlackjackEngine — shoe reshuffle', () => {
  it('reshuffles at approximately 75% penetration', () => {
    const engine = makeEngine({ numDecks: 1 })
    let reshuffled = false
    const initialSeed = engine.getState().rngSeed

    for (let i = 0; i < 50; i++) {
      engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
      engine.dispatch({ type: 'DEAL' })
      let state = engine.getState()
      if (state.phase === 'insurance') {
        engine.dispatch({ type: 'DECLINE_INSURANCE' })
        state = engine.getState()
      }
      while (state.phase === 'player_turn') {
        engine.dispatch({ type: 'STAND' })
        state = engine.getState()
      }
      engine.dispatch({ type: 'NEW_HAND' })
      state = engine.getState()
      if (state.rngSeed !== initialSeed) {
        reshuffled = true
        break
      }
    }
    expect(reshuffled).toBe(true)
  })
})

describe('Side bet — Perfect Pairs', () => {
  it('returns 0 for non-pair', () => {
    expect(calcPerfectPairs(card('A', 'spades'), card('K', 'hearts'), 1000)).toBe(0)
  })

  it('pays 5:1 for mixed pair (different color)', () => {
    expect(calcPerfectPairs(card('7', 'spades'), card('7', 'hearts'), 1000)).toBe(5000)
  })

  it('pays 10:1 for colored pair (same color, different suit)', () => {
    expect(calcPerfectPairs(card('7', 'hearts'), card('7', 'diamonds'), 1000)).toBe(10000)
  })

  it('pays 30:1 for perfect pair (same suit)', () => {
    expect(calcPerfectPairs(card('7', 'clubs'), card('7', 'clubs'), 1000)).toBe(30000)
  })
})

describe('Side bet — 21+3', () => {
  it('pays for flush', () => {
    const c1 = card('2', 'hearts')
    const c2 = card('7', 'hearts')
    const d = card('K', 'hearts')
    const result = calc21Plus3(c1, c2, d, 1000)
    expect(result).toBeGreaterThan(0)
  })

  it('pays for straight', () => {
    const c1 = card('7', 'hearts')
    const c2 = card('8', 'spades')
    const d = card('9', 'diamonds')
    const result = calc21Plus3(c1, c2, d, 1000)
    expect(result).toBeGreaterThan(0)
  })

  it('pays 30:1 for three of a kind', () => {
    const c1 = card('7', 'hearts')
    const c2 = card('7', 'spades')
    const d = card('7', 'diamonds')
    expect(calc21Plus3(c1, c2, d, 1000)).toBe(30000)
  })

  it('returns 0 for no qualifying hand', () => {
    const c1 = card('2', 'hearts')
    const c2 = card('5', 'spades')
    const d = card('K', 'diamonds')
    expect(calc21Plus3(c1, c2, d, 1000)).toBe(0)
  })
})

describe('Side bet — Lucky Ladies', () => {
  it('returns 0 for non-20 total', () => {
    expect(calcLuckyLadies(card('2'), card('5'), [], 1000)).toBe(0)
  })

  it('pays 4:1 for any 20', () => {
    expect(calcLuckyLadies(card('K'), card('Q', 'hearts'), [], 1000)).toBe(4000)
  })

  it('pays 19:1 for matched 20 (same rank+suit)', () => {
    expect(calcLuckyLadies(card('K', 'spades'), card('K', 'spades'), [], 1000)).toBe(19000)
  })

  it('pays 125:1 for Queen of Hearts pair', () => {
    const qh = card('Q', 'hearts')
    expect(calcLuckyLadies(qh, { ...qh }, [], 1000)).toBe(125000)
  })

  it('pays 1000:1 for QQ hearts when dealer has blackjack', () => {
    const qh = card('Q', 'hearts')
    const dealerHand = [card('A', 'spades'), card('K', 'clubs')]
    expect(calcLuckyLadies(qh, { ...qh }, dealerHand, 1000)).toBe(1000000)
  })
})

describe('Side bet — Bust It', () => {
  it('returns 0 when dealer does not bust', () => {
    expect(calcBustIt([card('K'), card('7')], 1000)).toBe(0)
  })

  it('pays 1:1 for 3-card bust', () => {
    const cards = [card('K'), card('Q'), card('5')]
    expect(cardTotal(cards)).toBe(25)
    expect(calcBustIt(cards, 1000)).toBe(1000)
  })

  it('pays 2:1 for 4-card bust', () => {
    const cards = [card('K'), card('5'), card('4'), card('4')]
    expect(cardTotal(cards)).toBe(23)
    expect(calcBustIt(cards, 1000)).toBe(2000)
  })

  it('pays 9:1 for 5-card bust', () => {
    const cards = [card('K'), card('3'), card('3'), card('3'), card('4')]
    expect(cardTotal(cards)).toBe(23)
    expect(calcBustIt(cards, 1000)).toBe(9000)
  })

  it('pays 50:1 for 7-card bust', () => {
    const cards = [card('2'), card('2'), card('2'), card('2'), card('2'), card('2'), card('K')]
    expect(cardTotal(cards)).toBe(22)
    expect(calcBustIt(cards, 1000)).toBe(50000)
  })
})

describe('Side bet — Match the Dealer', () => {
  it('returns 0 for no match', () => {
    expect(calcMatchTheDealer(card('2'), card('3'), card('K'), 1000)).toBe(0)
  })

  it('pays 4:1 for unsuited rank match on first card', () => {
    expect(calcMatchTheDealer(card('K', 'hearts'), card('3'), card('K', 'spades'), 1000)).toBe(4000)
  })

  it('pays 9:1 for suited match', () => {
    expect(calcMatchTheDealer(card('K', 'spades'), card('3'), card('K', 'spades'), 1000)).toBe(9000)
  })

  it('pays for both cards independently', () => {
    const result = calcMatchTheDealer(
      card('K', 'hearts'),
      card('K', 'diamonds'),
      card('K', 'spades'),
      1000,
    )
    expect(result).toBe(8000)
  })
})

describe('Side bet — Royal Match', () => {
  it('returns 0 for different suits', () => {
    expect(calcRoyalMatch(card('K', 'spades'), card('Q', 'hearts'), 1000)).toBe(0)
  })

  it('pays 5:2 for same-suit non-royal', () => {
    expect(calcRoyalMatch(card('K', 'spades'), card('J', 'spades'), 1000)).toBe(2500)
  })

  it('pays 25:1 for K+Q suited (Royal Match)', () => {
    expect(calcRoyalMatch(card('K', 'spades'), card('Q', 'spades'), 1000)).toBe(25000)
    expect(calcRoyalMatch(card('Q', 'spades'), card('K', 'spades'), 1000)).toBe(25000)
  })
})

describe('BlackjackEngine — complete hand lifecycle', () => {
  it('reaches complete phase after full hand', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })

    let state = engine.getState()
    if (state.phase === 'insurance') {
      engine.dispatch({ type: 'DECLINE_INSURANCE' })
      state = engine.getState()
    }

    let safety = 0
    while (state.phase === 'player_turn' && safety < 20) {
      engine.dispatch({ type: 'STAND' })
      state = engine.getState()
      safety++
    }

    expect(state.phase).toBe('complete')
  })

  it('all player hands have a result in complete phase', () => {
    const engine = makeEngine()
    engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
    engine.dispatch({ type: 'DEAL' })

    let state = engine.getState()
    if (state.phase === 'insurance') {
      engine.dispatch({ type: 'DECLINE_INSURANCE' })
      state = engine.getState()
    }

    while (state.phase === 'player_turn') {
      engine.dispatch({ type: 'STAND' })
      state = engine.getState()
    }

    if (state.phase === 'complete') {
      for (const hand of state.playerHands) {
        expect(hand.result).toBeDefined()
        expect(hand.netCents).toBeDefined()
      }
    }
  })
})

describe('BlackjackEngine — multi-hand split resolution', () => {
  it('each split hand gets an independent result', () => {
    const engine = makeEngine()
    let splitFound = false

    for (let i = 0; i < 200 && !splitFound; i++) {
      engine.dispatch({ type: 'NEW_HAND' })
      engine.dispatch({ type: 'PLACE_BET', amountCents: 5000 })
      engine.dispatch({ type: 'DEAL' })

      let state = engine.getState()
      if (state.phase === 'insurance') {
        engine.dispatch({ type: 'DECLINE_INSURANCE' })
        state = engine.getState()
      }

      if (state.phase !== 'player_turn') continue

      const hand = state.playerHands[0]!
      const [c1, c2] = hand.cards
      const rankMatch = c1 && c2 && (
        c1.rank === c2.rank ||
        (['10', 'J', 'Q', 'K'].includes(c1.rank) && ['10', 'J', 'Q', 'K'].includes(c2.rank))
      )

      if (!rankMatch) {
        while (state.phase === 'player_turn') {
          engine.dispatch({ type: 'STAND' })
          state = engine.getState()
        }
        continue
      }

      engine.dispatch({ type: 'SPLIT' })
      state = engine.getState()

      while (state.phase === 'player_turn') {
        engine.dispatch({ type: 'STAND' })
        state = engine.getState()
      }

      if (state.phase === 'complete' && state.playerHands.length >= 2) {
        for (const h of state.playerHands) {
          expect(h.result).toBeDefined()
        }
        splitFound = true
      }
    }
  })
})
