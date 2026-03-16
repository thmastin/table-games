import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameId, GameStats, HallOfFame, HallOfFameEntry } from './types'

const HOF_MAX = 10

type StatsState = {
  stats: Record<string, Record<GameId, GameStats>>
  hof: HallOfFame
  recordHandResult: (profileId: string, game: GameId, won: boolean, netCents: number) => void
  updateHallOfFame: (profileName: string, bankCents: number, biggestWin: number, winStreak: number) => void
  getStats: (profileId: string, game: GameId) => GameStats | null
}

function emptyStats(): GameStats {
  return {
    handsPlayed: 0,
    handsWon: 0,
    biggestWin: 0,
    netPnl: 0,
    currentStreak: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
  }
}

function insertHof(list: HallOfFameEntry[], entry: HallOfFameEntry, ascending = false): HallOfFameEntry[] {
  const updated = [...list, entry]
    .sort((a, b) => ascending ? a.value - b.value : b.value - a.value)
    .slice(0, HOF_MAX)
  return updated
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      stats: {},
      hof: {
        topBankrolls: [],
        biggestSingleWins: [],
        longestWinStreaks: [],
      },

      recordHandResult: (profileId, game, won, netCents) => {
        set(state => {
          const profileStats = state.stats[profileId] ?? {} as Record<GameId, GameStats>
          const current = profileStats[game] ?? emptyStats()

          let currentStreak = current.currentStreak
          let longestWinStreak = current.longestWinStreak
          let longestLossStreak = current.longestLossStreak

          if (won) {
            currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1
            longestWinStreak = Math.max(longestWinStreak, currentStreak)
          } else {
            currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1
            longestLossStreak = Math.max(longestLossStreak, Math.abs(currentStreak))
          }

          const updated: GameStats = {
            handsPlayed: current.handsPlayed + 1,
            handsWon: current.handsWon + (won ? 1 : 0),
            biggestWin: won ? Math.max(current.biggestWin, netCents) : current.biggestWin,
            netPnl: current.netPnl + netCents,
            currentStreak,
            longestWinStreak,
            longestLossStreak,
          }

          return {
            stats: {
              ...state.stats,
              [profileId]: { ...profileStats, [game]: updated },
            },
          }
        })
      },

      updateHallOfFame: (profileName, bankCents, biggestWin, winStreak) => {
        const date = new Date().toISOString()
        set(state => ({
          hof: {
            topBankrolls: insertHof(state.hof.topBankrolls, { profileName, value: bankCents, date }),
            biggestSingleWins: insertHof(state.hof.biggestSingleWins, { profileName, value: biggestWin, date }),
            longestWinStreaks: insertHof(state.hof.longestWinStreaks, { profileName, value: winStreak, date }),
          },
        }))
      },

      getStats: (profileId, game) => {
        const profileStats = get().stats[profileId]
        return profileStats?.[game] ?? null
      },
    }),
    {
      name: 'casino_suite_v1_stats',
    }
  )
)
