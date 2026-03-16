import { ActionButton } from '../../../components/ui/ActionButton'
import { formatCents } from '../../../lib/chips'
import type { UTHState } from '../types'
import type { ValidAction } from './useUTH'

type Props = {
  state: UTHState
  validActions: Set<ValidAction>
  onDeal: () => void
  onBet: (multiplier: 3 | 4) => void
  onCheck: () => void
  onBet2x: () => void
  onBet1x: () => void
  onFold: () => void
  onNewHand: () => void
}

export function UTHControls({
  state,
  validActions,
  onDeal,
  onBet,
  onCheck,
  onBet2x,
  onBet1x,
  onFold,
  onNewHand,
}: Props) {
  const { phase, ante } = state

  if (phase === 'idle' || phase === 'betting') {
    const canDeal = ante >= 1000
    return (
      <div className="flex gap-3 justify-center">
        <ActionButton
          label={ante > 0 ? `Deal (${formatCents(ante * 2)})` : 'Place Ante to Deal'}
          variant="primary"
          disabled={!canDeal}
          onClick={onDeal}
        />
      </div>
    )
  }

  if (phase === 'preflop') {
    return (
      <div className="flex gap-3 justify-center">
        <ActionButton
          label={`Bet 4x (${formatCents(ante * 4)})`}
          variant="primary"
          onClick={() => onBet(4)}
        />
        <ActionButton
          label={`Bet 3x (${formatCents(ante * 3)})`}
          variant="secondary"
          onClick={() => onBet(3)}
        />
        <ActionButton
          label="Check"
          variant="secondary"
          onClick={onCheck}
        />
      </div>
    )
  }

  if (phase === 'flop') {
    if (state.play > 0) {
      return null
    }
    return (
      <div className="flex gap-3 justify-center">
        <ActionButton
          label={`Bet 2x (${formatCents(ante * 2)})`}
          variant="primary"
          onClick={onBet2x}
        />
        <ActionButton
          label="Check"
          variant="secondary"
          onClick={onCheck}
        />
      </div>
    )
  }

  if (phase === 'river') {
    if (state.play > 0) {
      return null
    }
    return (
      <div className="flex gap-3 justify-center">
        <ActionButton
          label={`Bet 1x (${formatCents(ante)})`}
          variant="primary"
          onClick={onBet1x}
        />
        <ActionButton
          label="Fold"
          variant="danger"
          onClick={onFold}
        />
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="flex gap-3 justify-center">
        <ActionButton
          label="New Hand"
          variant="primary"
          onClick={onNewHand}
        />
      </div>
    )
  }

  return null
}
