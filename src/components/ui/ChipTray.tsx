import { DENOMINATIONS } from '../../lib/chips'
import type { Denomination } from '../../lib/chips'
import { ChipStack } from './ChipStack'

type Props = {
  onChipClick: (denomination: Denomination) => void
  activeDenomination?: Denomination
  sessionStakeCents: number
}

export function ChipTray({ onChipClick, activeDenomination, sessionStakeCents }: Props) {
  const dollars = Math.floor(sessionStakeCents / 100)

  return (
    <div className="chip-tray">
      {DENOMINATIONS.map(denom => (
        <div
          key={denom}
          onClick={() => onChipClick(denom)}
          style={{
            opacity: sessionStakeCents < denom * 100 ? 0.35 : 1,
            outline: activeDenomination === denom ? '2px solid var(--gold-bright)' : 'none',
            borderRadius: '50%',
            cursor: sessionStakeCents >= denom * 100 ? 'pointer' : 'not-allowed',
          }}
        >
          <ChipStack denomination={denom} size="lg" />
        </div>
      ))}
      <div className="chip-tray-divider" />
      <div className="bet-summary">
        <span className="bet-summary-label">Session</span>
        <span className="bet-summary-amount font-mono">${dollars.toLocaleString()}</span>
      </div>
    </div>
  )
}
