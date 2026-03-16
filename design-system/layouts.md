# Table Layout Principles

## Screen Structure (all games)

```
┌─────────────────────────────────────────────────────────────────────┐
│  NAV BAR  (56px)  — logo | game name | profile | bankroll           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FELT SURFACE  (fills remaining height, min 720px)                  │
│                                                                     │
│    [dealer zone]  [game-specific center zone]  [side bet zones]     │
│                                                                     │
│    [player card zone]                                               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  CHIP TRAY + ACTION BAR  (88px + 96px = 184px total)               │
│  — chip tray  |  current bets  |  action buttons  |  bankroll      │
└─────────────────────────────────────────────────────────────────────┘
```

The felt zone is always the visual center. Chrome (nav, tray, action bar)
is visually subordinate — dark, narrow, unobtrusive.

---

## Zone Vocabulary

Every game is composed of these zone types:

| Zone              | Description                                          |
|-------------------|------------------------------------------------------|
| Dealer Card Zone  | Fixed position, top center. Dealer hand always here. |
| Player Card Zone  | Fixed position, lower center. Player hand here.      |
| Ante/Main Bet     | Primary bet circle, center felt, below player cards. |
| Play Bet          | Secondary circle, adjacent to ante (UTH, 3CP, etc.). |
| Side Bet Zones    | Smaller circles to the right or left of main bet.    |
| Community Cards   | UTH, Let It Ride, Mississippi — shared board zone.   |
| Payout Table      | Small inset panel, bottom-right of felt. Always visible. |
| Result Banner     | Floats above player card zone, z-above cards.        |

---

## Per-Game Layout Maps

### BLACKJACK / FREE BET BLACKJACK

```
┌──────────────────────────────────────────────────────────────┐
│  FELT (1280px min)                                           │
│                                                              │
│         [DEALER CARDS — centered, top third]                 │
│                                                              │
│   [21+3]  [PERFECT PAIRS]  [MAIN BET]  [LUCKY LADIES] [TRILUX] │
│               side bets     ( ante )    side bets             │
│                                                              │
│         [PLAYER CARDS — centered, above action bar]          │
│                                                              │
│  [score: 14]                              [payout table]     │
└──────────────────────────────────────────────────────────────┘
│  CHIP TRAY  [$1] [$5] [$25] [$100] [$500] [$1K]  |  BET: $50 │
│  [CLEAR]    [HIT]   [STAND]   [DOUBLE]   [SPLIT]  [DEAL]     │
└──────────────────────────────────────────────────────────────┘
```

Notes:
- Side bets are smaller circles (60px), primary bet is larger (90px)
- Side bet zones only activate when a bet is placed on them
- Split adds a second player card zone to the right, mirror layout
- Free Bet Blackjack: "FREE" badge overlays chip on sponsored doubles/splits

---

### ULTIMATE TEXAS HOLD'EM

```
┌──────────────────────────────────────────────────────────────┐
│  FELT                                                        │
│                                                              │
│    [DEALER CARDS]           [TRIPS BET]  [PROGRESSIVE]       │
│         top center          side bets right                  │
│                                                              │
│    ─── COMMUNITY CARDS (5 shared) ─── center ───            │
│                                                              │
│    [ANTE]    [BLIND]    [PLAY]                               │
│    primary bets, center row, left-to-right                   │
│                                                              │
│    [PLAYER CARDS — 2 hole cards, bottom center]              │
│                                                              │
│    [hand strength label] e.g. "Two Pair — Aces & Kings"     │
└──────────────────────────────────────────────────────────────┘
│  CHIP TRAY  |  Ante: $25   Blind: $25   Play: —             │
│  [FOLD]  [CHECK]  [BET 3x]  [BET 4x]  [BET 2x]  [BET 1x]  │
└──────────────────────────────────────────────────────────────┘
```

Notes:
- Play bet circle is initially empty/inactive (locked until player acts)
- Community cards appear in horizontal row: 3 flop / 1 turn / 1 river
- Hand strength label appears after hole cards dealt, updates on each street

