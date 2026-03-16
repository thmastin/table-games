export const DENOMINATIONS = [1, 5, 25, 100, 500, 1000] as const
export type Denomination = (typeof DENOMINATIONS)[number]

export const CHIP_COLORS: Record<Denomination, string> = {
  1:    'white',
  5:    'red',
  25:   'green',
  100:  'black',
  500:  'purple',
  1000: 'yellow',
}

export function payout(bet: number, numerator: number, denominator: number): number {
  return Math.floor((bet * numerator) / denominator)
}

export function dollarsToChips(cents: number): Record<Denomination, number> {
  let remaining = cents
  const result: Partial<Record<Denomination, number>> = {}
  for (const denom of [...DENOMINATIONS].reverse()) {
    const denomCents = denom * 100
    const count = Math.floor(remaining / denomCents)
    if (count > 0) {
      result[denom] = count
      remaining -= count * denomCents
    }
  }
  return result as Record<Denomination, number>
}

export function formatCents(cents: number): string {
  const dollars = Math.floor(cents / 100)
  const remainder = cents % 100
  if (remainder === 0) {
    return `$${dollars.toLocaleString()}`
  }
  return `$${dollars.toLocaleString()}.${String(remainder).padStart(2, '0')}`
}
