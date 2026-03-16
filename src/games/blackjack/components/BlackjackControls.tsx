import { ActionButton } from '../../../components/ui/ActionButton'
import type { BlackjackState, BlackjackCommand } from '../types'
import { cardTotal } from '../paytables'

type Props = {
  state: BlackjackState
  dispatch: (cmd: BlackjackCommand) => void
}

export function BlackjackControls({ state, dispatch }: Props) {
  const { phase, playerHands, activeHandIndex, canSurrender, canInsurance } = state
  const activeHand = playerHands[activeHandIndex]

  if (phase === 'insurance') {
    return (
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <div
          className="font-sans"
          style={{ color: 'var(--gold-pale)', fontSize: 14, width: '100%', textAlign: 'center', marginBottom: 4 }}
        >
          Insurance? (costs {activeHand ? Math.floor(activeHand.betCents / 2 / 100) : 0} for half your bet)
        </div>
        {canInsurance && (
          <ActionButton label="Take Insurance" variant="primary" onClick={() => dispatch({ type: 'TAKE_INSURANCE' })} />
        )}
        <ActionButton label="Decline" variant="secondary" onClick={() => dispatch({ type: 'DECLINE_INSURANCE' })} />
      </div>
    )
  }

  if (phase === 'player_turn' && activeHand) {
    const total = cardTotal(activeHand.cards)
    const canDouble = activeHand.cards.length === 2 && !activeHand.stood && !activeHand.isBust
    const canSplitHand =
      activeHand.cards.length === 2 &&
      playerHands.length < 4 &&
      (() => {
        const [c1, c2] = activeHand.cards
        if (!c1 || !c2) return false
        const val = (c: typeof c1) => ['10', 'J', 'Q', 'K'].includes(c.rank) ? 10 : c.rank === 'A' ? 11 : parseInt(c.rank, 10)
        return val(c1) === val(c2)
      })()

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
        {canDouble && (
          <ActionButton
            label="Double"
            variant="secondary"
            onClick={() => dispatch({ type: 'DOUBLE' })}
          />
        )}
        {canSplitHand && (
          <ActionButton
            label="Split"
            variant="secondary"
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
          label="Next Hand"
          variant="primary"
          onClick={() => dispatch({ type: 'NEW_HAND' })}
        />
      </div>
    )
  }

  return null
}
