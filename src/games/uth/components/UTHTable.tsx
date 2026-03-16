import { useState } from 'react'
import { useUTH } from './useUTH'
import { UTHControls } from './UTHControls'
import { TripsPanel } from './TripsPanel'
import { Card as CardComp } from '../../../components/ui/Card'
import { BetSpot } from '../../../components/ui/BetSpot'
import { ChipTray } from '../../../components/ui/ChipTray'
import { ResultBanner } from '../../../components/ui/ResultBanner'
import { GameErrorBoundary } from '../../../components/GameErrorBoundary'
import { useProfileStore } from '../../../store/profileStore'
import { formatCents } from '../../../lib/chips'
import type { Denomination } from '../../../lib/chips'

const HAND_RANK_LABELS: Record<string, string> = {
  'royal-flush':     'Royal Flush',
  'straight-flush':  'Straight Flush',
  'four-of-a-kind':  'Four of a Kind',
  'full-house':      'Full House',
  'flush':           'Flush',
  'straight':        'Straight',
  'three-of-a-kind': 'Three of a Kind',
  'two-pair':        'Two Pair',
  'pair':            'Pair',
  'high-card':       'High Card',
}

function playLabel(play: number, ante: number): string {
  if (play === 0) return 'PLAY'
  const mult = Math.round(play / ante)
  return `${mult}x`
}

function blindResultLabel(
  blindResult: 'win' | 'push' | 'loss' | null,
  playerHandRank: string | null,
): string | null {
  if (blindResult === null) return null
  if (blindResult === 'loss') return 'Blind loses'
  if (blindResult === 'push') return 'Blind pushes'
  const rankLabel = playerHandRank ? (HAND_RANK_LABELS[playerHandRank] ?? playerHandRank) : ''
  return `Blind pays — ${rankLabel}`
}

