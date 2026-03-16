import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

type Props = {
  children: ReactNode
  gameName?: string
  onReset?: () => void
}

type State = {
  hasError: boolean
  error: Error | null
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[GameErrorBoundary] ${this.props.gameName ?? 'Game'} crashed:`, error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            gap: 16,
            backgroundColor: 'var(--chrome-panel)',
            borderRadius: 8,
            padding: 32,
          }}
        >
          <div className="font-display text-result-lg" style={{ color: 'var(--result-loss)' }}>
            Something went wrong
          </div>
          <div className="font-sans" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </div>
          <button className="btn-action btn-primary" onClick={this.handleReset}>
            Reset Game
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
