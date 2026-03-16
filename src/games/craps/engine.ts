import type { RNG } from '../../lib/rng'

export type CrapsPhase = 'come-out' | 'point'

export type ComeBet = { amount: number }

export type CrapsState = {
  phase: CrapsPhase
  point: number | null
  passLineBet: number
  comeBets: Map<number, ComeBet>
  lastRoll: [number, number] | null
  seed: number
}

export type CrapsCommand =
  | { type: 'PLACE_PASS'; amount: number }
  | { type: 'ROLL' }

export type CrapsEvent =
  | { type: 'ROLLED'; dice: [number, number]; total: number }
  | { type: 'POINT_ESTABLISHED'; point: number }
  | { type: 'POINT_HIT'; point: number; payout: number }
  | { type: 'SEVEN_OUT'; point: number }
  | { type: 'NATURAL_WIN'; total: number; payout: number }
  | { type: 'CRAPS_LOSS'; total: number }

export type DispatchResult = {
  state: CrapsState
  events: CrapsEvent[]
  error?: string
}

export class CrapsEngine {
  private state: CrapsState
  private rng: RNG

  constructor(rng: RNG) {
    this.rng = rng
    this.state = {
      phase: 'come-out',
      point: null,
      passLineBet: 0,
      comeBets: new Map(),
      lastRoll: null,
      seed: rng.seed,
    }
  }

  getState(): CrapsState {
    return { ...this.state, comeBets: new Map(this.state.comeBets) }
  }

  dispatch(cmd: CrapsCommand): DispatchResult {
    const events: CrapsEvent[] = []
    try {
      if (cmd.type === 'PLACE_PASS') {
        if (this.state.phase !== 'come-out') return { state: this.getState(), events, error: 'Pass line only on come-out' }
        this.state = { ...this.state, passLineBet: this.state.passLineBet + cmd.amount }
      } else if (cmd.type === 'ROLL') {
        const d1 = Math.floor(this.rng.next() * 6) + 1
        const d2 = Math.floor(this.rng.next() * 6) + 1
        const total = d1 + d2
        this.state = { ...this.state, lastRoll: [d1, d2] }
        events.push({ type: 'ROLLED', dice: [d1, d2], total })

        if (this.state.phase === 'come-out') {
          if (total === 7 || total === 11) {
            const payout = this.state.passLineBet
            events.push({ type: 'NATURAL_WIN', total, payout })
            this.state = { ...this.state, passLineBet: 0 }
          } else if (total === 2 || total === 3 || total === 12) {
            events.push({ type: 'CRAPS_LOSS', total })
            this.state = { ...this.state, passLineBet: 0 }
          } else {
            this.state = { ...this.state, phase: 'point', point: total }
            events.push({ type: 'POINT_ESTABLISHED', point: total })
          }
        } else {
          if (total === this.state.point) {
            const payout = this.state.passLineBet
            events.push({ type: 'POINT_HIT', point: this.state.point!, payout })
            this.state = { ...this.state, phase: 'come-out', point: null, passLineBet: 0 }
          } else if (total === 7) {
            events.push({ type: 'SEVEN_OUT', point: this.state.point! })
            this.state = { ...this.state, phase: 'come-out', point: null, passLineBet: 0 }
          }
        }
      }
    } catch (e) {
      return { state: this.getState(), events, error: String(e) }
    }
    return { state: this.getState(), events }
  }
}
