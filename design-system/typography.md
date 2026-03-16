# Typography System

## Font Stack

### Primary — Inter
- **Use**: Nav labels, action buttons, UI chrome text, form inputs, stat labels, all body copy
- **Load**: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`
- **Rationale**: Exceptional legibility at small sizes, neutral character, tabular figures available

### Display / Serif — Playfair Display
- **Use**: Game names, lobby header, result banners (WIN / BLACKJACK), card face values,
  felt-printed zone labels for decorative contexts
- **Load**: `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap`
- **Rationale**: Classic serif with high contrast strokes — reads as "luxury casino" immediately.
  Use sparingly (headlines, results, game names only — not body copy).

### Monospace — JetBrains Mono
- **Use**: Chip denominations, bankroll display, bet amounts, hand totals, statistics
- **Load**: `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap`
- **Rationale**: Fixed-width ensures dollar amounts don't shift width as digits change.
  Clean, technical feel suits financial/number contexts.

---

## Google Fonts Import (single request)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
```

---

## Type Scale

| Role                  | Font            | Size  | Weight | Color              | Notes                          |
|-----------------------|-----------------|-------|--------|--------------------|--------------------------------|
| Lobby H1              | Playfair Display| 48px  | 700    | gold-pale (#e8c97a)| Letter-spacing 0.02em          |
| Game name (lobby card)| Playfair Display| 18px  | 700    | text-primary       | On felt band                   |
| Nav label             | Inter           | 14px  | 500    | text-primary       | —                              |
| Nav sub / breadcrumb  | Inter           | 12px  | 400    | text-secondary     | —                              |
| Section header        | Inter           | 11px  | 600    | text-dim           | Uppercase, tracking 0.14em     |
| Game label (felt)     | Inter           | 11px  | 600    | felt-print         | Uppercase, tracking 0.12em     |
| Bet zone label        | Inter           | 10px  | 600    | felt-print         | Uppercase, tracking 0.12em     |
| Card rank (corner)    | Playfair Display| 14px  | 700    | suit color         | Line-height 1                  |
| Card rank (center J/Q/K)| Playfair Display| 38px | 700   | suit color         | Line-height 1                  |
| Card suit (center pip)| System          | 36px  | —      | suit color         | Unicode symbol                 |
| Chip amount (lg)      | JetBrains Mono  | 15px  | 700    | chip text color    | Letter-spacing -0.02em         |
| Chip amount (md)      | JetBrains Mono  | 13px  | 700    | chip text color    | —                              |
| Chip amount (sm)      | JetBrains Mono  | 10px  | 700    | chip text color    | —                              |
| Bankroll display      | JetBrains Mono  | 16px  | 700    | gold-pale          | Always show $ prefix           |
| Bet amount display    | JetBrains Mono  | 14px  | 600    | text-primary       | —                              |
| Hand total            | Inter           | 28px  | 700    | text-primary       | Bust = text-danger             |
| Result banner (main)  | Playfair Display| 26-32px| 700  | result-specific    | WIN=green, BJ=gold, LOSE=red   |
| Result payout line    | JetBrains Mono  | 13px  | 500    | text-primary       | e.g. "+$150 (3:2)"             |
| Action button label   | Inter           | 13px  | 600    | button text color  | Uppercase, tracking 0.06em     |
| Stat number           | JetBrains Mono  | 24px  | 600    | text-primary       | —                              |
| Stat label            | Inter           | 11px  | 500    | text-dim           | Uppercase, tracking 0.06em     |
| Payout table values   | JetBrains Mono  | 12px  | 500    | text-secondary     | Compact, right-aligned numbers |
| Payout table labels   | Inter           | 11px  | 500    | text-dim           | —                              |
| Toast / notification  | Inter           | 13px  | 500    | text-primary       | —                              |

---

## Key Rules

1. **Playfair Display is for drama only.** Results, game names, lobby headline.
   If you're tempted to use it for anything else, use Inter instead.

2. **Monospace for every number that changes.** Bankroll, bets, chip labels,
   stats. Prevents layout shift when digits change.

3. **Uppercase sparingly and with tracking.** Labels on the felt, section
   headers, button text. Never uppercase for body copy or payout tables.

4. **Text colors on the felt:** Use `felt-print` (rgba(255,255,255,0.18)) for
   decorative felt text. Use `text-primary` (#f0ece0) for active UI text
   that needs to be read. Pure white reads as harsh against the felt.

5. **Hand total bust state:** Color shift to text-danger (#e74c3c), same
   font/size — only color changes. Do not change size or weight on bust.
