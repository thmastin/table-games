import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AppShell } from './components/layout/AppShell'
import { Home } from './pages/Home'
import { ProfilePage } from './pages/ProfilePage'
import { BlackjackTable } from './games/blackjack/components/BlackjackTable'
import { ThreeCardPokerTable } from './games/three-card-poker/components/ThreeCardPokerTable'
import { UTHTable } from './games/uth/components/UTHTable'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/blackjack" element={<BlackjackTable />} />
          <Route path="/three-card-poker" element={<ThreeCardPokerTable />} />
          <Route path="/uth" element={<UTHTable />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  </StrictMode>,
)
