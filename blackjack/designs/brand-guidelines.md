# Blackjack — Brand Guidelines

**Phase:** 8 (High-Fidelity Design)
**Date:** 2026-03-30
**Status:** Authoritative for all Blackjack UI implementation
**Governs:** UI Designer deliverables and developer implementation for Blackjack

All color, typography, spacing, and motion values in this document reference token names from `visual-language.md`. No raw hex values or pixel sizes appear here. If you need a resolved value, look it up in `visual-language.md`.

---

## 1. Brand Voice for Blackjack UI

### Tone Definition

The Grand Atrium is a private high-roller lounge. The UI voice matches: calm, unambiguous, and self-assured. It does not celebrate, commiserate, encourage, or motivate. It informs and lets the game speak for itself.

Three words that define every copy decision:

- **Premium** — language that would appear in a real casino, not a mobile slot app
- **Calm** — no exclamation marks, no urgency, no manufactured excitement
- **Confident** — short, direct sentences; no hedging; no filler words

### Language That Is Appropriate

- Standard casino terminology: "Blackjack", "Push", "Bust", "Insurance", "Double Down", "Split", "Surrender"
- Neutral numeric result displays: "+$250", "$0"
- Factual action prompts: "Place your bet", "Your turn"
- Felt markings using standard casino print conventions: "BLACKJACK PAYS 3 TO 2", "DEALER MUST DRAW TO 16 AND STAND ON ALL 17s", "INSURANCE PAYS 2 TO 1"

### Language That Is Explicitly Off-Limits

The following copy patterns break brand. Any label, prompt, banner, or tooltip using this language must be rejected during review:

- Exclamation marks in any result or prompt copy
- Superlative or hype language: "AMAZING", "INCREDIBLE", "HUGE WIN", "BIG MONEY"
- Player-state commentary: "You're on fire!", "Hot streak!", "Keep it up!", "Comeback time!"
- Level-up or progression language: "Level up", "Achievement unlocked", "Rank earned", "XP gained"
- Urgency manufacturing: "Don't miss out", "Last chance", "Limited time", "Go big!"
- Second-person cheerleading: "You've got this", "Nice one!", "Great decision!"
- Apology or consolation copy: "Better luck next time", "Don't give up!", "Tough break"
- Anthropomorphizing the game: "The dealer is feeling lucky", "The deck is hot"

---

### Exact Copy — Result States

These are the only approved strings for result state display. No paraphrasing.

| State | Display Copy | Notes |
|---|---|---|
| Win (standard) | `+$[amount]` | Amount rendered as integer. No "You win" prefix. |
| Win (blackjack) | `Blackjack` | Shown in the result banner. Numeral float shows `+$[amount]` separately. |
| Loss (standard) | No display text | Loss is the absence of win signal — default surface state returns. No "You lose" label. |
| Dealer blackjack | `Dealer Blackjack` | Shown briefly before chips are removed. Then banner clears. |
| Push | `Push` | Rendered in `color_push`. No amount shown — net is zero. |
| Bust | `Bust` | Shown on the player hand zone. Clears when the next hand begins. |
| Dealer bust | `Dealer Bust` | Shown briefly on the dealer zone before win resolution begins. |
| Surrender | `Surrender` | Shown on the player hand zone. Half the bet is returned without explicit copy — chip animation communicates it. |

---

### Exact Copy — Action Buttons

These are the only approved label strings for action buttons. They match `ActionButton.Label` prop values exactly. All rendered in Manrope `text_base` Bold, all-caps with 0.1rem letter-spacing per the pairing rule.

| Action | Button Label | Notes |
|---|---|---|
| Deal (active bet) | `DEAL` | `IsGoldAccent = true`. Only gold-accented button in the standard game flow. |
| Deal (no bet placed) | `DEAL` | `IsGoldAccent = false`. Disabled state until a bet exists. |
| Hit | `HIT` | Standard enabled/disabled state. |
| Stand | `STAND` | Standard enabled/disabled state. |
| Double Down | `DOUBLE` | Not "Double Down" — too long for button label. |
| Split | `SPLIT` | Standard. |
| Surrender | `SURRENDER` | Standard. |
| Clear Bet | `CLEAR` | Not "Clear Bet" — label space is constrained. |
| Insurance — Yes | `TAKE INSURANCE` | Appears on InsuranceBetPrompt. |
| Insurance — No | `DECLINE` | Appears on InsuranceBetPrompt. Not "No Thanks" or "Skip". |

