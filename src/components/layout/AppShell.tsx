import type { ReactNode } from 'react'
import { Nav } from './Nav'

type Props = {
  children: ReactNode
}

export function AppShell({ children }: Props) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--chrome-bg)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  )
}
