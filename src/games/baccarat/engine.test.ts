import { describe, it, expect } from 'vitest'
import { BaccaratEngine } from './engine'
import { makeCard } from '../../lib/deck'
import type { Card } from '../../lib/deck'

// ---------------------------------------------------------------------------
// Helpers to build deterministic scenarios
// ---------------------------------------------------------------------------

function cardValue(card: Card): number {
  if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 0
  if (card.rank === 'A') return 1
  return parseInt(card.rank, 10)
}

function handTotal(cards: Card[]): number {
  return cards.reduce((s, c) => s + cardValue(c), 0) % 10
}

// Inject a pre-specified sequence of cards into the engine by monkey-patching
// the internal shoe. We read the state, replace the shoe's cards with our own
// sequence at position 0, and reset dealtCount so our cards come out first.
function injectCards(engine: BaccaratEngine, sequence: Card[]): void {
  // Access private shoe via the dispatch trick — we cast to any for test setup only.
  const eng = engine as unknown as { shoe: { cards: Card[]; numDecks: number; dealtCount: number } }
  const existing = eng.shoe
  // Place our sequence at the front, rest of shoe follows
  eng.shoe = {
    ...existing,
    cards: [...sequence, ...existing.cards.slice(sequence.length)],
    dealtCount: 0,
  }
}

function standardEngine(): BaccaratEngine {
  return new BaccaratEngine({ variant: 'standard', tableLimits: { min: 100, max: 100000 } })
}

function ezEngine(): BaccaratEngine {
  return new BaccaratEngine({ variant: 'ez', tableLimits: { min: 100, max: 100000 } })
}

// ---------------------------------------------------------------------------
// Deal order: P1, B1, P2, B2, [P3], [B3]
// Construct card sequences for specific scenarios
// ---------------------------------------------------------------------------

// Natural 8 scenario: Player gets 6+2=8, Banker gets 3+4=7 (player natural wins)
function natural8Sequence(): Card[] {
  return [
    makeCard('6', 'hearts'),   // P1
    makeCard('3', 'clubs'),    // B1
    makeCard('2', 'diamonds'), // P2
    makeCard('4', 'spades'),   // B2
    // No third cards should be drawn
    makeCard('K', 'hearts'),   // would be P3 — must NOT be drawn
    makeCard('K', 'clubs'),    // would be B3 — must NOT be drawn
  ]
}

// Natural 9 scenario: Player 5+4=9, Banker 2+3=5
function natural9Sequence(): Card[] {
  return [
    makeCard('5', 'hearts'),
    makeCard('2', 'clubs'),
    makeCard('4', 'diamonds'),
    makeCard('3', 'spades'),
    makeCard('K', 'hearts'),
    makeCard('K', 'clubs'),
  ]
}

// Player stands (total 6), banker draws (total 5 → draws when player stood)
// Player: 3+3=6 (stands), Banker: 2+3=5 (draws because player stood and banker <=5)
function playerStandsBankerDrawsSequence(): Card[] {
  return [
    makeCard('3', 'hearts'),  // P1 = 3
    makeCard('2', 'clubs'),   // B1 = 2
    makeCard('3', 'diamonds'),// P2 = 3  → player total 6 (stands)
    makeCard('3', 'spades'),  // B2 = 3  → banker total 5 (draws, player stood)
    makeCard('5', 'hearts'),  // B3 = 5  → banker total 10 mod 10 = 0 → banker loses
    makeCard('K', 'clubs'),   // unused
  ]
}

// Player stands (total 7), banker stands (total 6 or 7)
function playerStandsBankerStandsSequence(): Card[] {
  return [
    makeCard('4', 'hearts'),  // P1 = 4
    makeCard('4', 'clubs'),   // B1 = 4
    makeCard('3', 'diamonds'),// P2 = 3  → player total 7 (stands)
    makeCard('2', 'spades'),  // B2 = 2  → banker total 6 (stands: player stood, banker 6-7 stand)
    makeCard('K', 'hearts'),  // unused
    makeCard('K', 'clubs'),   // unused
  ]
}

