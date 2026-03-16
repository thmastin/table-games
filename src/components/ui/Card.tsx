import type { Card as CardType } from '../../lib/deck'

type Props = {
  card?: CardType
  faceDown?: boolean
  className?: string
}

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const RED_SUITS = new Set(['hearts', 'diamonds'])

export function Card({ card, faceDown, className = '' }: Props) {
  const isDown = faceDown || card?.faceDown || !card

  return (
    <div className={`card-flip-container ${className}`} style={{ width: 'var(--card-width)', height: 'var(--card-height)' }}>
      <div className={`card-flip-inner ${isDown ? 'flipped' : ''}`}>
        <div className="card-back-face card-back-pattern" />
        <div
          className="card-face"
          style={{
            backgroundColor: 'var(--card-face)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--shadow-card)',
            position: 'relative',
            padding: '4px 6px',
          }}
        >
          {card && (
            <>
              {/* top-left corner */}
              <span
                className="font-card text-card-sm"
                style={{
                  color: RED_SUITS.has(card.suit) ? 'var(--suit-red)' : 'var(--suit-black)',
                  position: 'absolute',
                  top: 4,
                  left: 6,
                  lineHeight: 1.2,
                  userSelect: 'none',
                }}
              >
                {card.rank}
                <br />
                {SUIT_SYMBOLS[card.suit]}
              </span>

              {/* center pip */}
              <span
                className="font-card"
                style={{
                  color: RED_SUITS.has(card.suit) ? 'var(--suit-red)' : 'var(--suit-black)',
                  fontSize: 28,
                  lineHeight: 1,
                  userSelect: 'none',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {SUIT_SYMBOLS[card.suit]}
              </span>

              {/* bottom-right corner */}
              <span
                className="font-card text-card-sm"
                style={{
                  color: RED_SUITS.has(card.suit) ? 'var(--suit-red)' : 'var(--suit-black)',
                  position: 'absolute',
                  bottom: 4,
                  right: 6,
                  lineHeight: 1.2,
                  userSelect: 'none',
                  transform: 'rotate(180deg)',
                }}
              >
                {card.rank}
                <br />
                {SUIT_SYMBOLS[card.suit]}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
