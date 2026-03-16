type Variant = 'primary' | 'secondary' | 'danger'

type Props = {
  label: string
  variant?: Variant
  disabled?: boolean
  onClick: () => void
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:   'btn-action btn-primary',
  secondary: 'btn-action btn-secondary',
  danger:    'btn-action btn-danger',
}

export function ActionButton({ label, variant = 'secondary', disabled, onClick }: Props) {
  return (
    <button
      className={VARIANT_CLASS[variant]}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
