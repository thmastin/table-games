# Blackjack UI Annotations

**Version:** 1.0
**Date:** 2026-03-30
**Phase:** 8
**Design resolution:** 1920 x 1080 (origin top-left)

All positions are (x, y) from top-left. All sizes are (width x height) in pixels at 1920x1080.
All visual values reference token names from `visual-language.md`. No raw hex values or raw pixel sizes not expressed as tokens.
All component names reference `component-boundaries.md` and `architecture.md`.

---

## How to Read This Document

Each entry covers one interactive or visually significant element. For display-only elements, "Signal emitted" is listed as "None."

Visual state columns:
- **Default**: resting, uninteracted, enabled state
- **Hover**: cursor over element, enabled state only
- **Pressed**: mouse button down, enabled
- **Disabled**: `IsEnabled = false`; not interactive

---

## 1. BankrollDisplay

| Field | Value |
|---|---|
| Element name | BankrollDisplay |
| Component | BankrollDisplay.tscn [shared] |
| Size | 200 x 48 |
| Position | (20, 24) |
| States visible | All game states |
| Signal emitted | None — display only |

**Visual states:**

| State | Fill | Text | Notes |
|---|---|---|---|
| Default | None (transparent; sits on left chrome panel at `color_background`) | Manrope SemiBold `text_lg`; `color_text_primary` | Tabular numerals; dollar sign prefix fixed-width |
| Updating | Same | `color_gold` for 150ms counter animation then returns to `color_text_primary` | Tween-driven counter (80ms counter update, then 150ms on BankrollDisplay itself); `color_gold` flash signals bankroll increase on win |

**Typography tokens used:** `text_lg` (18px Manrope), weight SemiBold (600), `color_text_primary`.
**Sizing tokens:** Padding `space_4` (16px) horizontal, `space_3` (12px) vertical.
**Numeric display rule:** Tabular numeral rendering via Manrope `tnum` feature or fixed-width slot per digit.

---

## 2. ChipTray — Denomination Chip (each of 5)

| Field | Value |
|---|---|
| Element name | ChipTray chip ($1 / $5 / $25 / $100 / $500) |
| Component | ChipTray.tscn → Chip.tscn [shared] |
| Size | 44 x 44 (tray size; `IsTraySize = true`) |
| Position (5-chip row) | Chips centered at y = 930; x positions (from left): 22, 66, 110, 154, 198 within left chrome panel |
| States visible | All game states (always visible) |
| Signal emitted | `DenominationSelected(int denomination)` — emitted on chip click; received by BlackjackTable.cs |

**Visual states:**

| State | Treatment |
|---|---|
| Default (affordable, unselected) | Chip base color per denomination token; edge segments (8 alternating); `color_gold_light` ring at 80% radius at 50% opacity; denomination numeral Manrope SemiBold `text_base` `color_text_primary` |
| Selected | Same base + `color_gold` glow at 40% opacity, `space_2` (8px) blur radius |
| Hover (affordable, unselected) | `color_gold_light` glow at 20% opacity, 4px blur radius |
| Disabled (unaffordable) | 40% opacity overall; no pointer cursor; glow suppressed |

**Chip diameter token:** 44px tray size. (Source: visual-language.md Section 5, Chip Dimensions.)
**Selection glow tokens:** `color_gold` at 40% opacity, `space_2` (8px) blur.
**Denomination-to-color token mapping:**

| Denomination | Fill token |
|---|---|
| $1 | `color_chip_1` |
| $5 | `color_chip_5` |
| $25 | `color_chip_25` |
| $100 | `color_chip_100` |
| $500 | `color_chip_500` |

---

## 3. MainBetSpot (BlackjackBetZone)

| Field | Value |
|---|---|
| Element name | MainBetSpot |
| Component | BetSpot.tscn [shared], inside BlackjackBetZone.tscn [BJ-specific] |
| Size | 88 x 80 |
| Position | (916, 660) (top-left of zone; center at 960, 700) |
| States visible | All states (always on table); interactive only during Betting |
| Signal emitted | `BetSpotClicked()` — received by BlackjackBetZone.cs, bubbled to BlackjackTable.cs |

