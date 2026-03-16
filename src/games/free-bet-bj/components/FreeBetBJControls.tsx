import { ActionButton } from '../../../components/ui/ActionButton'
import { formatCents } from '../../../lib/chips'
import { cardTotal } from '../paytables'
import type { FreeBetBJState, FreeBetBJCommand } from '../types'

type Props = {
  state: FreeBetBJState
  dispatch: (cmd: FreeBetBJCommand) => void
}

export function FreeBetBJControls({ state, dispatch }: Props) {
  const { phase, hands, activeHandIndex, activeHandValidActions, canSurrender, canInsurance } = state
  const activeHand = hands[activeHandIndex]

  if (phase === 'insurance') {
    const insuranceCost = activeHand ? Math.floor(activeHand.bet / 2) : 0
    return (
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <div
          className="font-sans"
          style={{ color: 'var(--gold-pale)', fontSize: 14, width: '100%', textAlign: 'center', marginBottom: 4 }}
        >
          Insurance? (costs {formatCents(insuranceCost)} — half your bet)
        </div>
        {canInsurance && (
          <ActionButton
            label="Take Insurance"
            variant="primary"
            onClick={() => dispatch({ type: 'TAKE_INSURANCE' })}
          />
        )}
        <ActionButton
          label="Decline"
          variant="secondary"
          onClick={() => dispatch({ type: 'DECLINE_INSURANCE' })}
        />
      </div>
    )
  }

  if (phase === 'player_turn' && activeHand) {
    const total = cardTotal(activeHand.cards)
    const canFreeDouble = activeHandValidActions.has('FREE_DOUBLE')
    const canAnyDouble = activeHandValidActions.has('DOUBLE') || canFreeDouble
    const canFreeSplit = activeHandValidActions.has('FREE_SPLIT') || activeHandValidActions.has('SPLIT')

    return (
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <ActionButton
          label={`Hit (${total})`}
          variant="primary"
          onClick={() => dispatch({ type: 'HIT' })}
        />
        <ActionButton
          label="Stand"
          variant="secondary"
          onClick={() => dispatch({ type: 'STAND' })}
        />

        {canFreeDouble && (
          <ActionButton
            label="Free Double"
            variant="primary"
            onClick={() => dispatch({ type: 'DOUBLE' })}
          />
        )}

        {canPaidDouble && !canFreeDouble && (
          <ActionButton
            label={`Double (${formatCents(activeHand.bet)})`}
            variant="secondary"
            onClick={() => dispatch({ type: 'DOUBLE' })}
          />
        )}

        {canFreeSplit && (
          <ActionButton
            label="Free Split"
            variant="primary"
            onClick={() => dispatch({ type: 'SPLIT' })}
          />
        )}

        {canSurrender && (
          <ActionButton
            label="Surrender"
            variant="danger"
            onClick={() => dispatch({ type: 'SURRENDER' })}
          />
        )}
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <ActionButton
          label="New Hand"
          variant="primary"
          onClick={() => dispatch({ type: 'NEW_HAND' })}
        />
      </div>
    )
  }

  return null
}
