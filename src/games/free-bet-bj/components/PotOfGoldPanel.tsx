import { formatCents } from '../../../lib/chips'
import { useJackpotStore } from '../../../store/jackpotStore'
import type { FreeBetBJState, FreeBetBJCommand } from '../types'

const QUICK_AMOUNTS = [100, 500, 1000, 2500]

type Props = {
  state: FreeBetBJState
  dispatch: (cmd: FreeBetBJCommand) => void
  selectedAmount: number
  onAmountChange: (amount: number) => void
}

export function PotOfGoldPanel({ state, dispatch, selectedAmount, onAmountChange }: Props) {
  const jackpotCents = useJackpotStore(s => s.jackpots['free-bet-pot-of-gold'])
  const { phase, potOfGold, events } = state

  const canBet = phase === 'betting' || phase === 'idle'
  const isPlaced = potOfGold > 0

  const triggeredEvent = events.find(e => e.type === 'POT_OF_GOLD_TRIGGERED')
  const resolvedEvent = events.find(e => e.type === 'POT_OF_GOLD_RESOLVED')

  function handlePlace() {
    if (!canBet) return
    dispatch({ type: 'PLACE_POT_OF_GOLD', amountCents: isPlaced ? 0 : selectedAmount })
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--chrome-panel)',
        border: isPlaced ? '1px solid rgba(212, 160, 23, 0.5)' : '1px solid var(--chrome-border)',
        borderRadius: 8,
        padding: '12px 16px',
        minWidth: 200,
      }}
    >
      <div
        className="font-sans"
        style={{
          color: 'var(--text-secondary)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        Pot of Gold
      </div>

      <div
        className="font-mono"
        style={{
          color: 'var(--gold-bright)',
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 8,
          letterSpacing: '0.02em',
        }}
      >
        {formatCents(jackpotCents)}
      </div>

      <div
        className="font-sans"
        style={{ color: 'var(--text-dim)', fontSize: 10, marginBottom: 10, lineHeight: 1.4 }}
      >
        Trigger: split Aces of the same suit after a free split
      </div>

      {canBet && (
        <>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            {QUICK_AMOUNTS.map(a => (
              <button
                key={a}
                onClick={() => onAmountChange(a)}
                className="font-mono"
                style={{
                  padding: '3px 7px',
                  borderRadius: 4,
                  border: selectedAmount === a ? '1px solid var(--gold-bright)' : '1px solid var(--chrome-border)',
                  backgroundColor: selectedAmount === a ? 'var(--chrome-active)' : 'var(--chrome-bg)',
                  color: selectedAmount === a ? 'var(--gold-bright)' : 'var(--text-secondary)',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                {formatCents(a)}
              </button>
            ))}
          </div>

          <div
            onClick={handlePlace}
            style={{
              padding: '7px 12px',
              borderRadius: 6,
              border: isPlaced ? '1px solid var(--gold-bright)' : '1px solid var(--chrome-border)',
              backgroundColor: isPlaced ? 'rgba(212,160,23,0.12)' : 'var(--chrome-bg)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'border-color 100ms ease',
            }}
          >
            <span className="font-sans" style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>
              Pot of Gold
            </span>
            {isPlaced ? (
              <span className="font-mono" style={{ color: 'var(--gold-bright)', fontSize: 12 }}>
                {formatCents(potOfGold)}
              </span>
            ) : (
              <span className="font-sans" style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                +{formatCents(selectedAmount)}
              </span>
            )}
          </div>
        </>
      )}

      {phase === 'complete' && triggeredEvent && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            borderRadius: 6,
            backgroundColor: 'rgba(212,160,23,0.15)',
            border: '1px solid var(--gold-bright)',
            textAlign: 'center',
          }}
        >
          <div
            className="font-display"
            style={{ color: 'var(--gold-bright)', fontSize: 14, fontWeight: 700 }}
          >
            JACKPOT!
          </div>
          <div className="font-sans" style={{ color: 'var(--gold-pale)', fontSize: 11, marginTop: 2 }}>
            Pot of Gold triggered
          </div>
        </div>
      )}

      {phase === 'complete' && !triggeredEvent && resolvedEvent && potOfGold > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: '6px 10px',
            borderRadius: 6,
            backgroundColor: 'var(--result-loss-bg)',
            border: '1px solid var(--result-loss-border)',
            textAlign: 'center',
          }}
        >
          <span
            className="font-sans"
            style={{ color: 'var(--result-loss)', fontSize: 11, fontWeight: 700 }}
          >
            No trigger
          </span>
        </div>
      )}
    </div>
  )
}