**Visual states:**

| State | Treatment |
|---|---|
| Default — empty (Idle/Betting no chips yet) | Felt arc marking visible: `color_felt_marking` semicircle stroke, Noto Serif `text_xl` if ShowLabel; no chip stack |
| Active — accepting input (Betting, MainBet > 0 on table) | Subtle `color_ghost_border` outline at 15% opacity on zone boundary |
| Chips present | ChipStack renders inside zone; chips at standard 52px diameter; 4px vertical stack offset |
| Inactive — locked (all non-Betting phases) | `IsActive = false`; zone not interactive; no hover response; chips still visible |

**Felt marking typography:** Noto Serif `text_xl` (22px), `color_felt_marking`, 0.8px letter-spacing. (No label text for main bet spot; arc marking only — `ShowLabel = false`.)
**Corner radius on zone boundary:** 6px (single corner radius token from visual-language.md Section 5).

---

## 4. TriLux BetSpot

| Field | Value |
|---|---|
| Element name | TriLuxBetSpot |
| Component | BetSpot.tscn [shared], inside SideBetZone.tscn [BJ-specific] |
| Size | 80 x 56 |
| Position | (780, 592) (top-left; label center at 820, 620) |
| States visible | All states; interactive only during Betting when MainBet > 0 |
| Signal emitted | `BetSpotClicked()` — received by SideBetZone.cs, bubbled to BlackjackTable.cs, calls `_game.PlaceTriLuxBet(denomination)` |

**Visual states:**

| State | Treatment |
|---|---|
| Default (Idle / Betting MainBet = 0) | "TRILUX" felt label at `color_felt_marking`; zone not interactive; 40% opacity |
| Active (Betting, MainBet > 0) | Label at full `color_felt_marking` opacity; zone accepts click; `color_ghost_border` subtle outline on hover |
| Bet placed | ChipStack renders one chip (single denomination; replace-on-next-click behavior) |
| Locked (all other phases) | `IsActive = false`; not interactive; chip stack (if present) still visible |

**Label typography:** Noto Serif `text_xl` (22px), `color_felt_marking`, 0.8px letter-spacing. `ShowLabel = true`.

---

## 5. LuckyLucky BetSpot

| Field | Value |
|---|---|
| Element name | LuckyLuckyBetSpot |
| Component | BetSpot.tscn [shared], inside SideBetZone.tscn [BJ-specific] |
| Size | 100 x 56 |
| Position | (1050, 592) (top-left; label center at 1100, 620) |
| States visible | All states; interactive only during Betting when MainBet > 0 |
| Signal emitted | `BetSpotClicked()` — received by SideBetZone.cs → BlackjackTable.cs → `_game.PlaceLuckyLuckyBet(denomination)` |

**Visual states:** Identical treatment to TriLuxBetSpot. Label reads "LUCKY LUCKY".

---

## 6. DoubleDownBetSpot

| Field | Value |
|---|---|
| Element name | DoubleDownBetSpot |
| Component | BetSpot.tscn [shared], inside BlackjackBetZone.tscn [BJ-specific] |
| Size | 88 x 80 |
| Position | (1040, 660) (top-left; center at 1084, 700; 80px right of MainBetSpot center) |
| States visible | Visible as empty zone marker when `CanDouble = true` during PlayerTurn; chip animates in on double confirm |
| Signal emitted | None during PlayerTurn — DoubleDown is triggered by the Double ActionButton, not by clicking this spot directly |

**Visual states:**

| State | Treatment |
|---|---|
| Hidden (CanDouble = false) | Not rendered (node hidden) |
| Visible — empty (CanDouble = true) | Ghost zone marker; `color_ghost_border` at 15% opacity rectangle; no label |
| Chip placed (after DoubleDown confirm) | Single chip arcs in via placement arc animation (210ms); chip denomination = active denomination |

