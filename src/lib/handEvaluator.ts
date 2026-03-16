import type { Card, Rank } from './deck'

export type HandRank =
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush'

export type HandResult = {
  rank: HandRank
  value: number
  tiebreakers: number[]
}

export type EvalMode = '5-card' | '3-card' | 'best-of-6'

const RANK_ORDER: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
}

const HAND_VALUES: Record<HandRank, number> = {
  'high-card':       1,
  'pair':            2,
  'two-pair':        3,
  'three-of-a-kind': 4,
  'straight':        5,
  'flush':           6,
  'full-house':      7,
  'four-of-a-kind':  8,
  'straight-flush':  9,
  'royal-flush':     10,
}

const HAND_VALUES_3CARD: Record<HandRank, number> = {
  'high-card':       1,
  'pair':            2,
  'straight':        3,
  'flush':           4,
  'three-of-a-kind': 5,
  'straight-flush':  6,
  'royal-flush':     7,
  'two-pair':        0,
  'full-house':      0,
  'four-of-a-kind':  0,
}

function cardValue(card: Card): number {
  return RANK_ORDER[card.rank]
}

function sortDesc(nums: number[]): number[] {
  return [...nums].sort((a, b) => b - a)
}

function evaluate5Card(cards: Card[]): HandResult {
  const values = sortDesc(cards.map(cardValue))
  const suits = cards.map(c => c.suit)
  const isFlush = suits.every(s => s === suits[0])
  const isStraight = checkStraight5(values)
  const counts = getCounts(values)

  if (isFlush && isStraight) {
    if (values[0] === 14 && values[1] === 13) {
      return { rank: 'royal-flush', value: HAND_VALUES['royal-flush'], tiebreakers: values }
    }
    return { rank: 'straight-flush', value: HAND_VALUES['straight-flush'], tiebreakers: values }
  }
  if (counts[0]!.count === 4) {
    return { rank: 'four-of-a-kind', value: HAND_VALUES['four-of-a-kind'], tiebreakers: countsToTiebreakers(counts) }
  }
  if (counts[0]!.count === 3 && counts[1]!.count === 2) {
    return { rank: 'full-house', value: HAND_VALUES['full-house'], tiebreakers: countsToTiebreakers(counts) }
  }
  if (isFlush) {
    return { rank: 'flush', value: HAND_VALUES['flush'], tiebreakers: values }
  }
  if (isStraight) {
    return { rank: 'straight', value: HAND_VALUES['straight'], tiebreakers: values }
  }
  if (counts[0]!.count === 3) {
    return { rank: 'three-of-a-kind', value: HAND_VALUES['three-of-a-kind'], tiebreakers: countsToTiebreakers(counts) }
  }
  if (counts[0]!.count === 2 && counts[1]!.count === 2) {
    return { rank: 'two-pair', value: HAND_VALUES['two-pair'], tiebreakers: countsToTiebreakers(counts) }
  }
  if (counts[0]!.count === 2) {
    return { rank: 'pair', value: HAND_VALUES['pair'], tiebreakers: countsToTiebreakers(counts) }
  }
  return { rank: 'high-card', value: HAND_VALUES['high-card'], tiebreakers: values }
}

function evaluate3Card(cards: Card[]): HandResult {
  const values = sortDesc(cards.map(cardValue))
  const suits = cards.map(c => c.suit)
  const isFlush = suits.every(s => s === suits[0])
  const isStraight = checkStraight3(values)
  const counts = getCounts(values)

  if (isFlush && isStraight) {
    if (values[0] === 14 && values[1] === 13) {
      return { rank: 'royal-flush', value: HAND_VALUES_3CARD['royal-flush'], tiebreakers: values }
    }
    return { rank: 'straight-flush', value: HAND_VALUES_3CARD['straight-flush'], tiebreakers: values }
  }
  if (counts[0]!.count === 3) {
    return { rank: 'three-of-a-kind', value: HAND_VALUES_3CARD['three-of-a-kind'], tiebreakers: countsToTiebreakers(counts) }
  }
  if (isStraight) {
    return { rank: 'straight', value: HAND_VALUES_3CARD['straight'], tiebreakers: values }
  }
  if (isFlush) {
    return { rank: 'flush', value: HAND_VALUES_3CARD['flush'], tiebreakers: values }
  }
  if (counts[0]!.count === 2) {
    return { rank: 'pair', value: HAND_VALUES_3CARD['pair'], tiebreakers: countsToTiebreakers(counts) }
  }
  return { rank: 'high-card', value: HAND_VALUES_3CARD['high-card'], tiebreakers: values }
}

function evaluateBestOf6(cards: Card[]): HandResult {
  const combos = combinations(cards, 5)
  let best: HandResult | null = null
  for (const combo of combos) {
    const result = evaluate5Card(combo)
    if (!best || compareResults(result, best) > 0) {
      best = result
    }
  }
  return best!
}

export function evaluate(cards: Card[], mode: EvalMode): HandResult {
  if (mode === '5-card') return evaluate5Card(cards)
  if (mode === '3-card') return evaluate3Card(cards)
  return evaluateBestOf6(cards)
}

export function compareResults(a: HandResult, b: HandResult): number {
  if (a.value !== b.value) return a.value - b.value
  for (let i = 0; i < Math.min(a.tiebreakers.length, b.tiebreakers.length); i++) {
    if (a.tiebreakers[i] !== b.tiebreakers[i]) {
      return (a.tiebreakers[i] ?? 0) - (b.tiebreakers[i] ?? 0)
    }
  }
  return 0
}

function checkStraight5(sortedDesc: number[]): boolean {
  if (sortedDesc[0] === 14 && sortedDesc[1] === 5 &&
      sortedDesc[2] === 4 && sortedDesc[3] === 3 && sortedDesc[4] === 2) {
    return true
  }
  for (let i = 0; i < 4; i++) {
    if (sortedDesc[i]! - sortedDesc[i + 1]! !== 1) return false
  }
  return true
}

function checkStraight3(sortedDesc: number[]): boolean {
  if (sortedDesc[0] === 14 && sortedDesc[1] === 3 && sortedDesc[2] === 2) {
    return true
  }
  return sortedDesc[0]! - sortedDesc[1]! === 1 && sortedDesc[1]! - sortedDesc[2]! === 1
}

type RankCount = { rankVal: number; count: number }

function getCounts(sortedDesc: number[]): RankCount[] {
  const map = new Map<number, number>()
  for (const v of sortedDesc) {
    map.set(v, (map.get(v) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([rankVal, count]) => ({ rankVal, count }))
    .sort((a, b) => b.count - a.count || b.rankVal - a.rankVal)
}

function countsToTiebreakers(counts: RankCount[]): number[] {
  return counts.map(c => c.rankVal)
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  const withFirst = combinations(rest, k - 1).map(combo => [first!, ...combo])
  const withoutFirst = combinations(rest, k)
  return [...withFirst, ...withoutFirst]
}
