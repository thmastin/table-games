import { useRef, useState, useCallback } from 'react'
import { BlackjackEngine } from '../engine'
import { useProfileStore } from '../../../store/profileStore'
import { useStatsStore } from '../../../store/statsStore'
import type { BlackjackState, BlackjackCommand, BlackjackConfig, DispatchResult } from '../types'

export function useBlackjack(config?: Partial<BlackjackConfig>) {
  const engineRef = useRef<BlackjackEngine>(new BlackjackEngine(config))
  const [state, setState] = useState<BlackjackState>(() => engineRef.current.getState())

  const { activeProfile, subtractFromBankroll, addToBankroll } = useProfileStore()
  const { recordHandResult } = useStatsStore()

  const dispatch = useCallback((command: BlackjackCommand): DispatchResult => {
    const profile = activeProfile()
    const engine = engineRef.current
    const prevState = engine.getState()

    if (command.type === 'DEAL') {
      const bet = prevState.mainBetCents
      const sideBetTotal = prevState.sideBets.reduce((sum, sb) => sum + sb.amountCents, 0)
      const total = bet + sideBetTotal
      if (profile && profile.sessionStakeCents >= total) {
        subtractFromBankroll(total)
      }
    }

    const result = engine.dispatch(command)
    setState({ ...result.state })

    if (result.state.phase === 'complete' && prevState.phase !== 'complete') {
      const netCents = result.state.totalNetCents
      if (profile) {
        addToBankroll(result.state.mainBetCents + result.state.sideBets.reduce((sum, sb) => sum + sb.amountCents, 0))
        if (netCents !== 0) {
          addToBankroll(netCents)
        }

        const won = netCents > 0
        recordHandResult(profile.id, 'blackjack', won, netCents)
      }
    }

    return result
  }, [activeProfile, subtractFromBankroll, addToBankroll, recordHandResult])

  const resetEngine = useCallback(() => {
    engineRef.current = new BlackjackEngine(config)
    setState(engineRef.current.getState())
  }, [config])

  return { state, dispatch, resetEngine }
}
