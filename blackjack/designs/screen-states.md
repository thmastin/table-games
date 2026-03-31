# Blackjack Screen States

**Version:** 1.0
**Date:** 2026-03-30
**Phase:** 8
**Design resolution:** 1920 x 1080 (origin top-left)
**Windowed default:** 1280 x 720

All positions are given as (x, y) from the top-left corner at 1920x1080 design resolution.
All dimensions are (width x height) in pixels at 1920x1080 design resolution.
All color references are token names from `visual-language.md`. All component names are from `component-boundaries.md` and `architecture.md`.

---

## Coordinate System Reference

The table surface is a 900 x 560px region centered horizontally in the 1920px viewport.

- Table surface left edge: x = 510
- Table surface right edge: x = 1410
- Table surface top edge (rail inner): y = 200
- Table surface bottom edge (rail inner): y = 760
- Table horizontal center: x = 960
- Table vertical center: y = 480

Left UI chrome panel: x = 0 to x = 220, full viewport height.
Right UI chrome panel: x = 1700 to x = 1920, full viewport height.

Rail band: 28px wide, `color_rail`, surrounds the table surface at the 900x560 boundary.

The semicircular arc establishes a single centered player position for MVP (one seat). The player's card and bet zones are centered on the bottom arc of the table.

Player seat horizontal center: x = 960
Player betting zone top: y = 650

Dealer zone horizontal center: x = 960
Dealer zone top: y = 220

---

## Layout: Fixed Elements (Always Present)

These elements are present in every screen state and are not repeated in each state section below.

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| FeltSurface | BlackjackTable / FeltSurface (Sprite2D) | (510, 200) | 900 x 560 | `color_felt`; fiber grain texture at 12% Screen blend; directional sheen 35 degrees |
| Rail | BlackjackTable / Rail (Sprite2D) | (482, 172) | 956 x 616 | `color_rail`; 28px band; bevel sprite on inner edge |
| FeltMarkings — "BLACKJACK PAYS 3 TO 2" | BlackjackTable / FeltMarkings | (960, 270) centered | — | Noto Serif `text_xl`; `color_felt_marking`; 0.8px letter-spacing |
| FeltMarkings — "DEALER MUST DRAW TO 16" | BlackjackTable / FeltMarkings | (960, 300) centered | — | Same treatment |
| FeltMarkings — "INSURANCE PAYS 2 TO 1" | BlackjackTable / FeltMarkings | (960, 330) centered | — | Same treatment |
| BankrollDisplay | BankrollDisplay.tscn [shared] | (20, 24) | 200 x 48 | Top-left of left chrome panel; Manrope SemiBold `text_lg`; `color_text_primary`; tabular numerals |
| ChipTray | ChipTray.tscn [shared] | (10, 900) | 200 x 64 | Bottom of left chrome panel; five tray-size chips (44px diameter) in a row |
| Settings icon button | secondary icon button (BlackjackTable) | (1876, 24) | 44 x 44 | Top-right corner; `icon_lg` (24px); `color_text_secondary` |
| Rules icon button | secondary icon button (BlackjackTable) | (1820, 24) | 44 x 44 | Adjacent left of settings; `icon_lg`; `color_text_secondary` |
| BettingArcMarking | BlackjackBetZone / BetSpot felt arc | (960, 700) centered | 88 x 80 | Printed semicircle arc on felt; `color_felt_marking`; no chip stack until bet placed |
| TriLux BetSpot felt label | SideBetZone / TriLuxBetSpot | (820, 620) | 80 x 56 | "TRILUX" Noto Serif `text_xl`; `color_felt_marking` |
| LuckyLucky BetSpot felt label | SideBetZone / LuckyLuckyBetSpot | (1100, 620) | 100 x 56 | "LUCKY LUCKY" Noto Serif `text_xl`; `color_felt_marking` |

---

## State 1: Idle

**GamePhase:** `Idle`
**Description:** Table loaded, no hand in progress, no bet placed. Player has not yet interacted. No cards on the table. This is the resting state between hands, and also the first state on scene load.