---

### THREE CARD POKER

```
┌──────────────────────────────────────────────────────────────┐
│  FELT                                                        │
│                                                              │
│    [DEALER CARDS — 3 cards, top center]                      │
│                                                              │
│    [PAIR PLUS]   [ANTE]   [PLAY]   [6-CARD BONUS]           │
│    side left    primary   primary  side right                 │
│                                                              │
│    [PLAYER CARDS — 3 cards, bottom center]                   │
│                                                              │
│    [payout table, bottom right corner of felt]               │
└──────────────────────────────────────────────────────────────┘
│  CHIP TRAY  |  Ante: $25   Pair Plus: $10                   │
│  [FOLD]                              [PLAY]                  │
└──────────────────────────────────────────────────────────────┘
```

Notes:
- Only two player decisions: Fold or Play (pay 1x ante)
- Play is only enabled if Ante bet is placed
- Three Card Poker has the most constrained layout — keep it clean

---

### BACCARAT

```
┌──────────────────────────────────────────────────────────────┐
│  FELT                                                        │
│                                                              │
│  [BANKER CARDS]        [TIE BET]        [PLAYER CARDS]      │
│  top left              top center       top right            │
│                                                              │
│  [BANKER]              [TIE]            [PLAYER]            │
│  main bet circle       bet circle       main bet circle      │
│  center-left           center           center-right         │
│                                                              │
│  [DRAGON BONUS B]                       [DRAGON BONUS P]     │
│  side bet, below banker                 side bet, below player│
│                                                              │
│  B: 7                                   P: 5                 │
│  hand totals display                                         │
└──────────────────────────────────────────────────────────────┘
│  CHIP TRAY  |  Player: $100   Banker: —   Tie: —            │
│  [CLEAR]                                  [DEAL]            │
└──────────────────────────────────────────────────────────────┘
```