---

### Exact Copy — Side Bet Results

**TriLux (Three-Card Poker-style side bet)**

| Result Tier | Display Copy |
|---|---|
| Suited Three of a Kind | `Suited Trips` |
| Three of a Kind | `Three of a Kind` |
| Straight Flush | `Straight Flush` |
| Straight | `Straight` |
| Flush | `Flush` |
| Pair | `Pair` |
| Loss | No display text. Side bet chips slide to dealer without copy. |

**Lucky Lucky (player hand + dealer up-card combination)**

| Result Tier | Display Copy |
|---|---|
| Suited 7-7-7 | `Suited Sevens` |
| 7-7-7 (any suit) | `Three Sevens` |
| Suited 6-7-8 | `Suited 6-7-8` |
| Suited 21 (any) | `Suited 21` |
| 6-7-8 (any suit) | `6-7-8` |
| Any 21 | `21` |
| Loss | No display text. |

**Both side bets lose:** No copy. No "Better luck next time" consolation. Chips animate to dealer. The felt returns to its default state.

---

### Exact Copy — PlayerBroke and CashierScreen

| State | Heading | Body |
|---|---|---|
| Player broke (bankroll = 0) | `Out of chips` | `Take a loan to continue, or start a new session.` |
| Loan available | `Take a loan` | `$[amount] — flat repayment of $[fee]` |
| Post-loan confirmation | No heading | No copy. Dismiss the CashierScreen. Chips added silently. |
| Tapped out (debt ceiling reached) | `Session complete` | `Start a new session to play again. Outstanding loans are cleared.` |
| Active loan shown | `Outstanding loan` | `$[principal] — repay from bankroll` |

**Prompts on CashierScreen action buttons:**

| Action | Button Label |
|---|---|
| Request loan | `TAKE LOAN` |
| Repay a loan | `REPAY` |
| Start new session | `NEW SESSION` |
| Return to table (bankroll > 0) | `BACK TO TABLE` |

---

## 2. Visual Hierarchy Rules for Blackjack

### Focal Point by Game Phase

Each phase has one and only one primary focal point. Everything else is subordinate.

| Phase | Primary Focal Point | Secondary | Rationale |
|---|---|---|---|
| Lobby / table select | Table surface (felt and rail) | Table tier label | The table is the destination — it should dominate before the player sits down. |
| Betting | Current bet total (`text_bet_display`, Manrope Bold) | Chip tray | The bet decision is the active task. Bet size dominates. |
| Active hand (player turn) | Card zones (player and dealer) | Action buttons | The hand state drives every decision. Cards are the primary information. |
| Dealer turn | Dealer hand zone | Player hand zone | The dealer's actions determine the outcome. Eye naturally moves to the dealer. |
| Resolution | Win numeral float (`text_display_lg`, Noto Serif, `color_gold`) or bust/push banner | Chip animation | The outcome signal is the most important moment. Let it land without competition. |
| Insurance prompt | InsuranceBetPrompt modal | Nothing else interactive | A decision with real stakes — everything else deactivates. |

### Gold Accent Usage

`color_gold` (`#C5A059`) and `color_gold_light` (`#E5C185`) are signal colors. Their meaning is "this matters right now." Overuse destroys the signal.

**Where gold is used:**

- Win numeral float (`color_gold`, `text_display_lg`)
- Win state screen-edge bloom (`color_win_bloom`)
- Deal button when a non-zero bet is placed (`IsGoldAccent = true`)
- Selected chip glow in the chip tray (40% opacity, 8px blur)
- Active chip in a betting zone (selection state)
- Chip gold inlay ring on Classic Casino Inlay chips (`color_gold_light` at 50% opacity)
- Card back center medallion seal (`color_gold` at 25% opacity — Option B locked)

**Where gold is never used:**

- Neutral UI labels or headings
- Action buttons other than Deal (Hit, Stand, Double, Split, Surrender are default surface)
- Borders, panel outlines, or separators
- Hover states on non-gold elements
- The bankroll display (this is informational, not a signal)
- Bet total display during the hand (by this point the bet is locked — not a signal)
- Push results — push uses `color_push` (which maps to `color_text_secondary`)
- Loss results — loss uses no color signal at all
- Side bet labels on the felt
- The insurance prompt (insurance is a hedge, not a win — no gold)

