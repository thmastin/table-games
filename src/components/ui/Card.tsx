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
      <div className={`card-flip-inner ${!isDown ? 'flipped' : ''}`}>
        <div className="card-back-face card-back-pattern" />
        <div
          className="card-face"
          style={{
            backgroundColor: 'var(--card-face)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '4px 6px',
          }}
        >
          {card && (
            <>
              <span
                className="font-card text-card-sm"
                style={{ color: RED_SUITS.has(card.suit) ? 'var(--suit-red)' : 'var(--suit-black)' }}
              >
                {card.rank}
                <br />
                {SUIT_SYMBOLS[card.suit]}
              </span>
              <span
                className="font-card text-card-lg self-center"
                style={{
                  color: RED_SUITS.has(card.suit) ? 'var(--suit-red)' : 'var(--suit-black)',
                  transform: 'rotate(180deg)',
                }}
              >
                {card.rank}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