### Visible Elements

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| All fixed elements (above) | — | — | — | — |
| Deal button | ActionButton.tscn [shared] (Deal, inside BlackjackActionPanel) | (1710, 900) | 180 x 52 | `IsEnabled = false`; `IsGoldAccent = true` but no active bet so rendered at dimmed state; label "DEAL"; `icon_base` |
| Clear Bet button | ActionButton.tscn [shared] (Clear Bet, inside BlackjackActionPanel) | (1710, 964) | 180 x 36 | `IsEnabled = false`; default surface; label "CLEAR" |

### Active / Highlighted

- None. No interactive element is highlighted at rest.
- ChipTray denominations: all denominations within bankroll affordability lit at `color_text_primary`. Unaffordable denominations dimmed at 40% opacity.

### Dimmed / Inactive

- Deal button: `IsGoldAccent = true` but `IsEnabled = false`; rendered at 60% opacity of gold accent style.
- Clear Bet button: `IsEnabled = false`; 60% opacity.
- BetSpot (main bet): `IsActive = false`; no pointer cursor; stack is empty.
- SideBetZone spots (TriLux, LuckyLucky): `IsActive = false`; labels still visible as felt markings.
- Action buttons (Hit, Stand, Double, Split, Surrender): not rendered. BlackjackActionPanel hides all game-action buttons during Idle phase.

### Hand Total Badges

- None rendered. PlayerHandZone and DealerHandZone contain no cards.

---

## State 2: Betting

**GamePhase:** `Betting`
**Description:** Player has clicked a chip denomination, activating the betting phase. The main bet spot and side bet spots become interactive. The Deal button activates when MainBet >= MinBet ($5 for Standard tier). The chip tray is fully active.

### Visible Elements

All fixed elements plus:

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| MainBetSpot chip stack | BetSpot.tscn / ChipStack.tscn [shared] | (960, 700) centered | 88 x 80 | Chips arc in from ChipTray position (10, 930) area; standard 52px diameter; 4px vertical stack offset |
| Bet total display | BlackjackBetZone label (above chip stack) | (960, 648) centered | — | Manrope Bold `text_bet_display` (42px); `color_text_primary`; tabular numerals; shows current MainBet sum |
| TriLux chip stack | SideBetZone / TriLuxBetSpot / ChipStack | (820, 645) | 80 x 56 | Empty until TriLux bet placed |
| LuckyLucky chip stack | SideBetZone / LuckyLuckyBetSpot / ChipStack | (1100, 645) | 100 x 56 | Empty until LuckyLucky bet placed |
| Deal button (active) | ActionButton.tscn [shared] | (1710, 900) | 180 x 52 | `IsEnabled = true` when MainBet >= MinBet; `IsGoldAccent = true`; full gold accent style: `color_gold` fill, `color_background` label text |
| Clear Bet button (active) | ActionButton.tscn [shared] | (1710, 964) | 180 x 36 | `IsEnabled = true` when MainBet > 0; label "CLEAR" |

### Active / Highlighted

- ChipTray: all affordable denominations fully lit. Selected denomination chip glows with `color_gold` at 40% opacity, 8px blur radius.
- MainBetSpot: `IsActive = true`; pointer cursor active over felt arc zone.
- TriLuxBetSpot: `IsActive = true` when MainBet > 0.
- LuckyLuckyBetSpot: `IsActive = true` when MainBet > 0.
- Deal button: gold accent fully active when MainBet >= MinBet.

### Dimmed / Inactive

- Action buttons (Hit, Stand, Double, Split, Surrender): not rendered.
- TriLux and LuckyLucky bet spots: `IsActive = false` (dimmed felt label at further reduced contrast) until MainBet > 0.

### Bet Total Display Rule

The bet total (`text_bet_display`, 42px Manrope Bold) is the largest numeral on screen during Betting. BankrollDisplay (`text_lg`, 18px) is visually subordinate. This is the information hierarchy spec from `ux-research.md` Section 2.