**The threshold test:** If removing the gold treatment from an element would make the UI feel cold or unfinished, that element should not have gold in the first place. Gold earns its place by being absent everywhere else.

---

### Typography Hierarchy

**Noto Serif** is for the game surface and big moments — content that exists on or belongs to the physical table world.

**Manrope** is for interaction chrome — the layer the player uses to control the game.

These domains do not mix. A Noto Serif label never appears on a button. A Manrope label never appears as a felt marking.

| Context | Font | Token | Weight | Notes |
|---|---|---|---|---|
| Felt zone markings ("BLACKJACK PAYS 3 TO 2") | Noto Serif | `text_xl` | Regular (400) | Rendered at `color_felt_marking` opacity. Slight open tracking (0.8px) for readability. |
| Card rank glyphs (A, K, 5, etc.) | Noto Serif | `text_2xl` | Medium (500) | Minimum 28px — never below this. Standard spacing. |
| Hand total badge (17, soft 18, 21, BUST) | Noto Serif | `text_display_sm` | Regular (400) | Displayed on PlayerHandZone. |
| Dealer hand total (dealer turn only) | Noto Serif | `text_display_sm` | Regular (400) | Appears only during dealer turn. Clears at resolution. |
| Win numeral float | Noto Serif | `text_display_lg` | Bold (700) | `color_gold`. Animates to bankroll. This is the largest Noto Serif moment. |
| Jackpot amounts, payout table entries | Noto Serif | `text_xl` | Regular (400) | In RulesPanel. |
| Section titles in RulesPanel | Noto Serif | `text_xl` | Regular (400) | Paired with Manrope `text_sm` supporting text per pairing rule. |
| Action button labels (HIT, STAND, etc.) | Manrope | `text_base` | Bold (700) | All-caps, 0.1rem letter-spacing. |
| Bankroll display | Manrope | `text_lg` | SemiBold (600) | Tabular numerals. `color_text_primary`. |
| Bet total during betting | Manrope | `text_bet_display` | Bold (700) | Largest numeral on screen during betting phase. |
| Chip denomination labels | Manrope | `text_base` | SemiBold (600) | On chip face. |
| Input labels and secondary info | Manrope | `text_sm` | Regular (400) | `color_text_secondary`. All-caps with 0.1rem letter-spacing where used as a label. |
| Micro-labels, keyboard hints | Manrope | `text_xs` | Regular (400) | `color_text_secondary`. Sparingly. |
| Result banners (Blackjack, Push, Bust, etc.) | Noto Serif | `text_display_sm` | Regular (400) | On the felt or near the hand zone. Not in the chrome. |
| CashierScreen headings | Noto Serif | `text_display_sm` | Regular (400) | Follows the pairing rule when a supporting Manrope label is present. |
| CashierScreen body text | Manrope | `text_base` | Regular (400) | `color_text_secondary`. |
| InsuranceBetPrompt heading | Noto Serif | `text_xl` | Regular (400) | "Insurance?" — centered above buttons. `color_text_primary`. Brief. The decision itself is the focal point, not the heading. |

**The pairing rule in Blackjack:** Wherever a section heading appears over a supporting label — for example, in RulesPanel or CashierScreen — use `text_display_lg` Noto Serif (headline-lg) paired with `text_sm` Manrope in all-caps at 0.1rem letter-spacing. This is the only approved heading/label combination.

---

### Icon Usage Rules

- All primary game action buttons (Hit, Stand, Double, Split, Surrender, Deal, Clear) must display an icon alongside the label. Icon-only is never used for buttons with monetary consequences.
- Default icon color: `color_text_secondary`
- Hover/active icon color: `color_text_primary`
- Icons on gold-accented elements (Deal button, active chip): `color_background` for contrast
- Icon size on action buttons: `icon_base` (20px)
- Icon size inline with `text_sm` labels: `icon_sm` (16px)
- No icon on win signals. The win numeral float and the screen-edge bloom are type and color only. An icon on a win result reads as gamification.
- No icon on result banners (Blackjack, Push, Bust). Text only.
- All icons: 1pt stroke, SVG source, round cap and round join. No filled icons.

---

## 3. Anti-Patterns — Do Not Implement

These patterns would break brand for Blackjack. Each one is a concrete implementation decision that a developer or designer might reach for under time pressure or aesthetic habit. All are explicitly prohibited.

### Animation Anti-Patterns

