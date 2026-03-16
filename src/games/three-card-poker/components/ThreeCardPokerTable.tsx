import { useState } from 'react'
import { useThreeCardPoker } from './useThreeCardPoker'
import { ThreeCardPokerControls } from './ThreeCardPokerControls'
import { SideBetPanel } from './SideBetPanel'
import { Card as CardComp } from '../../../components/ui/Card'
import { BetSpot } from '../../../components/ui/BetSpot'
import { ChipTray } from '../../../components/ui/ChipTray'
import { ResultBanner } from '../../../components/ui/ResultBanner'
import { GameErrorBoundary } from '../../../components/GameErrorBoundary'
import { useProfileStore } from '../../../store/profileStore'
import { formatCents } from '../../../lib/chips'
import { evaluate, compareResults } from '../../../lib/handEvaluator'
import type { Denomination } from '../../../lib/chips'

const HAND_RANK_LABELS: Record<string, string> = {
  'high-card':       'High Card',
  'pair':            'Pair',
  'flush':           'Flush',
  'straight':        'Straight',
  'three-of-a-kind': 'Three of a Kind',
  'straight-flush':  'Straight Flush',
  'royal-flush':     'Royal Flush',
}

function ThreeCardPokerTableInner() {
  const { state, placeBet, deal, play, fold, newHand } = useThreeCardPoker()
  const { activeProfile } = useProfileStore()
  const profile = activeProfile()
  const [activeDenom, setActiveDenom] = useState<Denomination>(25)

  const sessionCents = profile?.sessionStakeCents ?? 0

  function handleChipClick(denom: Denomination) {
    setActiveDenom(denom)
    if (state.phase === 'betting' || state.phase === 'idle') {
      const add = denom * 100
      const current = state.ante
      const next = Math.min(current + add, 30000)
      if (next > 0) {
        placeBet('ante', next)
      }
    }
  }

  function handlePairPlusClick() {
    if (state.phase !== 'betting' && state.phase !== 'idle') return
    const add = activeDenom * 100
    const current = state.pairPlus
    const next = Math.min(current + add, 10000)
    if (next > 0) {
      placeBet('pairPlus', next)
    }
  }

  function handleSixCardBonusClick() {
    if (state.phase !== 'betting' && state.phase !== 'idle') return
    const add = activeDenom * 100
    const current = state.sixCardBonus
    const next = Math.min(current + add, 10000)
    if (next > 0) {
      placeBet('sixCardBonus', next)
    }
  }

  const canDeal = (state.phase === 'betting' || state.phase === 'idle') && state.ante >= 1000

  const resultData = (() => {
    if (state.phase !== 'complete') return null

    if (state.result === null) {
      return { type: 'loss' as const, message: 'Folded', subMessage: `-${formatCents(state.ante)}` }
    }

    const playerResult = state.result
    const dealerResult = evaluate(state.dealerCards, '3-card')
    const cmp = compareResults(playerResult, dealerResult)

    let anteNet = 0
    let playNet = 0

    if (!state.dealerQualifies) {
      anteNet = state.ante
      playNet = 0
    } else if (cmp > 0) {
      anteNet = state.ante
      playNet = state.play
    } else if (cmp === 0) {
      anteNet = 0
      playNet = 0
    } else {
      anteNet = -state.ante
      playNet = -state.play
    }

    const netCents = anteNet + playNet + state.anteBonus
      + (state.sideBetResults?.pairPlus ?? 0)
      + (state.sideBetResults?.sixCardBonus ?? 0)

    const netDisplay = (netCents >= 0 ? '+' : '') + formatCents(netCents)
    const rankLabel = HAND_RANK_LABELS[playerResult.rank] ?? playerResult.rank

    if (!state.dealerQualifies) {
      return { type: 'win' as const, message: 'Dealer Does Not Qualify', subMessage: `${rankLabel} · ${netDisplay}` }
    }
    if (cmp > 0) {
      return { type: 'win' as const, message: 'Player Wins!', subMessage: `${rankLabel} · ${netDisplay}` }
    }
    if (cmp === 0) {
      return { type: 'push' as const, message: 'Push', subMessage: `${rankLabel} · ${netDisplay}` }
    }
    return { type: 'loss' as const, message: 'Dealer Wins', subMessage: `${rankLabel} · ${netDisplay}` }
  })()

  const dealerRankLabel = state.phase === 'complete' && state.dealerCards.length === 3
    ? (() => {
        const dr = evaluate(state.dealerCards, '3-card')
        return HAND_RANK_LABELS[dr.rank] ?? dr.rank
      })()
    : null

  const playerRankLabel = state.phase === 'complete' && state.playerCards.length === 3 && state.result
    ? (HAND_RANK_LABELS[state.result.rank] ?? state.result.rank)
    : null

  return (
    <div
      className="felt-texture"
      style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        backgroundColor: 'var(--felt-blackjack)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 24px 140px',
        gap: 24,
        position: 'relative',
      }}
    >
      <div
        className="font-display"
        style={{ color: 'var(--felt-print-strong)', fontSize: 28, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.6 }}
      >
        THREE CARD POKER
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span
          className="font-sans"
          style={{ color: 'var(--felt-print)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          Dealer
          {dealerRankLabel ? ` — ${dealerRankLabel}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 0 }}>
          {state.dealerCards.length > 0
            ? state.dealerCards.map((card, i) => (
                <div key={i} style={{ marginLeft: i > 0 ? -24 : 0, zIndex: i }}>
                  <CardComp card={card} faceDown={card.faceDown} />
                </div>
              ))
            : Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ marginLeft: i > 0 ? -24 : 0, zIndex: i }}>
                  <CardComp faceDown />
                </div>
              ))
          }
        </div>
        {state.phase === 'complete' && (
          <span
            className="font-sans"
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: state.dealerQualifies ? 'var(--result-win)' : 'var(--result-loss)',
              textTransform: 'uppercase',
            }}
          >
            {state.dealerQualifies ? 'Dealer Qualifies' : 'Dealer Does Not Qualify — Queen-High Required'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap' }}>
        <BetSpot
          label="ANTE"
          amountCents={state.ante}
          locked={state.phase !== 'betting' && state.phase !== 'idle'}
          size={90}
        />

        {state.phase === 'player_decision' || state.phase === 'complete' || state.phase === 'resolving' ? (
          <BetSpot
            label="PLAY"
            amountCents={state.play}
            locked
            size={90}
          />
        ) : (
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              border: '2px dashed rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              className="font-sans"
              style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              PLAY
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {state.playerCards.length > 0
            ? state.playerCards.map((card, i) => (
                <div key={i} style={{ marginLeft: i > 0 ? -24 : 0, zIndex: i }}>
                  <CardComp card={card} faceDown={false} />
                </div>
              ))
            : Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ marginLeft: i > 0 ? -24 : 0, zIndex: i }}>
                  <CardComp faceDown />
                </div>
              ))
          }
        </div>
        <span
          className="font-sans"
          style={{ color: 'var(--felt-print)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          Player
          {playerRankLabel ? ` — ${playerRankLabel}` : ''}
        </span>
      </div>

      {resultData && (
        <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <ResultBanner
            result={resultData.type}
            message={resultData.message}
            subMessage={resultData.subMessage}
          />
        </div>
      )}

      <ThreeCardPokerControls
        phase={state.phase}
        ante={state.ante}
        onDeal={deal}
        onPlay={play}
        onFold={fold}
        onNewHand={newHand}
        canDeal={canDeal}
      />

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
        <SideBetPanel
          state={state}
          activeDenomination={activeDenom}
          onPairPlusClick={handlePairPlusClick}
          onSixCardBonusClick={handleSixCardBonusClick}
        />
      </div>
    </div>
  )
}

export function ThreeCardPokerTable() {
  return (
    <GameErrorBoundary gameName="Three Card Poker" onReset={() => {}}>
      <ThreeCardPokerTableInner />
    </GameErrorBoundary>
  )
}
