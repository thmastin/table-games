import { useState } from 'react'
import { useProfileStore } from '../store/profileStore'
import { formatCents } from '../lib/chips'
import { ActionButton } from '../components/ui/ActionButton'

export function ProfilePage() {
  const { profiles, activeProfileId, createProfile, setActiveProfile, deleteProfile } = useProfileStore()
  const [newName, setNewName] = useState('')
  const [highRoller, setHighRoller] = useState(false)

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    createProfile(name, highRoller)
    setNewName('')
    setHighRoller(false)
  }

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>
      <h2 className="font-display" style={{ color: 'var(--gold-pale)', fontSize: 32, marginBottom: 32 }}>
        Profiles
      </h2>

      <div style={{ marginBottom: 32 }}>
        {profiles.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>No profiles yet. Create one below.</p>
        )}
        {profiles.map(p => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: p.id === activeProfileId ? 'var(--chrome-panel)' : 'transparent',
              border: `1px solid ${p.id === activeProfileId ? 'var(--gold-mid)' : 'var(--chrome-border)'}`,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.name}</div>
              <div className="font-mono" style={{ color: 'var(--gold-pale)', fontSize: 14 }}>
                {formatCents(p.bankCents)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {p.id !== activeProfileId && (
                <ActionButton label="Select" variant="primary" onClick={() => setActiveProfile(p.id)} />
              )}
              <ActionButton label="Delete" variant="danger" onClick={() => deleteProfile(p.id)} />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: 'var(--chrome-panel)',
          border: '1px solid var(--chrome-border)',
          borderRadius: 8,
          padding: 20,
        }}
      >
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 16 }}>
          New Profile
        </div>
        <input
          type="text"
          placeholder="Player name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          style={{
            width: '100%',
            backgroundColor: 'var(--chrome-bg)',
            border: '1px solid var(--chrome-border)',
            borderRadius: 6,
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontSize: 14,
            marginBottom: 12,
            boxSizing: 'border-box',
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={highRoller} onChange={e => setHighRoller(e.target.checked)} />
          High Roller ($25,000 starting bank)
        </label>
        <ActionButton label="Create Profile" variant="primary" onClick={handleCreate} disabled={!newName.trim()} />
      </div>
    </div>
  )
}