---

## 7. Deal Button

| Field | Value |
|---|---|
| Element name | Deal Button |
| Component | ActionButton.tscn [shared] (`IsGoldAccent = true`) |
| Size | 180 x 52 |
| Position | (1710, 900) |
| States visible | Idle, Betting |
| Signal emitted | `ActionPressed()` — received by BlackjackTable.cs → `GlobalState.ApplyBankrollDelta(-(MainBet + TriLuxBet + LuckyLuckyBet))` then `_game.DealInitiated()` |

**Visual states:**

| State | Fill | Text / Icon | Notes |
|---|---|---|---|
| Disabled (Idle / no bet) | `color_gold` fill at 30% opacity | Manrope Bold `text_base`; `color_background` at 40% opacity; `icon_base` | `IsGoldAccent = true` but `IsEnabled = false` |
| Enabled (Betting, MainBet >= MinBet) | `color_gold` fill at 100% | `color_background` text; `icon_base` icon in `color_background` | Full gold accent; highest visual weight on screen during betting |
| Hover (enabled) | `color_gold_light` fill | `color_background` text | Lightened gold on hover |
| Pressed | `color_gold` fill at 80%; translate 1px down | `color_background` text | Brief press feedback |

**Corner radius:** 6px (token: single corner radius value, visual-language.md Section 5).
**Icon:** `res://assets/icons/deal.svg`; `icon_base` (20px); `color_background`.
**Label typography:** Manrope Bold `text_base` (16px), weight 700, all-caps, 0.1rem letter-spacing.

---

## 8. Clear Bet Button

| Field | Value |
|---|---|
| Element name | Clear Bet Button |
| Component | ActionButton.tscn [shared] (`IsGoldAccent = false`) |
| Size | 180 x 36 |
| Position | (1710, 964) |
| States visible | Betting (always rendered; enabled only when MainBet > 0) |
| Signal emitted | `ActionPressed()` → `_game.ClearBet()` |

**Visual states:**

| State | Fill | Text |
|---|---|---|
| Disabled (no bet) | `color_surface` at 50% opacity | Manrope Medium `text_base`; `color_text_secondary` at 50% opacity |
| Enabled (MainBet > 0) | `color_surface` | `color_text_secondary` |
| Hover (enabled) | `color_surface_high` | `color_text_primary` |
| Pressed | `color_surface` at 80%; translate 1px down | `color_text_primary` |

**Icon:** `res://assets/icons/clear.svg`; `icon_sm` (16px).
**Label:** "CLEAR" — all-caps Manrope Medium `text_base`, 0.1rem letter-spacing. Not "Clear Bet" — label space is constrained.

---

## 9. Hit Button

| Field | Value |
|---|---|
| Element name | Hit Button |
| Component | ActionButton.tscn [shared] (`IsGoldAccent = false`) |
| Size | 180 x 52 |
| Position | (1710, 780) |
| States visible | PlayerTurn |
| Signal emitted | `ActionPressed()` → `_game.Hit()` |

**Enabled by:** `Actions.CanHit`

**Visual states:**

| State | Fill | Text / Icon |
|---|---|---|
| Default (enabled) | `color_surface` | Manrope Bold `text_base`; `color_text_primary`; `icon_base` `color_text_secondary` |
| Hover | `color_surface_high` | `color_text_primary`; `icon_base` `color_text_primary` |
| Pressed | `color_surface` at 80%; 1px down | Same |
| Disabled | `color_surface` at 40% opacity | `color_text_secondary` at 40% opacity |

**Icon:** `res://assets/icons/hit.svg`; `icon_base` (20px).
**Label:** "HIT" — all-caps Manrope Bold `text_base`, 0.1rem letter-spacing.

---

## 10. Stand Button

