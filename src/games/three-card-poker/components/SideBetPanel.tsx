import { BetSpot } from '../../../components/ui/BetSpot'
import { formatCents } from '../../../lib/chips'
import { evaluate } from '../../../lib/handEvaluator'
import type { ThreeCardPokerState } from '../types'
import type { Denomination } from '../../../lib/chips'

const HAND_RANK_LABELS: Record<string, string> = {
  'high-card':       'High Card',
  'pair':            'Pair',
  'flush':           'Flush',
  'straight':        'Straight',
  'three-of-a-kind': 'Three of a Kind',
  'straight-flush':  'Straight Flush',
  'royal-flush':     'Royal Flush',
  'full-house':      'Full House',
  'four-of-a-kind':  'Four of a Kind',
  'two-pair':        'Two Pair',
}

const PAIR_PLUS_PAYOUTS: Record<string, string> = {
  'pair':            '1:1',
  'flush':           '4:1',
  'straight':        '6:1',
  'three-of-a-kind': '30:1',
  'straight-flush':  '40:1',
  'royal-flush':     '40:1',
}

const SIX_CARD_PAYOUTS: Record<string, string> = {
  'three-of-a-kind': '5:1',
  'straight':        '10:1',
  'flush':           '15:1',
  'full-house':      '25:1',
  'four-of-a-kind':  '50:1',
  'straight-flush':  '200:1',
  'royal-flush':     '1000:1',
}

type Props = {
  state: ThreeCardPokerState
  activeDenomination: Denomination
  onPairPlusClick: () => void
  onSixCardBonusClick: () => void
}

export function SideBetPanel({
  state,
  onPairPlusClick,
  onSixCardBonusClick,
}: Props) {
  const isComplete = state.phase === 'complete'
  const canBet = state.phase === 'idle' || state.phase === 'betting'

  const pairPlusResult = state.sideBetResults?.pairPlus ?? null
  const sixCardResult = state.sideBetResults?.sixCardBonus ?? null

  const sixCardRank = isComplete && state.playerCards.length === 3 && state.dealerCards.length === 3
    ? evaluate([...state.playerCards, ...state.dealerCards], 'best-of-6').rank
    : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 200,
      }}
    >
      <div
        style={{
          color: 'var(--felt-print)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        Side Bets
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <BetSpot
            label="PAIR+"
            amountCents={state.pairPlus}
            locked={!canBet}
            onClick={canBet ? onPairPlusClick : undefined}
            size={72}
          />
          <span
            className="font-sans"
            style={{ color: 'var(--felt-print)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Pair Plus
          </span>
          <span
            className="font-sans"
            style={{ color: 'var(--gold-muted)', fontSize: 9, fontWeight: 600, textAlign: 'center' }}
          >
            SF 40:1
          </span>
          {isComplete && pairPlusResult !== null && state.pairPlus > 0 && (
            <NetResult
              net={pairPlusResult}
              rankLabel={state.result?.rank ? (HAND_RANK_LABELS[state.result.rank] ?? null) : null}
              payoutLabel={state.result?.rank ? (PAIR_PLUS_PAYOUTS[state.result.rank] ?? null) : null}
            />
          )}
          {isComplete && state.pairPlus > 0 && pairPlusResult === null && (
            <span className="font-sans" style={{ color: 'var(--result-loss)', fontSize: 10, fontWeight: 700 }}>No Win</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <BetSpot
            label="6CB"
            amountCents={state.sixCardBonus}
            locked={!canBet}
            onClick={canBet ? onSixCardBonusClick : undefined}
            size={72}
          />
          <span
            className="font-sans"
            style={{ color: 'var(--felt-print)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            6-Card Bonus
          </span>
          <span
            className="font-sans"
            style={{ color: 'var(--gold-muted)', fontSize: 9, fontWeight: 600, textAlign: 'center' }}
          >
            Royal 1000:1
          </span>
          {isComplete && sixCardResult !== null && state.sixCardBonus > 0 && (
            <NetResult
              net={sixCardResult}
              rankLabel={sixCardRank ? (HAND_RANK_LABELS[sixCardRank] ?? null) : null}
              payoutLabel={sixCardRank ? (SIX_CARD_PAYOUTS[sixCardRank] ?? null) : null}
            />
          )}
          {isComplete && state.sixCardBonus > 0 && sixCardResult === null && (
            <span className="font-sans" style={{ color: 'var(--result-loss)', fontSize: 10, fontWeight: 700 }}>No Win</span>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
        <div
          className="font-sans"
          style={{ color: 'var(--text-dim)', fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.6 }}
        >
          Pair+ pays: Pair 1:1 · Flush 4:1 · Straight 6:1 · Trips 30:1 · SF 40:1
        </div>
      </div>
    </div>
  )
}

type NetResultProps = {
  net: number
  rankLabel: string | null
  payoutLabel: string | null
}

function NetResult({ net, rankLabel, payoutLabel }: NetResultProps) {
  const won = net > 0

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '4px 8px',
        borderRadius: 4,
        backgroundColor: won ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
      }}
    >
      {rankLabel && payoutLabel && (
        <div
          className="font-sans"
          style={{ color: won ? 'var(--result-win)' : 'var(--text-dim)', fontSize: 9, letterSpacing: '0.05em' }}
        >
          {rankLabel} · {payoutLabel}
        </div>
      )}
      <div
        className="font-mono"
        style={{
          color: won ? 'var(--result-win)' : 'var(--result-loss)',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {net > 0 ? '+' : ''}{formatCents(net)}
      </div>
    </div>
  )
}
