import { useRef, useState, useCallback } from 'react'
import { BaccaratEngine } from '../engine'
import { useProfileStore } from '../../../store/profileStore'
import { useStatsStore } from '../../../store/statsStore'
import type { BaccaratState, BaccaratCommand, BaccaratConfig, DispatchResult } from '../types'
import type { Denomination } from '../../../lib/chips'

function totalBetCents(state: BaccaratState): number {
  return (
    state.playerBet +
    state.bankerBet +
    state.tieBet +
    state.dragonBonus.amount +
    state.panda8
  )
}

function totalReturnCents(state: BaccaratState): number {
  let total = 0

  const results = [
    { result: state.playerBetResult, original: state.playerBet },
    { result: state.bankerBetResult, original: state.bankerBet },
    { result: state.tieBetResult, original: state.tieBet },
    { result: state.dragonBonusResult, original: state.dragonBonus.amount },
    { result: state.panda8Result, original: state.panda8 },
  ]

  for (const { result, original } of results) {
    if (result === null) continue
    if (result > 0) {
      total += original + result
    } else if (result === 0) {
      total += original
    }
  }

  return total
}

function netCents(state: BaccaratState): number {
  const results = [
    state.playerBetResult,
    state.bankerBetResult,
    state.tieBetResult,
    state.dragonBonusResult,
    state.panda8Result,
  ]
  return results.reduce<number>((sum, r) => sum + (r ?? 0), 0)
}

export function useBaccarat(config?: Partial<BaccaratConfig>) {
  const engineRef = useRef<BaccaratEngine>(new BaccaratEngine(config))
  const [state, setState] = useState<BaccaratState>(() => engineRef.current.getState())
  const [activeDenom, setActiveDenom] = useState<Denomination>(25)

  const { activeProfile, subtractFromBankroll, addToBankroll } = useProfileStore()
  const { recordHandResult } = useStatsStore()

  const dispatch = useCallback((command: BaccaratCommand): DispatchResult => {
    const profile = activeProfile()
    const engine = engineRef.current
    const prevState = engine.getState()

    if (command.type === 'DEAL') {
      const total = totalBetCents(prevState)
      if (profile && profile.sessionStakeCents >= total) {
        subtractFromBankroll(total)
      }
    }

    const result = engine.dispatch(command)
    setState({ ...result.state })

    if (result.state.phase === 'complete' && prevState.phase !== 'complete') {
      if (profile) {
        const returnAmount = totalReturnCents(result.state)
        if (returnAmount > 0) {
          addToBankroll(returnAmount)
        }

        const net = netCents(result.state)
        const won = net > 0
        recordHandResult(profile.id, 'baccarat', won, net)
      }
    }

    return result
  }, [activeProfile, subtractFromBankroll, addToBankroll, recordHandResult])

  const placeBet = useCallback((bet: 'player' | 'banker' | 'tie', amount: number) => {
    dispatch({ type: 'PLACE_BET', bet, amount })
  }, [dispatch])

  const placeDragonBonus = useCallback((side: 'player' | 'banker', amount: number) => {
    dispatch({ type: 'PLACE_DRAGON_BONUS', side, amount })
  }, [dispatch])

  const placePanda8 = useCallback((amount: number) => {
    dispatch({ type: 'PLACE_PANDA_8', amount })
  }, [dispatch])

  const deal = useCallback(() => {
    dispatch({ type: 'DEAL' })
  }, [dispatch])

  const newHand = useCallback(() => {
    dispatch({ type: 'NEW_HAND' })
  }, [dispatch])

  const validActions = {
    canPlaceBets: state.phase === 'betting',
    canDeal: state.phase === 'betting' && (state.playerBet > 0 || state.bankerBet > 0 || state.tieBet > 0),
    canNewHand: state.phase === 'complete',
  }

  const resetEngine = useCallback(() => {
    engineRef.current = new BaccaratEngine(config)
    setState(engineRef.current.getState())
  }, [config])

  return {
    state,
    placeBet,
    placeDragonBonus,
    placePanda8,
    deal,
    newHand,
    validActions,
    activeDenom,
    setActiveDenom,
    resetEngine,
  }
}