| Field | Value |
|---|---|
| Element name | Stand Button |
| Component | ActionButton.tscn [shared] |
| Size | 180 x 52 |
| Position | (1710, 844) |
| States visible | PlayerTurn |
| Signal emitted | `ActionPressed()` → `_game.Stand()` |

**Enabled by:** `Actions.CanStand`

Visual state treatment identical to Hit Button. Label "STAND". Icon `res://assets/icons/stand.svg`.

---

## 11. Double Button

| Field | Value |
|---|---|
| Element name | Double Button |
| Component | ActionButton.tscn [shared] |
| Size | 180 x 52 |
| Position | (1710, 908) |
| States visible | PlayerTurn |
| Signal emitted | `ActionPressed()` → `GlobalState.ApplyBankrollDelta(-MainBet)` then `_game.DoubleDown()` |

**Enabled by:** `Actions.CanDouble`

Visual state treatment identical to Hit Button. Label "DOUBLE". Icon `res://assets/icons/double.svg`.

---

## 12. Split Button

| Field | Value |
|---|---|
| Element name | Split Button |
| Component | ActionButton.tscn [shared] |
| Size | 180 x 52 |
| Position | (1710, 716) |
| States visible | PlayerTurn |
| Signal emitted | `ActionPressed()` → `GlobalState.ApplyBankrollDelta(-MainBet)` then `_game.Split()` |

**Enabled by:** `Actions.CanSplit`

Visual state treatment identical to Hit Button. Label "SPLIT". Icon `res://assets/icons/split.svg`.

---

## 13. Surrender Button

| Field | Value |
|---|---|
| Element name | Surrender Button |
| Component | ActionButton.tscn [shared] |
| Size | 180 x 52 |
| Position | (1710, 652) |
| States visible | PlayerTurn |
| Signal emitted | `ActionPressed()` → `_game.Surrender()` |

**Enabled by:** `Actions.CanSurrender`

Visual state treatment identical to Hit Button. Label "SURRENDER". Icon `res://assets/icons/surrender.svg`.

**Placement rationale:** Surrender is positioned at the top of the action column — farthest from the natural resting mouse position near the center-bottom buttons. This reduces accidental surrenders.

---

## 14. HandTotalBadge (Player)

| Field | Value |
|---|---|
| Element name | Player HandTotalBadge |
| Component | PlayerHandZone.tscn / HandTotalBadge Label [BJ-specific] |
| Size | Autosize; minimum 80 x 44 |
| Position | Centered above card fan; y = (card fan top y) - `space_6` (24px); x = zone center |
| States visible | PlayerTurn, DealerTurn, Resolution |
| Signal emitted | None |

**Visual states:**

| State | Text | Color |
|---|---|---|
| Normal (any value 4–20) | Numeric total string (e.g., "17", "soft 18") | Noto Serif `text_display_sm` (36px); `color_text_primary` |
| 21 (auto-stand) | "21" | Same |
| Bust | "BUST" | Noto Serif `text_display_sm`; `color_error` |
| Active hand (split layout) | Same as normal | Full opacity |
| Inactive hand (split layout) | Same as normal | 60% opacity |

**Soft hand notation:** "soft 18" uses Noto Serif `text_display_sm` with a smaller Manrope `text_sm` prefix label "soft" in `color_text_secondary` — renders as two-line badge: "soft" above, "18" below. This maintains rapid readability of the key numeric value.

**Update animation:** HandTotalBadge counter update uses 80ms Tween (brief scale flash: 100%→108%→100%) on value change. Reduced motion: instant update, no scale.

---

## 15. DealerTotalBadge

| Field | Value |
|---|---|
| Element name | DealerTotalBadge |
| Component | DealerHandZone.tscn / DealerTotalBadge Label [BJ-specific] |
| Size | Autosize; minimum 80 x 44 |
| Position | (960, 215) centered; y = dealer card zone top - `space_6` (24px) |
| States visible | DealerTurn, Resolution |
| Signal emitted | None |

