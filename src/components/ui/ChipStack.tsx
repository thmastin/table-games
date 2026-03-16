import type { Denomination } from '../../lib/chips'

const CHIP_STYLES: Record<Denomination, { base: string; rim: string; text: string }> = {
  1:    { base: '#e8e4dc', rim: '#f5f2ec', text: '#2a2a2a' },
  5:    { base: '#c0392b', rim: '#e74c3c', text: '#ffffff' },
  25:   { base: '#1e8449', rim: '#27ae60', text: '#ffffff' },
  100:  { base: '#1a1a2e', rim: '#2d2d48', text: '#e8c97a' },
  500:  { base: '#6c3483', rim: '#8e44ad', text: '#ffffff' },
  1000: { base: '#b8860b', rim: '#d4a017', text: '#1a1a1a' },
}

type Props = {
  denomination: Denomination
  count?: number
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const SIZE_PX = { sm: 40, md: 52, lg: 64 }

export function ChipStack({ denomination, count = 1, size = 'md', onClick }: Props) {
  const { base, rim, text } = CHIP_STYLES[denomination]
  const px = SIZE_PX[size]
  const label = denomination >= 1000 ? `${denomination / 1000}K` : `$${denomination}`

  return (
    <div style={{ position: 'relative', width: px, height: px + Math.min(count - 1, 6) * 3 }}>
      {Array.from({ length: Math.min(count, 7) }).map((_, i) => (
        <div
          key={i}
          className="chip-base"
          onClick={i === Math.min(count, 7) - 1 ? onClick : undefined}
          style={{
            width: px,
            height: px,
            backgroundColor: base,
            borderColor: rim,
            color: text,
            fontSize: px <= 40 ? 10 : 13,
            position: 'absolute',
            bottom: i * 3,
            cursor: onClick ? 'pointer' : 'default',
          }}
        >
          {i === Math.min(count, 7) - 1 ? label : null}
        </div>
      ))}
    </div>
  )
}
