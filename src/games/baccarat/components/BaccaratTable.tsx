import { useState } from 'react'
import { useBaccarat } from './useBaccarat'
import { BaccaratControls } from './BaccaratControls'
import { SideBetPanel } from './SideBetPanel'
import { ChipTray } from '../../../components/ui/ChipTray'
import { BetSpot } from '../../../components/ui/BetSpot'
import { ResultBanner } from '../../../components/ui/ResultBanner'
import { Card as CardComp } from '../../../components/ui/Card'
import { GameErrorBoundary } from '../../../components/GameErrorBoundary'
import { useProfileStore } from '../../../store/profileStore'
import { formatCents } from '../../../lib/chips'
import type { Denomination } from '../../../lib/chips'

const TABLE_MIN = 2500
const TABLE_MAX = 100000
const BET_MAX = 100000

type BetTarget = 'player' | 'banker' | 'tie'

function BaccaratTableInner() {
  const { state, placeBet, placeDragonBonus, placePanda8, deal, newHand, validActions } = useBaccarat()
  const { activeProfile } = useProfileStore()
  const profile = activeProfile()
  const sessionCents = profile?.sessionStakeCents ?? 0

  const [activeDenom, setActiveDenom] = useState<Denomination>(25)

  function handleChipClick(denom: Denomination) {
    setActiveDenom(denom)
  }

  function handleBetSpotClick(target: BetTarget) {
    if (!validActions.canPlaceBets) return
    const add = activeDenom * 100
    const current = target === 'player' ? state.playerBet : target === 'banker' ? state.bankerBet : state.tieBet
    const next = Math.min(current + add, BET_MAX)
    placeBet(target, next)
  }

  function clearBet(target: BetTarget) {
    if (!validActions.canPlaceBets) return
    placeBet(target, 0)
  }

  const resultType = state.result === null ? null : (() => {
    if (state.result === 'tie') return 'push' as const
    return 'win' as const
  })()

  const resultMessage = state.result === 'player' ? 'PLAYER WINS' :
    state.result === 'banker' ? 'BANKER WINS' :
    state.result === 'tie' ? 'TIE' : ''

  const netAll = state.phase === 'complete'
    ? [state.playerBetResult, state.bankerBetResult, state.tieBetResult, state.dragonBonusResult, state.panda8Result]
        .reduce<number>((sum, r) => sum + (r ?? 0), 0)
    : 0

  const netDisplay = state.phase === 'complete'
    ? (netAll >= 0 ? '+' : '') + formatCents(netAll)
    : null

  const variantLabel = state.variant === 'ez' ? 'EZ Baccarat' : 'Standard'

  return (
    <div
      className="felt-texture"
      style={{
        height: '100%',
        backgroundColor: 'var(--felt-baccarat)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Main table area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 24px 16px',
          gap: 24,
          position: 'relative',
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div
            className="font-display"
            style={{
              color: 'var(--felt-print-strong)',
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '0.1em',
              opacity: 0.65,
              textTransform: 'uppercase',
            }}
          >
            Baccarat
          </div>
          <div
            style={{
              color: 'var(--gold-pale)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              opacity: 0.7,
              marginTop: 2,
            }}
          >
            {variantLabel}
          </div>
        </div>

        {/* Cards — symmetrical layout: BANKER left, PLAYER right */}
        <div
          style={{
            display: 'flex',
            gap: 48,
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            maxWidth: 700,
          }}
        >
          {/* Banker side */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                color: 'var(--felt-print-strong)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Banker
              {state.bankerCards.length > 0 && (
                <span
                  className="font-mono"
                  style={{ marginLeft: 8, color: 'var(--gold-pale)', fontSize: 14 }}
                >
                  {state.bankerTotal}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 0 }}>
              {state.bankerCards.length > 0
                ? state.bankerCards.map((card, i) => (
                    <div key={i} style={{ marginLeft: i > 0 ? -20 : 0, zIndex: i }}>
                      <CardComp card={card} faceDown={card.faceDown} />
                    </div>
                  ))
                : (
                    <div
                      style={{
                        width: 80,
                        height: 112,
                        borderRadius: 6,
                        border: '1px dashed rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ color: 'var(--felt-print)', fontSize: 10 }}>—</span>
                    </div>
                  )
              }
            </div>
            {state.phase === 'complete' && state.result === 'banker' && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--result-win)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {state.isNatural ? 'Natural Win' : 'Win'}
              </div>
            )}
          </div>

          {/* VS divider */}
          <div
            style={{
              color: 'var(--felt-print)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.08em',
              paddingTop: 44,
              opacity: 0.5,
            }}
          >
            VS
          </div>

          {/* Player side */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                color: 'var(--felt-print-strong)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Player
              {state.playerCards.length > 0 && (
                <span
                  className="font-mono"
                  style={{ marginLeft: 8, color: 'var(--gold-pale)', fontSize: 14 }}
                >
                  {state.playerTotal}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 0 }}>
              {state.playerCards.length > 0
                ? state.playerCards.map((card, i) => (
                    <div key={i} style={{ marginLeft: i > 0 ? -20 : 0, zIndex: i }}>
                      <CardComp card={card} faceDown={card.faceDown} />
                    </div>
                  ))
                : (
                    <div
                      style={{
                        width: 80,
                        height: 112,
                        borderRadius: 6,
                        border: '1px dashed rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ color: 'var(--felt-print)', fontSize: 10 }}>—</span>
                    </div>
                  )
              }
            </div>
            {state.phase === 'complete' && state.result === 'player' && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--result-win)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {state.isNatural ? 'Natural Win' : 'Win'}
              </div>
            )}
          </div>
        </div>

        {/* Dragon Hand notice (EZ) */}
        {state.phase === 'complete' && state.isDragonHand && (
          <div
            style={{
              backgroundColor: 'rgba(212, 160, 23, 0.15)',
              border: '1px solid var(--gold-mid)',
              borderRadius: 6,
              padding: '6px 16px',
              textAlign: 'center',
            }}
          >
            <span
              className="font-display"
              style={{ color: 'var(--gold-pale)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em' }}
            >
              Dragon Hand — Banker Pushes
            </span>
          </div>
        )}

        {/* Result banner */}
        {state.phase === 'complete' && resultType && (
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <ResultBanner
              result={resultType}
              message={resultMessage}
              subMessage={netDisplay ?? undefined}
            />
          </div>
        )}

        {/* Bet spots — BANKER | TIE | PLAYER */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
            alignItems: 'flex-end',
          }}
        >
          {/* Banker bet */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--felt-print-strong)', textTransform: 'uppercase' }}>
              Banker
            </div>
            <div style={{ fontSize: 9, color: 'var(--felt-print)', marginBottom: 2 }}>
              {state.variant === 'ez' ? 'Even money' : '19:20'}
            </div>
            <BetSpot
              label="BNK"
              amountCents={state.bankerBet}
              locked={!validActions.canPlaceBets}
              onClick={() => handleBetSpotClick('banker')}
              size={90}
            />
            {state.bankerBet > 0 && validActions.canPlaceBets && (
              <button
                style={{
                  fontSize: 10,
                  color: 'var(--text-dim)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                }}
                onClick={() => clearBet('banker')}
              >
                clear
              </button>
            )}
            {state.bankerBet > 0 && (
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {formatCents(state.bankerBet)}
              </div>
            )}
            {state.bankerBetResult !== null && (
              <div
                className="font-mono"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: state.bankerBetResult > 0 ? 'var(--result-win)' : state.bankerBetResult === 0 ? 'var(--result-push)' : 'var(--result-loss)',
                }}
              >
                {state.bankerBetResult > 0 ? '+' : ''}{formatCents(state.bankerBetResult)}
              </div>
            )}
          </div>

          {/* Tie bet */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--felt-print-strong)', textTransform: 'uppercase' }}>
              Tie
            </div>
            <div style={{ fontSize: 9, color: 'var(--felt-print)', marginBottom: 2 }}>
              8:1
            </div>
            <BetSpot
              label="TIE"
              amountCents={state.tieBet}
              locked={!validActions.canPlaceBets}
              onClick={() => handleBetSpotClick('tie')}
              size={80}
            />
            {state.tieBet > 0 && validActions.canPlaceBets && (
              <button
                style={{
                  fontSize: 10,
                  color: 'var(--text-dim)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                }}
                onClick={() => clearBet('tie')}
              >
                clear
              </button>
            )}
            {state.tieBet > 0 && (
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {formatCents(state.tieBet)}
              </div>
            )}
            {state.tieBetResult !== null && (
              <div
                className="font-mono"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: state.tieBetResult > 0 ? 'var(--result-win)' : state.tieBetResult === 0 ? 'var(--result-push)' : 'var(--result-loss)',
                }}
              >
                {state.tieBetResult > 0 ? '+' : ''}{formatCents(state.tieBetResult)}
              </div>
            )}
          </div>

          {/* Player bet */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--felt-print-strong)', textTransform: 'uppercase' }}>
              Player
            </div>
            <div style={{ fontSize: 9, color: 'var(--felt-print)', marginBottom: 2 }}>
              1:1
            </div>
            <BetSpot
              label="PLR"
              amountCents={state.playerBet}
              locked={!validActions.canPlaceBets}
              onClick={() => handleBetSpotClick('player')}
              size={90}
            />
            {state.playerBet > 0 && validActions.canPlaceBets && (
              <button
                style={{
                  fontSize: 10,
                  color: 'var(--text-dim)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                }}
                onClick={() => clearBet('player')}
              >
                clear
              </button>
            )}
            {state.playerBet > 0 && (
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {formatCents(state.playerBet)}
              </div>
            )}
            {state.playerBetResult !== null && (
              <div
                className="font-mono"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: state.playerBetResult > 0 ? 'var(--result-win)' : state.playerBetResult === 0 ? 'var(--result-push)' : 'var(--result-loss)',
                }}
              >
                {state.playerBetResult > 0 ? '+' : ''}{formatCents(state.playerBetResult)}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <BaccaratControls
          state={state}
          canDeal={validActions.canDeal}
          canNewHand={validActions.canNewHand}
          onDeal={deal}
          onNewHand={newHand}
        />

        {/* Table limits */}
        <div
          style={{
            fontSize: 10,
            color: 'var(--felt-print)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.55,
          }}
        >
          Table Limits: {formatCents(TABLE_MIN)} – {formatCents(TABLE_MAX)}
        </div>
      </div>

      {/* Bottom bar — chip tray + side bets */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '12px 24px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid var(--chrome-border)',
        }}
      >
        <ChipTray
          onChipClick={handleChipClick}
          activeDenomination={activeDenom}
          sessionStakeCents={sessionCents}
        />
        <SideBetPanel
          state={state}
          activeDenom={activeDenom}
          onPlaceDragonBonus={placeDragonBonus}
          onPlacePanda8={placePanda8}
        />
      </div>
    </div>
  )
}

export function BaccaratTable() {
  return (
    <GameErrorBoundary gameName="Baccarat" onReset={() => {}}>
      <BaccaratTableInner />
    </GameErrorBoundary>
  )
}