**Visual states:** Identical to Player HandTotalBadge treatment. Hidden during Idle, Betting, Dealing, SideBetResolution, InsurancePrompt, PlayerTurn.

---

## 15b. InsuranceBetPrompt Panel

| Field | Value |
|---|---|
| Element name | InsuranceBetPrompt Panel |
| Component | Game-specific (InsuranceBetPrompt.tscn) |
| Size | 480 x 200 |
| Position | Center (960, 540) — top-left (720, 440) |
| States visible | InsurancePrompt only |
| Signal emitted | None — container panel |

**Background:** `color_surface_modal`
**Border:** None — tonal layering, no explicit border (per ux-research.md)
**Corner radius:** `radius_lg` (from visual-language.md)

---

## 16. InsuranceBetPrompt — Yes Button

| Field | Value |
|---|---|
| Element name | Insurance — Yes |
| Component | InsuranceBetPrompt.tscn / ActionButton.tscn [shared] |
| Size | 200 x 52 |
| Position | (750, 578) — within modal |
| States visible | InsurancePrompt |
| Signal emitted | `ActionPressed()` — InsuranceBetPrompt emits own signal bubbled to BlackjackTable.cs → `_game.ResolveInsurance(true)` |

**Visual states:** Standard ActionButton enabled states. `IsGoldAccent = false`. Label "TAKE INSURANCE".

**Layout rule:** Two buttons, 200 x 52px each, 20px gap between them, horizontally centered within the 480px modal. Left button (TAKE INSURANCE) top-left at (750, 578). Right button (DECLINE) top-left at (970, 578).

---

## 17. InsuranceBetPrompt — No Button

| Field | Value |
|---|---|
| Element name | Insurance — No |
| Component | InsuranceBetPrompt.tscn / ActionButton.tscn [shared] |
| Size | 200 x 52 |
| Position | (970, 578) — within modal |
| States visible | InsurancePrompt |
| Signal emitted | `ActionPressed()` → `_game.ResolveInsurance(false)` |

**Visual states:** Standard ActionButton enabled states. `IsGoldAccent = false`. Label "DECLINE".

**Layout rule:** Two buttons, 200 x 52px each, 20px gap between them, horizontally centered within the 480px modal. Left button (TAKE INSURANCE) top-left at (750, 578). Right button (DECLINE) top-left at (970, 578).

---

## 18. SideBetResultBanner

| Field | Value |
|---|---|
| Element name | SideBetResultBanner |
| Component | SideBetResultBanner.tscn [BJ-specific] |
| Size | 200 x 80 |
| Position | TriLux: (720, 560); LuckyLucky: (1000, 560) — positioned above the respective BetSpot |
| States visible | SideBetResolution |
| Signal emitted | None (parent AnimationPlayer handles sequence completion signal) |

**Visual states:**

| Outcome | Fill | Text | Animation |
|---|---|---|---|
| Win | `color_surface_high` at 80% opacity; `color_gold` thin border at 40% opacity | Noto Serif `text_display_sm`; `color_gold`; payout amount | `transition_panel_enter` (400ms); hold 400ms; `transition_panel_exit` (300ms) |
| Lose | None (transparent) | Manrope `text_base`; `color_text_secondary`; "—" or loss text | `transition_fade_in` (300ms); hold 200ms; `transition_fade_out` (300ms) |

**Win text format:** "TRILUX\n+$[amount]" — two lines; label line Noto Serif `text_xl`, amount line Noto Serif `text_display_sm`.

---

## 19. TipPrompt

| Field | Value |
|---|---|
| Element name | TipPrompt |
| Component | TipPrompt.tscn [BJ-specific] |
| Size | 320 x 60 |
| Position | (800, 960) (horizontally centered; bottom of viewport) |
| States visible | SideBetResolution (conditional: TriLux win + DealerTipEnabled) |
| Signal emitted | TipPrompt internal signals — tip accepted or dismissed — handled by BlackjackTable.cs |