function UTHTableInner() {
  const {
    state,
    placeAnte,
    placeTrips,
    deal,
    bet,
    check,
    bet2x,
    bet1x,
    fold,
    newHand,
    validActions,
    resetEngine,
  } = useUTH()
  const { activeProfile } = useProfileStore()
  const profile = activeProfile()
  const [activeDenom, setActiveDenom] = useState<Denomination>(25)

  const sessionCents = profile?.sessionStakeCents ?? 0
  const canBetAnte = state.phase === 'idle' || state.phase === 'betting'

  function handleChipClick(denom: Denomination) {
    setActiveDenom(denom)
    if (canBetAnte) {
      const add = denom * 100
      const current = state.ante
      const next = Math.min(current + add, 10000)
      if (next > 0) {
        placeAnte(next)
      }
    }
  }

  function handleTripsClick() {
    if (!canBetAnte) return
    const add = activeDenom * 100
    const current = state.trips
    const next = Math.min(current + add, 10000)
    if (next > 0) {
      placeTrips(next)
    }
  }

  const showCommunity = state.phase === 'flop'
    || state.phase === 'river'
    || state.phase === 'resolving'
    || state.phase === 'complete'

  const showDealerHole = state.phase === 'resolving' || state.phase === 'complete'

  const resultData = (() => {
    if (state.phase !== 'complete') return null
    if (state.result === 'win') {
      const rankLabel = state.playerHandRank
        ? (HAND_RANK_LABELS[state.playerHandRank] ?? state.playerHandRank)
        : ''
      const blindLabel = blindResultLabel(state.blindResult, state.playerHandRank)
      const tripsNet = state.tripsResult ? state.tripsResult.payout : (state.trips > 0 ? -state.trips : 0)
      let net = state.ante + state.play
      if (state.blindResult === 'win') net += state.blind
      else if (state.blindResult === 'loss') net -= state.blind
      net += tripsNet
      const netDisplay = (net >= 0 ? '+' : '') + formatCents(net)
      return {
        type: 'win' as const,
        message: 'Player Wins!',
        subMessage: `${rankLabel} · ${netDisplay}`,
      }
    }
    if (state.result === 'push') {
      const tripsNet = state.tripsResult ? state.tripsResult.payout : (state.trips > 0 ? -state.trips : 0)
      let net = tripsNet
      if (state.blindResult === 'win') net += state.blind
      const netDisplay = (net >= 0 ? '+' : '') + formatCents(net)
      return {
        type: 'push' as const,
        message: 'Push',
        subMessage: netDisplay,
      }
    }
    if (state.result === 'loss') {
      const tripsNet = state.tripsResult ? state.tripsResult.payout : (state.trips > 0 ? -state.trips : 0)
      const net = -(state.ante + state.blind + state.play) + tripsNet
      const netDisplay = (net >= 0 ? '+' : '') + formatCents(net)
      return {
        type: 'loss' as const,
        message: 'Dealer Wins',
        subMessage: `${state.dealerQualifies ? 'Dealer Qualifies' : ''} · ${netDisplay}`.replace(/^·\s*/, ''),
      }
    }
    return null
  })()

  const dealerRankLabel = showDealerHole && state.dealerHandRank
    ? (HAND_RANK_LABELS[state.dealerHandRank] ?? state.dealerHandRank)
    : null

  const playerRankLabel = state.phase === 'complete' && state.playerHandRank
    ? (HAND_RANK_LABELS[state.playerHandRank] ?? state.playerHandRank)
    : null

  const blindNote = state.phase === 'complete'
    ? blindResultLabel(state.blindResult, state.playerHandRank)
    : null

  return (
    <div
      className="felt-texture"
      style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        backgroundColor: 'var(--felt-uth)',
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
        style={{
          color: 'var(--felt-print-strong)',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '0.06em',
          opacity: 0.6,
        }}
      >
        ULTIMATE TEXAS HOLD'EM
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span
          className="font-sans"
          style={{
            color: 'var(--felt-print)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Dealer{dealerRankLabel ? ` — ${dealerRankLabel}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 0 }}>
          {state.dealerHole.length > 0
            ? state.dealerHole.map((card, i) => (
                <div key={i} style={{ marginLeft: i > 0 ? -24 : 0, zIndex: i }}>
                  <CardComp card={card} faceDown={!showDealerHole} />
                </div>
              ))
            : Array.from({ length: 2 }).map((_, i) => (
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
            {state.dealerQualifies ? 'Dealer Qualifies' : 'Dealer Does Not Qualify — Pair Required'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {showCommunity
          ? state.community.map((card, i) => (
              <div key={i} style={{ zIndex: i }}>
                <CardComp card={card} faceDown={false} />
              </div>
            ))
          : Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 'var(--card-width)',
                  height: 'var(--card-height)',
                  borderRadius: 'var(--card-radius)',
                  border: '2px dashed rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                }}
              />
            ))
        }
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap' }}>
        <BetSpot
          label="ANTE"
          amountCents={state.ante}
          locked={!canBetAnte}
          size={90}
        />

        <BetSpot
          label="BLIND"
          amountCents={state.blind}
          locked
          size={90}
        />

        {state.play > 0 ? (
          <div style={{ position: 'relative' }}>
            <BetSpot
              label="PLAY"
              amountCents={state.play}
              locked
              size={90}
            />
            <div
              className="font-mono"
              style={{
                position: 'absolute',
                top: -18,
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'var(--gold-text)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}
            >
              {playLabel(state.play, state.ante)}
            </div>
          </div>
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
              style={{
                color: 'rgba(255,255,255,0.2)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              PLAY
            </span>
          </div>
        )}
      </div>

      {blindNote && (
        <div
          className="font-sans"
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: state.blindResult === 'win'
              ? 'var(--result-win)'
              : state.blindResult === 'push'
              ? 'var(--result-push)'
              : 'var(--result-loss)',
          }}
        >
          {blindNote}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {state.playerHole.length > 0
            ? state.playerHole.map((card, i) => (
                <div key={i} style={{ marginLeft: i > 0 ? -24 : 0, zIndex: i }}>
                  <CardComp card={card} faceDown={false} />
                </div>
              ))
            : Array.from({ length: 2 }).map((_, i) => (
                <div key={i} style={{ marginLeft: i > 0 ? -24 : 0, zIndex: i }}>
                  <CardComp faceDown />
                </div>
              ))
          }
        </div>
        <span
          className="font-sans"
          style={{
            color: 'var(--felt-print)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Player{playerRankLabel ? ` — ${playerRankLabel}` : ''}
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

      <UTHControls
        state={state}
        validActions={validActions}
        onDeal={deal}
        onBet={bet}
        onCheck={check}
        onBet2x={bet2x}
        onBet1x={bet1x}
        onFold={fold}
        onNewHand={newHand}
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
        <TripsPanel
          state={state}
          activeDenomination={activeDenom}
          onTripsClick={handleTripsClick}
        />
      </div>
    </div>
  )
}

export function UTHTable() {
  return (
    <GameErrorBoundary gameName="Ultimate Texas Hold'Em" onReset={() => {}}>
      <UTHTableInner />
    </GameErrorBoundary>
  )
}
