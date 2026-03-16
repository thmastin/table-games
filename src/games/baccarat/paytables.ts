import { payout } from '../../lib/chips'

export function payPlayerWin(bet: number): number {
  return payout(bet, 1, 1)
}

export function payBankerWinStandard(bet: number): number {
  return payout(bet, 19, 20)
}

export function payBankerWinEZ(bet: number): number {
  return payout(bet, 1, 1)
}

export function payTie(bet: number): number {
  return payout(bet, 8, 1)
}

export function payDragonBonus(bet: number, isNatural: boolean, margin: number): number {
  if (isNatural) {
    return payout(bet, 1, 1)
  }
  if (margin <= 3) {
    return 0
  }
  if (margin === 4) return payout(bet, 1, 1)
  if (margin === 5) return payout(bet, 2, 1)
  if (margin === 6) return payout(bet, 4, 1)
  if (margin === 7) return payout(bet, 6, 1)
  if (margin === 8) return payout(bet, 10, 1)
  return payout(bet, 30, 1)
}

export function payPanda8(bet: number): number {
  return payout(bet, 25, 1)
}