---

## State 3: Dealing

**GamePhase:** `Dealing`
**Description:** Player pressed Deal. Bankroll has been deducted. All input is disabled. Four cards animate across the table in staggered arcs: player card 1, dealer card 1 (face-up), player card 2, dealer card 2 (face-down / hole card). Phase ends when all four deal arcs and settle animations complete.

### Visible Elements

All fixed elements plus:

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| Player card 1 | PlayerHandZone / CardFace.tscn [shared] | (920, 780) | 80 x 112 | Face-up; animating from off-table source toward final position; 250ms arc + 50ms settle |
| Player card 2 | PlayerHandZone / CardFace.tscn [shared] | (948, 780) | 80 x 112 | Face-up; 28px right-offset from card 1; 90ms stagger after card 1 arc start |
| Dealer card 1 (upcard) | DealerHandZone / CardFace.tscn [shared] | (940, 240) | 80 x 112 | Face-up; 180ms stagger after card 1 arc start |
| Dealer card 2 (hole card) | DealerHandZone / CardFace.tscn [shared] | (968, 240) | 80 x 112 | Face-down (card back: Chevron Stripe, Option B); 270ms stagger after card 1 arc start |
| MainBetSpot chip stack | BetSpot / ChipStack [shared] | (960, 700) | 88 x 80 | Bet is locked; `IsActive = false` during Dealing |
| Side bet stacks (if placed) | SideBetZone / BetSpot / ChipStack | (820, 645), (1100, 645) | — | Locked; not animated during Dealing |
| Deal button | ActionButton.tscn [shared] | (1710, 900) | 180 x 52 | `IsEnabled = false` during animation |
| Clear Bet button | ActionButton.tscn [shared] | (1710, 964) | 180 x 36 | `IsEnabled = false` |

### Active / Highlighted

- None. All input is blocked. `_animationsPending > 0` gate is active.

### Dimmed / Inactive

- ChipTray: all denominations dimmed; no interaction.
- All ActionButtons: not rendered / hidden.
- BetSpot zones: `IsActive = false`.

### Card Final Resting Positions (after deal completes)

Player hand zone center: (960, 820)
- Card 1 final position: (906, 780) (centered at 906 = 960 - 28 - 26; see layout note)
- Card 2 final position: (934, 780) (28px right-offset from card 1)

Dealer hand zone center: (960, 260)
- Dealer card 1 (upcard) final: (946, 240)
- Dealer card 2 (hole card) final: (974, 240)

Layout note: Two-card hand rendered as a 136px wide fan (80px card + 28px offset + 28px visible of card 2). The fan is horizontally centered within the 200px card deal zone.

### Arc Source Position

All four cards animate from a notional deck/shoe position at the dealer's right: approximately (1200, 190). This is off the felt surface area, suggesting the shoe sits to the dealer's right on the rail.

---

## State 4: SideBetResolution

**GamePhase:** `SideBetResolution`
**Description:** Deal animation has completed. TriLux and/or Lucky Lucky bets are evaluated automatically. Win or loss banners appear over the respective bet spots. If TriLux wins and DealerTipEnabled, TipPrompt may appear. All table input is blocked until the resolution sequence finishes.

### Visible Elements

