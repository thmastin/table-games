import { useState } from 'react'
import { ChipStack } from '../../../components/ui/ChipStack'
import { formatCents } from '../../../lib/chips'
import type { SideBetId, BlackjackState, BlackjackCommand, SideBet } from '../types'

const SIDE_BET_INFO: Record<SideBetId, { label: string; description: string }> = {
  'perfect-pairs': { label: 'Perfect Pairs', description: 'Mixed 5:1 · Colored 10:1 · Perfect 30:1' },
  '21plus3': { label: '21+3', description: 'Flush 5:1 · Str 10:1 · Trips 30:1 · SF 40:1 · ST 100:1' },
  'lucky-ladies': { label: 'Lucky Ladies', description: 'Any 20 4:1 · QQ♥ 125:1 (1000:1 vs BJ)' },
  'bust-it': { label: 'Bust It', description: '3-card 1:1 up to 8+ card 250:1' },
  'match-the-dealer': { label: 'Match the Dealer', description: 'Rank 4:1 · Suit match 9:1' },
  'royal-match': { label: 'Royal Match', description: 'Same suit 5:2 · K+Q suited 25:1' },
}

const SIDE_BET_IDS: SideBetId[] = [
  'perfect-pairs',
  '21plus3',
  'lucky-ladies',
  'bust-it',
  'match-the-dealer',
  'royal-match',
]

const QUICK_AMOUNTS = [100, 500, 1000, 2500]

type Props = {
  state: BlackjackState
  dispatch: (cmd: BlackjackCommand) => void
}

export function SideBetPanel({ state, dispatch }: Props) {
  const [selectedBet, setSelectedBet] = useState<SideBetId | null>(null)
  const [amount, setAmount] = useState(100)

  const { phase, sideBets } = state
  const canBet = phase === 'betting'

  function getSideBet(id: SideBetId): SideBet | undefined {
    return sideBets.find(sb => sb.id === id)
  }

  function handlePlace(id: SideBetId) {
    if (!canBet) return
    dispatch({ type: 'PLACE_SIDE_BET', id, amountCents: amount })
    setSelectedBet(null)
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--chrome-panel)',
        border: '1px solid var(--chrome-border)',
        borderRadius: 8,
        padding: '12px 16px',
        minWidth: 220,
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
          marginBottom: 10,
        }}
      >
        Side Bets
      </div>

      {canBet && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className="font-mono"
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                border: amount === a ? '1px solid var(--gold-bright)' : '1px solid var(--chrome-border)',
                backgroundColor: amount === a ? 'var(--chrome-active)' : 'var(--chrome-bg)',
                color: amount === a ? 'var(--gold-bright)' : 'var(--text-secondary)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {formatCents(a)}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SIDE_BET_IDS.map(id => {
          const info = SIDE_BET_INFO[id]
          const placed = getSideBet(id)
          const isSelected = selectedBet === id

          return (
            <div
              key={id}
              onClick={() => {
                if (!canBet) return
                if (isSelected) {
                  handlePlace(id)
                } else {
                  setSelectedBet(id)
                }
              }}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: isSelected
                  ? '1px solid var(--gold-bright)'
                  : placed
                  ? '1px solid var(--result-win-border)'
                  : '1px solid var(--chrome-border)',
                backgroundColor: isSelected
                  ? 'var(--chrome-active)'
                  : placed
                  ? 'rgba(0,180,80,0.06)'
                  : 'var(--chrome-bg)',
                cursor: canBet ? 'pointer' : 'default',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'border-color 100ms ease',
              }}
            >
              <div>
                <div className="font-sans" style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>
                  {info.label}
                </div>
                <div className="font-sans" style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                  {info.description}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                {placed ? (
                  <>
                    <ChipStack denomination={25} size="sm" />
                    <span className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
                      {formatCents(placed.amountCents)}
                    </span>
                    {placed.resolved && (
                      <span
                        className="font-sans"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: placed.won ? 'var(--result-win)' : 'var(--result-loss)',
                        }}
                      >
                        {placed.won ? `+${formatCents((placed.resultMultiplier ?? 0) * placed.amountCents)}` : 'LOSE'}
                      </span>
                    )}
                  </>
                ) : isSelected ? (
                  <span className="font-sans" style={{ color: 'var(--gold-bright)', fontSize: 11 }}>
                    Tap again ({formatCents(amount)})
                  </span>
                ) : canBet ? (
                  <span className="font-sans" style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                    +{formatCents(amount)}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
