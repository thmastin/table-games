import { useNavigate } from 'react-router-dom'

type GameCard = {
  id: string
  name: string
  phase: 1 | 2 | 3
  felt: string
  description: string
  path: string
  available: boolean
}

const GAMES: GameCard[] = [
  { id: 'blackjack', name: 'Blackjack', phase: 1, felt: 'var(--felt-blackjack)', description: '6-Deck · Dealer Stands Soft 17 · Late Surrender', path: '/blackjack', available: true },
  { id: 'three-card-poker', name: 'Three Card Poker', phase: 1, felt: 'var(--felt-blackjack)', description: 'Ante/Play · Pair Plus · 6-Card Bonus', path: '/three-card-poker', available: true },
  { id: 'ultimate-texas-holdem', name: 'Ultimate Texas Hold\'Em', phase: 1, felt: 'var(--felt-uth)', description: 'Ante/Play/Blind · Trips · Progressive', path: '/uth', available: true },
  { id: 'free-bet-blackjack', name: 'Free Bet Blackjack', phase: 1, felt: 'var(--felt-free-bet)', description: 'Free Doubles & Splits · Push 22', path: '/free-bet-bj', available: true },
  { id: 'baccarat', name: 'Baccarat', phase: 2, felt: 'var(--felt-baccarat)', description: 'Standard & EZ · Dragon Bonus · Panda 8', path: '/baccarat', available: false },
  { id: 'mississippi-stud', name: 'Mississippi Stud', phase: 2, felt: 'var(--felt-mississippi)', description: '3-Card Bonus Side Bet', path: '/mississippi-stud', available: false },
  { id: 'let-it-ride', name: 'Let It Ride', phase: 2, felt: 'var(--felt-let-it-ride)', description: '$1 Tournament Bonus', path: '/let-it-ride', available: false },
  { id: 'roulette', name: 'Roulette', phase: 2, felt: 'var(--felt-roulette)', description: 'American & European · La Partage', path: '/roulette', available: false },
  { id: 'craps', name: 'Craps', phase: 3, felt: 'var(--felt-craps)', description: 'Pass/Don\'t Pass · Come · Place · Fire Bet', path: '/craps', available: false },
]

export function Home() {
  const navigate = useNavigate()
  return (
    <div
      className="lobby"
      style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        backgroundColor: 'var(--chrome-bg)',
        padding: '48px 32px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <h1
          className="font-display"
          style={{
            color: 'var(--gold-pale)',
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Casino Suite
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            textAlign: 'center',
            marginBottom: 48,
            fontSize: 16,
          }}
        >
          Choose your game
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {GAMES.map(game => (
            <div
              key={game.id}
              style={{
                backgroundColor: 'var(--chrome-panel)',
                border: '1px solid var(--chrome-border)',
                borderRadius: 12,
                overflow: 'hidden',
                opacity: game.available ? 1 : 0.6,
                cursor: game.available ? 'pointer' : 'default',
                textDecoration: 'none',
                transition: 'transform 120ms ease, box-shadow 120ms ease',
              }}
              onMouseEnter={e => {
                if (game.available) {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = ''
                ;(e.currentTarget as HTMLElement).style.boxShadow = ''
              }}
              onClick={() => game.available && navigate(game.path)}
            >
              <div
                className="felt-texture"
                style={{
                  height: 80,
                  backgroundColor: game.felt,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    color: 'var(--felt-print-strong)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Phase {game.phase}
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div
                  className="font-display"
                  style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}
                >
                  {game.name}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {game.description}
                </div>
                {!game.available && (
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-dim)',
                    }}
                  >
                    Coming Soon
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