All fixed elements, all cards at their final dealt positions, plus:

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| SideBetResultBanner (TriLux win) | SideBetResultBanner.tscn [BJ-specific] | (820, 560) | 200 x 80 | Shown if TriLux wins; Noto Serif `text_display_sm`; `color_gold` for win amount; animates in via `transition_panel_enter` (400ms) |
| SideBetResultBanner (TriLux lose) | SideBetResultBanner.tscn [BJ-specific] | (820, 560) | 200 x 80 | Shown if TriLux loses; `color_text_secondary`; fades in via `transition_fade_in` (300ms), holds 200ms, fades out |
| SideBetResultBanner (LuckyLucky win) | SideBetResultBanner.tscn [BJ-specific] | (1100, 560) | 200 x 80 | Same treatment; `color_gold` |
| SideBetResultBanner (LuckyLucky lose) | SideBetResultBanner.tscn [BJ-specific] | (1100, 560) | 200 x 80 | Same treatment; secondary text |
| TipPrompt (conditional) | TipPrompt.tscn [BJ-specific] | (960, 960) centered | 320 x 60 | Only if TriLux wins and DealerTipEnabled; "TIP DEALER?" button + dismiss; animates via `transition_panel_enter`; auto-timeout 5s |
| MainBetSpot chip stack | BetSpot / ChipStack | (960, 700) | 88 x 80 | Unchanged; not animated |

### Active / Highlighted

- TipPrompt buttons (if visible): yes/no affordances, standard button treatment; no gold accent (not a high-value action).

### Dimmed / Inactive

- ChipTray: fully dimmed.
- All game ActionButtons: not rendered.
- BetSpot zones: `IsActive = false`.

---

## State 5: InsurancePrompt

**GamePhase:** `InsurancePrompt`
**Description:** Dealer's upcard is an Ace. The insurance prompt modal appears over the table. Cards are visible in their dealt positions. All table input except the insurance prompt is blocked.

### Visible Elements

All fixed elements, all cards at dealt positions (hole card face-down), plus:

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| InsuranceBetPrompt modal | InsuranceBetPrompt.tscn [BJ-specific] | (720, 440) | 480 x 200 | `color_surface_modal`; `transition_modal_enter` (450ms) |
| Prompt heading | Inside InsuranceBetPrompt | (960, 440) centered | — | Noto Serif `text_xl`; `color_text_primary`; "Insurance?" |
| Insurance amount label | Inside InsuranceBetPrompt | (960, 510) centered | 360 x 28 | Manrope `text_base`; `color_text_secondary`; "Costs $[half of MainBet]"; dynamically bound to `floor(MainBet / 2)` |
| TAKE INSURANCE button | Inside InsuranceBetPrompt | (750, 578) | 200 x 52 | ActionButton.tscn [shared]; "TAKE INSURANCE" label; `IsEnabled = true`; not gold accent |
| DECLINE button | Inside InsuranceBetPrompt | (970, 578) | 200 x 52 | ActionButton.tscn [shared]; "DECLINE" label; `IsEnabled = true`; not gold accent |
| MainBetSpot chip stack | BetSpot / ChipStack | (960, 700) | 88 x 80 | Visible but inactive |

### Active / Highlighted

- Yes and No buttons are the only interactive elements. Both fully lit.
- Dealer upcard (Ace) is visually prominent — no specific highlight treatment, but the prompt directs attention.

### Dimmed / Inactive

- Entire table surface behind modal: blurred via backdrop filter on InsuranceBetPrompt.
- ChipTray: dimmed.
- All game ActionButtons: not rendered.

---

## State 6: PlayerTurn (single hand)

**GamePhase:** `PlayerTurn`, `ActiveHandIndex = 0`, one hand
**Description:** Normal single-hand player turn. Two or more player cards visible. Action buttons reflect current `ActionAvailability`. The hand total badge is shown above the player's card fan.

### Visible Elements