Notes:
- No player decisions after deal — layout is almost entirely visual
- Baccarat felt variant: deep blue-green (#1e2d4a) — upscale differentiation
- EZ Baccarat mode: remove the 5% banker commission display, add "EZ" badge

---

### MISSISSIPPI STUD

```
┌──────────────────────────────────────────────────────────────┐
│  FELT                                                        │
│                                                              │
│    [COMMUNITY 1]  [COMMUNITY 2]  [COMMUNITY 3]              │
│    top row, 3 face-down cards                               │
│                                                              │
│    [3RD STREET]  [4TH STREET]  [5TH STREET]                 │
│    bet circles   bet circles   bet circles                   │
│    (locked until revealed)                                   │
│                                                              │
│    [ANTE]          [3-CARD BONUS side bet]                   │
│                                                              │
│    [PLAYER CARDS — 2 hole cards]                             │
└──────────────────────────────────────────────────────────────┘
│  CHIP TRAY  |  Ante: $10  3rd: —  4th: —  5th: —           │
│  [FOLD]  [BET 1x]  [BET 3x]                                 │
└──────────────────────────────────────────────────────────────┘
```

Notes:
- Street bet circles animate from locked → active as community cards reveal
- Bet multiplier options (1x or 3x) update per street

---

### LET IT RIDE

```
┌──────────────────────────────────────────────────────────────┐
│  FELT                                                        │
│                                                              │
│    [COMMUNITY 1]      [COMMUNITY 2]                          │
│    face-down, top center                                     │
│                                                              │
│    [BET 1]   [BET 2]   [BET 3]    [SIDE BET ($)]            │
│    circles, center row             smaller, right            │
│                                                              │
│    [PLAYER CARDS — 3 cards]                                  │
│                                                              │
│    [payout table, bottom right]                              │
└──────────────────────────────────────────────────────────────┘
│  CHIP TRAY  |  Bet 1: $10   Bet 2: $10   Bet 3: $10        │
│  [TAKE BACK BET 1]       [TAKE BACK BET 2]   [LET IT RIDE] │
└──────────────────────────────────────────────────────────────┘
```

Notes:
- The "Let It Ride" / "Take Back" toggle is the core mechanic — make it prominent
- "Let It Ride" button = primary gold; "Take Back" = secondary

---

### ROULETTE

```
┌──────────────────────────────────────────────────────────────┐
│  FELT (wider — roulette needs more horizontal space)         │
│                                                              │
│  [WHEEL VISUAL — left, ~400px circle]  [BETTING GRID — right]│
│                                         Numbers 0-36 (+ 00)  │
│                                         Outside bets below   │
│                                                              │
│  [Last 20 results — number history strip, bottom of felt]   │
└──────────────────────────────────────────────────────────────┘
│  CHIP TRAY  |  Total bet: $—                                │
│  [CLEAR BETS]  [UNDO]                     [SPIN]            │
└──────────────────────────────────────────────────────────────┘
```

Notes:
- Wheel is decorative/visual — clicking it does nothing
- The number grid is where betting happens (click intersections for splits, corners)
- Chip selection from tray determines denomination placed when clicking grid cells
- History strip: last 20 results as colored circles (red/black/green), right-to-left

---

### CRAPS

```
┌──────────────────────────────────────────────────────────────┐
│  FELT (full width — craps uses the entire table width)       │
│                                                              │
│  [PASS LINE] [DON'T PASS]  [COME]  [DON'T COME]  [FIELD]   │
│  primary bets across top and middle of table                 │
│                                                              │
│  [PLACE BETS: 4, 5, 6, 8, 9, 10]  center row numbers        │
│                                                              │
│  [HARDWAYS: 4, 6, 8, 10]   [ANY 7]  [ANY CRAPS]  [PROP BETS]│
│  proposition bets, center strip                              │
│                                                              │
│  [ODDS BET zone — overlays pass/come bets after point set]  │
│                                                              │
│  [DICE visual — rolled result shown center after each roll]  │
└──────────────────────────────────────────────────────────────┘
│  CHIP TRAY  |  Pass Line: $10   Odds: $30   Field: —       │
│  [CLEAR]                                    [ROLL]          │
└──────────────────────────────────────────────────────────────┘
```

Notes:
- Craps is the most complex layout — use the standard felt layout as close as possible
- Point puck: OFF (dark) / ON (white) indicator over the active point number
- "ROLL" button replaces "DEAL" — same position, same gold primary style
- Phase display: "Come Out Roll" / "Point: 6" shown above the dice visual

---

## Chip Tray / Action Bar

The bottom chrome strip is identical structure across all games:

```
┌──────────────────────────────────────────────────────────────┐
│  CHIP TRAY (88px)                                            │
│  [$1] [$5] [$25] [$100] [$500] [$1K]   Bankroll: $1,250    │
│  ← chip buttons, 64px each, equal spacing, gold selected    │
├──────────────────────────────────────────────────────────────┤
│  ACTION BAR (96px)                                           │
│  [secondary actions, left]          [primary action, right] │
│  e.g. [CLEAR] [UNDO] [REBET]             [DEAL] or [HIT]   │
└──────────────────────────────────────────────────────────────┘
```

- Selected chip denomination: gold ring + slight scale-up (1.08x)
- Bankroll: right side of chip tray, font-mono, text-gold-pale
- Current total bet: center of chip tray, label "BET:" prefix
- Action bar: never more than 5 buttons — if a game has more, use a row split

---

## Spacing Rules for Felt Zones

- Dealer card zone top edge: 24px from nav bottom (via padding-top on felt container)
- Bet circles vertical spacing from player cards: 32px
- Between adjacent bet circles: 20px minimum gap
- Side bet circles: 60-70px diameter vs. main bet 80-90px
- Labels under bet circles: 10px gap between circle and text
- Community cards horizontal gap: 8px between each card
- Player vs. dealer card zones: maintain at least 180px vertical separation
