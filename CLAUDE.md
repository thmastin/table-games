# Claude Context — Table Games

Casino table games suite. Fun-first, not a simulator. Should feel like a real casino.

---

## Project Overview

A browser-based casino table games suite with realistic UI, proper game logic, side bets, and local player profiles with stats tracking.

**GitHub:** https://github.com/thmastin/table-games

---

## Tech Stack

- **Framework:** React + TypeScript (Vite)
- **Styling:** Tailwind CSS (config scaffolded in `design-system/tailwind.config.ts`)
- **State:** Zustand (profile/bankroll only — game state lives in engine refs)
- **Persistence:** localStorage, key `casino_suite_v1`, all money stored as integers (cents)
- **Testing:** Vitest
- **Routing:** React Router

---

## Games

### Phase 1 (Build first)
1. **Blackjack** — 6-deck, dealer stands soft 17, late surrender, insurance
2. **Three Card Poker** — Ante/Play + Pair Plus + 6-Card Bonus
3. **Ultimate Texas Hold'Em** — Trips + Progressive side bets
4. **Free Bet Blackjack** — Geoff Hall variant (deprioritized — build after other Phase 1 games)

### Phase 2
5. **Baccarat** — standard first, then EZ variant; Dragon Bonus + Panda 8
6. **Mississippi Stud** — 3-Card Bonus side bet
7. **Let It Ride** — $1 Tournament Bonus side bet
8. **Roulette** — American (00) + European (0); La Partage rule on European

