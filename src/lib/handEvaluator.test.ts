import { describe, it, expect } from 'vitest'
import { evaluate, compareResults } from './handEvaluator'
import type { Card, Rank, Suit } from './deck'

function c(rank: Rank, suit: Suit): Card {
  return { rank, suit, faceDown: false }
}

describe('5-card mode', () => {
  it('identifies royal flush', () => {
    const hand = [c('A', 'spades'), c('K', 'spades'), c('Q', 'spades'), c('J', 'spades'), c('10', 'spades')]
    expect(evaluate(hand, '5-card').rank).toBe('royal-flush')
  })

  it('identifies straight flush', () => {
    const hand = [c('9', 'hearts'), c('8', 'hearts'), c('7', 'hearts'), c('6', 'hearts'), c('5', 'hearts')]
    expect(evaluate(hand, '5-card').rank).toBe('straight-flush')
  })

  it('identifies four of a kind', () => {
    const hand = [c('K', 'spades'), c('K', 'hearts'), c('K', 'diamonds'), c('K', 'clubs'), c('3', 'spades')]
    expect(evaluate(hand, '5-card').rank).toBe('four-of-a-kind')
  })

  it('identifies full house', () => {
    const hand = [c('Q', 'spades'), c('Q', 'hearts'), c('Q', 'clubs'), c('J', 'hearts'), c('J', 'diamonds')]
    expect(evaluate(hand, '5-card').rank).toBe('full-house')
  })

  it('identifies flush', () => {
    const hand = [c('A', 'clubs'), c('10', 'clubs'), c('7', 'clubs'), c('5', 'clubs'), c('2', 'clubs')]
    expect(evaluate(hand, '5-card').rank).toBe('flush')
  })

  it('identifies straight', () => {
    const hand = [c('9', 'spades'), c('8', 'hearts'), c('7', 'clubs'), c('6', 'diamonds'), c('5', 'spades')]
    expect(evaluate(hand, '5-card').rank).toBe('straight')
  })

  it('identifies A-2-3-4-5 wheel straight', () => {
    const hand = [c('A', 'spades'), c('2', 'hearts'), c('3', 'clubs'), c('4', 'diamonds'), c('5', 'spades')]
    expect(evaluate(hand, '5-card').rank).toBe('straight')
  })

  it('identifies three of a kind', () => {
    const hand = [c('7', 'spades'), c('7', 'hearts'), c('7', 'clubs'), c('K', 'diamonds'), c('3', 'spades')]
    expect(evaluate(hand, '5-card').rank).toBe('three-of-a-kind')
  })

  it('identifies two pair', () => {
    const hand = [c('A', 'spades'), c('A', 'hearts'), c('K', 'clubs'), c('K', 'diamonds'), c('Q', 'spades')]
    expect(evaluate(hand, '5-card').rank).toBe('two-pair')
  })

  it('identifies pair', () => {
    const hand = [c('J', 'spades'), c('J', 'hearts'), c('9', 'clubs'), c('5', 'diamonds'), c('2', 'spades')]
    expect(evaluate(hand, '5-card').rank).toBe('pair')
  })

  it('identifies high card', () => {
    const hand = [c('A', 'spades'), c('K', 'hearts'), c('J', 'clubs'), c('8', 'diamonds'), c('3', 'spades')]
    expect(evaluate(hand, '5-card').rank).toBe('high-card')
  })

  it('straight flush beats four of a kind', () => {
    const sf = evaluate([c('9', 'hearts'), c('8', 'hearts'), c('7', 'hearts'), c('6', 'hearts'), c('5', 'hearts')], '5-card')
    const foak = evaluate([c('K', 'spades'), c('K', 'hearts'), c('K', 'diamonds'), c('K', 'clubs'), c('3', 'spades')], '5-card')
    expect(compareResults(sf, foak)).toBeGreaterThan(0)
  })

  it('higher pair beats lower pair', () => {
    const pairA = evaluate([c('A', 'spades'), c('A', 'hearts'), c('K', 'clubs'), c('Q', 'diamonds'), c('J', 'spades')], '5-card')
    const pairK = evaluate([c('K', 'spades'), c('K', 'hearts'), c('A', 'clubs'), c('Q', 'diamonds'), c('J', 'spades')], '5-card')
    expect(compareResults(pairA, pairK)).toBeGreaterThan(0)
  })

  it('flush beats straight', () => {
    const flush = evaluate([c('A', 'clubs'), c('10', 'clubs'), c('7', 'clubs'), c('5', 'clubs'), c('2', 'clubs')], '5-card')
    const straight = evaluate([c('9', 'spades'), c('8', 'hearts'), c('7', 'clubs'), c('6', 'diamonds'), c('5', 'spades')], '5-card')
    expect(compareResults(flush, straight)).toBeGreaterThan(0)
  })
})

