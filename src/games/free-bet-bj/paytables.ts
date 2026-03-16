import type { Card } from '../../lib/deck'
import { payout } from '../../lib/chips'

export function cardTotal(cards: Card[]): number {
  let total = 0
  let aces = 0
  for (const c of cards) {
    if (c.rank === 'A') {
      aces++
      total += 11
    } else if (['10', 'J', 'Q', 'K'].includes(c.rank)) {
      total += 10
    } else {
      total += parseInt(c.rank, 10)
    }
    while (total > 21 && aces > 0) {
      total -= 10
      aces--
    }
  }
  return total
}

export function calcPotOfGold(
  ace1: Card,
  ace2: Card,
  betCents: number,
): { netCents: number; isJackpot: boolean } {
  const sameSuit = ace1.suit === ace2.suit
  const isRed = (c: Card) => c.suit === 'hearts' || c.suit === 'diamonds'
  const sameColor = isRed(ace1) === isRed(ace2)

  if (sameSuit) {
    return { netCents: 0, isJackpot: true }
  }
  if (sameColor) {
    return { netCents: payout(betCents, 25, 1), isJackpot: false }
  }
  return { netCents: payout(betCents, 10, 1), isJackpot: false }
}