- **Pulsing or looping win effects.** The screen-edge bloom plays once (500ms total) and stops. It does not loop, pulse, or re-trigger unless a new win occurs. A looping bloom reads as a slot machine.
- **Confetti, particles, or burst effects.** No particle systems on win. No sparks, coins, stars, or fireworks. These are mobile gamification patterns that conflict with the Grand Atrium direction.
- **Scale-pop chip placement.** Chips must animate via arc (from tray to betting zone). A chip scaling from 0 to 1 in place reads as a UI widget, not a physical object being set down.
- **Vertical card drop.** Cards deal laterally across the felt surface. A card dropping from above the viewport has no physical plausibility in the dealer-slide-deal convention.
- **Card appear/disappear without animation.** Even in reduced-motion mode, cards appear at their final position instantly — they do not fade in. Fading a card in reads as a UI transition, not a physical object. Reduced-motion removes travel; it does not replace it with a fade.
- **Sub-300ms UI transitions.** No menu, overlay, panel, or modal may transition in under 300ms. Fast transitions read as cheap.
- **Non-interruptible animations beyond 400ms.** If a player input arrives during an animation longer than 400ms, the animation must snap to its final state on the next frame.

### Color Anti-Patterns

- **Neon or saturated colors.** No colors outside the locked palette. No bright cyan, hot pink, electric blue, or saturated green. The only saturated element in the scene is the felt (`color_felt`).
- **Pure white text.** Maximum text brightness is `color_text_primary`. `#FFFFFF` is not used anywhere.
- **Gold as decoration.** Gold elements that serve no signal function (borders, dividers, decorative rules, background gradients) dilute the win signal and are prohibited.
- **Red for loss state.** `color_error` (muted rose) is reserved for system errors and invalid bet states. Loss resolution does not use a red or error color — loss is the absence of win signal.
- **Felt colors lighter than `color_felt`.** The felt is `color_felt`. It does not get lightened except for the directional sheen from the locked fiber grain texture (Option B). An independently lightened felt region reads as an unintended highlight.
- **Borders.** Structure is communicated through tonal layering. A visible border around a card zone, bet spot, or panel is not used unless tonal contrast genuinely cannot define the boundary and a ghost border (`color_ghost_border` at 15% opacity) is specifically approved.

### Typography Anti-Patterns

- **Noto Serif on action buttons.** Buttons are always Manrope.
- **Manrope for felt markings.** Felt zone text is always Noto Serif.
- **Mixed-case all-caps labels.** All-caps Manrope labels use the full all-caps treatment with 0.1rem letter-spacing. Partial caps or title case on what should be a label reads inconsistent.
- **Rank glyphs below `text_2xl`.** Card ranks must be readable at speed. Never below 28px at 1080p.
- **Non-tabular numerals on bankroll or bet displays.** The bankroll and bet total must use tabular numerals. Proportional numerals shift laterally as values change, which creates visual instability.

### Copy Anti-Patterns

- **Any exclamation mark in UI copy.** No exceptions.
- **Any copy consoling the player on a loss.** Loss is silent. The felt returns to its resting state.
- **Any copy celebrating a win beyond the win numeral.** The gold numeral and bloom are the celebration. A text banner saying "Great win!" alongside the numeral is double-signaling.
- **"You" as the subject in result banners.** "You win", "You bust", "You lost" — all wrong. Result states are the name of the outcome, not a sentence addressed to the player. "Blackjack", "Bust", "Push" — not "You got Blackjack."
- **Branded language on felt markings.** Felt text follows casino convention ("BLACKJACK PAYS 3 TO 2"), not UI copy conventions. Do not rewrite felt markings in sentence case or casual language.

### UI Structure Anti-Patterns

- **Floating tooltips on the felt during a hand.** Any contextual information needed during play belongs in a fixed panel outside the table surface, not overlaid on the felt.
- **Modal dialogs for standard win/loss outcomes.** Modals are reserved for PlayerBroke, CashierScreen, RulesPanel, and InsuranceBetPrompt. A win or loss does not block play with a dialog.
- **Bankroll and bet total at equal visual weight during betting.** The bet total (`text_bet_display`) must be larger than the bankroll display (`text_lg`) during the betting phase. Equal weight creates ambiguity about which number the player is acting on.
- **UI chrome inside the table surface area.** The felt must be chrome-free. Bankroll, chip tray, and action buttons live in the left and right chrome panels (220px each side), never inside the 900px table surface.
- **Gamification overlays.** No XP bars. No achievement toasts. No "session stats" mid-hand. No streak counters in the UI chrome.
- **Oversized chip stacks.** Chip stacks visually cap at approximately 10 chips before clipping risk in the betting zone (80px × 88px). A stack that exceeds the betting zone height breaks the physical plausibility of the table surface.

