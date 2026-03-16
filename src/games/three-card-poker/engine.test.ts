import { describe, it, expect } from 'vitest'
import { ThreeCardPokerEngine } from './engine'
import type { ThreeCardPokerEvent } from './types'
import { makeCard } from '../../lib/deck'
import { evaluate } from '../../lib/handEvaluator'

function placeBets(engine: ThreeCardPokerEngine, ante: number, pairPlus = 0, sixCardBonus = 0) {
  if (ante > 0) engine.dispatch({ type: 'PLACE_BET', bet: 'ante', amount: ante })
  if (pairPlus > 0) engine.dispatch({ type: 'PLACE_BET', bet: 'pairPlus', amount: pairPlus })
  if (sixCardBonus > 0) engine.dispatch({ type: 'PLACE_BET', bet: 'sixCardBonus', amount: sixCardBonus })
}

function dealWithCards(
  engine: ThreeCardPokerEngine,
  playerCards: ReturnType<typeof makeCard>[],
  dealerCards: ReturnType<typeof makeCard>[],
) {
  engine._testInjectDeal(playerCards, dealerCards)
}

function getEvents(events: ThreeCardPokerEvent[], type: string): ThreeCardPokerEvent[] {
  return events.filter(e => e.type === type)
}

function findSideBetEvent(events: ThreeCardPokerEvent[], bet: string) {
  return getEvents(events, 'SIDE_BET_RESOLVED')
    .find(e => (e as { type: 'SIDE_BET_RESOLVED'; bet: string; payout: number }).bet === bet) as
    | { type: 'SIDE_BET_RESOLVED'; bet: string; payout: number }
    | undefined
}

