import { useState } from 'react'
import { useFreeBetBJ } from './useFreeBetBJ'
import { FreeBetBJControls } from './FreeBetBJControls'
import { PotOfGoldPanel } from './PotOfGoldPanel'
import { Card as CardComp } from '../../../components/ui/Card'
import { ChipTray } from '../../../components/ui/ChipTray'
import { BetSpot } from '../../../components/ui/BetSpot'
import { ResultBanner } from '../../../components/ui/ResultBanner'
import { GameErrorBoundary } from '../../../components/GameErrorBoundary'
import { useProfileStore } from '../../../store/profileStore'
import { formatCents } from '../../../lib/chips'
import { cardTotal } from '../paytables'
import type { Denomination } from '../../../lib/chips'
import type { FreeBetHand } from '../types'

type HandResultType = 'win' | 'blackjack' | 'push' | 'loss'

function FreeBetChipBadge({ label }: { label: string }) {
  return (
    <span
      className="font-sans"
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.06em',
        backgroundColor: 'rgba(39,174,96,0.25)',
        border: '1px solid rgba(39,174,96,0.6)',
        color: '#27ae60',
        borderRadius: 3,
        padding: '1px 5px',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  )
}

function FreeBetBJHand({
  hand,
  isActive,
  label,
}: {
  hand: FreeBetHand
  isActive: boolean
  label?: string
}) {
  const visibleCards = hand.cards.filter(c => !c.faceDown)
  const total = visibleCards.length > 0 ? cardTotal(visibleCards) : 0

  const resultColor =
    hand.result === 'win' || hand.result === 'blackjack'
      ? 'var(--result-win)'
      : hand.result === 'push'
      ? 'var(--result-push)'
      : hand.result === 'surrender'
      ? 'var(--text-secondary)'
      : 'var(--result-loss)'

  const resultLabel =
    hand.result === 'blackjack' ? 'BLACKJACK' :
    hand.result === 'win' ? 'WIN' :
    hand.result === 'push' ? 'PUSH' :
    hand.result === 'surrender' ? 'SURRENDER' :
    hand.result === 'bust' ? 'BUST' :
    hand.result === 'loss' ? 'LOSE' : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 8,
        border: isActive ? '2px solid var(--gold-bright)' : '2px solid transparent',
        transition: 'border-color 150ms ease',
        minWidth: 120,
      }}
    >
      {label && (
        <span
          className="font-sans"
          style={{
            color: 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      )}

      <div style={{ display: 'flex', position: 'relative' }}>
        {hand.cards.map((card, i) => (
          <div key={i} style={{ marginLeft: i > 0 ? -24 : 0, zIndex: i }}>
            <CardComp card={card} faceDown={card.faceDown} />
          </div>
        ))}
        {hand.cards.length === 0 && (
          <div
            style={{
              width: 'var(--card-width)',
              height: 'var(--card-height)',
              borderRadius: 6,
              border: '1px dashed var(--chrome-border)',
              opacity: 0.3,
            }}
          />
        )}
      </div>

      {hand.cards.length > 0 && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            className="font-mono"
            style={{
              color: hand.isBust
                ? 'var(--result-loss)'
                : hand.isBlackjack
                ? 'var(--result-blackjack)'
                : 'var(--text-primary)',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {total}
          </span>
          {hand.isBlackjack && (
            <span className="font-display" style={{ color: 'var(--result-blackjack)', fontSize: 11, fontWeight: 700 }}>
              BJ
            </span>
          )}
          {hand.isBust && (
            <span className="font-sans" style={{ color: 'var(--result-loss)', fontSize: 11, fontWeight: 700 }}>
              BUST
            </span>
          )}
          {hand.doubled && (
            <span className="font-sans" style={{ color: hand.isFreeDouble ? '#27ae60' : 'var(--gold-pale)', fontSize: 10, fontWeight: 600 }}>
              2x
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {hand.bet > 0 && (
          <span className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            {formatCents(hand.bet)}
          </span>
        )}
        {hand.freeBet > 0 && (
          <FreeBetChipBadge label={`FREE +${formatCents(hand.freeBet)}`} />
        )}
        {hand.isFreeSplit && (
          <FreeBetChipBadge label="Split" />
        )}
      </div>

      {resultLabel && (
        <span
          className="font-display"
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: resultColor,
          }}
        >
          {resultLabel}
        </span>
      )}
    </div>
  )
}

function Push22Banner() {
  return (
    <div
      className="animate-result-appear"
      style={{
        backgroundColor: 'rgba(30, 100, 180, 0.18)',
        border: '1px solid rgba(80, 150, 230, 0.55)',
        boxShadow: '0 0 20px rgba(80, 150, 230, 0.3)',
        borderRadius: 8,
        padding: '12px 24px',
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      <div className="font-display text-result-lg" style={{ color: '#5aabff' }}>
        Push 22
      </div>
      <div className="font-mono text-result-sm" style={{ color: '#5aabff', opacity: 0.8, marginTop: 4 }}>
        Dealer bust — all hands push
      </div>
    </div>
  )
}

function FreeBetBJTableInner() {
  const { state, dispatch } = useFreeBetBJ()
  const { activeProfile } = useProfileStore()
  const profile = activeProfile()
  const [activeDenom, setActiveDenom] = useState<Denomination>(25)
  const [potOfGoldAmount, setPotOfGoldAmount] = useState(100)

  const sessionCents = profile?.sessionStakeCents ?? 0

  function handleChipClick(denom: Denomination) {
    setActiveDenom(denom)
    if (state.phase === 'betting') {
      const add = denom * 100
      const current = state.bet
      const max = state.config.tableLimits.maxBet
      const next = Math.min(current + add, max)
      dispatch({ type: 'PLACE_BET', amountCents: next })
    }
  }

  function handleDeal() {
    if (state.bet < state.config.tableLimits.minBet) return
    dispatch({ type: 'DEAL' })
  }

  function clearBet() {
    dispatch({ type: 'PLACE_BET', amountCents: 0 })
  }

  const dealerVisibleCards = state.dealerCards.filter(c => !c.faceDown)
  const dealerTotal = dealerVisibleCards.length > 0 ? cardTotal(dealerVisibleCards) : 0
  const showDealerTotal =
    state.phase !== 'player_turn' &&
    state.phase !== 'insurance' &&
    dealerVisibleCards.length > 0

  const isPush22 = state.phase === 'complete' &&
    state.events.some(e => e.type === 'PUSH_22')

  const primaryResult: HandResultType | null =
    state.phase === 'complete' && state.hands.length > 0
      ? (() => {
          const hasBlackjack = state.hands.some(h => h.isBlackjack && h.result === 'blackjack')
          const allResults = state.hands.map(h => h.result)
          const hasWin = allResults.some(r => r === 'win' || r === 'blackjack')
          const hasLoss = allResults.some(r => r === 'loss' || r === 'bust')
          const allPush = allResults.every(r => r === 'push' || r === 'surrender')
          if (hasBlackjack) return 'blackjack'
          if (allPush || isPush22) return 'push'
          if (hasWin && !hasLoss) return 'win'
          return 'loss'
        })()
      : null

  const netDisplay =
    state.phase === 'complete'
      ? (state.totalNetCents >= 0 ? '+' : '') + formatCents(state.totalNetCents)
      : null

  const canDeal = state.phase === 'betting' && state.bet >= state.config.tableLimits.minBet

  return (
    <div
      className="felt-texture"
      style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        backgroundColor: 'var(--felt-free-bet)',
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
        style={{
          color: 'var(--felt-print-strong)',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '0.06em',
          opacity: 0.6,
        }}
      >
        FREE BET BLACKJACK · PUSH 22
      </div>

      {state.dealerCards.length > 0 && (
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
            Dealer {showDealerTotal && dealerTotal > 0 ? dealerTotal : ''}
          </span>
          <div style={{ display: 'flex' }}>
            {state.dealerCards.map((card, i) => (
              <div key={i} style={{ marginLeft: i > 0 ? -24 : 0, zIndex: i }}>
                <CardComp card={card} faceDown={card.faceDown} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {state.hands.map((hand, i) => (
          <FreeBetBJHand
            key={hand.id}
            hand={hand}
            isActive={state.phase === 'player_turn' && i === state.activeHandIndex}
            label={state.hands.length > 1 ? `Hand ${i + 1}` : undefined}
          />
        ))}
      </div>

      {state.phase === 'complete' && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          {isPush22 ? (
            <Push22Banner />
          ) : primaryResult && netDisplay ? (
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
          ) : null}
        </div>
      )}

      {state.phase === 'betting' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <BetSpot
            label="BET"
            amountCents={state.bet}
            locked={false}
            onClick={() => {}}
            size={100}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            {state.bet > 0 && (
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
              Deal ({formatCents(state.bet)})
            </button>
          </div>
        </div>
      )}

      <FreeBetBJControls state={state} dispatch={dispatch} />

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
        <PotOfGoldPanel
          state={state}
          dispatch={dispatch}
          selectedAmount={potOfGoldAmount}
          onAmountChange={setPotOfGoldAmount}
        />
      </div>
    </div>
  )
}

export function FreeBetBJTable() {
  return (
    <GameErrorBoundary gameName="Free Bet Blackjack" onReset={() => {}}>
      <FreeBetBJTableInner />
    </GameErrorBoundary>
  )
}
