import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '../../store/profileStore'
import { formatCents } from '../../lib/chips'

const QUICK_AMOUNTS_CENTS = [10000, 25000, 50000, 100000, 250000]

export function BuyInModal() {
  const navigate = useNavigate()
  const { activeProfile, withdrawToSession } = useProfileStore()
  const profile = activeProfile()

  const bankCents = profile?.bankCents ?? 0
  const [customInput, setCustomInput] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  if (!profile) return null

  const allInAmount = bankCents
  const amounts = QUICK_AMOUNTS_CENTS.filter(a => a <= bankCents)

  function resolvedAmount(): number {
    if (customInput !== '') {
      const dollars = parseFloat(customInput)
      if (!isNaN(dollars) && dollars > 0) {
        return Math.min(Math.round(dollars * 100), bankCents)
      }
    }
    if (selected !== null) return selected
    return 0
  }

  function handleQuick(amount: number) {
    setSelected(amount)
    setCustomInput('')
  }

  function handleAllIn() {
    setSelected(allInAmount)
    setCustomInput('')
  }

  function handleCustomChange(value: string) {
    setCustomInput(value)
    setSelected(null)
  }

  function handleSitDown() {
    const amount = resolvedAmount()
    if (amount <= 0) return
    withdrawToSession(amount)
  }

  if (bankCents <= 0) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          backgroundColor: 'rgba(0,0,0,0.82)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--chrome-panel)',
            border: '1px solid var(--chrome-border)',
            borderRadius: 12,
            padding: '32px 40px',
            maxWidth: 400,
            width: '90%',
            textAlign: 'center',
          }}
        >
          <div
            className="font-display"
            style={{ color: 'var(--gold-pale)', fontSize: 22, fontWeight: 700, marginBottom: 12 }}
          >
            No Funds
          </div>
          <div
            className="font-sans"
            style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}
          >
            Your bank is empty. Visit your profile to manage your account.
          </div>
          <button
            className="btn-action btn-primary"
            onClick={() => navigate('/profile')}
          >
            Go to Profile
          </button>
        </div>
      </div>
    )
  }

  const amount = resolvedAmount()
  const canSit = amount > 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(0,0,0,0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--chrome-panel)',
          border: '1px solid var(--chrome-border)',
          borderRadius: 12,
          padding: '28px 32px',
          maxWidth: 420,
          width: '92%',
        }}
      >
        <div
          className="font-display"
          style={{ color: 'var(--gold-pale)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}
        >
          Buy In
        </div>
        <div
          className="font-sans"
          style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 20 }}
        >
          Bank: <span className="font-mono" style={{ color: 'var(--gold-bright)', fontWeight: 700 }}>{formatCents(bankCents)}</span>
        </div>

        <div
          className="font-sans"
          style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}
        >
          Quick Select
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {amounts.map(a => (
            <button
              key={a}
              onClick={() => handleQuick(a)}
              className="font-mono"
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: selected === a && customInput === '' ? '1px solid var(--gold-bright)' : '1px solid var(--chrome-border)',
                backgroundColor: selected === a && customInput === '' ? 'var(--chrome-active)' : 'var(--chrome-bg)',
                color: selected === a && customInput === '' ? 'var(--gold-bright)' : 'var(--text-secondary)',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'border-color 100ms ease, color 100ms ease',
              }}
            >
              {formatCents(a)}
            </button>
          ))}
          <button
            onClick={handleAllIn}
            className="font-mono"
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: selected === allInAmount && customInput === '' ? '1px solid var(--gold-bright)' : '1px solid var(--chrome-border)',
              backgroundColor: selected === allInAmount && customInput === '' ? 'var(--chrome-active)' : 'var(--chrome-bg)',
              color: selected === allInAmount && customInput === '' ? 'var(--gold-bright)' : 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'border-color 100ms ease, color 100ms ease',
            }}
          >
            All In ({formatCents(allInAmount)})
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div
            className="font-sans"
            style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}
          >
            Custom Amount
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: 16 }}>$</span>
            <input
              type="number"
              min={1}
              max={bankCents / 100}
              value={customInput}
              onChange={e => handleCustomChange(e.target.value)}
              placeholder="0"
              style={{
                backgroundColor: 'var(--chrome-bg)',
                border: customInput !== '' ? '1px solid var(--gold-bright)' : '1px solid var(--chrome-border)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 14,
                padding: '7px 12px',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <button
          className="btn-action btn-primary"
          disabled={!canSit}
          onClick={handleSitDown}
          style={{ width: '100%', opacity: canSit ? 1 : 0.4, fontSize: 15 }}
        >
          Sit Down{canSit ? ` — ${formatCents(amount)}` : ''}
        </button>
      </div>
    </div>
  )
}