// Player draws (total 4), banker total 3 with player third card = 8 → banker stands
// Banker rule: banker 3 stands on player third card value 8
function bankerTotal3PlayerThird8Sequence(): Card[] {
  return [
    makeCard('2', 'hearts'),  // P1 = 2
    makeCard('2', 'clubs'),   // B1 = 2
    makeCard('2', 'diamonds'),// P2 = 2  → player total 4 (draws)
    makeCard('A', 'spades'),  // B2 = 1  → banker total 3
    makeCard('8', 'hearts'),  // P3 = 8  → banker 3 STANDS on player 3rd = 8
    makeCard('K', 'clubs'),   // would be B3 — must NOT be drawn
  ]
}

// Banker total 3 draws on player third card = 7 (not 8)
function bankerTotal3PlayerThird7Sequence(): Card[] {
  return [
    makeCard('2', 'hearts'),  // P1 = 2
    makeCard('2', 'clubs'),   // B1 = 2
    makeCard('2', 'diamonds'),// P2 = 2  → player total 4 (draws)
    makeCard('A', 'spades'),  // B2 = 1  → banker total 3
    makeCard('7', 'hearts'),  // P3 = 7  → banker 3 DRAWS on player 3rd = 7
    makeCard('2', 'clubs'),   // B3 = 2  → banker total 5
  ]
}

// Banker total 6 draws only on player third 6 or 7
function bankerTotal6PlayerThird6Sequence(): Card[] {
  return [
    makeCard('3', 'hearts'),  // P1 = 3
    makeCard('4', 'clubs'),   // B1 = 4
    makeCard('2', 'diamonds'),// P2 = 2  → player total 5 (draws)
    makeCard('2', 'spades'),  // B2 = 2  → banker total 6
    makeCard('6', 'hearts'),  // P3 = 6  → banker 6 DRAWS on player 3rd = 6
    makeCard('A', 'clubs'),   // B3 = 1  → banker total 7
  ]
}

// Banker total 6 does NOT draw on player third = 5
function bankerTotal6PlayerThird5Sequence(): Card[] {
  return [
    makeCard('3', 'hearts'),  // P1 = 3
    makeCard('4', 'clubs'),   // B1 = 4
    makeCard('2', 'diamonds'),// P2 = 2  → player total 5 (draws)
    makeCard('2', 'spades'),  // B2 = 2  → banker total 6
    makeCard('5', 'hearts'),  // P3 = 5  → banker 6 STANDS on player 3rd = 5
    makeCard('K', 'clubs'),   // would be B3 — must NOT be drawn
  ]
}

// EZ Dragon Hand: banker wins with 3-card total 7
// Player: 2+3=5 (draws), Banker: 3+3=6 draws (banker 6 draws on player 3rd=6... let's use different values)
// Better: Player: A+2=3 (draws), Player3=5 → player total 8 (natural? No: 3+5=8 is total 8... that IS natural!)
// Careful: natural check happens before drawing. We need player total after 2 cards to NOT be natural.
// Player: 2+3=5 (draws 3rd), Banker: 4+2=6, banker draws on player 3rd... need player 3rd = 6 or 7
// Player: 2+3=5 draws, Player3=6 → player total 1, Banker: 4+2=6 draws (banker6, player3rd=6) → Banker3=A → banker total 7 (3 cards = Dragon Hand)
function dragonHandSequence(): Card[] {
  return [
    makeCard('2', 'hearts'),  // P1 = 2
    makeCard('4', 'clubs'),   // B1 = 4
    makeCard('3', 'diamonds'),// P2 = 3  → player total 5 (draws)
    makeCard('2', 'spades'),  // B2 = 2  → banker total 6
    makeCard('6', 'hearts'),  // P3 = 6  → player total 11 mod 10 = 1 (banker 6 draws on player 3rd=6)
    makeCard('A', 'clubs'),   // B3 = 1  → banker total 7 (3 cards) = Dragon Hand!
  ]
}

// EZ: 2-card Banker total 7 — NOT a Dragon Hand
// Player: A+3=4 (draws), Banker: 3+4=7 (2 cards, stands — 7 always stands)
// Player draws P3=2 → player total 6. Banker 7 beats Player 6. No Dragon Hand (only 2 banker cards).
function twoCardBankerTotal7Sequence(): Card[] {
  return [
    makeCard('A', 'hearts'),  // P1 = 1
    makeCard('3', 'clubs'),   // B1 = 3
    makeCard('3', 'diamonds'),// P2 = 3  → player total 4 (draws)
    makeCard('4', 'spades'),  // B2 = 4  → banker total 7 (stands — 7 always stands)
    makeCard('2', 'hearts'),  // P3 = 2  → player total 6
    makeCard('K', 'clubs'),   // unused
  ]
}

