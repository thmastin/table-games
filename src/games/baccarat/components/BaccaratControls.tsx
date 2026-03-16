import { ActionButton } from '../../../components/ui/ActionButton'
import { formatCents } from '../../../lib/chips'
import type { BaccaratState } from '../types'

type Props = {
  state: BaccaratState
  canDeal: boolean
  canNewHand: boolean
  onDeal: () => void
  onNewHand: () => void
}

export function BaccaratControls({ state, canDeal, canNewHand, onDeal, onNewHand }: Props) {
  if (state.phase === 'complete' && canNewHand) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ActionButton label="New Hand" variant="primary" onClick={onNewHand} />
      </div>
    )
  }

  if (state.phase === 'betting') {
    const totalBet = state.playerBet + state.bankerBet + state.tieBet
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ActionButton
          label={totalBet > 0 ? `Deal (${formatCents(totalBet)})` : 'Deal'}
          variant="primary"
          disabled={!canDeal}
          onClick={onDeal}
        />
      </div>
    )
  }

  return null
}
