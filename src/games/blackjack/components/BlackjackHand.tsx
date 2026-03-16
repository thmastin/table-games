import { Card } from '../../../components/ui/Card'
import { formatCents } from '../../../lib/chips'
import { cardTotal } from '../paytables'
import type { Hand } from '../types'

type Props = {
  hand: Hand
  isDealer?: boolean
  isActive?: boolean
  label?: string
}

export function BlackjackHand({ hand, isDealer = false, isActive = false, label }: Props) {
  const total = cardTotal(hand.cards.filter(c => !c.faceDown))
  const showTotal = hand.cards.length > 0 && !isDealer

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
          style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          {label}
        </span>
      )}

      <div style={{ display: 'flex', gap: -8, position: 'relative' }}>
        {hand.cards.map((card, i) => (
          <div key={i} style={{ marginLeft: i > 0 ? -24 : 0, zIndex: i }}>
            <Card card={card} faceDown={card.faceDown} />
          </div>
        ))}
        {hand.cards.length === 0 && (
          <div style={{ width: 'var(--card-width)', height: 'var(--card-height)', borderRadius: 6, border: '1px dashed var(--chrome-border)', opacity: 0.3 }} />
        )}
      </div>

      {showTotal && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            className="font-mono"
            style={{
              color: hand.isBust ? 'var(--result-loss)' : hand.isBlackjack ? 'var(--result-blackjack)' : 'var(--text-primary)',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {total}
          </span>
          {hand.isBlackjack && (
            <span className="font-display" style={{ color: 'var(--result-blackjack)', fontSize: 11, fontWeight: 700 }}>BJ</span>
          )}
          {hand.isBust && (
            <span className="font-sans" style={{ color: 'var(--result-loss)', fontSize: 11, fontWeight: 700 }}>BUST</span>
          )}
          {hand.doubled && (
            <span className="font-sans" style={{ color: 'var(--gold-pale)', fontSize: 10, fontWeight: 600 }}>2x</span>
          )}
        </div>
      )}

      {!isDealer && hand.betCents > 0 && (
        <span className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          {formatCents(hand.betCents)}
        </span>
      )}

      {hand.result && (
        <span
          className="font-display"
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color:
              hand.result === 'win' || hand.result === 'blackjack' ? 'var(--result-win)' :
              hand.result === 'push' ? 'var(--result-push)' :
              'var(--result-loss)',
          }}
        >
          {hand.result === 'blackjack' ? 'BLACKJACK' :
           hand.result === 'win' ? 'WIN' :
           hand.result === 'push' ? 'PUSH' :
           hand.result === 'surrender' ? 'SURRENDER' :
           hand.result === 'bust' ? 'BUST' :
           'LOSE'}
        </span>
      )}
    </div>
  )
}
