import { Link, useLocation } from 'react-router-dom'
import { useProfileStore } from '../../store/profileStore'
import { formatCents } from '../../lib/chips'

export function Nav() {
  const location = useLocation()
  const activeProfile = useProfileStore(s => s.activeProfile())

  const isLobby = location.pathname === '/'

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
