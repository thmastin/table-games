import { ActionButton } from '../../../components/ui/ActionButton'
import { formatCents } from '../../../lib/chips'
import type { GamePhase } from '../types'

type Props = {
  phase: GamePhase
  ante: number
  onDeal: () => void
  onPlay: () => void
  onFold: () => void
  onNewHand: () => void
  canDeal: boolean
}

export function ThreeCardPokerControls({
  phase,
  ante,
  onDeal,
  onPlay,
  onFold,
  onNewHand,
  canDeal,
}: Props) {
  if (phase === 'betting') {
    return (
      <div className="flex gap-3 justify-center">
        <ActionButton
          label={`Deal (${formatCents(ante)})`}
          variant="primary"
          disabled={!canDeal}
          onClick={onDeal}
        />
      </div>
    )
  }

  if (phase === 'player_decision') {
    return (
      <div className="flex gap-3 justify-center">
        <ActionButton
          label={`Play (${formatCents(ante)})`}
          variant="primary"
          onClick={onPlay}
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