describe('3-card mode (Three Card Poker)', () => {
  it('identifies royal flush (A-K-Q suited)', () => {
    const hand = [c('A', 'hearts'), c('K', 'hearts'), c('Q', 'hearts')]
    expect(evaluate(hand, '3-card').rank).toBe('royal-flush')
  })

  it('identifies straight flush', () => {
    const hand = [c('9', 'clubs'), c('8', 'clubs'), c('7', 'clubs')]
    expect(evaluate(hand, '3-card').rank).toBe('straight-flush')
  })

  it('identifies three of a kind', () => {
    const hand = [c('7', 'spades'), c('7', 'hearts'), c('7', 'clubs')]
    expect(evaluate(hand, '3-card').rank).toBe('three-of-a-kind')
  })

  it('identifies straight', () => {
    const hand = [c('9', 'spades'), c('8', 'hearts'), c('7', 'clubs')]
    expect(evaluate(hand, '3-card').rank).toBe('straight')
  })

  it('identifies flush', () => {
    const hand = [c('A', 'diamonds'), c('10', 'diamonds'), c('6', 'diamonds')]
    expect(evaluate(hand, '3-card').rank).toBe('flush')
  })

  it('identifies pair', () => {
    const hand = [c('J', 'spades'), c('J', 'hearts'), c('5', 'clubs')]
    expect(evaluate(hand, '3-card').rank).toBe('pair')
  })

  it('identifies high card', () => {
    const hand = [c('A', 'spades'), c('K', 'hearts'), c('J', 'clubs')]
    expect(evaluate(hand, '3-card').rank).toBe('high-card')
  })

  it('flush beats straight (TCP rule)', () => {
    const flush = evaluate([c('A', 'diamonds'), c('10', 'diamonds'), c('6', 'diamonds')], '3-card')
    const straight = evaluate([c('9', 'spades'), c('8', 'hearts'), c('7', 'clubs')], '3-card')
    expect(compareResults(flush, straight)).toBeGreaterThan(0)
  })

  it('straight beats flush is false in 3-card mode', () => {
    const flush = evaluate([c('A', 'diamonds'), c('10', 'diamonds'), c('6', 'diamonds')], '3-card')
    const straight = evaluate([c('9', 'spades'), c('8', 'hearts'), c('7', 'clubs')], '3-card')
    expect(compareResults(straight, flush)).toBeLessThan(0)
  })

  it('three of a kind beats straight', () => {
    const trips = evaluate([c('7', 'spades'), c('7', 'hearts'), c('7', 'clubs')], '3-card')
    const straight = evaluate([c('9', 'spades'), c('8', 'hearts'), c('7', 'clubs')], '3-card')
    expect(compareResults(trips, straight)).toBeGreaterThan(0)
  })

  it('A-2-3 is a valid straight in 3-card mode', () => {
    const hand = [c('A', 'spades'), c('2', 'hearts'), c('3', 'clubs')]
    expect(evaluate(hand, '3-card').rank).toBe('straight')
  })
})

describe('best-of-6 mode', () => {
  it('finds best 5-card hand from 6 cards', () => {
    const cards = [
      c('A', 'spades'), c('K', 'spades'), c('Q', 'spades'), c('J', 'spades'),
      c('10', 'spades'), c('2', 'hearts'),
    ]
    expect(evaluate(cards, 'best-of-6').rank).toBe('royal-flush')
  })

  it('picks flush over high card when flush is possible', () => {
    const cards = [
      c('A', 'clubs'), c('10', 'clubs'), c('7', 'clubs'), c('5', 'clubs'),
      c('2', 'clubs'), c('3', 'hearts'),
    ]
    expect(evaluate(cards, 'best-of-6').rank).toBe('flush')
  })

  it('picks straight over pair when straight is possible', () => {
    const cards = [
      c('9', 'spades'), c('8', 'hearts'), c('7', 'clubs'), c('6', 'diamonds'),
      c('5', 'spades'), c('5', 'hearts'),
    ]
    expect(evaluate(cards, 'best-of-6').rank).toBe('straight')
  })

  it('finds four of a kind from 6 cards', () => {
    const cards = [
      c('K', 'spades'), c('K', 'hearts'), c('K', 'diamonds'), c('K', 'clubs'),
      c('A', 'spades'), c('2', 'hearts'),
    ]
    expect(evaluate(cards, 'best-of-6').rank).toBe('four-of-a-kind')
  })

  it('finds full house over three of a kind when extra pair is available', () => {
    const cards = [
      c('Q', 'spades'), c('Q', 'hearts'), c('Q', 'clubs'),
      c('J', 'hearts'), c('J', 'diamonds'), c('2', 'spades'),
    ]
    expect(evaluate(cards, 'best-of-6').rank).toBe('full-house')
  })
})

describe('compareResults', () => {
  it('returns 0 for equal hands', () => {
    const h1 = evaluate([c('A', 'spades'), c('K', 'hearts'), c('J', 'clubs'), c('8', 'diamonds'), c('3', 'spades')], '5-card')
    const h2 = evaluate([c('A', 'hearts'), c('K', 'clubs'), c('J', 'diamonds'), c('8', 'spades'), c('3', 'hearts')], '5-card')
    expect(compareResults(h1, h2)).toBe(0)
  })

  it('higher full house beats lower full house', () => {
    const high = evaluate([c('A', 'spades'), c('A', 'hearts'), c('A', 'clubs'), c('K', 'hearts'), c('K', 'diamonds')], '5-card')
    const low = evaluate([c('2', 'spades'), c('2', 'hearts'), c('2', 'clubs'), c('3', 'hearts'), c('3', 'diamonds')], '5-card')
    expect(compareResults(high, low)).toBeGreaterThan(0)
  })
})
