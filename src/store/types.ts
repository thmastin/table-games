export type GameId =
  | 'blackjack'
  | 'free-bet-blackjack'
  | 'three-card-poker'
  | 'ultimate-texas-holdem'
  | 'baccarat'
  | 'mississippi-stud'
  | 'let-it-ride'
  | 'roulette'
  | 'craps'

export type GameStats = {
  handsPlayed: number
  handsWon: number
  biggestWin: number
  netPnl: number
  currentStreak: number
  longestWinStreak: number
  longestLossStreak: number
}

export type HallOfFameEntry = {
  profileName: string
  value: number
  date: string
}

export type HallOfFame = {
  topBankrolls: HallOfFameEntry[]
  biggestSingleWins: HallOfFameEntry[]
  longestWinStreaks: HallOfFameEntry[]
}

export type Profile = {
  id: string
  name: string
  bankCents: number
  sessionStakeCents: number
  stats: Record<GameId, GameStats>
  createdAt: string
}
