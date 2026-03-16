import type { RNG } from './rng'

export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export type Card = {
  rank: Rank
  suit: Suit
  faceDown: boolean
}

export type Shoe = {
  cards: Card[]
  numDecks: number
  dealtCount: number
}

const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades']
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

export function makeCard(rank: Rank, suit: Suit, faceDown = false): Card {
  return { rank, suit, faceDown }
}

export function makeDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(rank, suit))
    }
  }
  return deck
}

export function shuffle(cards: Card[], rng: RNG): Card[] {
  const result = [...cards]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    const tmp = result[i]!
    result[i] = result[j]!
    result[j] = tmp
  }
  return result
}

export function makeShoe(numDecks: number, rng: RNG): Shoe {
  const cards: Card[] = []
  for (let d = 0; d < numDecks; d++) {
    cards.push(...makeDeck())
  }
  return {
    cards: shuffle(cards, rng),
    numDecks,
    dealtCount: 0,
  }
}

export function dealCard(shoe: Shoe, faceDown = false): { card: Card; shoe: Shoe } {
  if (shoe.dealtCount >= shoe.cards.length) {
    throw new Error('Shoe is empty')
  }
  const card = { ...shoe.cards[shoe.dealtCount]!, faceDown }
  return {
    card,
    shoe: { ...shoe, dealtCount: shoe.dealtCount + 1 },
  }
}

export function cardsRemaining(shoe: Shoe): number {
  return shoe.cards.length - shoe.dealtCount
}

export function penetration(shoe: Shoe): number {
  return shoe.dealtCount / shoe.cards.length
}