All fixed elements, plus:

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| Player card fan (2+ cards) | PlayerHandZone / CardFace nodes | (960, 820) zone center | 80 x 112 per card | 28px horizontal offset per additional card; slight ±2° rotation per card |
| Dealer card fan (2 cards) | DealerHandZone / CardFace nodes | (960, 260) zone center | 80 x 112 per card | Card 1 face-up; Card 2 face-down (hole card) |
| Player HandTotalBadge | PlayerHandZone / HandTotalBadge | (960, 752) | — | Noto Serif `text_display_sm` (36px); `color_text_primary`; centered above card fan |
| Dealer upcard label (rank only, no total) | DealerHandZone / HandTotalBadge | Hidden | — | DealerTotalBadge is hidden during PlayerTurn; hole card value is unknown |
| MainBetSpot chip stack | BetSpot / ChipStack | (960, 700) | 88 x 80 | `IsActive = false` during PlayerTurn; stack shows placed bet |
| DoubleDownBetSpot (empty marker) | BlackjackBetZone / DoubleDownBetSpot | (1040, 660) | 88 x 80 | Visible as an empty zone marker when `CanDouble = true` |
| Hit button | BlackjackActionPanel / ActionButton [shared] | (1710, 780) | 180 x 52 | `IsEnabled = Actions.CanHit`; label "HIT"; `icon_base` |
| Stand button | BlackjackActionPanel / ActionButton [shared] | (1710, 844) | 180 x 52 | `IsEnabled = Actions.CanStand`; label "STAND" |
| Double button | BlackjackActionPanel / ActionButton [shared] | (1710, 908) | 180 x 52 | `IsEnabled = Actions.CanDouble`; label "DOUBLE" |
| Split button | BlackjackActionPanel / ActionButton [shared] | (1710, 716) | 180 x 52 | `IsEnabled = Actions.CanSplit`; label "SPLIT" |
| Surrender button | BlackjackActionPanel / ActionButton [shared] | (1710, 652) | 180 x 52 | `IsEnabled = Actions.CanSurrender`; label "SURRENDER" |

### Action Button Column Layout (right chrome panel, top to bottom)

Buttons are stacked in the right chrome panel (x = 1700–1920) with `space_3` (12px) gaps between them, centered on the panel at x = 1800, starting at y = 652.

Order from top to bottom: Surrender → Split → Hit → Stand → Double

This ordering places the most consequential destructive action (Surrender) at top (least likely accidental click from natural mouse travel), and the primary continue action (Stand) in the center-lower zone.

### Active / Highlighted

- Enabled action buttons: full opacity, `color_surface` fill, `color_text_primary` label, `color_text_secondary` icon; hover state: `color_surface_high` fill, `color_text_primary` icon.
- Disabled action buttons: 40% opacity, no hover response.

### Dimmed / Inactive

- ChipTray: dimmed (not in betting phase).
- Deal and Clear Bet buttons: not rendered during PlayerTurn.
- Side bet zones: `IsActive = false`; labels still visible as felt markings.

---

## State 7: PlayerTurn — Split Hand Layout (2 hands)

**GamePhase:** `PlayerTurn`, `ActiveHandIndex = 0 or 1`, two `PlayerHandZone` instances
**Description:** Player has split once, creating two simultaneous hands. The active hand is visually distinguished. Both hands show their card fans.

### Layout Change from Single Hand

Two `PlayerHandZone` instances are placed symmetrically on the table bottom arc:

| Hand | Zone center | Card fan start x |
|---|---|---|
| Hand 0 (left) | (810, 820) | (786, 780) |
| Hand 1 (right) | (1110, 820) | (1086, 780) |

Horizontal separation between hand zone centers: 300px. This gives each hand a 200px wide zone with 100px inter-zone clearance.

### Active Hand Indicator

The active hand (`ActiveHandIndex`) is indicated by:
- HandTotalBadge shown at full `color_text_primary` opacity.
- A subtle `color_gold` at 15% opacity highlight behind the active hand zone cards (not a border — an ambient underlay).
- Action buttons in the right chrome panel remain in the same positions; they now control the active hand only.

### Inactive Hand

- HandTotalBadge shown at 60% opacity (`color_text_secondary`).
- No gold underlay.
- Cards still visible.

### MainBetSpot Positions (2-hand split)

Each hand has its own MainBetSpot, horizontally aligned under its hand zone:

| BetSpot | Position |
|---|---|
| Hand 0 MainBetSpot | (810, 870) centered |
| Hand 1 MainBetSpot | (1110, 870) centered |

### DoubleDownBetSpot

Available on the active hand's bet zone, 124px to the right of the active MainBetSpot center.

### Visible Elements (in addition to fixed)

