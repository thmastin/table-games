import { createRNG } from '../../lib/rng'
import { makeShoe, dealCard, penetration } from '../../lib/deck'
import type { Card, Shoe } from '../../lib/deck'
import {
  payPlayerWin,
  payBankerWinStandard,
  payBankerWinEZ,
  payTie,
  payDragonBonus,
  payPanda8,
} from './paytables'
import type { BaccaratConfig, BaccaratState, BaccaratCommand, BaccaratEvent, DispatchResult } from './types'

const NUM_DECKS = 8
const RESHUFFLE_PENETRATION = 0.75

const DEFAULT_CONFIG: BaccaratConfig = {
  variant: 'standard',
  tableLimits: { min: 2500, max: 100000 },
}

function cardValue(card: Card): number {
  if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 0
  if (card.rank === 'A') return 1
  return parseInt(card.rank, 10)
}

function handTotal(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + cardValue(c), 0) % 10
}

function isNaturalTotal(total: number): boolean {
  return total === 8 || total === 9
}

function playerShouldDraw(playerTotal: number): boolean {
  return playerTotal <= 5
}

function bankerShouldDraw(bankerTotal: number, playerDrewThirdCard: boolean, playerThirdCard: Card | null): boolean {
  if (bankerTotal >= 7) return false

  if (!playerDrewThirdCard) {
    return bankerTotal <= 5
  }

  const p3 = playerThirdCard !== null ? cardValue(playerThirdCard) : 0

  switch (bankerTotal) {
    case 0:
    case 1:
    case 2:
      return true
    case 3:
      return p3 !== 8
    case 4:
      return p3 >= 2 && p3 <= 7
    case 5:
      return p3 >= 4 && p3 <= 7
    case 6:
      return p3 === 6 || p3 === 7
    default:
      return false
  }
}

function isDragonHand(bankerCards: Card[], bankerTotal: number): boolean {
  return bankerCards.length === 3 && bankerTotal === 7
}

function isPanda8(playerCards: Card[], playerTotal: number): boolean {
  return playerCards.length === 3 && playerTotal === 8
}

interface Shoe2 {
  shoe: Shoe
}

function drawCard(shoe: Shoe, faceDown = false): { card: Card; shoe: Shoe } {
  return dealCard(shoe, faceDown)
}

function makeInitialState(config: BaccaratConfig, existingShoe?: Shoe): BaccaratState {
  const seed = Math.floor(Math.random() * 0xffffffff)
  const rng = createRNG(seed)
  const shoe = existingShoe ?? makeShoe(NUM_DECKS, rng)
  return {
    phase: 'betting',
    variant: config.variant,
    playerCards: [],
    bankerCards: [],
    playerTotal: 0,
    bankerTotal: 0,
    result: null,
    isNatural: false,
    isDragonHand: false,
    playerBet: 0,
    bankerBet: 0,
    tieBet: 0,
    dragonBonus: { side: null, amount: 0 },
    panda8: 0,
    playerBetResult: null,
    bankerBetResult: null,
    tieBetResult: null,
    dragonBonusResult: null,
    panda8Result: null,
    seed,
  }
}

function reshuffleIfNeeded(shoe: Shoe, config: BaccaratConfig): Shoe {
  if (penetration(shoe) >= RESHUFFLE_PENETRATION) {
    const seed = Math.floor(Math.random() * 0xffffffff)
    const rng = createRNG(seed)
    return makeShoe(NUM_DECKS, rng)
  }
  return shoe
}