### Phase 3
9. **Craps** — simplified first (pass/don't pass, come, place, field, hardways), then full bet menu (buy/lay, hops, Fire Bet, All/Tall/Small)

### Future Consideration
- Casino War (trivial, good onboarding game)
- Pai Gow Poker (push-heavy, good for player retention)
- Spanish 21

---

## Side Bets by Game

### Blackjack (8 side bets)
| Bet | Description |
|-----|-------------|
| Trilux | Player's first two cards + dealer upcard form poker hands; 777 = jackpot |
| Perfect Pairs | Player's first two cards are a pair (mixed/colored/perfect) |
| 21+3 | Player's first two cards + dealer upcard form 3-card poker hand |
| Lucky Ladies | Player's first two cards total 20; Queen of Hearts pair = top payout |
| Bust It / Buster BJ | Pays when dealer busts; multiplier based on number of cards in bust hand |
| Match the Dealer | Player cards match dealer upcard by rank and/or suit |
| Royal Match | Player's first two cards same suit; suited BJ pays bonus |
| Super Sevens | Progressive; pays for 1, 2, or 3 sevens in sequence |
| Progressive | Trigger: suited Blackjack; jackpot persists in profile store |
| Insurance | Offered when dealer shows Ace; pays 2:1; resolved before player acts |

### Free Bet Blackjack
- **Pot of Gold** — progressive; triggers on suited Ace-Ace after free bet
- Free doubles on hard 9/10/11 only (not soft hands)
- Free splits on pairs 2–9 (not 10-value pairs, even mixed rank)
- Re-splitting allowed and each re-split is also free
- Push-22: dealer bust on 22 pushes all non-busted player hands (player Blackjack still pays 3:2)
- Cannot re-split Aces

### Ultimate Texas Hold'Em
- **Trips** — pays on player's final 5-card hand regardless of dealer qualifying; independent bet
- **Progressive** — trigger: Royal Flush; jackpot in profile store

### Three Card Poker
- **Pair Plus** — pays regardless of dealer qualifying or player Play decision
- **6-Card Bonus** — best 5 of 6 combined cards (player 3 + dealer 3)
- **Ante Bonus** — straight or better regardless of dealer qualifying (straight 1:1, trips 4:1, SF 5:1)
- Dealer qualifies with Q-high; if not: Ante pays even money, Play returns

### Baccarat
- **Dragon Bonus** — pays on natural win or non-natural win by 4+ points; available on Player or Banker side
- **Panda 8** — Player wins with 3-card total of 8; pays 25:1
- EZ Baccarat: no commission on Banker, but Banker push on 3-card Banker total of 7 (Dragon Hand). Two-card Banker 7 still pays normally.
- Standard Baccarat: 5% commission on Banker wins
- Tie pays 8:1

### Mississippi Stud
- **3-Card Bonus** — player's two hole cards form pair or better; pays independently
- Paytable starts at pair of 6s (not pair of Jacks); pairs 2–5 lose despite being a pair
- Players who fold lose all bets placed including raises already made

### Let It Ride
- **$1 Tournament Bonus** — pays on player's 3 cards only (not full 5-card hand); three of a kind or better
- Bet 3 always rides; only Bets 1 and 2 can be pulled back
- Main paytable: pair of 10s or better = 1:1 (through royal = 1000:1)

### Roulette
- All standard inside bets (straight, split, street, corner, line, basket)
- All standard outside bets (red/black, odd/even, high/low, dozens, columns)
- American basket bet (0-00-1-2-3): house edge 7.89% — include but note in UI
- European La Partage: half of even-money bet returned when zero hits

### Craps (simplified v1)
- Pass/Don't Pass, Come/Don't Come, Place bets, Field, Hardways
- Place bets off by default on come-out roll
- **Fire Bet** — player bets shooter makes multiple unique points before sevening out

---

## Rules Precision Notes

These are the most commonly misimplemented rules — check these first in each engine:

- **UTH river**: player who checked pre-flop AND flop must bet 1x or fold at river (cannot check again)
- **UTH Blind**: pushes on pair or two-pair win (only pays on straight or better)
- **TCP non-qualify**: Ante pays even money, Play *returns* — not both push
- **EZ Baccarat Dragon Hand**: only triggers on 3-card Banker total of 7, not 2-card
- **Baccarat third card**: implement the full drawing rules matrix — most common misimplementation
- **Let It Ride side bet**: pays on player's 3 cards only, not 5-card hand
- **Mississippi Stud**: pair of 2–5 loses; paytable starts at pair of 6s
- **Free Bet BJ push-22**: player Blackjack still pays 3:2 even on dealer 22
- **Blackjack splitting**: max 4 hands (3 splits), no re-splitting Aces, one card each on split Aces, DAS allowed

---

## Player & Bankroll System

### Two-Balance Model
- **Bank** (total) — persistent across all sessions; never bet directly
- **Session stake** — player withdraws from bank before sitting at a table; all play uses this amount
- On leaving table: session balance automatically returns to bank
- If session stake hits $0: player can make another withdrawal if bank has funds
- Stats track net session P&L per withdrawal

### Profiles
- Multiple named profiles, each with their own bank
- Starting bank: **$5,000** (default); high-roller option: **$25,000**
- Per-game stats: hands played, hands won, biggest win, net P&L, current streak, longest win/loss streak
- Hall of Fame: top 10 bankrolls, biggest single wins, longest win streaks

### Table Limits
| Game | Min | Max | Notes |
|------|-----|-----|-------|
| Blackjack | $10 | $500 | Side bets $1–$25 |
| Free Bet BJ | $10 | $500 | |
| UTH | $10 Ante | $100 Ante | 4x pre-flop = up to $400 swing |
| Three Card Poker | $10 | $300 | Pair Plus $5–$100 |
| Baccarat | $25 | $1,000 | |
| Mississippi Stud | $10 | $100 | Up to $600 at risk on $10 unit with raises |
| Let It Ride | $10 | $200 | $30 minimum effective (3 equal bets) |
| Roulette | $5 inside / $10 outside | $500 | |
| Craps | $10 Pass | $1,000 odds | Odds cap high — pro-player feature |

---

## Architecture

### Engine Pattern
Every game exports a class: `new GameEngine(config?)` → `getState()` + `dispatch(command)` → `{ state, events, error }`
- Zero React dependencies — fully testable with Vitest
- Events array drives animations, sounds, and stats updates in the hook layer
- Config object handles rule variants (S17/H17, number of decks, etc.)

### State Boundaries
- Game state: lives in engine ref inside custom hook (`useBlackjack`, `useUTH`, etc.)
- Profile/bankroll: Zustand with `persist` middleware (not manual subscribe)
- Progressive jackpots: `jackpotStore` in Zustand (persisted separately, increments across hands)
- No global game state store

### Hand Evaluator Modes
`src/lib/handEvaluator.ts` must support multiple modes:
- `5-card` — standard poker rankings
- `3-card` — Three Card Poker rankings (flush beats straight)
- `best-of-6` — for 6-Card Bonus (best 5 of 6 cards)
Define interface and modes before writing any card game engine.

### RNG
Use seeded PRNG (xoshiro128\*\*, ~20 lines). Seed logged in state for debugging/replay. `Math.random()` is not acceptable — cannot reproduce reported bugs.

### Persistence
- Single localStorage key `casino_suite_v1` with version field
- Write backup key before any migration runs
- Zustand `persist` middleware handles serialization
- All monetary values stored as integers (cents); use `payout(bet, numerator, denominator)` utility in `chips.ts` for all payout math — never raw division

### Craps State
Craps state model is fundamentally different from card games. Come bets use `Map<number, ComeBet>`. Do not try to extend the card game engine pattern for craps. Spike the craps engine early to validate the dispatch model.

### Error Handling
Per-game error boundary component (built once in Phase 0) wraps each game route. Engine throws → refund in-progress bets → reset to idle. Never crash the full app on a game engine error.

---

## Folder Structure

```
src/
├── lib/
│   ├── deck.ts             Card/Shoe types, Fisher-Yates, N-deck shoe
│   ├── rng.ts              Seeded PRNG (xoshiro128**)
│   ├── chips.ts            Denomination math, payout() integer utility
│   ├── storage.ts          load/save/migrate with backup-before-migrate
│   ├── handEvaluator.ts    5-card, 3-card, best-of-6 modes
│   └── paytables.ts        Shared paytable data
├── store/
│   ├── profileStore.ts     Zustand + persist: profiles, bank, session stake
│   ├── statsStore.ts       Zustand + persist: per-game stats, HoF
│   ├── jackpotStore.ts     Zustand + persist: progressive meters
│   └── types.ts            Profile, GameStats, HallOfFame, GameId types
├── components/
│   ├── layout/             AppShell, GameRoom, Nav
│   ├── ui/                 Card, ChipStack, ChipTray, BetSpot, ActionButton,
│   │                       BankrollDisplay, ResultBanner, PlayerSeat
│   ├── profile/            ProfileSelector, ProfileCard, HallOfFame
│   ├── stats/              StatsPanel, StatRow
│   └── GameErrorBoundary.tsx
├── pages/
│   ├── Home.tsx            Lobby — game grid
│   ├── ProfilePage.tsx
│   └── HallOfFamePage.tsx
└── games/
    └── <game-name>/
        ├── engine.ts       Pure logic, no React
        ├── types.ts
        ├── paytables.ts
        └── components/
design-system/              Visual design system (reference/starter files)
    ├── tokens.css
    ├── tailwind.config.ts
    ├── components.tsx
    ├── layouts.md
    ├── lobby.tsx
    ├── typography.md
    └── index.css
```

---

## UI / Design System

Design system scaffolded in `design-system/`. Key decisions:

- **Felt colors by game family:** Blackjack/TCP/MS/LIR = classic green; Free Bet BJ = teal; UTH = yellow-green; Baccarat = deep blue-green; Roulette = dark hunter green; Craps = traditional green
- **Chip colors:** $1 white, $5 red, $25 green, $100 black (gold text), $500 purple, $1000 yellow/gold
- **Typography:** Playfair Display for result banners + game names; JetBrains Mono for all numbers (prevents layout shift); Inter for everything else
- **Result colors:** Win = bright green with glow; Blackjack = gold (3:2 deserves its own look); Push = muted gold; Loss = low-opacity red (no glow — losing already feels bad)
- **Action button hierarchy:** Gold gradient = primary action; dark = passive; red = destructive (Fold, Clear Bets). Never more than one gold button visible at a time.
- **Felt texture:** Pure CSS (two overlapping repeating gradients at 4px pitch) — no image assets
- **Card flip:** CSS `transform-style: preserve-3d` + `backface-visibility: hidden`

### Player Experience Requirements
- Decision timer with auto-action (game stalls without it)
- Card reveal pacing with delays (UTH, Mississippi Stud, Let It Ride)
- Auto-bet repeat (re-place same bet from previous hand)
- Speed mode toggle (skips animations)
- Session stats visible without leaving table
- Bankroll warning when session stake drops below 2x table minimum
- Simulated other players: cosmetic only, no AI logic

---

## Build Order

### Phase 0 — Infrastructure (nothing else can be built without this)
1. Vite + TS + Tailwind scaffold; wire in `design-system/` files
2. `lib/deck.ts` — Card, Shoe, shuffle
3. `lib/rng.ts` — seeded PRNG
4. `lib/handEvaluator.ts` — all three modes; full Vitest coverage before any card game starts
5. `lib/chips.ts` — payout() utility, denominations
6. `lib/storage.ts` — load/save/migrate/backup
7. Zustand stores (profile, stats, jackpot) with persist middleware
8. Shared UI atoms (Card, ChipTray, BetSpot, ActionButton, ResultBanner, GameErrorBoundary)
9. AppShell + Router + Home lobby
10. **Craps engine spike** — 50-line prototype to validate dispatch model before locking it

### Phase 1 — Core card games
Blackjack → Three Card Poker → UTH → Free Bet BJ

### Phase 2
Baccarat (standard) → EZ variant → Mississippi Stud → Let It Ride → Roulette

### Phase 3
Craps simplified → Craps full

---

## Open Decisions (resolve before implementing affected game)
- Blackjack rule variants: configurable per table or one standard set? (recommendation: config object on engine constructor)
- Progressive jackpot seeding amount and growth rate
- Craps buy bet commission: on placement or on win only?
- European Roulette: La Partage only, or also En Prison?

---

## Standing Rules

- No backend — everything in localStorage
- No Supabase (reserved for Budget project)
- Commit atomically and often — one logical concern per commit, code must be in a working state. Commit at natural checkpoints (lib file complete, engine passing tests, component working) without waiting to be asked. Don't bundle unrelated changes. Don't commit mid-refactor when things are broken.
- Minimum complexity for the task at hand
- No comments or docstrings on code that wasn't asked about
- All money as integers (cents) — no float math anywhere
- Use custom agents from `~/.claude/agents/` when spawning subagents

---

## Session Log

| Date | Work Done | Next Action |
|------|-----------|-------------|
| 2026-03-15 | Project created, architecture designed, all game rules reviewed and corrected, side bets finalized, bankroll model defined, design system scaffolded in design-system/ | Phase 0: scaffold Vite project, wire Tailwind, build shared lib + stores + UI atoms, then Blackjack |