Same action button set as single-hand PlayerTurn. Two PlayerHandZone instances. Two MainBetSpot instances. HandTotalBadge on each zone, with active/inactive opacity distinction.

---

## State 8: PlayerTurn — Split Hand Layout (3 hands)

**GamePhase:** `PlayerTurn`, three `PlayerHandZone` instances

Three hand zones spread across the table bottom arc at equal spacing.

| Hand | Zone center |
|---|---|
| Hand 0 (left) | (710, 820) |
| Hand 1 (center) | (960, 820) |
| Hand 2 (right) | (1210, 820) |

Horizontal separation: 250px per zone. Zone width per hand: ~160px (two-card fan = 108px, with 26px margin each side).

Same active/inactive visual distinction as 2-hand layout. MainBetSpots centered under each zone.

---

## State 9: PlayerTurn — Split Hand Layout (4 hands)

**GamePhase:** `PlayerTurn`, four `PlayerHandZone` instances (maximum)

Four hand zones at minimum safe spacing.

| Hand | Zone center |
|---|---|
| Hand 0 (leftmost) | (640, 820) |
| Hand 1 | (853, 820) |
| Hand 2 | (1067, 820) |
| Hand 3 (rightmost) | (1280, 820) |

Horizontal separation: 213px per zone. At this density, card overlap within each hand is unchanged (28px per card); only zone separation narrows. Zone width per hand: ~130px usable.

Note: At 4-hand split with multiple hit cards per hand, each hand's fan may extend beyond the 130px budget. The fan expands rightward without clipping; adjacent zones' left edges must maintain at least `space_6` (24px) clearance from a neighboring fan's right edge. This is a layout constraint, not a visual decision — it is flagged here for the developer's attention during implementation.

---

## State 10: DealerTurn

**GamePhase:** `DealerTurn`
**Description:** All player hands have been resolved. The dealer's hole card flips face-up (200ms flip animation). The dealer draws cards to reach a stand/bust total. The DealerTotalBadge becomes visible. No player input is accepted during this phase.

### Visible Elements

All fixed elements, all player hand cards (at final positions, no changes), plus:

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| Dealer card fan (2+ cards) | DealerHandZone / CardFace nodes | (960, 260) zone center | 80 x 112 per card | Hole card flipping or face-up; additional cards animate in as dealer draws |
| DealerTotalBadge | DealerHandZone / DealerTotalBadge | (960, 215) | — | Noto Serif `text_display_sm` (36px); `color_text_primary`; visible during DealerTurn; shows running dealer total |
| Player hand fans (final state) | PlayerHandZone instances | (per hand layout) | — | No changes; all stands/busts/surrenders locked in |
| Player HandTotalBadges | PlayerHandZone / HandTotalBadge | Above each hand | — | All visible; bust hands show "BUST" in `color_error` |
| MainBetSpot stacks | BetSpot / ChipStack | (per hand layout) | — | Visible; not animated |
| All action buttons | BlackjackActionPanel | — | — | Not rendered; hidden during DealerTurn |

### Active / Highlighted

- None. No player interaction is possible.

### Dimmed / Inactive

- ChipTray: dimmed.
- All action buttons: hidden.

### Hole Card Flip

On `DealerTurn` entry, `DealerHandZone.cs` sets `CardFace.AnimateFlip = true` on the hole card node and sets `CardFace.FaceUp = true`. The 200ms flip animation plays (two-phase horizontal rotation as specified in `visual-language.md` motion spec). `DealerHandZone.cs` listens for `FlipCompleted` before triggering the first dealer draw card animation.

---

## State 11: Resolution — Win

**GamePhase:** `Resolution`, `HandOutcome.Win`
**Description:** Player wins. Chip win collection animation plays (chips slide from dealer area toward player bet zone). Win numeral float plays. Screen-edge gold bloom pulses.

### Visible Elements

