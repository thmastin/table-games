import { BetSpot } from '../../../components/ui/BetSpot'
import { formatCents } from '../../../lib/chips'
import type { BaccaratState } from '../types'
import type { Denomination } from '../../../lib/chips'

type Props = {
  state: BaccaratState
  activeDenom: Denomination
  onPlaceDragonBonus: (side: 'player' | 'banker', amount: number) => void
  onPlacePanda8: (amount: number) => void
}

const DRAGON_BONUS_MAX = 10000

function clampBet(current: number, add: number, max: number): number {
  return Math.min(current + add, max)
}

export function SideBetPanel({ state, activeDenom, onPlaceDragonBonus, onPlacePanda8 }: Props) {
  const locked = state.phase !== 'betting'
  const dragonSide = state.dragonBonus.side
  const dragonAmount = state.dragonBonus.amount

  function handleDragonSideSelect(side: 'player' | 'banker') {
    if (locked) return
    const newSide = dragonSide === side ? side : side
    onPlaceDragonBonus(newSide, dragonAmount)
  }

  function handleDragonBetClick() {
    if (locked || dragonSide === null) return
    const add = activeDenom * 100
    const next = clampBet(dragonAmount, add, DRAGON_BONUS_MAX)
    onPlaceDragonBonus(dragonSide, next)
  }

  function handlePanda8Click() {
    if (locked) return
    const add = activeDenom * 100
    const next = clampBet(state.panda8, add, 10000)
    onPlacePanda8(next)
  }

  const dragonBonusResult = state.dragonBonusResult
  const panda8Result = state.panda8Result

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '12px 16px',
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 200,
      }}
    >
      <div
        className="font-sans"
        style={{ color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}
      >
        Side Bets
      </div>

      {/* Dragon Bonus */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          className="font-sans"
          style={{ color: 'var(--gold-pale)', fontSize: 12, fontWeight: 600 }}
        >
          Dragon Bonus
        </div>
        <div
          style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}
        >
          Natural win 1:1 &nbsp;|&nbsp; Win by 9: 30:1
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {(['player', 'banker'] as const).map(side => (
            <button
              key={side}
              disabled={locked}
              onClick={() => handleDragonSideSelect(side)}
              style={{
                flex: 1,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
                letterSpacing: '0.04em',
                borderRadius: 4,
                border: dragonSide === side
                  ? '1px solid var(--gold-bright)'
                  : '1px solid rgba(255,255,255,0.15)',
                backgroundColor: dragonSide === side
                  ? 'rgba(212, 160, 23, 0.18)'
                  : 'rgba(255,255,255,0.05)',
                color: dragonSide === side ? 'var(--gold-pale)' : 'var(--text-secondary)',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.5 : 1,
                transition: 'all var(--transition-fast)',
              }}
            >
              {side}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BetSpot
            label="Dragon"
            amountCents={dragonAmount}
            locked={locked || dragonSide === null}
            onClick={handleDragonBetClick}
            size={64}
          />
          {dragonAmount > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {formatCents(dragonAmount)}
              {dragonSide && (
                <span style={{ color: 'var(--text-dim)', marginLeft: 4 }}>
                  ({dragonSide})
                </span>
              )}
            </div>
          )}
        </div>

        {dragonBonusResult !== null && (
          <div
            className="font-mono"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: dragonBonusResult > 0 ? 'var(--result-win)' : dragonBonusResult === 0 ? 'var(--result-push)' : 'var(--result-loss)',
            }}
          >
            {dragonBonusResult > 0 ? '+' : ''}{formatCents(dragonBonusResult)}
          </div>
        )}
      </div>

      {/* Panda 8 — EZ only */}
      {state.variant === 'ez' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              className="font-sans"
              style={{ color: 'var(--gold-pale)', fontSize: 12, fontWeight: 600 }}
            >
              Panda 8
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              Player 3-card 8 pays 25:1
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BetSpot
              label="Panda 8"
              amountCents={state.panda8}
              locked={locked}
              onClick={handlePanda8Click}
              size={64}
            />
            {state.panda8 > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {formatCents(state.panda8)}
              </div>
            )}
          </div>

          {panda8Result !== null && (
            <div
              className="font-mono"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: panda8Result > 0 ? 'var(--result-win)' : panda8Result === 0 ? 'var(--result-push)' : 'var(--result-loss)',
              }}
            >
              {panda8Result > 0 ? '+' : ''}{formatCents(panda8Result)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
