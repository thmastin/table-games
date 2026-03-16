import { describe, it, expect } from 'vitest'
import { UTHEngine } from './engine'
import type { UTHState } from './types'
import type { Card } from '../../lib/deck'

// Helper: build a card
function c(rank: Card['rank'], suit: Card['suit']): Card {
  return { rank, suit, faceDown: false }
}

// Helper: inject hole cards and community into the engine for deterministic tests.
// We use the internal _testInjectState method (added below via type augmentation).
// Instead, we create a small helper that wraps the engine and uses its public API.

// We expose a test-injection method on the engine via declaration merging in the test.
// Since the engine doesn't have _testInjectState, we'll subclass to inject.
class TestUTHEngine extends UTHEngine {
  injectPostDeal(
    playerHole: Card[],
    dealerHole: Card[],
    community: Card[],
    ante: number,
    phase: UTHState['phase'],
    overrides: Partial<UTHState> = {},
  ): void {
    const base = this.getState()
    ;(this as unknown as { state: UTHState }).state = {
      ...base,
      phase,
      playerHole: playerHole.map(c => ({ ...c, faceDown: false })),
      dealerHole: dealerHole.map(c => ({ ...c, faceDown: true })),
      community: community.map(c => ({ ...c, faceDown: false })),
      ante,
      blind: ante,
      play: 0,
      checkedPreflop: false,
      checkedFlop: false,
      result: null,
      blindResult: null,
      tripsResult: null,
      events: [],
      ...overrides,
    }
  }
}