All fixed elements, all cards (dealer total badge visible), plus:

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| Win chip collection | ChipStack / Chip arc animation | Dealer area → MainBetSpot | — | 350ms slide; `color_chip_*` per denomination; directed toward player bet zone center |
| Win numeral float | ResultBanner.tscn [shared] | Originates at MainBetSpot; travels to BankrollDisplay (20, 48) | — | Noto Serif `text_display_lg` (52px); `color_gold`; 450ms travel; scale 100%→60%; alpha fades in final 100ms |
| Screen-edge gold bloom | ResultBanner.tscn / AnimationPlayer | Viewport edges (0,0 to 1920,1080) | max 120px inward | `color_win_bloom` at 12% opacity max; 500ms total (150ms in, 150ms hold, 200ms out) |
| DealerTotalBadge | DealerHandZone | (960, 215) | — | Visible; final dealer total |
| Player HandTotalBadge | PlayerHandZone | Above player cards | — | Visible; final player total |

### Not Rendered / Dimmed

- Action buttons: hidden.
- ChipTray: dimmed.

---

## State 12: Resolution — Loss

**GamePhase:** `Resolution`, `HandOutcome.Loss`
**Description:** Player loses. Chip loss collection animation plays (chips slide from player bet zone toward dealer area). No win numeral. No bloom. No victory signal.

### Visible Elements

All fixed elements, all cards at final positions, plus:

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| Loss chip collection | ChipStack / Chip arc animation | MainBetSpot → dealer area direction | — | 350ms slide away; chips leave the player zone |
| DealerTotalBadge | DealerHandZone | (960, 215) | — | Visible |
| Player HandTotalBadge | PlayerHandZone | Above player cards | — | Visible; bust hands show "BUST" in `color_error` if applicable |

### Result Signal

Loss is the absence of win signal. `ResultBanner` is instantiated with `Result = ResultType.Loss` and renders nothing. No bloom, no float numeral.

---

## State 13: Resolution — Push

**GamePhase:** `Resolution`, `HandOutcome.Push`
**Description:** Player and dealer tie. Bet is returned. A neutral push indicator appears. No gold bloom.

### Visible Elements

All fixed elements, all cards at final positions, plus:

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| Push indicator | ResultBanner.tscn [shared] | (960, 480) centered over felt | — | `color_push` (`color_text_secondary`); Manrope `text_base`; "PUSH"; appears via `transition_panel_enter` (400ms); no float travel |
| Chip return (push) | ChipStack stays in place | MainBetSpot | — | Chips are not animated away; they remain for the next bet state |

---

## State 14: Resolution — Blackjack Win (3:2)

**GamePhase:** `Resolution`, `HandOutcome.BlackjackWin`
**Description:** Player has a natural blackjack (Ace + 10-value), dealer does not. Pays 3:2. Win resolution is visually identical to a standard Win but with a larger win numeral and optional blackjack fanfare SFX.

### Differences from Resolution — Win

- Win numeral is the 3:2 payout amount (e.g., $75 for a $50 bet), using the same `text_display_lg` Noto Serif `color_gold` float treatment.
- Blackjack fanfare SFX plays via AudioStreamPlayer (no visual animation added — audio-only per architecture.md animation inventory).
- No additional screen treatment beyond the standard win bloom. The numeral amount is the signal.

### Layout

Identical to Resolution — Win.

---

## State 15: PlayerBroke (CashierScreen overlay)

**GamePhase:** `PlayerBroke`
**Description:** Resolution completed and bankroll < MinBet. CashierScreen is instantiated by SceneManager and placed as a CanvasLayer above z_index 3. The table is fully visible but completely inactive beneath the overlay.

### Visible Elements

All fixed elements, all cards at final post-resolution positions (chips already animated away or back), plus:

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| CashierScreen overlay | CashierScreen.tscn [shared] | (0, 0) | 1920 x 1080 | Full-screen; `color_surface_modal` at 60% opacity; 20px backdrop blur over entire table; `transition_modal_enter` (450ms) |

### CashierScreen Internal Layout