**Visual states:**

| State | Fill | Text |
|---|---|---|
| Default (visible) | `color_surface` at 90% opacity; 6px corner radius | Manrope Medium `text_base`; `color_text_secondary`; "TIP DEALER?"; dismiss "×" icon |
| Tip button hover | `color_surface_high` | `color_text_primary` |

**Auto-timeout:** Dismisses automatically after 5 seconds if no interaction. Uses `transition_panel_exit` (300ms) on dismiss.

---

## 20. ResultBanner (Win Numeral Float)

| Field | Value |
|---|---|
| Element name | ResultBanner (win numeral) |
| Component | ResultBanner.tscn [shared] |
| Size | Dynamic (text autosize) |
| Position | Source: MainBetSpot screen position; Target: BankrollDisplay position (20, 48) |
| States visible | Resolution — Win, Resolution — Blackjack Win |
| Signal emitted | `AnimationCompleted()` → BlackjackTable.cs decrements `_animationsPending` |

**Visual states:**

| Phase | Treatment |
|---|---|
| In motion | Noto Serif `text_display_lg` (52px); `color_gold`; weight Bold (700); travels from source to target over 450ms; scale 100%→60%; alpha 100%→0% in final 100ms |
| Reduced motion | Appears at BankrollDisplay position; holds 100ms at full opacity; fades out; no travel |

**No icon rule:** The win numeral float has no icon (visual-language.md Section 6, Usage Rule 3).

---

## 21. ResultBanner (Push Indicator)

| Field | Value |
|---|---|
| Element name | ResultBanner (push) |
| Component | ResultBanner.tscn [shared] |
| Size | Autosize; approximately 200 x 44 |
| Position | (960, 480) centered over felt |
| States visible | Resolution — Push |
| Signal emitted | `AnimationCompleted()` |

**Visual treatment:** Manrope `text_base`; `color_push` (`color_text_secondary`); "PUSH" text. Appears via `transition_panel_enter` (400ms). No float travel; no bloom. Stays briefly (400ms hold), then fades out via `transition_fade_out` (300ms).

---

## 22. Settings Icon Button

| Field | Value |
|---|---|
| Element name | Settings icon button |
| Component | Secondary icon button — BlackjackTable.cs (not ActionButton.tscn) |
| Size | 44 x 44 |
| Position | (1876, 24) |
| States visible | All states |
| Signal emitted | Internal: opens SettingsPanel |

**Visual states:**

| State | Icon | Notes |
|---|---|---|
| Default | `icon_lg` (24px) settings SVG; `color_text_secondary` | No fill; just icon |
| Hover | `color_text_primary` | Icon color transitions |
| Pressed | `color_text_primary`; 1px down | Brief |

**Minimum hit area:** 44 x 44 (same as rendered size).

---

## 23. Rules Icon Button

| Field | Value |
|---|---|
| Element name | Rules icon button |
| Component | Secondary icon button — BlackjackTable.cs |
| Size | 44 x 44 |
| Position | (1820, 24) |
| States visible | All states |
| Signal emitted | Internal: opens RulesPanel |

**Visual states:** Identical to Settings Icon Button. Icon is a different SVG (help/info icon).

---

## 24. CardFace (Standard Player Card)

| Field | Value |
|---|---|
| Element name | Player CardFace |
| Component | CardFace.tscn [shared] |
| Size | 80 x 112 (base card size; visual-language.md Section 5) |
| Position | Set by PlayerHandZone.cs; varies per hand and card index |
| States visible | Dealing through Resolution |
| Signal emitted | `DealArcCompleted()` (on arc completion); `FlipCompleted()` (not emitted for player cards — always face-up) |

**Visual states:**

