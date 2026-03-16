import { BetSpot } from '../../../components/ui/BetSpot'
import { formatCents } from '../../../lib/chips'
import { useJackpotStore } from '../../../store/jackpotStore'
import type { UTHState } from '../types'

type Props = {
  state: UTHState
  onTripsClick: () => void
}

const TRIPS_PAYTABLE: Array<{ rank: string; pays: string }> = [
  { rank: 'Royal Flush',    pays: '50:1' },
  { rank: 'Straight Flush', pays: '40:1' },
  { rank: 'Four of a Kind', pays: '30:1' },
  { rank: 'Full House',     pays: '8:1' },
  { rank: 'Flush',          pays: '7:1' },
  { rank: 'Straight',       pays: '4:1' },
  { rank: 'Three of a Kind',pays: '3:1' },
]

const HAND_RANK_LABELS: Record<string, string> = {
  'royal-flush':     'Royal Flush',
  'straight-flush':  'Straight Flush',
  'four-of-a-kind':  'Four of a Kind',
  'full-house':      'Full House',
  'flush':           'Flush',
  'straight':        'Straight',
  'three-of-a-kind': 'Three of a Kind',
  'two-pair':        'Two Pair',
  'pair':            'Pair',
  'high-card':       'High Card',
}

export function TripsPanel({ state, onTripsClick }: Props) {
  const jackpotCents = useJackpotStore(s => s.jackpots['uth-progressive'])
  const canBet = state.phase === 'idle' || state.phase === 'betting'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 8,
        border: '1px solid var(--chrome-border)',
        padding: '12px 16px',
        minWidth: 160,
      }}
    >
      <div
        className="font-sans"
        style={{
          color: 'var(--text-gold)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Progressive
      </div>
      <div
        className="font-mono"
        style={{
          color: 'var(--gold-bright)',
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {formatCents(jackpotCents)}
      </div>

      <div style={{ width: '100%', height: 1, backgroundColor: 'var(--chrome-border)', margin: '4px 0' }} />

      <BetSpot
        label="TRIPS"
        amountCents={state.trips}
        locked={!canBet}
        onClick={canBet ? onTripsClick : undefined}
        size={72}
      />
      <span
        className="font-sans"
        style={{ color: 'var(--gold-muted)', fontSize: 9, fontWeight: 600 }}
      >
        Royal 50:1
      </span>

      {state.phase === 'complete' && state.tripsResult && (
        <div style={{ textAlign: 'center' }}>
          <div
            className="font-sans"
            style={{ color: 'var(--result-win)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}
          >
            {HAND_RANK_LABELS[state.tripsResult.rank] ?? state.tripsResult.rank}
          </div>
          <div
            className="font-mono"
            style={{ color: 'var(--result-win)', fontSize: 13, fontWeight: 700 }}
          >
            +{formatCents(state.tripsResult.payout)}
          </div>
        </div>
      )}

      {state.phase === 'complete' && state.trips > 0 && !state.tripsResult && (
        <div
          style={{
            textAlign: 'center',
            padding: '4px 8px',
            borderRadius: 4,
            backgroundColor: 'rgba(192,57,43,0.1)',
          }}
        >
          <div
            className="font-mono"
            style={{ color: 'var(--result-loss)', fontSize: 11, fontWeight: 700 }}
          >
            LOSE -{formatCents(state.trips)}
          </div>
        </div>
      )}

      <div style={{ width: '100%', height: 1, backgroundColor: 'var(--chrome-border)', margin: '4px 0' }} />

      <div style={{ width: '100%' }}>
        {TRIPS_PAYTABLE.map(row => (
          <div
            key={row.rank}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              padding: '1px 0',
            }}
          >
            <span className="font-sans" style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
              {row.rank}
            </span>
            <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: 10, fontWeight: 600 }}>
              {row.pays}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
