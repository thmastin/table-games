import { ChipStack } from '../../../components/ui/ChipStack'
import { formatCents } from '../../../lib/chips'
import type { SideBetId, BlackjackState, BlackjackCommand, SideBet } from '../types'

const SIDE_BET_INFO: Record<SideBetId, { label: string; topPayout: string; description: string }> = {
  'perfect-pairs': {
    label: 'Perfect Pairs',
    topPayout: 'Perfect pair 30:1',
    description: 'Mixed 5:1 · Colored 10:1 · Perfect 30:1',
  },
  '21plus3': {
    label: '21+3',
    topPayout: 'Suited trips 100:1',
    description: 'Flush 5:1 · Str 10:1 · Trips 30:1 · SF 40:1 · ST 100:1',
  },
  'lucky-ladies': {
    label: 'Lucky Ladies',
    topPayout: 'QQ♥ vs BJ 1000:1',
    description: 'Any 20 4:1 · QQ♥ 125:1 · QQ♥ vs BJ 1000:1',
  },
  'bust-it': {
    label: 'Bust It',
    topPayout: '8+ card bust 250:1',
    description: '3-card 1:1 up to 8+ card 250:1',
  },
  'match-the-dealer': {
    label: 'Match the Dealer',
    topPayout: 'Suited match 9:1',
    description: 'Rank match 4:1 · Suited match 9:1',
  },
  'royal-match': {
    label: 'Royal Match',
    topPayout: 'K+Q suited 25:1',
    description: 'Same suit 5:2 · K+Q suited 25:1',
  },
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
  selectedAmount?: number
  onAmountChange?: (amount: number) => void
}

export function SideBetPanel({ state, dispatch, selectedAmount = 100, onAmountChange }: Props) {
  const { phase, sideBets } = state
  const canBet = phase === 'betting'
  const amount = selectedAmount

  function getSideBet(id: SideBetId): SideBet | undefined {
    return sideBets.find(sb => sb.id === id)
  }

  function handlePlace(id: SideBetId) {
    if (!canBet) return
    const placed = getSideBet(id)
    if (placed) {
      dispatch({ type: 'PLACE_SIDE_BET', id, amountCents: 0 })
    } else {
      dispatch({ type: 'PLACE_SIDE_BET', id, amountCents: amount })
    }
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
              onClick={() => onAmountChange?.(a)}
              className="font-mono"
              style={{
                padding: '4px 9px',
                borderRadius: 4,
                border: amount === a ? '1px solid var(--gold-bright)' : '1px solid var(--chrome-border)',
                backgroundColor: amount === a ? 'rgba(212,160,23,0.15)' : 'var(--chrome-bg)',
                color: amount === a ? 'var(--gold-bright)' : 'var(--text-secondary)',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: amount === a ? 700 : 400,
                transition: 'border-color 100ms ease, color 100ms ease',
              }}
            >
              {formatCents(a)}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {SIDE_BET_IDS.map(id => {
          const info = SIDE_BET_INFO[id]
          const placed = getSideBet(id)
          const isLocked = !canBet

          return (
            <div
              key={id}
              onClick={() => handlePlace(id)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: placed
                  ? '1px solid var(--result-win-border)'
                  : isLocked
                  ? '1px solid var(--chrome-border-dim)'
                  : '1px solid var(--chrome-border)',
                backgroundColor: placed
                  ? 'rgba(0,180,80,0.06)'
                  : isLocked
                  ? 'rgba(0,0,0,0.1)'
                  : 'var(--chrome-bg)',
                cursor: isLocked ? 'default' : 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'border-color 100ms ease',
                opacity: isLocked && !placed ? 0.6 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-sans" style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>
                  {info.label}
                </div>
                <div className="font-sans" style={{ color: 'var(--gold-muted)', fontSize: 10, fontWeight: 600 }}>
                  {info.topPayout}
                </div>
                {!placed && !isLocked && (
                  <div className="font-sans" style={{ color: 'var(--text-dim)', fontSize: 9, marginTop: 1 }}>
                    {info.description}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, marginLeft: 8, flexShrink: 0 }}>
                {placed ? (
                  <>
                    <ChipStack denomination={25} size="sm" />
                    <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 700 }}>
                      {formatCents(placed.amountCents)}
                    </span>
                    {placed.resolved ? (
                      <span
                        className="font-sans"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: placed.won ? 'var(--result-win)' : 'var(--result-loss)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {placed.won
                          ? `WIN +${formatCents((placed.resultMultiplier ?? 0) * placed.amountCents)}`
                          : 'LOSE'}
                      </span>
                    ) : isLocked ? (
                      <span className="font-sans" style={{ color: 'var(--text-dim)', fontSize: 9 }}>
                        locked
                      </span>
                    ) : (
                      <span className="font-sans" style={{ color: 'var(--text-dim)', fontSize: 9 }}>
                        tap to remove
                      </span>
                    )}
                  </>
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