---

## 4. Consistency Checklist

Use this checklist before shipping any new UI element in Blackjack. Every item must pass. Items that cannot be verified against this document should be treated as a blocker until the relevant token or rule is confirmed.

### Color

- [ ] Every color used is a named token from `visual-language.md` — no raw hex literals in scene or script code
- [ ] `color_gold` and `color_gold_light` appear only in win signals, the Deal CTA button (when active bet exists), chip selection glow, chip inlay ring, and card back medallion
- [ ] No borders are present unless a ghost border was explicitly justified — and if so, it uses `color_ghost_border` at exactly 15% opacity
- [ ] Modal surfaces use `color_surface_modal` at 60% opacity with 20px backdrop blur — never opaque
- [ ] No `#FFFFFF` appears anywhere; maximum text brightness is `color_text_primary`
- [ ] Loss state uses no color signal — `color_loss` means returning to default surface state, not displaying a red indicator

### Typography

- [ ] All felt zone markings use Noto Serif
- [ ] All action button labels use Manrope Bold, all-caps, 0.1rem letter-spacing
- [ ] Card rank glyphs are at `text_2xl` (28px) or larger — never smaller
- [ ] Win numeral float uses Noto Serif `text_display_lg` in `color_gold`
- [ ] Bankroll and bet total use Manrope with tabular numeral rendering
- [ ] No element uses a font that is not Noto Serif or Manrope
- [ ] Where a heading appears over a supporting label, the pairing rule is applied: headline-lg Noto Serif + title-sm Manrope all-caps at 0.1rem letter-spacing

### Copy

- [ ] No exclamation marks in any copy
- [ ] Result banners use the approved exact copy from Section 1 — no paraphrasing
- [ ] Action button labels use the approved exact strings from Section 1
- [ ] Side bet result copy matches the approved exact strings from Section 1
- [ ] Loss state displays no text copy
- [ ] No copy uses second-person celebration, consolation, or commentary on the player's state

### Animation and Motion

- [ ] All UI transition durations are between 300ms and 500ms (using tokens from `visual-language.md`)
- [ ] All animation durations use token names — no hardcoded durations in script code
- [ ] Card deal uses lateral arc, not vertical drop
- [ ] Chip placement uses arc, not scale-pop
- [ ] Win bloom plays once and stops — no loop
- [ ] No confetti, particles, or burst effects on any outcome
- [ ] Reduced-motion mode is handled: arcs and flips are replaced with instant placement; state changes still occur
- [ ] No animation is non-interruptible for more than 400ms

### Spacing and Layout

- [ ] All spacing values use named tokens from `visual-language.md` (`space_1` through `space_20`)
- [ ] All interactive elements use 6px corner radius
- [ ] No UI chrome is placed inside the 900px table surface area
- [ ] The bet total is visually larger than the bankroll display during the betting phase
- [ ] No floating overlays on the felt during an active hand

### Icon Usage

- [ ] All primary game action buttons show icon plus label — no icon-only action buttons
- [ ] No icon appears on win signals (no icon on numeral float, no icon on result banners)
- [ ] All icons use 1pt stroke SVG source, round cap, round join
- [ ] Icon size follows the scale tokens: `icon_sm` inline with labels, `icon_base` on buttons, `icon_lg` for standalone contexts

### Component Boundaries

- [ ] No game-specific logic is in a shared component
- [ ] No hex literals or inline px values appear in any component — all values are token references
- [ ] No component named with a `GameType`, `Mode`, or equivalent prop that branches on game identity
- [ ] All display strings on shared components (BetSpot labels, ActionButton labels, RulesPanel content) arrive as props — nothing is hardcoded in the component

---

**Brand Guidelines Author:** Brand Guardian
**Document Date:** 2026-03-30
**Source Documents:** `visual-language.md` (v1.0), `ux-research.md`, `component-boundaries.md` (v1.0)
**Governs:** All Blackjack UI designer deliverables and developer implementation in Phase 8 and beyond
