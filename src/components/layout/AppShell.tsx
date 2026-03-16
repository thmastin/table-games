import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { BuyInModal } from '../ui/BuyInModal'
import { useProfileStore } from '../../store/profileStore'

type Props = {
  children: ReactNode
}

const NON_GAME_ROUTES = new Set(['/', '/profile'])

export function AppShell({ children }: Props) {
  const location = useLocation()
  const activeProfile = useProfileStore(s => s.activeProfile())

  const isGameRoute = !NON_GAME_ROUTES.has(location.pathname)
  const needsBuyIn = isGameRoute && activeProfile !== null && activeProfile.sessionStakeCents === 0

  return (
    <div style={{ height: '100vh', backgroundColor: 'var(--chrome-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Nav />
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </main>
      {needsBuyIn && <BuyInModal />}
    </div>
  )
}