| Element | Position (x, y) | Notes |
|---|---|---|
| Panel container | (560, 240) | 800 x 600px modal area; `color_surface_modal` fill; 6px corner radius |
| Heading | (960, 300) centered | Noto Serif `text_display_sm`; `color_text_primary`; "ADD CHIPS" or "TAPPED OUT" |
| Bankroll display | (960, 360) centered | Manrope `text_lg`; `color_text_secondary`; current bankroll ($0) |
| Loan options | (960, 440) centered | ActionButton rows for loan amounts; Manrope `text_base` |
| Outstanding loans list | (960, 580) | Manrope `text_sm`; `color_text_secondary` |
| New Session button (tapped out only) | (960, 720) | ActionButton; `IsGoldAccent = false`; labeled "NEW SESSION" |
| Return to Table button (if bankroll > 0) | (960, 780) | ActionButton; `IsGoldAccent = true`; labeled "RETURN TO TABLE" |

### Active / Highlighted

- All CashierScreen interactive elements are active.
- Table beneath the overlay: no interaction, pointer events blocked.

---

## State 16: DealerBlackjack

**GamePhase:** `Resolution` (not a separate phase — see architecture.md Section 1.7)
**Description:** Dealer has a natural blackjack revealed after peek. Hole card flips immediately during Resolution entry. Player blackjack = push; all other hands = loss. No player action phase occurred.

### Visible Elements

All fixed elements, cards at final dealt positions (all four dealt cards), plus:

| Element | Component | Position (x, y) | Size (w x h) | Notes |
|---|---|---|---|---|
| Dealer hole card (now face-up) | DealerHandZone / CardFace | (974, 240) | 80 x 112 | Flipped to face-up during Resolution entry via `AnimateFlip = true` |
| DealerTotalBadge (shows 21 / BJ) | DealerHandZone | (960, 215) | — | Visible immediately after flip; "21" or "BJ" label |
| Win numeral (player BJ push) | ResultBanner.tscn [shared] | — | — | `Result = Push`; push indicator shown if player also has blackjack |
| Loss chip collection | ChipStack animation | MainBetSpot → dealer | — | For non-BJ player hands; 350ms slide away |

### Notes on Dealer Blackjack Path

- Insurance was accepted: insurance pays 2:1 before this state is displayed; the insurance bet win numeral float plays first, then the dealer blackjack resolution follows immediately.
- Insurance was declined: no additional sequence; straight to loss chip animation.
- Player also has blackjack: push result; bet returned; neutral push indicator.

The hole card flip animation (200ms) blocks the chip resolution animation start, giving the player a beat to understand what happened before chips move.

---

## State Transition Summary

```
Idle → Betting             (chip denomination clicked)
Betting → Idle             (Clear Bet clicked)
Betting → Dealing          (Deal clicked, MainBet >= MinBet)
Dealing → SideBetResolution (deal complete, side bets present)
Dealing → InsurancePrompt  (deal complete, no side bets, dealer Ace)
Dealing → PlayerTurn       (deal complete, no side bets, dealer not Ace or 10-peek no BJ)
Dealing → Resolution       (deal complete, dealer 10-peek confirms BJ)
SideBetResolution → InsurancePrompt (resolved, dealer Ace)
SideBetResolution → PlayerTurn (resolved, no insurance trigger)
SideBetResolution → Resolution (resolved, dealer BJ)
InsurancePrompt → PlayerTurn (decided; no dealer BJ or player BJ skips PT)
InsurancePrompt → Resolution (dealer BJ or player-only BJ)
PlayerTurn → PlayerTurn    (Hit / Stand / Double / Split / Surrender with remaining hands)
PlayerTurn → DealerTurn    (all hands resolved)
DealerTurn → Resolution    (dealer stands or busts)
Resolution → Idle          (bankroll >= MinBet)
Resolution → PlayerBroke   (bankroll < MinBet)
PlayerBroke → Idle         (bankroll reloaded via CashierScreen)
```
