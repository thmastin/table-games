import { describe, it, expect } from 'vitest'
import { CrapsEngine } from './engine'
import { createRNG } from '../../lib/rng'

function makeEngine(seed = 42) {
  return new CrapsEngine(createRNG(seed))
}

describe('CrapsEngine dispatch model', () => {
  it('initializes in come-out phase with no point', () => {
    const eng = makeEngine()
    const state = eng.getState()
    expect(state.phase).toBe('come-out')
    expect(state.point).toBeNull()
    expect(state.passLineBet).toBe(0)
  })

  it('accepts a pass line bet on come-out', () => {
    const eng = makeEngine()
    const { state, events, error } = eng.dispatch({ type: 'PLACE_PASS', amount: 1000 })
    expect(error).toBeUndefined()
    expect(events).toHaveLength(0)
    expect(state.passLineBet).toBe(1000)
  })

  it('rejects pass line bet when point is established', () => {
    const eng = makeEngine()
    eng.dispatch({ type: 'PLACE_PASS', amount: 1000 })
    let result = eng.dispatch({ type: 'ROLL' })
    while (result.state.phase === 'come-out') {
      eng.dispatch({ type: 'PLACE_PASS', amount: 1000 })
      result = eng.dispatch({ type: 'ROLL' })
    }
    const { error } = eng.dispatch({ type: 'PLACE_PASS', amount: 500 })
    expect(error).toBeDefined()
  })

  it('emits ROLLED event on every roll', () => {
    const eng = makeEngine()
    const { events } = eng.dispatch({ type: 'ROLL' })
    const rolled = events.find(e => e.type === 'ROLLED')
    expect(rolled).toBeDefined()
    if (rolled?.type === 'ROLLED') {
      expect(rolled.dice).toHaveLength(2)
      expect(rolled.total).toBe(rolled.dice[0] + rolled.dice[1])
    }
  })

  it('establishes a point on non-natural come-out', () => {
    const eng = makeEngine(100)
    eng.dispatch({ type: 'PLACE_PASS', amount: 1000 })
    let pointEstablished = false
    for (let i = 0; i < 20; i++) {
      const { events } = eng.dispatch({ type: 'ROLL' })
      if (events.some(e => e.type === 'POINT_ESTABLISHED')) {
        pointEstablished = true
        expect(eng.getState().phase).toBe('point')
        expect(eng.getState().point).not.toBeNull()
        break
      }
      if (eng.getState().phase === 'come-out') {
        eng.dispatch({ type: 'PLACE_PASS', amount: 1000 })
      }
    }
    expect(pointEstablished).toBe(true)
  })

  it('returns to come-out after point hit or seven-out', () => {
    const eng = makeEngine(42)
    eng.dispatch({ type: 'PLACE_PASS', amount: 1000 })
    let resolved = false
    for (let i = 0; i < 50 && !resolved; i++) {
      const { events } = eng.dispatch({ type: 'ROLL' })
      if (events.some(e => e.type === 'POINT_HIT' || e.type === 'SEVEN_OUT')) {
        resolved = true
        expect(eng.getState().phase).toBe('come-out')
        expect(eng.getState().point).toBeNull()
        expect(eng.getState().passLineBet).toBe(0)
      } else if (eng.getState().phase === 'come-out') {
        eng.dispatch({ type: 'PLACE_PASS', amount: 1000 })
      }
    }
    expect(resolved).toBe(true)
  })

  it('come bets map is accessible and starts empty', () => {
    const eng = makeEngine()
    expect(eng.getState().comeBets.size).toBe(0)
  })

  it('getState returns a copy — mutations do not affect engine state', () => {
    const eng = makeEngine()
    const s1 = eng.getState()
    s1.passLineBet = 99999
    expect(eng.getState().passLineBet).toBe(0)
  })
})
