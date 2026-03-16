import type { HandRank } from '../../lib/handEvaluator'
import { payout } from '../../lib/chips'

export const DEALER_QUALIFY_RANK = 'Q'

export const PAIR_PLUS_MULTIPLIERS: Partial<Record<HandRank, [number, number]>> = {
  'pair':            [1, 1],
  'flush':           [4, 1],
  'straight':        [6, 1],
  'three-of-a-kind': [30, 1],
  'straight-flush':  [40, 1],
  'royal-flush':     [40, 1],
}

export const ANTE_BONUS_MULTIPLIERS: Partial<Record<HandRank, [number, number]>> = {
  'straight':        [1, 1],
  'three-of-a-kind': [4, 1],
  'straight-flush':  [5, 1],
  'royal-flush':     [5, 1],
}

export const SIX_CARD_BONUS_MULTIPLIERS: Partial<Record<HandRank, [number, number]>> = {
  'three-of-a-kind': [5,    1],
  'straight':        [10,   1],
  'flush':           [15,   1],
  'full-house':      [25,   1],
  'four-of-a-kind':  [50,   1],
  'straight-flush':  [200,  1],
  'royal-flush':     [1000, 1],
}

export function pairPlusPayout(bet: number, rank: HandRank): number {
  const multiplier = PAIR_PLUS_MULTIPLIERS[rank]
  if (!multiplier) return 0
  return payout(bet, multiplier[0], multiplier[1])
}

export function anteBonusPayout(bet: number, rank: HandRank): number {
  const multiplier = ANTE_BONUS_MULTIPLIERS[rank]
  if (!multiplier) return 0
  return payout(bet, multiplier[0], multiplier[1])
}

export function sixCardBonusPayout(bet: number, rank: HandRank): number {
  const multiplier = SIX_CARD_BONUS_MULTIPLIERS[rank]
  if (!multiplier) return 0
  return payout(bet, multiplier[0], multiplier[1])
}
