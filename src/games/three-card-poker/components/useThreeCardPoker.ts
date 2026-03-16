import { useRef, useState, useCallback } from 'react'
import { ThreeCardPokerEngine } from '../engine'
import { useProfileStore } from '../../../store/profileStore'
import { useStatsStore } from '../../../store/statsStore'
import { evaluate, compareResults } from '../../../lib/handEvaluator'
import type { ThreeCardPokerState, ThreeCardPokerCommand, GamePhase } from '../types'

export type ValidAction = 'place_bet' | 'deal' | 'play' | 'fold' | 'new_hand'

function deriveNetCents(state: ThreeCardPokerState): number {
  let net = 0

  if (state.result === null) {
    net = -state.ante
  } else {
    const playerResult = state.result
    const dealerResult = evaluate(state.dealerCards, '3-card')
    const cmp = compareResults(playerResult, dealerResult)

    if (!state.dealerQualifies) {
      net += state.ante
    } else if (cmp > 0) {
      net += state.ante + state.play
    } else if (cmp === 0) {
      net += 0
    } else {
      net -= state.ante + state.play
    }

    net += state.anteBonus
  }

  if (state.sideBetResults?.pairPlus !== null && state.sideBetResults?.pairPlus !== undefined) {
    net += state.sideBetResults.pairPlus
  }
  if (state.sideBetResults?.sixCardBonus !== null && state.sideBetResults?.sixCardBonus !== undefined) {
    net += state.sideBetResults.sixCardBonus
  }

  return net
}

function deriveValidActions(phase: GamePhase): Set<ValidAction> {
  switch (phase) {
    case 'idle':
    case 'betting':
      return new Set(['place_bet', 'deal'])
    case 'player_decision':
      return new Set(['play', 'fold'])
    case 'complete':
      return new Set(['new_hand'])
    default:
      return new Set()
  }
}

export function useThreeCardPoker() {
  const engineRef = useRef<ThreeCardPokerEngine>(new ThreeCardPokerEngine())
  const [state, setState] = useState<ThreeCardPokerState>(() => engineRef.current.getState())

  const { activeProfile, subtractFromBankroll, addToBankroll } = useProfileStore()
  const { recordHandResult } = useStatsStore()

  const dispatch = useCallback((command: ThreeCardPokerCommand) => {
    const profile = activeProfile()
    const engine = engineRef.current
    const prevState = engine.getState()

    if (command.type === 'DEAL') {
      const totalDeduct = prevState.ante + prevState.pairPlus + prevState.sixCardBonus
      if (profile && profile.sessionStakeCents >= totalDeduct) {
        subtractFromBankroll(totalDeduct)
      }
    }

    if (command.type === 'PLAY') {
      const playBet = prevState.ante
      if (profile && profile.sessionStakeCents >= playBet) {
        subtractFromBankroll(playBet)
      }
    }

    const result = engine.dispatch(command)
    setState({ ...result.state })

    if (result.state.phase === 'complete' && prevState.phase !== 'complete') {
      const netCents = deriveNetCents(result.state)
      const totalWagered = result.state.ante
        + result.state.play
        + result.state.pairPlus
        + result.state.sixCardBonus
      const returnAmount = totalWagered + netCents

      if (profile) {
        if (returnAmount > 0) {
          addToBankroll(returnAmount)
        }

        const won = netCents > 0
        recordHandResult(profile.id, 'three-card-poker', won, netCents)
      }
    }

    return result
  }, [activeProfile, subtractFromBankroll, addToBankroll, recordHandResult])

  const placeBet = useCallback((bet: 'ante' | 'pairPlus' | 'sixCardBonus', amount: number) => {
    return dispatch({ type: 'PLACE_BET', bet, amount })
  }, [dispatch])

  const deal = useCallback(() => {
    return dispatch({ type: 'DEAL' })
  }, [dispatch])

  const play = useCallback(() => {
    return dispatch({ type: 'PLAY' })
  }, [dispatch])

  const fold = useCallback(() => {
    return dispatch({ type: 'FOLD' })
  }, [dispatch])

  const newHand = useCallback(() => {
    return dispatch({ type: 'NEW_HAND' })
  }, [dispatch])

  const resetEngine = useCallback(() => {
    engineRef.current = new ThreeCardPokerEngine()
    setState(engineRef.current.getState())
  }, [])

  const validActions = deriveValidActions(state.phase)

  return { state, dispatch, placeBet, deal, play, fold, newHand, validActions, resetEngine }
}
