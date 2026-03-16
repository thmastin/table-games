import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useProfileStore } from '../../store/profileStore'
import { formatCents } from '../../lib/chips'

const NON_GAME_ROUTES = new Set(['/', '/profile'])

export function Nav() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeProfile = useProfileStore(s => s.activeProfile())
  const returnSessionToBank = useProfileStore(s => s.returnSessionToBank)

  const isLobby = location.pathname === '/'
  const isGameRoute = !NON_GAME_ROUTES.has(location.pathname)

  function handleCashOut() {
    returnSessionToBank()
    navigate('/')
  }

  return (
    <nav className="site-nav">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span className="nav-game-title">Casino Suite</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {activeProfile && (
          <>
            <span className="nav-bankroll">
              {isLobby
                ? formatCents(activeProfile.bankCents)
                : formatCents(activeProfile.sessionStakeCents)}
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
              {activeProfile.name}
            </span>
          </>
        )}
        {isGameRoute && activeProfile && activeProfile.sessionStakeCents > 0 && (
          <button
            onClick={handleCashOut}
            className="font-sans"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--chrome-border)',
              borderRadius: 5,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.04em',
              padding: '4px 10px',
            }}
          >
            Cash Out
          </button>
        )}
        <Link
          to="/profile"
          style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none' }}
        >
          Profile
        </Link>
      </div>
    </nav>
  )
}
