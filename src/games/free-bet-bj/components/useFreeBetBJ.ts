import { useRef, useState, useCallback } from 'react'
import { FreeBetBJEngine } from '../engine'
import { useProfileStore } from '../../../store/profileStore'
import { useStatsStore } from '../../../store/statsStore'
import { useJackpotStore } from '../../../store/jackpotStore'
import type { FreeBetBJState, FreeBetBJCommand, DispatchResult } from '../types'

export function useFreeBetBJ() {
  const engineRef = useRef<FreeBetBJEngine>(new FreeBetBJEngine())
  const [state, setState] = useState<FreeBetBJState>(() => engineRef.current.getState())

  const { activeProfile, subtractFromBankroll, addToBankroll } = useProfileStore()
  const { recordHandResult } = useStatsStore()
  const { getJackpot, resetJackpot, addToBankroll: addToJackpot } = useJackpotStore()

  const dispatch = useCallback((command: FreeBetBJCommand): DispatchResult => {
    const profile = activeProfile()
    const engine = engineRef.current
    const prevState = engine.getState()

    if (command.type === 'DEAL') {
      const playerCost = prevState.bet + prevState.potOfGold
      if (profile && profile.sessionStakeCents >= playerCost) {
        subtractFromBankroll(playerCost)
      }
    }

    if (command.type === 'DOUBLE') {
      const activeHand = prevState.hands[prevState.activeHandIndex]
      if (activeHand && !prevState.activeHandValidActions.has('FREE_DOUBLE')) {
        subtractFromBankroll(activeHand.bet)
      }
    }

    const result = engine.dispatch(command)
    setState({ ...result.state })

    for (const event of result.events) {
      if (event.type === 'POT_OF_GOLD_TRIGGERED') {
        const jackpotAmount = getJackpot('free-bet-pot-of-gold')
        if (profile) {
          addToBankroll(jackpotAmount)
        }
        resetJackpot('free-bet-pot-of-gold')
      }
    }

    if (result.state.phase === 'complete' && prevState.phase !== 'complete') {
      const netCents = result.state.totalNetCents

      if (profile) {
        const playerBetReturned = result.state.bet + result.state.potOfGold
        addToBankroll(playerBetReturned)

        const paidDoubles = result.state.hands.filter(
          h => h.doubled && !h.isFreeDouble
        )
        for (const h of paidDoubles) {
          addToBankroll(h.bet)
        }

        if (netCents !== 0) {
          addToBankroll(netCents)
        }

        const won = netCents > 0
        recordHandResult(profile.id, 'free-bet-blackjack', won, netCents)
      }
    }

    return result
  }, [activeProfile, subtractFromBankroll, addToBankroll, recordHandResult, getJackpot, resetJackpot, addToJackpot])

  const resetEngine = useCallback(() => {
    engineRef.current = new FreeBetBJEngine()
    setState(engineRef.current.getState())
  }, [])

  const validActions = state.activeHandValidActions

  return { state, dispatch, resetEngine, validActions }
}
