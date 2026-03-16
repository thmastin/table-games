import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, GameId, GameStats } from './types'

const STARTING_BANK_CENTS = 500000
const HIGH_ROLLER_BANK_CENTS = 2500000

function defaultStats(): Record<GameId, GameStats> {
  const games: GameId[] = [
    'blackjack', 'free-bet-blackjack', 'three-card-poker',
    'ultimate-texas-holdem', 'baccarat', 'mississippi-stud',
    'let-it-ride', 'roulette', 'craps',
  ]
  const empty: GameStats = {
    handsPlayed: 0,
    handsWon: 0,
    biggestWin: 0,
    netPnl: 0,
    currentStreak: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
  }
  return Object.fromEntries(games.map(g => [g, { ...empty }])) as Record<GameId, GameStats>
}

function makeProfile(name: string, highRoller = false): Profile {
  return {
    id: crypto.randomUUID(),
    name,
    bankCents: highRoller ? HIGH_ROLLER_BANK_CENTS : STARTING_BANK_CENTS,
    sessionStakeCents: 0,
    stats: defaultStats(),
    createdAt: new Date().toISOString(),
  }
}

type ProfileState = {
  profiles: Profile[]
  activeProfileId: string | null
  activeProfile: () => Profile | null
  createProfile: (name: string, highRoller?: boolean) => void
  deleteProfile: (id: string) => void
  setActiveProfile: (id: string) => void
  withdrawToSession: (cents: number) => void
  returnSessionToBank: () => void
  addToBankroll: (cents: number) => void
  subtractFromBankroll: (cents: number) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,

      activeProfile: () => {
        const { profiles, activeProfileId } = get()
        return profiles.find(p => p.id === activeProfileId) ?? null
      },

      createProfile: (name, highRoller = false) => {
        const profile = makeProfile(name, highRoller)
        set(state => ({
          profiles: [...state.profiles, profile],
          activeProfileId: state.activeProfileId ?? profile.id,
        }))
      },

      deleteProfile: (id) => {
        set(state => ({
          profiles: state.profiles.filter(p => p.id !== id),
          activeProfileId: state.activeProfileId === id ? null : state.activeProfileId,
        }))
      },

      setActiveProfile: (id) => {
        set({ activeProfileId: id })
      },

      withdrawToSession: (cents) => {
        set(state => ({
          profiles: state.profiles.map(p =>
            p.id === state.activeProfileId
              ? { ...p, bankCents: p.bankCents - cents, sessionStakeCents: p.sessionStakeCents + cents }
              : p
          ),
        }))
      },

      returnSessionToBank: () => {
        set(state => ({
          profiles: state.profiles.map(p =>
            p.id === state.activeProfileId
              ? { ...p, bankCents: p.bankCents + p.sessionStakeCents, sessionStakeCents: 0 }
              : p
          ),
        }))
      },

      addToBankroll: (cents) => {
        set(state => ({
          profiles: state.profiles.map(p =>
            p.id === state.activeProfileId
              ? { ...p, sessionStakeCents: p.sessionStakeCents + cents }
              : p
          ),
        }))
      },

      subtractFromBankroll: (cents) => {
        set(state => ({
          profiles: state.profiles.map(p =>
            p.id === state.activeProfileId
              ? { ...p, sessionStakeCents: p.sessionStakeCents - cents }
              : p
          ),
        }))
      },
    }),
    {
      name: 'casino_suite_v1',
    }
  )
)