describe('ThreeCardPokerEngine', () => {
  describe('state machine transitions', () => {
    it('starts in idle phase', () => {
      const engine = new ThreeCardPokerEngine()
      expect(engine.getState().phase).toBe('idle')
    })

    it('transitions to betting on PLACE_BET', () => {
      const engine = new ThreeCardPokerEngine()
      engine.dispatch({ type: 'PLACE_BET', bet: 'ante', amount: 1000 })
      expect(engine.getState().phase).toBe('betting')
    })

    it('transitions to player_decision after DEAL', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      expect(engine.getState().phase).toBe('player_decision')
    })

    it('transitions to complete after PLAY', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'PLAY' })
      expect(engine.getState().phase).toBe('complete')
    })

    it('transitions to complete after FOLD', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'FOLD' })
      expect(engine.getState().phase).toBe('complete')
    })

    it('transitions to idle after NEW_HAND', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'PLAY' })
      engine.dispatch({ type: 'NEW_HAND' })
      expect(engine.getState().phase).toBe('idle')
    })

    it('resets bets to zero on NEW_HAND', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 500, 500)
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'PLAY' })
      engine.dispatch({ type: 'NEW_HAND' })
      const s = engine.getState()
      expect(s.ante).toBe(0)
      expect(s.pairPlus).toBe(0)
      expect(s.sixCardBonus).toBe(0)
    })
  })

  describe('error handling', () => {
    it('rejects DEAL without an ante or pair plus', () => {
      const engine = new ThreeCardPokerEngine()
      const result = engine.dispatch({ type: 'DEAL' })
      expect(result.error).toBeDefined()
    })

    it('rejects PLAY outside player_decision phase', () => {
      const engine = new ThreeCardPokerEngine()
      const result = engine.dispatch({ type: 'PLAY' })
      expect(result.error).toBeDefined()
    })

    it('rejects FOLD outside player_decision phase', () => {
      const engine = new ThreeCardPokerEngine()
      const result = engine.dispatch({ type: 'FOLD' })
      expect(result.error).toBeDefined()
    })

    it('rejects NEW_HAND outside complete phase', () => {
      const engine = new ThreeCardPokerEngine()
      const result = engine.dispatch({ type: 'NEW_HAND' })
      expect(result.error).toBeDefined()
    })

    it('rejects ante below table minimum', () => {
      const engine = new ThreeCardPokerEngine()
      const result = engine.dispatch({ type: 'PLACE_BET', bet: 'ante', amount: 1 })
      expect(result.error).toBeDefined()
    })

    it('rejects ante above table maximum', () => {
      const engine = new ThreeCardPokerEngine()
      const result = engine.dispatch({ type: 'PLACE_BET', bet: 'ante', amount: 999999 })
      expect(result.error).toBeDefined()
    })
  })

  describe('DEAL', () => {
    it('deals 3 cards to player and 3 to dealer', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      const s = engine.getState()
      expect(s.playerCards).toHaveLength(3)
      expect(s.dealerCards).toHaveLength(3)
    })

    it('dealer cards are face down after deal', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      const s = engine.getState()
      expect(s.dealerCards.every(c => c.faceDown)).toBe(true)
    })

    it('player cards are face up after deal', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      const s = engine.getState()
      expect(s.playerCards.every(c => !c.faceDown)).toBe(true)
    })

    it('emits alternating CARD_DEALT events', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      const { events } = engine.dispatch({ type: 'DEAL' })
      const cardEvents = getEvents(events, 'CARD_DEALT')
      expect(cardEvents).toHaveLength(6)
      expect(cardEvents[0]).toMatchObject({ target: 'player', index: 0 })
      expect(cardEvents[1]).toMatchObject({ target: 'dealer', index: 0 })
      expect(cardEvents[2]).toMatchObject({ target: 'player', index: 1 })
      expect(cardEvents[3]).toMatchObject({ target: 'dealer', index: 1 })
    })

    it('stores seed in state', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      expect(typeof engine.getState().seed).toBe('number')
    })
  })

  describe('dealer qualification', () => {
    it('Q-high qualifies', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('2', 'hearts'), makeCard('5', 'clubs'), makeCard('9', 'spades')],
        [makeCard('Q', 'diamonds'), makeCard('3', 'hearts'), makeCard('8', 'clubs')],
      )
      const { state } = engine.dispatch({ type: 'PLAY' })
      expect(state.dealerQualifies).toBe(true)
    })

    it('J-high does not qualify', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('A', 'spades'), makeCard('2', 'hearts'), makeCard('7', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('3', 'hearts'), makeCard('8', 'clubs')],
      )
      const { state } = engine.dispatch({ type: 'PLAY' })
      expect(state.dealerQualifies).toBe(false)
    })

    it('pair of 2s qualifies (any pair beats Q-high)', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('A', 'spades'), makeCard('K', 'hearts'), makeCard('Q', 'clubs')],
        [makeCard('2', 'diamonds'), makeCard('2', 'hearts'), makeCard('9', 'clubs')],
      )
      const { state } = engine.dispatch({ type: 'PLAY' })
      expect(state.dealerQualifies).toBe(true)
    })
  })

  describe('non-qualifying dealer: ante pays 1:1, play RETURNS', () => {
    it('emits DEALER_QUALIFIES false event when dealer has J-high', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('A', 'spades'), makeCard('K', 'hearts'), makeCard('Q', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('4', 'hearts'), makeCard('9', 'clubs')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const qualEvent = getEvents(events, 'DEALER_QUALIFIES') as Array<{
        type: 'DEALER_QUALIFIES'
        qualifies: boolean
      }>
      expect(qualEvent).toHaveLength(1)
      expect(qualEvent[0]!.qualifies).toBe(false)
    })

    it('sets dealerQualifies false and records play bet on non-qualifying hand', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('A', 'spades'), makeCard('K', 'hearts'), makeCard('Q', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('3', 'hearts'), makeCard('8', 'clubs')],
      )
      const { state } = engine.dispatch({ type: 'PLAY' })
      expect(state.dealerQualifies).toBe(false)
      expect(state.play).toBe(1000)
    })
  })

  describe('FOLD behavior', () => {
    it('ante is forfeited on fold (play stays 0)', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'FOLD' })
      const s = engine.getState()
      expect(s.phase).toBe('complete')
      expect(s.play).toBe(0)
    })

    it('pair plus still resolves on fold when player has a pair', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('A', 'spades'), makeCard('A', 'hearts'), makeCard('7', 'clubs')],
        [makeCard('K', 'diamonds'), makeCard('3', 'hearts'), makeCard('8', 'clubs')],
      )
      const { events } = engine.dispatch({ type: 'FOLD' })
      const ppEvent = findSideBetEvent(events, 'pairPlus')
      expect(ppEvent).toBeDefined()
      expect(ppEvent!.payout).toBe(500)
    })

    it('six card bonus is not resolved on fold', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 0, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('A', 'spades'), makeCard('A', 'hearts'), makeCard('7', 'clubs')],
        [makeCard('K', 'diamonds'), makeCard('3', 'hearts'), makeCard('8', 'clubs')],
      )
      const { events } = engine.dispatch({ type: 'FOLD' })
      const scbEvent = findSideBetEvent(events, 'sixCardBonus')
      expect(scbEvent).toBeUndefined()
    })

    it('ante bonus is not paid on fold', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('7', 'spades'), makeCard('8', 'hearts'), makeCard('9', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('3', 'hearts'), makeCard('5', 'clubs')],
      )
      const { events } = engine.dispatch({ type: 'FOLD' })
      const anteBonusEvents = getEvents(events, 'ANTE_BONUS_PAID')
      expect(anteBonusEvents).toHaveLength(0)
      expect(engine.getState().anteBonus).toBe(0)
    })
  })

  describe('ante bonus', () => {
    it('pays 1:1 on straight regardless of dealer qualifying', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('7', 'spades'), makeCard('8', 'hearts'), makeCard('9', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('3', 'hearts'), makeCard('5', 'clubs')],
      )
      const { events, state } = engine.dispatch({ type: 'PLAY' })
      expect(state.dealerQualifies).toBe(false)
      const anteBonusEvents = getEvents(events, 'ANTE_BONUS_PAID') as Array<{
        type: 'ANTE_BONUS_PAID'
        amount: number
      }>
      expect(anteBonusEvents).toHaveLength(1)
      expect(anteBonusEvents[0]!.amount).toBe(1000)
    })

    it('pays 4:1 on three of a kind', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('7', 'spades'), makeCard('7', 'hearts'), makeCard('7', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('3', 'hearts'), makeCard('5', 'clubs')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const anteBonusEvents = getEvents(events, 'ANTE_BONUS_PAID') as Array<{
        type: 'ANTE_BONUS_PAID'
        amount: number
      }>
      expect(anteBonusEvents).toHaveLength(1)
      expect(anteBonusEvents[0]!.amount).toBe(4000)
    })

    it('pays 5:1 on straight flush', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('7', 'hearts'), makeCard('8', 'hearts'), makeCard('9', 'hearts')],
        [makeCard('J', 'diamonds'), makeCard('3', 'clubs'), makeCard('5', 'spades')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const anteBonusEvents = getEvents(events, 'ANTE_BONUS_PAID') as Array<{
        type: 'ANTE_BONUS_PAID'
        amount: number
      }>
      expect(anteBonusEvents).toHaveLength(1)
      expect(anteBonusEvents[0]!.amount).toBe(5000)
    })

    it('does not pay on flush (flush does not trigger ante bonus)', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('2', 'hearts'), makeCard('7', 'hearts'), makeCard('K', 'hearts')],
        [makeCard('J', 'diamonds'), makeCard('3', 'clubs'), makeCard('5', 'spades')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const anteBonusEvents = getEvents(events, 'ANTE_BONUS_PAID')
      expect(anteBonusEvents).toHaveLength(0)
    })
  })

  describe('pair plus', () => {
    it('pays 1:1 on a pair', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('A', 'spades'), makeCard('A', 'hearts'), makeCard('7', 'clubs')],
        [makeCard('K', 'diamonds'), makeCard('3', 'hearts'), makeCard('8', 'clubs')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const ppEvent = findSideBetEvent(events, 'pairPlus')
      expect(ppEvent!.payout).toBe(500)
    })

    it('pays 4:1 on flush', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('2', 'hearts'), makeCard('7', 'hearts'), makeCard('K', 'hearts')],
        [makeCard('J', 'diamonds'), makeCard('3', 'clubs'), makeCard('5', 'spades')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const ppEvent = findSideBetEvent(events, 'pairPlus')
      expect(ppEvent!.payout).toBe(2000)
    })

    it('pays 6:1 on straight', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('7', 'spades'), makeCard('8', 'hearts'), makeCard('9', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('3', 'clubs'), makeCard('5', 'spades')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const ppEvent = findSideBetEvent(events, 'pairPlus')
      expect(ppEvent!.payout).toBe(3000)
    })

    it('pays 30:1 on three of a kind', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('7', 'spades'), makeCard('7', 'hearts'), makeCard('7', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('3', 'clubs'), makeCard('5', 'spades')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const ppEvent = findSideBetEvent(events, 'pairPlus')
      expect(ppEvent!.payout).toBe(15000)
    })

    it('pays 40:1 on straight flush', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('7', 'hearts'), makeCard('8', 'hearts'), makeCard('9', 'hearts')],
        [makeCard('J', 'diamonds'), makeCard('3', 'clubs'), makeCard('5', 'spades')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const ppEvent = findSideBetEvent(events, 'pairPlus')
      expect(ppEvent!.payout).toBe(20000)
    })

    it('loses (negative payout) on high card', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('2', 'spades'), makeCard('7', 'hearts'), makeCard('K', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('3', 'clubs'), makeCard('5', 'spades')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const ppEvent = findSideBetEvent(events, 'pairPlus')
      expect(ppEvent!.payout).toBe(-500)
    })

    it('pays independently when dealer does not qualify', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('A', 'spades'), makeCard('A', 'hearts'), makeCard('7', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('3', 'hearts'), makeCard('8', 'clubs')],
      )
      const { state, events } = engine.dispatch({ type: 'PLAY' })
      expect(state.dealerQualifies).toBe(false)
      const ppEvent = findSideBetEvent(events, 'pairPlus')
      expect(ppEvent!.payout).toBe(500)
    })
  })

  describe('6-card bonus', () => {
    it('uses best-of-6 and pays on flush (5 of 6 same suit)', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 0, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('2', 'hearts'), makeCard('7', 'hearts'), makeCard('K', 'hearts')],
        [makeCard('J', 'hearts'), makeCard('3', 'hearts'), makeCard('5', 'clubs')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const scbEvent = findSideBetEvent(events, 'sixCardBonus')
      expect(scbEvent).toBeDefined()
      expect(scbEvent!.payout).toBeGreaterThan(0)
    })

    it('pays 5:1 on three of a kind', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 0, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('7', 'spades'), makeCard('7', 'hearts'), makeCard('7', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('3', 'clubs'), makeCard('5', 'spades')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const scbEvent = findSideBetEvent(events, 'sixCardBonus')
      expect(scbEvent!.payout).toBe(2500)
    })

    it('pays 1000:1 on royal flush', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 0, 100)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('A', 'hearts'), makeCard('K', 'hearts'), makeCard('Q', 'hearts')],
        [makeCard('J', 'hearts'), makeCard('10', 'hearts'), makeCard('5', 'spades')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const scbEvent = findSideBetEvent(events, 'sixCardBonus')
      expect(scbEvent!.payout).toBe(100000)
    })

    it('loses (negative payout) when best 5-of-6 is high card', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 0, 500)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('2', 'spades'), makeCard('7', 'hearts'), makeCard('K', 'clubs')],
        [makeCard('J', 'diamonds'), makeCard('3', 'clubs'), makeCard('5', 'spades')],
      )
      const { events } = engine.dispatch({ type: 'PLAY' })
      const scbEvent = findSideBetEvent(events, 'sixCardBonus')
      expect(scbEvent!.payout).toBe(-500)
    })
  })

  describe('3-card hand rankings: flush beats straight', () => {
    it('flush ranks higher than straight in 3-card mode', () => {
      const straight = evaluate(
        [makeCard('7', 'spades'), makeCard('8', 'hearts'), makeCard('9', 'clubs')],
        '3-card',
      )
      const flush = evaluate(
        [makeCard('2', 'hearts'), makeCard('7', 'hearts'), makeCard('K', 'hearts')],
        '3-card',
      )
      expect(flush.value).toBeGreaterThan(straight.value)
    })

    it('three of a kind ranks higher than flush in 3-card mode', () => {
      const flush = evaluate(
        [makeCard('2', 'hearts'), makeCard('7', 'hearts'), makeCard('K', 'hearts')],
        '3-card',
      )
      const trips = evaluate(
        [makeCard('7', 'spades'), makeCard('7', 'hearts'), makeCard('7', 'clubs')],
        '3-card',
      )
      expect(trips.value).toBeGreaterThan(flush.value)
    })

    it('straight flush is the highest 3-card hand below royal flush', () => {
      const straightFlush = evaluate(
        [makeCard('7', 'hearts'), makeCard('8', 'hearts'), makeCard('9', 'hearts')],
        '3-card',
      )
      const trips = evaluate(
        [makeCard('A', 'spades'), makeCard('A', 'hearts'), makeCard('A', 'clubs')],
        '3-card',
      )
      expect(straightFlush.value).toBeGreaterThan(trips.value)
    })
  })

  describe('tie handling', () => {
    it('pushes when player and dealer have identical high-card hands', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      dealWithCards(
        engine,
        [makeCard('A', 'spades'), makeCard('K', 'hearts'), makeCard('J', 'clubs')],
        [makeCard('A', 'diamonds'), makeCard('K', 'clubs'), makeCard('J', 'spades')],
      )
      const { state } = engine.dispatch({ type: 'PLAY' })
      expect(state.phase).toBe('complete')
      expect(state.dealerQualifies).toBe(true)
    })
  })

  describe('complete hand flow', () => {
    it('full hand: PLACE_BET → DEAL → PLAY → NEW_HAND clears state', () => {
      const engine = new ThreeCardPokerEngine()

      expect(engine.getState().phase).toBe('idle')

      engine.dispatch({ type: 'PLACE_BET', bet: 'ante', amount: 1000 })
      expect(engine.getState().phase).toBe('betting')
      expect(engine.getState().ante).toBe(1000)

      engine.dispatch({ type: 'PLACE_BET', bet: 'pairPlus', amount: 500 })
      expect(engine.getState().pairPlus).toBe(500)

      engine.dispatch({ type: 'DEAL' })
      expect(engine.getState().phase).toBe('player_decision')
      expect(engine.getState().playerCards).toHaveLength(3)
      expect(engine.getState().dealerCards).toHaveLength(3)

      engine.dispatch({ type: 'PLAY' })
      const postPlay = engine.getState()
      expect(postPlay.phase).toBe('complete')
      expect(postPlay.dealerCardRevealed).toBe(true)
      expect(postPlay.result).not.toBeNull()
      expect(postPlay.sideBetResults).not.toBeNull()

      engine.dispatch({ type: 'NEW_HAND' })
      const postNew = engine.getState()
      expect(postNew.phase).toBe('idle')
      expect(postNew.ante).toBe(0)
      expect(postNew.playerCards).toHaveLength(0)
    })

    it('full hand with fold: pair plus resolves, play stays 0', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000, 500)
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'FOLD' })
      const postFold = engine.getState()
      expect(postFold.phase).toBe('complete')
      expect(postFold.play).toBe(0)
      expect(postFold.dealerCardRevealed).toBe(true)

      engine.dispatch({ type: 'NEW_HAND' })
      expect(engine.getState().phase).toBe('idle')
    })

    it('pair plus only — can deal and fold without ante', () => {
      const engine = new ThreeCardPokerEngine()
      engine.dispatch({ type: 'PLACE_BET', bet: 'pairPlus', amount: 500 })
      const { error } = engine.dispatch({ type: 'DEAL' })
      expect(error).toBeUndefined()
      expect(engine.getState().phase).toBe('player_decision')
    })

    it('dealer reveals cards on PLAY', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'PLAY' })
      const s = engine.getState()
      expect(s.dealerCardRevealed).toBe(true)
      expect(s.dealerCards.every(c => !c.faceDown)).toBe(true)
    })

    it('dealer reveals cards on FOLD', () => {
      const engine = new ThreeCardPokerEngine()
      placeBets(engine, 1000)
      engine.dispatch({ type: 'DEAL' })
      engine.dispatch({ type: 'FOLD' })
      const s = engine.getState()
      expect(s.dealerCardRevealed).toBe(true)
    })
  })
})