// Tie scenario: Player 6, Banker 6 — no third cards
function tieSequence(): Card[] {
  return [
    makeCard('3', 'hearts'),  // P1 = 3
    makeCard('3', 'clubs'),   // B1 = 3
    makeCard('3', 'diamonds'),// P2 = 3  → player total 6 (stands)
    makeCard('3', 'spades'),  // B2 = 3  → banker total 6 (stands)
    makeCard('K', 'hearts'),  // unused
    makeCard('K', 'clubs'),   // unused
  ]
}

// Banker wins for commission test: Banker natural 8 beats Player natural-free hand
// Player: 3+3=6 (stands), Banker: 5+3=8 (natural 8) → banker wins
function bankerWinsSequence(): Card[] {
  return [
    makeCard('3', 'hearts'),  // P1 = 3
    makeCard('5', 'clubs'),   // B1 = 5
    makeCard('3', 'diamonds'),// P2 = 3  → player total 6 (stands)
    makeCard('3', 'spades'),  // B2 = 3  → banker total 8 (natural — no third cards)
    makeCard('K', 'hearts'),  // unused
    makeCard('K', 'clubs'),   // unused
  ]
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BaccaratEngine — Natural hands', () => {
  it('Natural 8: no third cards drawn', () => {
    const engine = standardEngine()
    injectCards(engine, natural8Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.playerCards).toHaveLength(2)
    expect(state.bankerCards).toHaveLength(2)
    expect(state.isNatural).toBe(true)
    expect(handTotal(state.playerCards)).toBe(8)
    expect(state.result).toBe('player')
    expect(state.phase).toBe('complete')
  })

  it('Natural 8: events include NATURAL for player side', () => {
    const engine = standardEngine()
    injectCards(engine, natural8Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const { events } = engine.dispatch({ type: 'DEAL' })

    const naturalEvt = events.find(e => e.type === 'NATURAL')
    expect(naturalEvt).toBeDefined()
    if (naturalEvt?.type === 'NATURAL') {
      expect(naturalEvt.side).toBe('player')
      expect(naturalEvt.total).toBe(8)
    }
  })

  it('Natural 9: no third cards drawn', () => {
    const engine = standardEngine()
    injectCards(engine, natural9Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.playerCards).toHaveLength(2)
    expect(state.bankerCards).toHaveLength(2)
    expect(state.isNatural).toBe(true)
    expect(handTotal(state.playerCards)).toBe(9)
    expect(state.result).toBe('player')
  })
})

