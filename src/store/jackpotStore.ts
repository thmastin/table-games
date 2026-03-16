import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type JackpotId = 'blackjack-progressive' | 'uth-progressive' | 'free-bet-pot-of-gold'

const SEED_AMOUNTS: Record<JackpotId, number> = {
  'blackjack-progressive': 1000000,
  'uth-progressive': 2500000,
  'free-bet-pot-of-gold': 500000,
}

const INCREMENT_RATES: Record<JackpotId, number> = {
  'blackjack-progressive': 100,
  'uth-progressive': 150,
  'free-bet-pot-of-gold': 75,
}

type JackpotState = {
  jackpots: Record<JackpotId, number>
  incrementJackpot: (id: JackpotId) => void
  resetJackpot: (id: JackpotId) => void
  getJackpot: (id: JackpotId) => number
}

export const useJackpotStore = create<JackpotState>()(
  persist(
    (set, get) => ({
      jackpots: {
        'blackjack-progressive': SEED_AMOUNTS['blackjack-progressive'],
        'uth-progressive': SEED_AMOUNTS['uth-progressive'],
        'free-bet-pot-of-gold': SEED_AMOUNTS['free-bet-pot-of-gold'],
      },

      incrementJackpot: (id) => {
        set(state => ({
          jackpots: {
            ...state.jackpots,
            [id]: state.jackpots[id] + INCREMENT_RATES[id],
          },
        }))
      },

      resetJackpot: (id) => {
        set(state => ({
          jackpots: {
            ...state.jackpots,
            [id]: SEED_AMOUNTS[id],
          },
        }))
      },

      getJackpot: (id) => get().jackpots[id],
    }),
    {
      name: 'casino_suite_v1_jackpots',
    }
  )
)
