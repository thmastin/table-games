import type { Card } from '../../lib/deck'
import { evaluate } from '../../lib/handEvaluator'
import { payout } from '../../lib/chips'
import type { SideBetId } from './types'

function cardTotal(cards: Card[]): number {
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

export function calcPerfectPairs(c1: Card, c2: Card, betCents: number): number {
  if (c1.rank !== c2.rank) return 0
  const sameColor =
    (c1.suit === 'hearts' || c1.suit === 'diamonds') ===
    (c2.suit === 'hearts' || c2.suit === 'diamonds')
  const sameSuit = c1.suit === c2.suit
  if (sameSuit) return payout(betCents, 30, 1)
  if (sameColor) return payout(betCents, 10, 1)
  return payout(betCents, 5, 1)
}

export function calc21Plus3(c1: Card, c2: Card, dealer: Card, betCents: number): number {
  const result = evaluate([c1, c2, dealer], '3-card')
  switch (result.rank) {
    case 'straight-flush':
    case 'royal-flush':
      return result.rank === 'royal-flush' || (c1.suit === c2.suit && c2.suit === dealer.suit)
        ? payout(betCents, 100, 1)
        : payout(betCents, 40, 1)
    case 'three-of-a-kind':
      return payout(betCents, 30, 1)
    case 'straight':
      return payout(betCents, 10, 1)
    case 'flush':
      return payout(betCents, 5, 1)
    default:
      return 0
  }
}

export function calcLuckyLadies(
  c1: Card,
  c2: Card,
  dealerHand: Card[],
  betCents: number,
): number {
  const total = cardTotal([c1, c2])
  if (total !== 20) return 0

  const dealerHasBlackjack =
    dealerHand.length === 2 &&
    cardTotal(dealerHand) === 21

  const isQueenOfHearts = (c: Card) => c.rank === 'Q' && c.suit === 'hearts'
  if (isQueenOfHearts(c1) && isQueenOfHearts(c2)) {
    return dealerHasBlackjack
      ? payout(betCents, 1000, 1)
      : payout(betCents, 125, 1)
  }
  if (c1.rank === c2.rank && c1.suit === c2.suit) return payout(betCents, 19, 1)
  if (c1.rank === c2.rank && c1.suit[0] === c2.suit[0]) return payout(betCents, 9, 1)
  return payout(betCents, 4, 1)
}

export function calcBustIt(dealerCards: Card[], betCents: number): number {
  const total = cardTotal(dealerCards)
  if (total <= 21) return 0
  const bustCount = dealerCards.length
  if (bustCount === 3) return payout(betCents, 1, 1)
  if (bustCount === 4) return payout(betCents, 2, 1)
  if (bustCount === 5) return payout(betCents, 9, 1)
  if (bustCount === 6) return payout(betCents, 18, 1)
  if (bustCount === 7) return payout(betCents, 50, 1)
  return payout(betCents, 250, 1)
}

export function calcMatchTheDealer(
  c1: Card,
  c2: Card,
  dealer: Card,
  betCents: number,
): number {
  let winnings = 0
  const rankMatch1 = c1.rank === dealer.rank
  const rankMatch2 = c2.rank === dealer.rank
  if (rankMatch1) {
    winnings += c1.suit === dealer.suit
      ? payout(betCents, 9, 1)
      : payout(betCents, 4, 1)
  }
  if (rankMatch2) {
    winnings += c2.suit === dealer.suit
      ? payout(betCents, 9, 1)
      : payout(betCents, 4, 1)
  }
  return winnings
}

export function calcRoyalMatch(c1: Card, c2: Card, betCents: number): number {
  if (c1.suit !== c2.suit) return 0
  const isRoyalMatch =
    (c1.rank === 'K' && c2.rank === 'Q') ||
    (c1.rank === 'Q' && c2.rank === 'K')
  return isRoyalMatch
    ? payout(betCents, 25, 1)
    : payout(betCents, 5, 2)
}

export type SideBetCalcParams = {
  id: SideBetId
  betCents: number
  playerCards: [Card, Card]
  dealerCards: Card[]
}

export function calcSideBet({ id, betCents, playerCards, dealerCards }: SideBetCalcParams): number {
  const [c1, c2] = playerCards
  const upcard = dealerCards[0]!

  switch (id) {
    case 'perfect-pairs':
      return calcPerfectPairs(c1, c2, betCents)
    case '21plus3':
      return calc21Plus3(c1, c2, upcard, betCents)
    case 'lucky-ladies':
      return calcLuckyLadies(c1, c2, dealerCards, betCents)
    case 'bust-it':
      return calcBustIt(dealerCards, betCents)
    case 'match-the-dealer':
      return calcMatchTheDealer(c1, c2, upcard, betCents)
    case 'royal-match':
      return calcRoyalMatch(c1, c2, betCents)
  }
}

export { cardTotal }
