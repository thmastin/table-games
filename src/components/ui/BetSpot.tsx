import { ChipStack } from './ChipStack'
import { dollarsToChips } from '../../lib/chips'
import type { Denomination } from '../../lib/chips'

type Props = {
  label: string
  amountCents: number
  locked?: boolean
  onClick?: () => void
  size?: number
}

export function BetSpot({ label, amountCents, locked, onClick, size = 80 }: Props) {
  const hasChips = amountCents > 0
  const chips: Record<Denomination, number> = hasChips
    ? dollarsToChips(amountCents)
    : { 1: 0, 5: 0, 25: 0, 100: 0, 500: 0, 1000: 0 }

  const topChip = (Object.keys(chips) as unknown as Denomination[])
    .filter(d => chips[d] > 0)
    .sort((a, b) => b - a)[0]

  return (
    <div
      className={`bet-spot ${hasChips ? 'bet-spot--active' : ''} ${locked ? 'bet-spot--locked' : ''}`}
      onClick={locked ? undefined : onClick}
      style={{ width: size, height: size }}
    >
      {topChip ? (
        <ChipStack denomination={topChip} size="md" />
      ) : (
        <span className="text-felt-label" style={{ color: 'var(--felt-print)', userSelect: 'none' }}>
          {label}
        </span>
      )}
    </div>
  )
}