function resolvePayouts(
  state: BaccaratState,
  result: 'player' | 'banker' | 'tie',
  playerCards: Card[],
  bankerCards: Card[],
  playerTotal: number,
  bankerTotal: number,
  natural: boolean,
  dragonHand: boolean,
  events: BaccaratEvent[]
): BaccaratState {
  let playerBetResult: number | null = null
  let bankerBetResult: number | null = null
  let tieBetResult: number | null = null
  let dragonBonusResult: number | null = null
  let panda8Result: number | null = null

  if (state.playerBet > 0) {
    if (result === 'tie') {
      playerBetResult = 0
    } else if (result === 'player') {
      playerBetResult = payPlayerWin(state.playerBet)
    } else {
      playerBetResult = -state.playerBet
    }
    events.push({ type: 'PAYOUT', bet: 'player', netCents: playerBetResult })
  }

  if (state.bankerBet > 0) {
    if (result === 'tie') {
      bankerBetResult = 0
    } else if (result === 'banker') {
      if (dragonHand) {
        bankerBetResult = 0
      } else if (state.variant === 'standard') {
        bankerBetResult = payBankerWinStandard(state.bankerBet)
      } else {
        bankerBetResult = payBankerWinEZ(state.bankerBet)
      }
    } else {
      bankerBetResult = -state.bankerBet
    }
    events.push({ type: 'PAYOUT', bet: 'banker', netCents: bankerBetResult })
  }

  if (state.tieBet > 0) {
    if (result === 'tie') {
      tieBetResult = payTie(state.tieBet)
    } else {
      tieBetResult = -state.tieBet
    }
    events.push({ type: 'PAYOUT', bet: 'tie', netCents: tieBetResult })
  }

  if (state.dragonBonus.side !== null && state.dragonBonus.amount > 0) {
    const side = state.dragonBonus.side
    const betAmount = state.dragonBonus.amount

    const sideWon = result === side
    const sideLost = result !== side && result !== 'tie'
    const naturalTie = natural && result === 'tie'

    if (naturalTie) {
      dragonBonusResult = 0
    } else if (sideLost || (result === 'tie' && !natural)) {
      dragonBonusResult = -betAmount
    } else if (sideWon) {
      if (natural) {
        dragonBonusResult = payDragonBonus(betAmount, true, 0)
      } else {
        const sideTotal = side === 'player' ? playerTotal : bankerTotal
        const otherTotal = side === 'player' ? bankerTotal : playerTotal
        const margin = sideTotal - otherTotal
        const winnings = payDragonBonus(betAmount, false, margin)
        if (winnings === 0) {
          dragonBonusResult = 0
        } else {
          dragonBonusResult = winnings
        }
      }
    } else {
      dragonBonusResult = -betAmount
    }
    events.push({ type: 'PAYOUT', bet: 'dragonBonus', netCents: dragonBonusResult })
  }

  if (state.panda8 > 0) {
    if (isPanda8(playerCards, playerTotal)) {
      panda8Result = payPanda8(state.panda8)
    } else {
      panda8Result = -state.panda8
    }
    events.push({ type: 'PAYOUT', bet: 'panda8', netCents: panda8Result })
  }

  return {
    ...state,
    result,
    playerCards,
    bankerCards,
    playerTotal,
    bankerTotal,
    isNatural: natural,
    isDragonHand: dragonHand,
    playerBetResult,
    bankerBetResult,
    tieBetResult,
    dragonBonusResult,
    panda8Result,
    phase: 'complete',
  }
}

export class BaccaratEngine {
  private state: BaccaratState
  private shoe: Shoe
  private config: BaccaratConfig

  constructor(config: Partial<BaccaratConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    const seed = Math.floor(Math.random() * 0xffffffff)
    const rng = createRNG(seed)
    this.shoe = makeShoe(NUM_DECKS, rng)
    this.state = makeInitialState(this.config, this.shoe)
    this.state = { ...this.state, seed }
  }

  getState(): BaccaratState {
    return this.state
  }

