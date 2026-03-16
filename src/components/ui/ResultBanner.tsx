type ResultType = 'win' | 'blackjack' | 'push' | 'loss'

type Props = {
  result: ResultType
  message: string
  subMessage?: string
}

const STYLES: Record<ResultType, { bg: string; border: string; color: string; shadow: string }> = {
  win: {
    bg: 'var(--result-win-bg)',
    border: 'var(--result-win-border)',
    color: 'var(--result-win)',
    shadow: 'var(--result-win-glow)',
  },
  blackjack: {
    bg: 'var(--result-blackjack-bg)',
    border: 'var(--result-push-border)',
    color: 'var(--result-blackjack)',
    shadow: 'var(--result-push-glow)',
  },
  push: {
    bg: 'var(--result-push-bg)',
    border: 'var(--result-push-border)',
    color: 'var(--result-push)',
    shadow: 'var(--result-push-glow)',
  },
  loss: {
    bg: 'var(--result-loss-bg)',
    border: 'var(--result-loss-border)',
    color: 'var(--result-loss)',
    shadow: 'var(--result-loss-glow)',
  },
}

export function ResultBanner({ result, message, subMessage }: Props) {
  const { bg, border, color, shadow } = STYLES[result]

  return (
    <div
      className="animate-result-appear"
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        boxShadow: shadow,
        borderRadius: 8,
        padding: '12px 24px',
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      <div className="font-display text-result-lg" style={{ color }}>
        {message}
      </div>
      {subMessage && (
        <div className="font-mono text-result-sm" style={{ color, opacity: 0.8, marginTop: 4 }}>
          {subMessage}
        </div>
      )}
    </div>
  )
}