| State | Treatment |
|---|---|
| Face-up (normal) | Card body `color_surface_high`; rank glyph Noto Serif `text_2xl` (28px) weight Medium; suit symbol at `text_xl`; red suits: `color_error` (hearts, diamonds); black suits: `color_text_primary` (clubs, spades) |
| Deal arc (in motion) | Travels lateral arc; 18px peak above table surface; 250ms ease-out; 2.5° overshoot settle 50ms |
| Resting | Drop shadow: 4px blur, 0px horizontal / 2px vertical offset, 25% black opacity; slight ±2° rotation randomization applied by PlayerHandZone.cs |

**Card back (dealer hole card):** Chevron Stripe with Center Seal (Option B, locked). `color_surface_high` and `color_surface_low` alternating 6px diagonal stripes at 45°; faint `color_gold` compass rose medallion at 25% opacity; `color_gold` 2px border frame.

**Aspect ratio token:** 2.5:3.5 (standard poker card). Base width 80px, base height 112px.

---

## 25. Shuffle Indicator

| Field | Value |
|---|---|
| Element name | Shuffle indicator overlay |
| Component | BlackjackTable.cs / AnimationPlayer (not a standalone scene) |
| Size | 400 x 80 |
| Position | (760, 480) centered over felt |
| States visible | Transient: between Betting → Dealing when ShufflePending = true |
| Signal emitted | None; auto-dismisses after 400ms hold |

**Visual treatment:** `color_surface_modal` fill; 6px corner radius; Manrope `text_base`; `color_text_secondary`; "Shuffling...". Enters via `transition_panel_enter` (400ms), holds 400ms, exits via `transition_panel_exit` (300ms). Total duration: ~1100ms including hold.

---

## 26. FeltMarkings

| Field | Value |
|---|---|
| Element name | Felt printed text labels |
| Component | BlackjackTable.tscn / FeltMarkings (Node2D containing Label nodes) [BJ-specific] |
| Size | Varies by label |
| Position | See screen-states.md fixed elements table |
| States visible | All states (always rendered; never interactive) |
| Signal emitted | None |

**Visual treatment:** Noto Serif `text_xl` (22px); `color_felt_marking` (derivation: `color_felt` lightened 35% = `#007a62` at 35% opacity over felt — effective screen color approximately `#004f41`); weight Regular (400); letter-spacing 0.8px.

Three labels:
- "BLACKJACK PAYS 3 TO 2"
- "DEALER MUST DRAW TO 16"
- "INSURANCE PAYS 2 TO 1"

These are printed text rendered as Godot Label nodes, not baked textures, for crisp rendering at any viewport scale.

---

## Design Flag — Unresolved Values

The following design decisions are flagged as requiring developer confirmation before implementation. They are outside the scope of `visual-language.md` and cannot be resolved from existing reference documents.

1. ~~**Design Flag 1 (RESOLVED):**~~ **Bet total display position:** (960, 648), horizontally centered, `text_bet_display`, `color_text_primary`. No overlap with felt markings (y=270–330). Position is confirmed.

2. **Suit color for red suits:** `color_error` (`#ffb4ab`) is the muted rose error token. Used here for hearts and diamonds on card faces because it is the closest token to the convention red that stays within the Grand Atrium tonality. This is the intended interpretation — the token name is a coincidence of palette overlap. If the developer wants a distinct red suit token added to `visual-language.md`, that amendment should be made before card rendering is implemented.

3. **"Soft" prefix notation on HandTotalBadge:** The two-line soft hand badge ("soft" / "18") requires a composite label treatment not explicitly specified in `visual-language.md`. The tokens used (`text_display_sm` for the number, `text_sm` for the "soft" prefix) are in-spec. The two-line layout is a Phase 8 design decision. Flag for developer review.

4. **Shoe position visual indicator:** Architecture.md Section 5.2 notes that `CardBack.tscn` could serve as a shoe/deck indicator if design requires it. No shoe indicator is specified in these documents. If one is desired, it should be placed at approximately (1200, 190) — the source point for deal arcs — and would require a `visual-language.md` amendment for the indicator component if it introduces any new visual values.