  dispatch(command: BaccaratCommand): DispatchResult {
    const events: BaccaratEvent[] = []

    try {
      switch (command.type) {
        case 'PLACE_BET': {
          if (this.state.phase !== 'betting') {
            return { state: this.state, events, error: 'Not in betting phase' }
          }
          const { min, max } = this.config.tableLimits
          if (command.amount < min || command.amount > max) {
            return { state: this.state, events, error: `Bet must be between ${min} and ${max} cents` }
          }
          if (command.bet === 'player') {
            this.state = { ...this.state, playerBet: command.amount }
          } else if (command.bet === 'banker') {
            this.state = { ...this.state, bankerBet: command.amount }
          } else {
            this.state = { ...this.state, tieBet: command.amount }
          }
          break
        }

        case 'PLACE_DRAGON_BONUS': {
          if (this.state.phase !== 'betting') {
            return { state: this.state, events, error: 'Not in betting phase' }
          }
          const { min, max } = this.config.tableLimits
          if (command.amount < min || command.amount > max) {
            return { state: this.state, events, error: `Bet must be between ${min} and ${max} cents` }
          }
          this.state = {
            ...this.state,
            dragonBonus: { side: command.side, amount: command.amount },
          }
          break
        }

        case 'PLACE_PANDA_8': {
          if (this.state.phase !== 'betting') {
            return { state: this.state, events, error: 'Not in betting phase' }
          }
          if (this.config.variant !== 'ez') {
            return { state: this.state, events, error: 'Panda 8 is only available in EZ Baccarat' }
          }
          const { min, max } = this.config.tableLimits
          if (command.amount < min || command.amount > max) {
            return { state: this.state, events, error: `Bet must be between ${min} and ${max} cents` }
          }
          this.state = { ...this.state, panda8: command.amount }
          break
        }

        case 'DEAL': {
          if (this.state.phase !== 'betting') {
            return { state: this.state, events, error: 'Not in betting phase' }
          }
          const hasMainBet =
            this.state.playerBet > 0 || this.state.bankerBet > 0 || this.state.tieBet > 0
          if (!hasMainBet) {
            return { state: this.state, events, error: 'Must place at least one bet before dealing' }
          }

          this.shoe = reshuffleIfNeeded(this.shoe, this.config)

          let shoe = this.shoe
          const playerCards: Card[] = []
          const bankerCards: Card[] = []

          let r: { card: Card; shoe: Shoe }

          r = drawCard(shoe)
          shoe = r.shoe
          playerCards.push(r.card)
          events.push({ type: 'CARD_DEALT', card: r.card, target: 'player', index: 0 })

          r = drawCard(shoe)
          shoe = r.shoe
          bankerCards.push(r.card)
          events.push({ type: 'CARD_DEALT', card: r.card, target: 'banker', index: 0 })

          r = drawCard(shoe)
          shoe = r.shoe
          playerCards.push(r.card)
          events.push({ type: 'CARD_DEALT', card: r.card, target: 'player', index: 1 })

          r = drawCard(shoe)
          shoe = r.shoe
          bankerCards.push(r.card)
          events.push({ type: 'CARD_DEALT', card: r.card, target: 'banker', index: 1 })

          const pt = handTotal(playerCards)
          const bt = handTotal(bankerCards)
          const natural = isNaturalTotal(pt) || isNaturalTotal(bt)

          if (isNaturalTotal(pt)) {
            events.push({ type: 'NATURAL', side: 'player', total: pt })
          }
          if (isNaturalTotal(bt)) {
            events.push({ type: 'NATURAL', side: 'banker', total: bt })
          }

          let playerThirdCard: Card | null = null
          let playerDrewThirdCard = false

          if (!natural) {
            if (playerShouldDraw(pt)) {
              r = drawCard(shoe)
              shoe = r.shoe
              playerThirdCard = r.card
              playerCards.push(r.card)
              playerDrewThirdCard = true
              events.push({ type: 'PLAYER_DRAWS', card: r.card })
            }

            const btAfterPlayer = handTotal(bankerCards)
            if (bankerShouldDraw(btAfterPlayer, playerDrewThirdCard, playerThirdCard)) {
              r = drawCard(shoe)
              shoe = r.shoe
              bankerCards.push(r.card)
              events.push({ type: 'BANKER_DRAWS', card: r.card })
            }
          }

          this.shoe = shoe

          const finalPT = handTotal(playerCards)
          const finalBT = handTotal(bankerCards)

          let result: 'player' | 'banker' | 'tie'
          if (finalPT > finalBT) {
            result = 'player'
          } else if (finalBT > finalPT) {
            result = 'banker'
          } else {
            result = 'tie'
          }

          const dragonHandTriggered =
            this.config.variant === 'ez' && isDragonHand(bankerCards, finalBT) && result === 'banker'

          if (dragonHandTriggered) {
            events.push({ type: 'DRAGON_HAND' })
          }

          events.push({
            type: 'RESULT',
            winner: result,
            playerTotal: finalPT,
            bankerTotal: finalBT,
          })

          this.state = resolvePayouts(
            this.state,
            result,
            playerCards,
            bankerCards,
            finalPT,
            finalBT,
            natural,
            dragonHandTriggered,
            events
          )
          break
        }

        case 'NEW_HAND': {
          this.shoe = reshuffleIfNeeded(this.shoe, this.config)
          const newState = makeInitialState(this.config, this.shoe)
          this.state = { ...newState, seed: this.state.seed }
          break
        }

        default: {
          return { state: this.state, events, error: 'Unknown command' }
        }
      }
    } catch (err) {
      return {
        state: this.state,
        events,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }

    return { state: this.state, events }
  }
}