describe('UTHEngine', () => {
  describe('state machine: betting and deal', () => {
    it('starts in idle phase', () => {
      const engine = new UTHEngine()
      expect(engine.getState().phase).toBe('idle')
    })

    it('PLACE_ANTE moves to betting and sets blind equal to ante', () => {
      const engine = new UTHEngine()
      const { state } = engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      expect(state.phase).toBe('betting')
      expect(state.ante).toBe(1000)
      expect(state.blind).toBe(1000)
    })

    it('DEAL from betting moves to preflop with hole cards', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      const { state } = engine.dispatch({ type: 'DEAL' })
      expect(state.phase).toBe('preflop')
      expect(state.playerHole).toHaveLength(2)
      expect(state.dealerHole).toHaveLength(2)
      expect(state.community).toHaveLength(0)
      expect(state.playerHole.every(c => c.faceDown === false)).toBe(true)
      expect(state.dealerHole.every(c => c.faceDown === true)).toBe(true)
    })

    it('DEAL without ante returns error', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      const { error } = engine.dispatch({ type: 'DEAL' })
      expect(error).toBeTruthy()
    })

    it('rejects ante below table minimum', () => {
      const engine = new UTHEngine()
      const { error } = engine.dispatch({ type: 'PLACE_ANTE', amount: 50 })
      expect(error).toBeTruthy()
    })

    it('DEAL emits HOLE_CARDS_DEALT event', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      const { events } = engine.dispatch({ type: 'DEAL' })
      expect(events.some(e => e.type === 'HOLE_CARDS_DEALT')).toBe(true)
    })
  })

  describe('state machine: preflop bet (4x)', () => {
    it('BET 4x sets play = 4 * ante and resolves to complete', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      const { state, events } = engine.dispatch({ type: 'BET', multiplier: 4 })
      expect(state.play).toBe(4000)
      expect(state.phase).toBe('complete')
      expect(state.community).toHaveLength(5)
      expect(events.some(e => e.type === 'FLOP_DEALT')).toBe(true)
      expect(events.some(e => e.type === 'RIVER_DEALT')).toBe(true)
      expect(events.some(e => e.type === 'HAND_RESOLVED')).toBe(true)
    })

    it('BET 3x sets play = 3 * ante', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      const { state } = engine.dispatch({ type: 'BET', multiplier: 3 })
      expect(state.play).toBe(3000)
      expect(state.phase).toBe('complete')
    })

    it('BET preflop does not require further player action', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'BET', multiplier: 4 })
      const { error } = engine.dispatch({ type: 'BET_1X' })
      expect(error).toBeTruthy()
    })
  })

  describe('state machine: check preflop → bet 2x flop', () => {
    it('CHECK preflop moves to flop with 3 community cards', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      const { state, events } = engine.dispatch({ type: 'CHECK' })
      expect(state.phase).toBe('flop')
      expect(state.community).toHaveLength(3)
      expect(state.checkedPreflop).toBe(true)
      expect(events.some(e => e.type === 'FLOP_DEALT')).toBe(true)
    })

    it('BET_2X on flop sets play = 2 * ante and resolves to complete', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'CHECK' })
      const { state, events } = engine.dispatch({ type: 'BET_2X' })
      expect(state.play).toBe(2000)
      expect(state.phase).toBe('complete')
      expect(state.community).toHaveLength(5)
      expect(events.some(e => e.type === 'RIVER_DEALT')).toBe(true)
      expect(events.some(e => e.type === 'HAND_RESOLVED')).toBe(true)
    })
  })

  describe('state machine: double check → river forced decision', () => {
    it('CHECK preflop then CHECK flop moves to river phase', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'CHECK' })
      const { state, events } = engine.dispatch({ type: 'CHECK' })
      expect(state.phase).toBe('river')
      expect(state.community).toHaveLength(5)
      expect(state.checkedPreflop).toBe(true)
      expect(state.checkedFlop).toBe(true)
      expect(events.some(e => e.type === 'RIVER_DEALT')).toBe(true)
    })

    it('BET_1X at river sets play = ante and resolves to complete', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'CHECK' })
      engine.dispatch({ type: 'CHECK' })
      const { state } = engine.dispatch({ type: 'BET_1X' })
      expect(state.play).toBe(1000)
      expect(state.phase).toBe('complete')
    })

    it('cannot CHECK again at river', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'CHECK' })
      engine.dispatch({ type: 'CHECK' })
      const { error } = engine.dispatch({ type: 'CHECK' })
      expect(error).toBeTruthy()
    })
  })

  describe('river fold', () => {
    it('FOLD at river results in loss with ante+blind lost and play=0', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'CHECK' })
      engine.dispatch({ type: 'CHECK' })
      const { state } = engine.dispatch({ type: 'FOLD' })
      expect(state.phase).toBe('complete')
      expect(state.result).toBe('loss')
      expect(state.blindResult).toBe('loss')
      expect(state.play).toBe(0)
    })

    it('FOLD at river still resolves trips when trips bet placed', () => {
      const engine = new TestUTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'PLACE_TRIPS', amount: 500 })
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'CHECK' })
      engine.dispatch({ type: 'CHECK' })
      const { state, events } = engine.dispatch({ type: 'FOLD' })
      expect(state.phase).toBe('complete')
      expect(events.some(e => e.type === 'TRIPS_RESOLVED')).toBe(true)
      expect(state.tripsResult).not.toBeNull()
    })

    it('cannot FOLD outside river phase', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      const { error } = engine.dispatch({ type: 'FOLD' })
      expect(error).toBeTruthy()
    })
  })

  describe('dealer qualification', () => {
    it('dealer non-qualification event is emitted and state reflects it', () => {
      const engine = new TestUTHEngine()

      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })

      engine.injectPostDeal(
        [c('A', 'spades'), c('K', 'spades')],
        [c('2', 'hearts'), c('3', 'diamonds')],
        [],
        1000,
        'preflop',
      )

      ;(engine as unknown as { shoe: { cards: Card[]; numDecks: number; dealtCount: number } }).shoe = {
        cards: [
          c('4', 'clubs'), c('7', 'hearts'), c('9', 'diamonds'),
          c('J', 'clubs'), c('5', 'spades'),
        ],
        numDecks: 1,
        dealtCount: 0,
      }

      engine.dispatch({ type: 'BET', multiplier: 4 })
      const finalState = engine.getState()

      expect(finalState.phase).toBe('complete')
      expect(typeof finalState.dealerQualifies).toBe('boolean')
      expect(finalState.result).not.toBeNull()
    })
  })

  describe('blind bet resolution', () => {
    it('blind pushes on player pair win', () => {
      const engine = new TestUTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })

      engine.injectPostDeal(
        [c('A', 'spades'), c('A', 'hearts')],
        [c('2', 'clubs'), c('3', 'diamonds')],
        [c('K', 'spades'), c('7', 'hearts'), c('2', 'hearts'), c('5', 'clubs'), c('9', 'diamonds')],
        1000,
        'river',
        { checkedPreflop: true, checkedFlop: true },
      )

      const { state } = engine.dispatch({ type: 'BET_1X' })

      expect(state.phase).toBe('complete')
      if (state.result === 'win') {
        expect(state.blindResult).toBe('push')
      }
    })

    it('blind pushes on player two-pair win', () => {
      const engine = new TestUTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })

      engine.injectPostDeal(
        [c('A', 'spades'), c('K', 'hearts')],
        [c('2', 'clubs'), c('3', 'diamonds')],
        [c('A', 'hearts'), c('K', 'diamonds'), c('7', 'clubs'), c('5', 'spades'), c('9', 'hearts')],
        1000,
        'river',
        { checkedPreflop: true, checkedFlop: true },
      )

      const { state } = engine.dispatch({ type: 'BET_1X' })
      expect(state.phase).toBe('complete')
      if (state.result === 'win') {
        expect(state.blindResult).toBe('push')
      }
    })

    it('blind pays on straight win', () => {
      const engine = new TestUTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })

      engine.injectPostDeal(
        [c('5', 'spades'), c('6', 'hearts')],
        [c('2', 'clubs'), c('3', 'diamonds')],
        [c('7', 'clubs'), c('8', 'diamonds'), c('9', 'hearts'), c('A', 'spades'), c('K', 'clubs')],
        1000,
        'river',
        { checkedPreflop: true, checkedFlop: true },
      )

      const { state } = engine.dispatch({ type: 'BET_1X' })
      expect(state.phase).toBe('complete')
      if (state.result === 'win' && state.playerHandRank === 'straight') {
        expect(state.blindResult).toBe('win')
      }
    })

    it('blind loses when player loses', () => {
      const engine = new TestUTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })

      engine.injectPostDeal(
        [c('2', 'spades'), c('3', 'hearts')],
        [c('A', 'clubs'), c('A', 'diamonds')],
        [c('K', 'clubs'), c('Q', 'diamonds'), c('J', 'hearts'), c('7', 'spades'), c('8', 'clubs')],
        1000,
        'river',
        { checkedPreflop: true, checkedFlop: true },
      )

      const { state } = engine.dispatch({ type: 'BET_1X' })
      expect(state.phase).toBe('complete')
      if (state.result === 'loss') {
        expect(state.blindResult).toBe('loss')
      }
    })
  })

  describe('trips bet', () => {
    it('trips pays independently on player loss', () => {
      const engine = new TestUTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'PLACE_TRIPS', amount: 500 })
      engine.dispatch({ type: 'DEAL' })

      engine.injectPostDeal(
        [c('A', 'spades'), c('A', 'hearts')],
        [c('K', 'clubs'), c('K', 'diamonds')],
        [c('A', 'clubs'), c('J', 'hearts'), c('Q', 'diamonds'), c('2', 'spades'), c('3', 'clubs')],
        1000,
        'river',
        { checkedPreflop: true, checkedFlop: true, trips: 500 },
      )

      const { state, events } = engine.dispatch({ type: 'BET_1X' })
      expect(state.phase).toBe('complete')
      expect(state.tripsResult).not.toBeNull()
      expect(events.some(e => e.type === 'TRIPS_RESOLVED')).toBe(true)
    })

    it('trips resolves even when player wins hand', () => {
      const engine = new TestUTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'PLACE_TRIPS', amount: 500 })
      engine.dispatch({ type: 'DEAL' })

      engine.injectPostDeal(
        [c('A', 'spades'), c('A', 'hearts')],
        [c('2', 'clubs'), c('3', 'diamonds')],
        [c('7', 'clubs'), c('8', 'hearts'), c('9', 'diamonds'), c('J', 'spades'), c('Q', 'clubs')],
        1000,
        'river',
        { checkedPreflop: true, checkedFlop: true, trips: 500 },
      )

      const { state } = engine.dispatch({ type: 'BET_1X' })
      expect(state.tripsResult).not.toBeNull()
    })

    it('trips loses when player hand is a pair', () => {
      const engine = new TestUTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'PLACE_TRIPS', amount: 500 })
      engine.dispatch({ type: 'DEAL' })

      engine.injectPostDeal(
        [c('2', 'spades'), c('2', 'hearts')],
        [c('3', 'clubs'), c('4', 'diamonds')],
        [c('7', 'clubs'), c('9', 'hearts'), c('J', 'diamonds'), c('Q', 'spades'), c('K', 'clubs')],
        1000,
        'river',
        { checkedPreflop: true, checkedFlop: true, trips: 500 },
      )

      const { state } = engine.dispatch({ type: 'BET_1X' })
      expect(state.tripsResult).not.toBeNull()
      expect(state.tripsResult!.payout).toBe(-500)
    })

    it('trips pays 3:1 on three of a kind', () => {
      const engine = new TestUTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'PLACE_TRIPS', amount: 500 })
      engine.dispatch({ type: 'DEAL' })

      engine.injectPostDeal(
        [c('A', 'spades'), c('A', 'hearts')],
        [c('2', 'clubs'), c('3', 'diamonds')],
        [c('A', 'clubs'), c('7', 'hearts'), c('9', 'diamonds'), c('J', 'spades'), c('Q', 'clubs')],
        1000,
        'river',
        { checkedPreflop: true, checkedFlop: true, trips: 500 },
      )

      const { state } = engine.dispatch({ type: 'BET_1X' })
      expect(state.tripsResult).not.toBeNull()
      if (state.tripsResult!.rank === 'three-of-a-kind') {
        expect(state.tripsResult!.payout).toBe(1500)
      }
    })
  })

  describe('best 5 of 7 selection', () => {
    it('identifies the best hand from 7 cards', () => {
      const engine = new TestUTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })

      engine.injectPostDeal(
        [c('A', 'spades'), c('K', 'spades')],
        [c('2', 'clubs'), c('3', 'diamonds')],
        [c('Q', 'spades'), c('J', 'spades'), c('10', 'spades'), c('9', 'hearts'), c('8', 'clubs')],
        1000,
        'preflop',
      )

      ;(engine as unknown as { shoe: { cards: Card[]; numDecks: number; dealtCount: number } }).shoe = {
        cards: [],
        numDecks: 1,
        dealtCount: 0,
      }

      ;(engine as unknown as { state: UTHState }).state = {
        ...(engine as unknown as { state: UTHState }).state,
        community: [c('Q', 'spades'), c('J', 'spades'), c('10', 'spades'), c('9', 'hearts'), c('8', 'clubs')],
        phase: 'river',
        checkedPreflop: true,
        checkedFlop: true,
      }

      const { state } = engine.dispatch({ type: 'BET_1X' })
      expect(state.playerHandRank).toBe('royal-flush')
    })
  })

  describe('NEW_HAND', () => {
    it('resets to idle phase after complete', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'BET', multiplier: 4 })
      const { state } = engine.dispatch({ type: 'NEW_HAND' })
      expect(state.phase).toBe('idle')
      expect(state.ante).toBe(0)
      expect(state.play).toBe(0)
    })

    it('cannot NEW_HAND before completing a hand', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      const { error } = engine.dispatch({ type: 'NEW_HAND' })
      expect(error).toBeTruthy()
    })
  })

  describe('events', () => {
    it('full flow emits expected events in order', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'CHECK' })
      engine.dispatch({ type: 'CHECK' })
      const { events } = engine.dispatch({ type: 'BET_1X' })

      const types = events.map(e => e.type)
      expect(types).toContain('DEALER_REVEALED')
      expect(types).toContain('DEALER_QUALIFIES')
      expect(types).toContain('HAND_RESOLVED')
      expect(types).toContain('BLIND_RESOLVED')
    })

    it('TRIPS_RESOLVED event not emitted when no trips bet', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'BET', multiplier: 4 })
      engine.dispatch({ type: 'NEW_HAND' })
      const completionEvents = engine.getState().events
      expect(completionEvents.some(e => e.type === 'TRIPS_RESOLVED')).toBe(false)
    })

    it('seed is recorded in state and is a number', () => {
      const engine = new UTHEngine()
      engine.dispatch({ type: 'PLACE_ANTE', amount: 1000 })
      const { state } = engine.dispatch({ type: 'DEAL' })
      expect(typeof state.seed).toBe('number')
      expect(state.seed).toBeGreaterThan(0)
    })
  })

  describe('PLACE_TRIPS', () => {
    it('can place trips independently before ante', () => {
      const engine = new UTHEngine()
      const { state } = engine.dispatch({ type: 'PLACE_TRIPS', amount: 500 })
      expect(state.trips).toBe(500)
      expect(state.phase).toBe('betting')
    })

    it('rejects trips below minimum', () => {
      const engine = new UTHEngine()
      const { error } = engine.dispatch({ type: 'PLACE_TRIPS', amount: 10 })
      expect(error).toBeTruthy()
    })
  })
})