describe('BaccaratEngine — Player stands, banker drawing rules (no player draw)', () => {
  it('Player stands (6), banker draws on total 5 when player stood', () => {
    const engine = standardEngine()
    injectCards(engine, playerStandsBankerDrawsSequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(handTotal(state.playerCards.slice(0, 2))).toBe(6)
    expect(state.playerCards).toHaveLength(2)
    expect(state.bankerCards).toHaveLength(3)
  })

  it('Player stands (7), banker stands (6) — no draws', () => {
    const engine = standardEngine()
    injectCards(engine, playerStandsBankerStandsSequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.playerCards).toHaveLength(2)
    expect(state.bankerCards).toHaveLength(2)
    expect(handTotal(state.playerCards)).toBe(7)
    expect(handTotal(state.bankerCards)).toBe(6)
  })
})

describe('BaccaratEngine — Banker drawing rules (player draws third card)', () => {
  it('Banker total 3, player third card = 8: banker stands', () => {
    const engine = standardEngine()
    injectCards(engine, bankerTotal3PlayerThird8Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.playerCards).toHaveLength(3)
    expect(cardValue(state.playerCards[2]!)).toBe(8)
    expect(state.bankerCards).toHaveLength(2)
  })

  it('Banker total 3, player third card = 7: banker draws', () => {
    const engine = standardEngine()
    injectCards(engine, bankerTotal3PlayerThird7Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.playerCards).toHaveLength(3)
    expect(cardValue(state.playerCards[2]!)).toBe(7)
    expect(state.bankerCards).toHaveLength(3)
  })

  it('Banker total 6, player third card = 6: banker draws', () => {
    const engine = standardEngine()
    injectCards(engine, bankerTotal6PlayerThird6Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.playerCards).toHaveLength(3)
    expect(state.bankerCards).toHaveLength(3)
  })

  it('Banker total 6, player third card = 5: banker stands', () => {
    const engine = standardEngine()
    injectCards(engine, bankerTotal6PlayerThird5Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.playerCards).toHaveLength(3)
    expect(cardValue(state.playerCards[2]!)).toBe(5)
    expect(state.bankerCards).toHaveLength(2)
  })
})

describe('BaccaratEngine — Dragon Hand (EZ variant)', () => {
  it('Dragon Hand triggers on 3-card banker total 7 when banker wins (EZ)', () => {
    const engine = ezEngine()
    injectCards(engine, dragonHandSequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'banker', amount: 10000 })
    const { state, events } = engine.dispatch({ type: 'DEAL' })

    expect(state.bankerCards).toHaveLength(3)
    expect(handTotal(state.bankerCards)).toBe(7)
    expect(state.isDragonHand).toBe(true)
    expect(events.some(e => e.type === 'DRAGON_HAND')).toBe(true)
  })

  it('Dragon Hand: banker bet pushes (net 0) on Dragon Hand', () => {
    const engine = ezEngine()
    injectCards(engine, dragonHandSequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'banker', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.bankerBetResult).toBe(0)
  })

  it('Dragon Hand does NOT trigger on 2-card banker total 7 (EZ)', () => {
    const engine = ezEngine()
    injectCards(engine, twoCardBankerTotal7Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'banker', amount: 10000 })
    const { state, events } = engine.dispatch({ type: 'DEAL' })

    expect(state.bankerCards).toHaveLength(2)
    expect(handTotal(state.bankerCards)).toBe(7)
    expect(state.isDragonHand).toBe(false)
    expect(events.some(e => e.type === 'DRAGON_HAND')).toBe(false)
  })

  it('2-card banker total 7 pays normally in EZ (1:1, no commission)', () => {
    const engine = ezEngine()
    injectCards(engine, twoCardBankerTotal7Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'banker', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.bankerBetResult).toBe(10000)
  })
})

describe('BaccaratEngine — Commission / No-Commission payouts', () => {
  it('Standard: banker win pays 0.95:1 (5% commission on $100 bet → net $95)', () => {
    const engine = standardEngine()
    injectCards(engine, bankerWinsSequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'banker', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.result).toBe('banker')
    expect(state.bankerBetResult).toBe(9500)
  })

  it('EZ: banker win (non-Dragon) pays 1:1', () => {
    const engine = ezEngine()
    injectCards(engine, bankerWinsSequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'banker', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.result).toBe('banker')
    expect(state.isDragonHand).toBe(false)
    expect(state.bankerBetResult).toBe(10000)
  })

  it('Player win pays 1:1', () => {
    const engine = standardEngine()
    injectCards(engine, natural8Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.result).toBe('player')
    expect(state.playerBetResult).toBe(10000)
  })
})

