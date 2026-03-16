import { useBlackjack } from './useBlackjack'
import { BlackjackHand } from './BlackjackHand'
import { BlackjackControls } from './BlackjackControls'
import { SideBetPanel } from './SideBetPanel'
import { ChipTray } from '../../../components/ui/ChipTray'
import { BetSpot } from '../../../components/ui/BetSpot'
import { ResultBanner } from '../../../components/ui/ResultBanner'
import { Card as CardComp } from '../../../components/ui/Card'
import { GameErrorBoundary } from '../../../components/GameErrorBoundary'
import { useProfileStore } from '../../../store/profileStore'
import { formatCents } from '../../../lib/chips'
import { cardTotal } from '../paytables'
import type { Denomination } from '../../../lib/chips'
import { useState } from 'react'

function BlackjackTableInner() {
  const { state, dispatch } = useBlackjack()
  const { activeProfile } = useProfileStore()
  const profile = activeProfile()
  const [activeDenom, setActiveDenom] = useState<Denomination>(25)

  const sessionCents = profile?.sessionStakeCents ?? 0

  function handleChipClick(denom: Denomination) {
    setActiveDenom(denom)
    if (state.phase === 'betting') {
      const add = denom * 100
      const current = state.mainBetCents
      const max = state.config.tableLimits.maxBet
      const next = Math.min(current + add, max)
      dispatch({ type: 'PLACE_BET', amountCents: next })
    }
  }

  function handleDeal() {
    if (state.mainBetCents < state.config.tableLimits.minBet) return
    dispatch({ type: 'DEAL' })
  }

  function clearBet() {
    dispatch({ type: 'PLACE_BET', amountCents: 0 })
  }

  const dealerTotal = state.dealerHand.length > 0
    ? cardTotal(state.dealerHand.filter(c => !c.faceDown))
    : 0

  const primaryResult = state.phase === 'complete' && state.playerHands.length > 0
    ? (() => {
        const hasBlackjack = state.playerHands.some(h => h.isBlackjack && h.result === 'blackjack')
        const allResults = state.playerHands.map(h => h.result)
        const hasWin = allResults.some(r => r === 'win' || r === 'blackjack')
        const hasLoss = allResults.some(r => r === 'loss' || r === 'bust')
        const allPush = allResults.every(r => r === 'push' || r === 'surrender')
        if (hasBlackjack) return 'blackjack' as const
        if (hasWin && !hasLoss) return 'win' as const
        if (allPush) return 'push' as const
        return 'loss' as const
      })()
    : null

  const netDisplay = state.phase === 'complete'
    ? (state.totalNetCents >= 0 ? '+' : '') + formatCents(state.totalNetCents)
    : null

  const canDeal = state.phase === 'betting' && state.mainBetCents >= state.config.tableLimits.minBet

  return (
    <div
      className="felt-texture"
      style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        backgroundColor: 'var(--felt-blackjack)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 24px',
        gap: 24,
        position: 'relative',
      }}
    >
      <div
        className="font-display"
        style={{ color: 'var(--felt-print-strong)', fontSize: 28, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.6 }}
      >
        BLACKJACK PAYS 3 TO 2
      </div>

      {state.dealerHand.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span className="font-sans" style={{ color: 'var(--felt-print)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Dealer {dealerTotal > 0 && state.phase !== 'player_turn' && state.phase !== 'insurance' ? dealerTotal : ''}
          </span>
          <div style={{ display: 'flex', gap: -8 }}>
            {state.dealerHand.map((card, i) => (
              <div key={i} style={{ marginLeft: i > 0 ? -24 : 0, zIndex: i }}>
                <CardComp card={card} faceDown={card.faceDown} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {state.playerHands.map((hand, i) => (
          <BlackjackHand
            key={hand.id}
            hand={hand}
            isActive={state.phase === 'player_turn' && i === state.activeHandIndex}
            label={state.playerHands.length > 1 ? `Hand ${i + 1}` : undefined}
          />
        ))}
      </div>

      {primaryResult && netDisplay && (
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <ResultBanner
            result={primaryResult}
            message={
              primaryResult === 'blackjack' ? 'Blackjack!' :
              primaryResult === 'win' ? 'Winner!' :
              primaryResult === 'push' ? 'Push' :
              'Dealer Wins'
            }
            subMessage={netDisplay}
          />
        </div>
      )}

      {state.phase === 'betting' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <BetSpot
            label="BET"
            amountCents={state.mainBetCents}
            locked={false}
            onClick={() => {}}
            size={100}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            {state.mainBetCents > 0 && (
              <button
                className="btn-action btn-secondary"
                style={{ fontSize: 12 }}
                onClick={clearBet}
              >
                Clear
              </button>
            )}
            <button
              className="btn-action btn-primary"
              disabled={!canDeal}
              onClick={handleDeal}
              style={{ opacity: canDeal ? 1 : 0.4 }}
            >
              Deal ({formatCents(state.mainBetCents)})
            </button>
          </div>
        </div>
      )}

      <BlackjackControls state={state} dispatch={dispatch} />

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
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
        <SideBetPanel state={state} dispatch={dispatch} />
      </div>
    </div>
  )
}

export function BlackjackTable() {
  return (
    <GameErrorBoundary gameName="Blackjack" onReset={() => {}}>
      <BlackjackTableInner />
    </GameErrorBoundary>
  )
}
