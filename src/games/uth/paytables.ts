import { payout } from '../../lib/chips'
import type { HandRank } from '../../lib/handEvaluator'

// Blind bet paytable — only pays on straight or better when player wins
// Pair or two-pair while winning: push (return bet, net 0)
// Less than pair (impossible to win with high-card vs dealer pair+ qualifier, but handled anyway): loss
const BLIND_PAYS: Partial<Record<HandRank, { numerator: number; denominator: number }>> = {
  'straight':        { numerator: 1,   denominator: 1 },
  'flush':           { numerator: 3,   denominator: 2 },
  'full-house':      { numerator: 3,   denominator: 1 },
  'four-of-a-kind':  { numerator: 10,  denominator: 1 },
  'straight-flush':  { numerator: 50,  denominator: 1 },
  'royal-flush':     { numerator: 500, denominator: 1 },
}

// Returns net gain on blind bet (positive = win, 0 = push, negative = loss)
// Call this only when the player wins the hand — if player loses, blind loses regardless
export function blindPayout(bet: number, playerRank: HandRank): number {
  const pays = BLIND_PAYS[playerRank]
  if (pays) {
    return payout(bet, pays.numerator, pays.denominator)
  }
  // pair or two-pair (or three-of-a-kind is covered above): push
  if (playerRank === 'three-of-a-kind') {
    return payout(bet, 3, 1)
  }
  // pair, two-pair, high-card: push (net 0)
  return 0
}

// Returns true if the blind bet pushes (player wins but hand is below straight)
export function blindPushes(playerRank: HandRank): boolean {
  return (
    playerRank === 'pair' ||
    playerRank === 'two-pair' ||
    playerRank === 'high-card'
  )
}

// Trips paytable — independent of hand outcome
// Returns winnings (net gain) or 0 if no win (caller handles the loss = -bet)
const TRIPS_PAYS: Partial<Record<HandRank, { numerator: number; denominator: number }>> = {
  'three-of-a-kind': { numerator: 3,  denominator: 1 },
  'straight':        { numerator: 4,  denominator: 1 },
  'flush':           { numerator: 7,  denominator: 1 },
  'full-house':      { numerator: 8,  denominator: 1 },
  'four-of-a-kind':  { numerator: 30, denominator: 1 },
  'straight-flush':  { numerator: 40, denominator: 1 },
  'royal-flush':     { numerator: 50, denominator: 1 },
}

export function tripsPayout(bet: number, rank: HandRank): number {
  const pays = TRIPS_PAYS[rank]
  if (!pays) return 0
  return payout(bet, pays.numerator, pays.denominator)
}

export function tripsWins(rank: HandRank): boolean {
  return rank in TRIPS_PAYS
}