describe('BaccaratEngine — Tie', () => {
  it('Tie: player and banker bets push (net 0), tie bet pays 8:1', () => {
    const engine = standardEngine()
    injectCards(engine, tieSequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    engine.dispatch({ type: 'PLACE_BET', bet: 'banker', amount: 10000 })
    engine.dispatch({ type: 'PLACE_BET', bet: 'tie', amount: 5000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.result).toBe('tie')
    expect(state.playerBetResult).toBe(0)
    expect(state.bankerBetResult).toBe(0)
    expect(state.tieBetResult).toBe(40000)
  })

  it('Tie: losing tie bet loses its amount', () => {
    const engine = standardEngine()
    injectCards(engine, natural8Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'tie', amount: 5000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.result).toBe('player')
    expect(state.tieBetResult).toBe(-5000)
  })
})

describe('BaccaratEngine — Dragon Bonus side bet', () => {
  it('Dragon Bonus natural win (your side wins with natural): pays 1:1', () => {
    const engine = standardEngine()
    injectCards(engine, natural8Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    engine.dispatch({ type: 'PLACE_DRAGON_BONUS', side: 'player', amount: 5000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.result).toBe('player')
    expect(state.isNatural).toBe(true)
    expect(state.dragonBonusResult).toBe(5000)
  })

  it('Dragon Bonus: non-natural win by 4 points pays 1:1', () => {
    // Need player to win by exactly 4 non-naturally
    // Player: 4+3=7, Banker: 4+A=5 → player wins by 2 (not enough, need 4)
    // Player: 5+2=7 stands, Banker: 2+A=3 draws, B3=9 → banker total 12%10=2. Player 7 - Banker 2 = 5 points
    // Adjusted: Player 6, Banker 2 → diff = 4
    // Player: 3+3=6 stands, Banker: 2+0(K)=2 draws (banker 2 always draws)
    // B3 = K(0) → banker total 2 still. Player 6 - Banker 2 = 4. Win by 4 → pays 1:1
    // Player stands (6). Banker total 2, player stood → banker draws (<=5 when player stood)
    // Banker draws B3. But where is B3 in sequence? When player STANDS, deal order is P1,B1,P2,B2,B3.
    // So correct sequence: P1, B1, P2, B2, B3
    const seq2 = [
      makeCard('3', 'hearts'),  // P1=3
      makeCard('2', 'clubs'),   // B1=2
      makeCard('3', 'diamonds'),// P2=3  → player 6 (stands)
      makeCard('K', 'spades'),  // B2=0  → banker 2 (draws)
      makeCard('K', 'clubs'),   // B3=0  → banker total 2 (3 cards but total=2, not dragon hand)
    ]
    const engine = standardEngine()
    injectCards(engine, seq2)
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    engine.dispatch({ type: 'PLACE_DRAGON_BONUS', side: 'player', amount: 5000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    const margin = state.playerTotal - state.bankerTotal
    expect(state.result).toBe('player')
    expect(state.isNatural).toBe(false)
    expect(margin).toBe(4)
    expect(state.dragonBonusResult).toBe(5000)
  })

  it('Dragon Bonus: non-natural win by 1-3 points pushes (net 0)', () => {
    // Player 5, Banker 4 → win by 1 → push on dragon bonus
    // Player: 2+3=5 (draws), Player3= ... actually 5 draws.
    // Need player to stand: player 6 or 7 with non-natural.
    // Player: 3+4=7 (stands), Banker: 2+2=4 (draws), B3=K(0) → banker=4 → player wins by 3
    const seq = [
      makeCard('3', 'hearts'),  // P1=3
      makeCard('2', 'clubs'),   // B1=2
      makeCard('4', 'diamonds'),// P2=4  → player 7 (stands)
      makeCard('2', 'spades'),  // B2=2  → banker 4 (draws when player stood <=5)
      makeCard('K', 'clubs'),   // B3=0  → banker 4 still
    ]
    const engine = standardEngine()
    injectCards(engine, seq)
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    engine.dispatch({ type: 'PLACE_DRAGON_BONUS', side: 'player', amount: 5000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.result).toBe('player')
    expect(state.isNatural).toBe(false)
    const margin = state.playerTotal - state.bankerTotal
    expect(margin).toBe(3)
    expect(state.dragonBonusResult).toBe(0)
  })

  it('Dragon Bonus: your side loses → lose the bet', () => {
    const engine = standardEngine()
    injectCards(engine, bankerWinsSequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    engine.dispatch({ type: 'PLACE_DRAGON_BONUS', side: 'player', amount: 5000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.result).toBe('banker')
    expect(state.dragonBonusResult).toBe(-5000)
  })
})

describe('BaccaratEngine — Panda 8 (EZ only)', () => {
  it('Panda 8 pays 25:1 when player has 3-card total of 8', () => {
    // Player: 3+2=5 (draws 3rd), Player3=3 → player total 8 (3 cards)
    // Banker: 4+3=7 (stands always)
    const seq = [
      makeCard('3', 'hearts'),  // P1=3
      makeCard('4', 'clubs'),   // B1=4
      makeCard('2', 'diamonds'),// P2=2  → player 5 (draws)
      makeCard('3', 'spades'),  // B2=3  → banker 7 (stands)
      makeCard('3', 'hearts'),  // P3=3  → player total 8 (3 cards, Panda 8!)
    ]
    const engine = ezEngine()
    injectCards(engine, seq)
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    engine.dispatch({ type: 'PLACE_PANDA_8', amount: 5000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.playerCards).toHaveLength(3)
    expect(state.playerTotal).toBe(8)
    expect(state.panda8Result).toBe(125000)
  })

  it('Panda 8 loses on player 2-card total 8 (natural)', () => {
    const engine = ezEngine()
    injectCards(engine, natural8Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    engine.dispatch({ type: 'PLACE_PANDA_8', amount: 5000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.playerCards).toHaveLength(2)
    expect(state.panda8Result).toBe(-5000)
  })

  it('Panda 8 loses when player 3-card total is not 8', () => {
    const engine = ezEngine()
    injectCards(engine, bankerTotal3PlayerThird7Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    engine.dispatch({ type: 'PLACE_PANDA_8', amount: 5000 })
    const { state } = engine.dispatch({ type: 'DEAL' })

    expect(state.playerCards).toHaveLength(3)
    expect(state.playerTotal).not.toBe(8)
    expect(state.panda8Result).toBe(-5000)
  })

  it('Panda 8 is rejected in standard variant', () => {
    const engine = standardEngine()
    const result = engine.dispatch({ type: 'PLACE_PANDA_8', amount: 5000 })
    expect(result.error).toBeDefined()
  })
})

describe('BaccaratEngine — Full hand flow', () => {
  it('PLACE_BET → DEAL → NEW_HAND resets to betting phase', () => {
    const engine = standardEngine()
    injectCards(engine, natural8Sequence())

    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const dealResult = engine.dispatch({ type: 'DEAL' })
    expect(dealResult.state.phase).toBe('complete')

    const newHandResult = engine.dispatch({ type: 'NEW_HAND' })
    expect(newHandResult.state.phase).toBe('betting')
    expect(newHandResult.state.playerCards).toHaveLength(0)
    expect(newHandResult.state.bankerCards).toHaveLength(0)
    expect(newHandResult.state.result).toBeNull()
    expect(newHandResult.state.playerBet).toBe(0)
    expect(newHandResult.state.bankerBet).toBe(0)
    expect(newHandResult.state.tieBet).toBe(0)
  })

  it('DEAL without bet returns error', () => {
    const engine = standardEngine()
    const result = engine.dispatch({ type: 'DEAL' })
    expect(result.error).toBeDefined()
  })

  it('PLACE_BET during dealing phase returns error', () => {
    const engine = standardEngine()
    injectCards(engine, natural8Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    engine.dispatch({ type: 'DEAL' })
    const result = engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 5000 })
    expect(result.error).toBeDefined()
  })

  it('RESULT event is emitted with correct winner', () => {
    const engine = standardEngine()
    injectCards(engine, natural8Sequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    const { events } = engine.dispatch({ type: 'DEAL' })

    const resultEvt = events.find(e => e.type === 'RESULT')
    expect(resultEvt).toBeDefined()
    if (resultEvt?.type === 'RESULT') {
      expect(resultEvt.winner).toBe('player')
    }
  })

  it('PAYOUT events are emitted for each placed bet', () => {
    const engine = standardEngine()
    injectCards(engine, tieSequence())
    engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 10000 })
    engine.dispatch({ type: 'PLACE_BET', bet: 'tie', amount: 5000 })
    const { events } = engine.dispatch({ type: 'DEAL' })

    const payoutEvents = events.filter(e => e.type === 'PAYOUT')
    expect(payoutEvents.length).toBeGreaterThanOrEqual(2)
  })
})

describe('BaccaratEngine — Bet validation', () => {
  it('Bet below table minimum returns error', () => {
    const engine = new BaccaratEngine({
      variant: 'standard',
      tableLimits: { min: 2500, max: 100000 },
    })
    const result = engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 100 })
    expect(result.error).toBeDefined()
  })

  it('Bet above table maximum returns error', () => {
    const engine = new BaccaratEngine({
      variant: 'standard',
      tableLimits: { min: 2500, max: 100000 },
    })
    const result = engine.dispatch({ type: 'PLACE_BET', bet: 'player', amount: 200000 })
    expect(result.error).toBeDefined()
  })
})
