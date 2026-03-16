import { useRef, useState, useCallback } from 'react'
import { UTHEngine } from '../engine'
import { useProfileStore } from '../../../store/profileStore'
import { useStatsStore } from '../../../store/statsStore'
import type { UTHState, UTHCommand, GamePhase } from '../types'

export type ValidAction =
  | 'place_ante'
  | 'place_trips'
  | 'deal'
  | 'bet_4x'
  | 'bet_3x'
  | 'check'
  | 'bet_2x'
  | 'bet_1x'
  | 'fold'
  | 'new_hand'

function deriveValidActions(
  phase: GamePhase,
  checkedPreflop: boolean,
  checkedFlop: boolean,
  play: number,
): Set<ValidAction> {
  switch (phase) {
    case 'idle':
    case 'betting':
      return new Set(['place_ante', 'place_trips', 'deal'])
    case 'preflop':
      return new Set(['bet_4x', 'bet_3x', 'check'])
    case 'flop':
      if (play > 0) return new Set()
      return new Set(['bet_2x', 'check'])
    case 'river':
      if (play > 0) return new Set()
      if (checkedPreflop && checkedFlop) return new Set(['bet_1x', 'fold'])
      return new Set()
    case 'complete':
      return new Set(['new_hand'])
    default:
      return new Set()
  }
}

function deriveNetCents(state: UTHState): number {
  if (state.result === null) {
    return -(state.ante + state.blind + state.play)
  }

  let net = 0

  if (state.result === 'win') {
    net += state.ante + state.play
    const blindNet = state.blindResult === 'win'
      ? (state.tripsResult?.payout ?? 0) > 0
        ? state.blind
        : state.blind
      : 0
    if (state.blindResult === 'win') {
      net += state.blind
    } else if (state.blindResult === 'push') {
      net += 0
    } else {
      net -= state.blind
    }
  } else if (state.result === 'push') {
    net += 0
    if (state.blindResult === 'win') {
      net += state.blind
    } else if (state.blindResult === 'push') {
      net += 0
    } else {
      net -= state.blind
    }
  } else {
    net -= state.ante + state.blind + state.play
  }

  if (state.tripsResult) {
    net += state.tripsResult.payout
  } else if (state.trips > 0) {
    net -= state.trips
  }

  return net
}

export function useUTH() {
  const engineRef = useRef<UTHEngine>(new UTHEngine())
  const [state, setState] = useState<UTHState>(() => engineRef.current.getState())

  const { activeProfile, subtractFromBankroll, addToBankroll } = useProfileStore()
  const { recordHandResult } = useStatsStore()

  const dispatch = useCallback((command: UTHCommand) => {
    const profile = activeProfile()
    const engine = engineRef.current
    const prevState = engine.getState()

    if (command.type === 'DEAL') {
      const total = prevState.ante + prevState.blind + prevState.trips
      if (profile && profile.sessionStakeCents >= total) {
        subtractFromBankroll(total)
      }
    }

    if (command.type === 'BET') {
      const betAmount = command.multiplier * prevState.ante
      if (profile && profile.sessionStakeCents >= betAmount) {
        subtractFromBankroll(betAmount)
      }
    }

    if (command.type === 'BET_2X') {
      const betAmount = 2 * prevState.ante
      if (profile && profile.sessionStakeCents >= betAmount) {
        subtractFromBankroll(betAmount)
      }
    }

    if (command.type === 'BET_1X') {
      const betAmount = prevState.ante
      if (profile && profile.sessionStakeCents >= betAmount) {
        subtractFromBankroll(betAmount)
      }
    }

    const result = engine.dispatch(command)
    setState({ ...result.state })

    if (result.state.phase === 'complete' && prevState.phase !== 'complete') {
      const netCents = deriveNetCents(result.state)
      const totalWagered = result.state.ante
        + result.state.blind
        + result.state.play
        + result.state.trips
      const returnAmount = totalWagered + netCents

      if (profile) {
        if (returnAmount > 0) {
          addToBankroll(returnAmount)
        }

        const won = netCents > 0
        recordHandResult(profile.id, 'ultimate-texas-holdem', won, netCents)
      }
    }

    return result
  }, [activeProfile, subtractFromBankroll, addToBankroll, recordHandResult])

  const placeAnte = useCallback((amount: number) => {
    return dispatch({ type: 'PLACE_ANTE', amount })
  }, [dispatch])

  const placeTrips = useCallback((amount: number) => {
    return dispatch({ type: 'PLACE_TRIPS', amount })
  }, [dispatch])

  const deal = useCallback(() => {
    return dispatch({ type: 'DEAL' })
  }, [dispatch])

  const bet = useCallback((multiplier: 3 | 4) => {
    return dispatch({ type: 'BET', multiplier })
  }, [dispatch])

  const check = useCallback(() => {
    return dispatch({ type: 'CHECK' })
  }, [dispatch])

  const bet2x = useCallback(() => {
    return dispatch({ type: 'BET_2X' })
  }, [dispatch])

  const bet1x = useCallback(() => {
    return dispatch({ type: 'BET_1X' })
  }, [dispatch])

  const fold = useCallback(() => {
    return dispatch({ type: 'FOLD' })
  }, [dispatch])

  const newHand = useCallback(() => {
    return dispatch({ type: 'NEW_HAND' })
  }, [dispatch])

  const resetEngine = useCallback(() => {
    engineRef.current = new UTHEngine()
    setState(engineRef.current.getState())
  }, [])

  const validActions = deriveValidActions(
    state.phase,
    state.checkedPreflop,
    state.checkedFlop,
    state.play,
  )

  return {
    state,
    dispatch,
    placeAnte,
    placeTrips,
    deal,
    bet,
    check,
    bet2x,
    bet1x,
    fold,
    newHand,
    validActions,
    resetEngine,
  }
}
