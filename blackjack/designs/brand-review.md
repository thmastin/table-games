# Brand Review — Blackjack Phase 8 Design Specification

**Version:** 1.0
**Date:** 2026-03-31
**Status:** Phase 8 reference — authoritative brand constraints for all Blackjack high-fidelity design work
**Governs:** All design decisions in `blackjack/designs/` and all visual implementation in `res://games/blackjack/`
**Sources:** `visual-language.md`, `ux-research.md`, `blackjack/game-spec.md`, `blackjack/architecture.md`, `component-boundaries.md`, `product-decisions.md`

Every value in this document is sourced from the locked specification files listed above. No value is invented here. If a value in this document conflicts with `visual-language.md`, `visual-language.md` wins — file an amendment against `visual-language.md` and update this document in the same commit.

---

## 1. Brand Identity Summary

The Blackjack table is the first and defining expression of the Grand Atrium brand — a hushed, private high-roller environment that earns trust through restraint, not spectacle. The brand is built on deep tonal layering between five surface levels (`color_background` through `color_surface_modal`), a single focal surface in `color_felt`, and a gold signal color (`color_gold`) reserved exclusively for win states and the single highest-priority call to action. Typography is split into two non-mixing domains: Noto Serif owns the game surface and its big moments, Manrope owns all interaction chrome. Motion is "heavy and luxurious" — nothing snaps, nothing flashes, no transition completes in under 300ms. The Blackjack implementation must honor this identity at every state in the `GamePhase` enum: from the quiet `Idle` table waiting for a bet, through the weighted arc of a card deal, to the screen-edge bloom of a win and the deliberate absence of any color on a loss. The brand succeeds when the table reads as a solid physical environment rather than a UI. It fails the moment any element — a color, a font, a transition speed, an icon weight — reads as a slot floor or a gamification widget.

---

## 2. Color Usage Rules

### 2.1 `color_background` — #121412

**Used for:** The entire viewport base. Every pixel of screen not covered by a surface layer renders at this value. The `Background` CanvasLayer (z_index = 0) fills the viewport before any other element renders.

**Not used for:** Text, borders, icons, chips, cards, felt, or any interactive element fill. Never used as a foreground color against a darker background (there is no darker background).

**Combination rules:** Must always sit beneath `color_surface_low`, `color_felt`, or `color_rail`. Never placed directly adjacent to `color_surface_modal` without an intermediate layer — the 60% modal opacity blends over `color_background` to produce the correct modal tone.

---

### 2.2 `color_surface_low` — #1a1c1a

**Used for:** Large structural content regions. The first lift off `color_background`. Panel backgrounds, section containers, the left and right UI chrome panel backgrounds (`UI chrome panel width: 220px` each side per `visual-language.md` Section 5).

**Not used for:** Interactive elements (buttons, input fields, chip tray — those use `color_surface`). Not used for elevated or floating elements. Not used for the table felt.

**Combination rules:** Provides sufficient tonal contrast over `color_background` to define structural regions without borders. If a boundary between `color_surface_low` and `color_background` fails to read, apply `color_ghost_border` at 15% opacity as an exception — never as a default.

---

### 2.3 `color_surface` — #1e201e

**Used for:** Interactive surfaces — action buttons (`BlackjackActionPanel` children: Hit, Stand, Double, Split, Surrender, Deal, Clear Bet), input fields, the `ChipTray` container background.

**Not used for:** Static content regions, cards, chips, or the table surface. Not used for modal backgrounds.

**Combination rules:** Paired with `color_text_primary` (#e2e3df) for button label text. Paired with `color_text_secondary` (#bfc9c4) for dimmed or disabled button labels. The Deal button when a bet is placed is the one approved exception — it receives `color_gold` treatment (see `color_gold` rules below). No other button on `color_surface` uses gold.

---

### 2.4 `color_surface_high` — #292a28

**Used for:** Cards, raised panel elements, elevated UI components that need to read as physically lifted. The `CardFace` card body renders on this surface. The Chevron Stripe card back (Option B, locked in `visual-language.md` Section 4) uses `color_surface_high` and `color_surface_low` as its two alternating stripe colors.

**Not used for:** Flat interactive surfaces, section containers, the felt surface.

**Combination rules:** Card rank glyphs render over `color_surface_high` in `color_text_primary` (red suits use `color_suit_red` (#cc2222) — dedicated token in `visual-language.md` Section 1, distinct from `color_error`; used only on card face suit coloring for hearts and diamonds). The card back medallion seal renders in `color_gold` at 25% opacity over the `color_surface_high`/`color_surface_low` stripe pattern.

---

### 2.5 `color_surface_modal` — #333533 at 60% opacity with 20px backdrop blur

**Used for:** The `RulesPanel` overlay, the `SettingsPanel`, and the `CashierScreen` — full-screen panels at z_index = 3 (Overlays CanvasLayer). Also used for the `InsuranceBetPrompt` modal panel background at z_index = 2 (UI CanvasLayer) — see note below. Never rendered opaque.

**Not used for:** Panel backgrounds in the UI chrome (z_index = 2) other than `InsuranceBetPrompt`. Not used for `SideBetResultBanner` or `TipPrompt`, which are UI-layer elements, not modals.

**InsuranceBetPrompt specifics (architecture.md authoritative):** `InsuranceBetPrompt` is a 480 × 200 modal panel, not a full-screen overlay. It lives in the UI CanvasLayer at z_index = 2 (alongside `BankrollDisplay`, `ChipTray`, `BlackjackActionPanel`, `SideBetResultBanner`, and `TipPrompt`). It is not placed in the Overlays CanvasLayer (z_index = 3). Its `color_surface_modal` background is paired with 20px backdrop blur over the visible table region behind the panel, not over the full screen. The `transition_modal_enter` (450ms) timing applies to its appearance animation.

**Combination rules:** Must always be paired with 20px backdrop blur. The 60% opacity value and the blur together produce the correct dimming effect over the table surface. Applying this color at full opacity or without the blur is a brand violation.

---

### 2.6 `color_felt` — #004b3d

**Used for:** The table surface exclusively. Rendered as a base fill on `FeltSurface` (Sprite2D) with the Option B directional fiber grain texture blended at 12% opacity in Screen blend mode over it. The focal surface of every scene — the brightest, most saturated surface in the scene (excluding `color_gold` signal moments).

**Not used for:** Backgrounds outside the table rail, UI chrome, cards, chips, or any element not on the physical table surface. Never darker than this value on any surface intended to read as felt.

**Combination rules:** All felt markings (`FeltMarkings` node: "INSURANCE PAYS 2 TO 1", "DEALER MUST DRAW TO 16", "BLACKJACK PAYS 3 TO 2") render in `color_felt_marking` — `#007a62` at 35% opacity over the felt surface. The rail (`color_rail`) borders the felt on all sides with a pre-baked bevel sprite that overlaps the felt edge, suggesting the rail overhangs the recessed felt surface. The `color_felt` surface must never touch `color_background` directly — the rail separates them.

---

### 2.7 `color_felt_marking` — #007a62 at 35% opacity

**Used for:** All printed text on the felt surface. Felt zone labels (`TriLuxBetSpot` label "TRILUX", `LuckyLuckyBetSpot` label "LUCKY LUCKY"), the `FeltMarkings` node label text, betting circle arc markings. Rendered using Noto Serif `text_xl` (22px) at 0.8px letter-spacing.

**Not used for:** UI chrome text, card glyphs, bankroll display, action buttons, or any element not rendered directly on the felt surface.

**Combination rules:** This token is derived (not a standalone hex), computed as: base `color_felt` lightened 35% = `#007a62`, then applied at 35% opacity over the `color_felt` base. The rendered screen color is approximately `#004f41`. Do not apply full `#007a62` without the opacity reduction — it will read too bright against the felt and compete with card content.

---

### 2.8 `color_gold` — #C5A059

**Used for:** Win state numerals (the `Win numeral float` — `text_display_lg`, 52px, Noto Serif), the `color_win` semantic (chip win collection signal), the Deal action button when `CanDeal == true` and `MainBet >= MinBet` (the single approved high-value action use), the chip selection glow (40% opacity, 8px blur radius on `IsSelected == true` chips in the `ChipTray`), the card back medallion seal (25% opacity), the 2px card edge border frame (60% opacity).

**Not used for:** Neutral UI labels, borders as decoration, icon colors in default or hover states, any button other than Deal (in its active state), the screen-edge bloom (that uses `color_win_bloom`, same hex but always at 12% opacity as a screen-edge effect, not a fill). Never used for push state or loss state.

**Combination rules:** Gold is a signal. Every application of `color_gold` communicates "something significant just happened" or "this is the action that advances the hand." Overuse destroys the signal value. At any given moment, there should be at most one element using full `color_gold` fill — either the win numeral float or the Deal button, never both simultaneously (the Deal button is hidden during `Resolution` phase when the win numeral plays). The `color_gold_light` tertiary (#E5C185) is available for chip edge highlights and hover states on gold elements only.

---

### 2.9 `color_gold_light` — #E5C185

**Used for:** Chip edge highlights (the gold ring inlay at 80% radius on Option A Classic Casino Inlay chips, rendered at 50% opacity). Hover states on elements already using `color_gold` — specifically the Deal button hover state.

**Not used for:** Primary win signals, labels, borders, or any element where `color_gold` is not already present. More restrained than `color_gold` — does not carry signal weight on its own.

**Combination rules:** Only appears in contexts already established as gold-signal contexts. Must not be introduced into neutral UI elements as a "warm accent."

---

### 2.10 `color_text_primary` — #e2e3df

**Used for:** All primary-hierarchy text: card rank glyphs on face-up cards, hand total badges (`HandTotalBadge` and `DealerTotalBadge` — Noto Serif `text_display_sm`), action button labels (Manrope `text_base`, weight 500 Medium), bankroll display (Manrope `text_lg` or `text_bet_display` depending on context, weight 600 SemiBold), chip denomination numerals on chip faces (Manrope `text_base`, weight 600 SemiBold).

**Not used for:** Secondary supporting text, felt markings, disabled button labels. Never `#FFFFFF` — this value is the maximum brightness in the entire system.

**Combination rules:** Paired with all surface levels (`color_surface`, `color_surface_high`, `color_surface_low`) for readable contrast. Icons in active or hover states use `color_text_primary`. Icons on gold-accent elements use `color_background` (#121412) for contrast instead.

---

### 2.11 `color_text_secondary` — #bfc9c4

**Used for:** Secondary supporting text, input labels, disabled button labels, `DealerTotalBadge` when dealer hand is not yet revealed (hidden per architecture spec — this color applies when the badge becomes visible in `DealerTurn` and `Resolution` phases for supporting numerals). Also the push state signal color — `color_push` is this same value.

**Not used for:** Primary hierarchy text, win numerals, card rank glyphs. Not used as the maximum brightness in any context.

**Combination rules:** Used alongside `color_text_primary` to establish hierarchy. A label in `color_text_secondary` reads as supporting information. When all labels on screen are this color, hierarchy has collapsed — that is a design error.

---

### 2.12 `color_rail` — #3d2210

**Used for:** The `Rail` sprite (dark mahogany band, 28px uniform width) surrounding the felt on all sides. The rail must read as a physically distinct surface from both the felt and the background. The pre-baked bevel sprite overlaps the felt edge suggesting the rail overhangs the recessed felt surface.

**Not used for:** Any element outside the table rail geometry. Not used for borders, panels, or chrome.

**Combination rules:** Must be at least 20% lighter in perceived lightness than `color_background` (#121412) so it reads as a separate surface. Never the same lightness value as `color_background`.

---

### 2.13 `color_win` — #C5A059 and `color_win_bloom` — #C5A059 at 12% opacity

**Used for:** `color_win` applies to win-state numerals and chip win collection signal. `color_win_bloom` applies exclusively to the screen-edge pulse animation — a radial gradient from viewport edges inward, reaching no further than 120px from the nearest edge, at maximum 12% opacity during the hold phase. The bloom is never a fill, never a background, never applied to any element other than the screen-edge layer.

**Not used for:** Loss state (no color — loss is the absence of win signal, surface returns to default). Push state (uses `color_push`/`color_text_secondary`). Error state (uses `color_error`).

**Combination rules:** `color_win_bloom` runs as a parallel animation during `Resolution` — it does not block state transitions. In reduced-motion mode, `color_win_bloom` is omitted entirely. The win numeral float in `color_gold` (`text_display_lg`, Noto Serif) is the only win signal in reduced-motion mode.

---

### 2.14 `color_loss` — #1e201e (default surface state return)

**Used for:** Loss state is the absence of a signal. On a loss outcome, the surface returns to `color_surface` (#1e201e) — no dedicated loss color is applied. Chips slide away toward the dealer area per the chip loss collection animation (350ms, standard easing), and no color bloom or numeral float fires.

**Not used for:** Any positive signal, any modal, any error condition.

**Combination rules:** The deliberate restraint of loss state is a brand rule. Adding a red flash, a color wash, or any non-neutral visual element to a loss outcome is a violation of the Grand Atrium identity.

---

### 2.15 `color_push` — #bfc9c4

**Used for:** The push outcome indicator — neutral, communicating neither win nor loss. The push indicator appears via AnimationPlayer at `transition_panel_enter` timing (400ms) as a neutral-colored element.

**Not used for:** Win state, loss state, error state. Not used for primary text hierarchy.

**Combination rules:** Same value as `color_text_secondary`. The neutrality is intentional and structural — push is a non-event in brand terms.

---

### 2.16 `color_error` — #ffb4ab

**Used for:** System errors and invalid bet states only. The `HandTotalBadge` "BUST" label text when `IsBust == true` on a `PlayerHandZone`. The bust label in `DealerHandZone` when dealer busts. Invalid bet state indicators (attempting to deal with `MainBet < MinBet`).

**Not used for:** Game resolution outcomes (win, loss, push). Not used as a win or loss signal. Not used decoratively.

**Combination rules:** This is a muted rose value — an intentional departure from saturated alarm red to stay within Grand Atrium tonality. Do not substitute a saturated red. This color appears rarely and only in genuinely invalid or terminal states.

---

### 2.17 `color_ghost_border` — #89938f at 15% opacity

**Used for:** An exception, not a default. Applied only when tonal contrast between two surface levels genuinely cannot define a required boundary without assistance. Requires justification at the point of use.

**Not used for:** Standard element boundaries, card edges (cards use drop shadow), button outlines, panel edges. The visual language is a no-border system — tonal layering carries all structural definition.

**Combination rules:** Always 15% opacity. Never opaque. Never used on the felt surface or the table rail.

---

## 3. Typography Rules

### 3.1 Font Assignment Domains

Noto Serif and Manrope are the complete typeface set. They occupy non-overlapping domains and do not mix within any single element.

**Noto Serif domain — game surface content:**
Table markings, payout text, zone labels, hand total displays, win numerals, section titles, jackpot amounts. Any text that is part of the game surface or communicates a game moment.

**Manrope domain — interaction chrome:**
Bankroll display, betting odds, action button labels, navigation, input labels, chip denominations, keyboard shortcut hints. Any text that is part of the UI chrome controlling or reflecting player interaction.

Violating this domain split — placing Manrope on a felt label, or Noto Serif on an action button — is a brand red line violation.

---

### 3.2 Text Element Map

**Felt markings ("INSURANCE PAYS 2 TO 1", "DEALER MUST DRAW TO 16", "BLACKJACK PAYS 3 TO 2")**
Font: Noto Serif | Token: `text_xl` (22px) | Weight: Regular (400) | Letter-spacing: 0.8px | Capitalization: All-caps | Color: `color_felt_marking` (#007a62 at 35% opacity) | Rendered on: `FeltMarkings` Node2D, directly on the felt surface

**Bet spot zone labels ("TRILUX", "LUCKY LUCKY")**
Font: Noto Serif | Token: `text_xl` (22px) | Weight: Regular (400) | Letter-spacing: 0.8px | Capitalization: All-caps | Color: `color_felt_marking` | Rendered on: `TriLuxBetSpot` and `LuckyLuckyBetSpot` label nodes | `ShowLabel = true`

**Hand total badges (PlayerHandZone, DealerHandZone)**
Font: Noto Serif | Token: `text_display_sm` (36px) | Weight: Regular (400) | Letter-spacing: 0px | Capitalization: Numeric — no capitalization rule applies | Color: `color_text_primary` | Bust state overrides color to `color_error` and text to "BUST" | Hidden during `Idle` and `Betting` phases; `DealerTotalBadge` hidden until `DealerTurn` and `Resolution`

**Card rank glyphs (A, K, Q, J, 2–10)**
Font: Noto Serif | Token: `text_2xl` (28px minimum) | Weight: Medium (500) | Letter-spacing: 0px | Capitalization: Standard glyph — standard mixed case or symbol (not all-caps for rank labels) | Color: `color_text_primary` for black suits; `color_suit_red` (#cc2222) for red suits (hearts, diamonds) | Rendered on: `CardFace.tscn`

**Win numeral float**
Font: Noto Serif | Token: `text_display_lg` (52px) | Weight: Bold (700) | Letter-spacing: 0px | Capitalization: Numeric — currency format | Color: `color_gold` (#C5A059) | Numeric display: dollar prefix, no tabular figures required (single appearance, not a live counter) | Animates from chip resolution point to `BankrollDisplay` position over 450ms, scale 100% to 60%, alpha fades in final 100ms

**Side bet result banner text**
Font: Noto Serif | Token: `text_display_sm` (36px) | Weight: Regular (400) | Letter-spacing: 0px | Color: `color_text_primary` for win banners; `color_text_secondary` for loss indicators | Rendered on: `SideBetResultBanner.tscn`, positioned over respective bet spot

**Bankroll display**
Font: Manrope | Token: `text_lg` (18px) | Weight: SemiBold (600) | Letter-spacing: 0px (tabular figures — no tracking adjustment) | Capitalization: Numeric — dollar prefix, no capitalization rule | Color: `color_text_primary` | Numeric display rule: tabular (monospaced) numerals mandatory — digits must not shift laterally as values change; use `font_features` `tnum` or fixed-width slot per digit | Rendered on: `BankrollDisplay.tscn` in the left UI chrome panel

**Current bet total (during Betting phase)**
Font: Manrope | Token: `text_bet_display` (42px) | Weight: Bold (700) | Letter-spacing: 0px (tabular figures) | Capitalization: Numeric | Color: `color_text_primary` | This is the largest numeral on screen during `Betting` phase — larger than the bankroll display — because the immediate bet decision is the highest-priority information at that moment | Numeric display rule: same tabular figure requirement as bankroll display

**Action button labels (Hit, Stand, Double, Split, Surrender, Deal, Clear Bet)**
Font: Manrope | Token: `text_base` (16px) | Weight: Medium (500) | Letter-spacing: 0.1rem (1.6px at 1080p) for all-caps labels | Capitalization: All-caps | Color: `color_text_primary` (active buttons); `color_text_secondary` (disabled buttons) | Icon-plus-label required for all primary game action buttons — icon-only is never used for actions with real monetary consequences

**Input labels and secondary supporting text**
Font: Manrope | Token: `text_sm` (13px) | Weight: Regular (400) | Letter-spacing: 0.1rem when used as all-caps label | Color: `color_text_secondary` | Used for supporting info, secondary numerals, the dollar-amount suffix on `ChipTray` chips (if Option B chip style were selected — not applicable since Option A is locked)

**Keyboard shortcut hints**
Font: Manrope | Token: `text_xs` (11px) | Weight: Regular (400) | Letter-spacing: 0px | Color: `color_text_secondary` | Micro-labels only; never used for any content with game consequences

**Chip denomination numerals**
Font: Manrope | Token: `text_base` (16px) | Weight: SemiBold (600) | Color: `color_text_primary` | Rendered at chip face center; Option A Classic Casino Inlay chip — denomination numeral in `text_base` Manrope SemiBold

**Approved heading/label combination**
When a heading appears over a supporting label anywhere in the UI: `text_display_lg` (Noto Serif, 52px) paired with `text_sm` (Manrope, 13px) in all-caps at 0.1rem letter-spacing. This is the only approved heading/label pairing. Do not create alternative pairings.

---

### 3.3 Numeric Display Rules

The bankroll display and bet total must use tabular (monospaced) numeral rendering. In Godot, use a font variant with `font_features` set to `tnum` if available in the Manrope variable font, or use a fixed-width slot for each digit using a Label with fixed minimum width per character. Digits must not shift laterally as values change — lateral digit shift is the specific Encore reference failure this rule corrects.

Win numerals (the floating `text_display_lg` Noto Serif value during resolution) are a single-appearance display, not a live counter. Tabular figure enforcement is not required for the win numeral float, but the value must be currency-formatted with a dollar prefix.

---

## 4. Motion Brand Rules

### 4.1 Animation Floor

No UI transition may be shorter than 300ms. This is a hard floor with no exceptions. Sub-300ms transitions break the Grand Atrium atmosphere and read as cheap or mechanical.

No game animation during an active hand may remain non-interruptible for longer than 400ms. If a player clicks a game action during any animation, the animation must complete or skip to its final state within one frame on the next input event. The 50ms card settle animation is within this threshold and completes before input is processed — it is not interruptible by design, but its duration is below the 400ms threshold.

---

### 4.2 Non-Skippable Animations

The following animations are non-interruptible and must complete before the state machine advances. They represent game resolution events that must communicate outcome:

**Chip win collection (350ms):** Non-interruptible. State machine does not advance to `Idle` until all win chips have reached their destination. 350ms is within the 400ms non-interruptible threshold.

**Chip loss collection (350ms):** Non-interruptible. Same rationale as win collection.

**Insurance prompt modal (450ms enter, 350ms exit):** Non-interruptible. The `InsurancePrompt` phase blocks all table input until the player makes a decision. The AnimationPlayer animation for modal entry is part of the phase entry — input is suppressed while `_animationsPending > 0`.

**Initial card deal arcs during Dealing phase:** All four initial deal arcs (250ms per card + 50ms settle, 90ms stagger between card starts) must complete before the phase exits. The scene tracks `_animationsPending` — each blocking arc increments this counter; each `DealArcCompleted` signal decrements it; the phase transition fires when `_animationsPending == 0`.

**Hole card flip during DealerTurn entry (200ms):** Non-interruptible. The flip must complete before the dealer draws the first additional card. `FlipCompleted` signal gates the first dealer draw.

**Side bet win banner (400ms enter + 400ms hold):** Non-interruptible. `SideBetResolution` phase holds until the banner animation sequence completes or the tip prompt resolves.

**Tip prompt (450ms enter + up to 5s hold until dismissed or auto-timeout):** Non-interruptible during `SideBetResolution`. Auto-timeout fires at 5 seconds if player does not dismiss.

---

### 4.3 Animation Timing Tokens

All durations are sourced from `visual-language.md` Section 3. No hardcoded duration values appear in component code — token names are used exclusively.

| Token | Duration | Easing | Applied to |
|---|---|---|---|
| `transition_panel_enter` | 400ms | Decelerate cubic-bezier(0.0, 0.0, 0.2, 1.0) | SettingsPanel open, SideBetResultBanner win, Shuffle indicator |
| `transition_panel_exit` | 300ms | Accelerate cubic-bezier(0.4, 0.0, 1.0, 1.0) | SettingsPanel close, TipPrompt dismiss |
| `transition_modal_enter` | 450ms | Decelerate cubic-bezier(0.0, 0.0, 0.2, 1.0) | InsuranceBetPrompt appear, RulesPanel open, CashierScreen open |
| `transition_modal_exit` | 350ms | Accelerate cubic-bezier(0.4, 0.0, 1.0, 1.0) | InsuranceBetPrompt dismiss, RulesPanel close, CashierScreen close |
| `transition_lobby_to_table` | 500ms | Standard cubic-bezier(0.4, 0.0, 0.2, 1.0) | Camera approach sit-down — table surface grows to fill screen |
| `transition_table_to_lobby` | 500ms | Standard cubic-bezier(0.4, 0.0, 0.2, 1.0) | Camera retreat — table shrinks as surround comes into view |
| `transition_fade_in` | 350ms | Decelerate | UI elements appearing (bust banner, SideBetResultBanner loss) |
| `transition_fade_out` | 300ms | Accelerate | UI elements disappearing |
| Card deal arc per card | 250ms + 50ms settle | Ease-out cubic-bezier(0.0, 0.0, 0.2, 1.0) | Each card in initial deal and hit/dealer draw |
| Card deal stagger | 90ms between card starts | — | Each card's arc starts 90ms after the previous card's arc starts |
| Card flip (hole card) | 200ms total | Phase 1 accelerate, Phase 2 decelerate | DealerTurn entry hole card reveal |
| Chip placement arc | 210ms | Ease-out cubic-bezier(0.0, 0.0, 0.2, 1.0) | Main bet, side bet, double down chip placement |
| Chip win collection | 350ms | Standard cubic-bezier(0.4, 0.0, 0.2, 1.0) | Chips slide from dealer area to player bet zone |
| Chip loss collection | 350ms | Standard cubic-bezier(0.4, 0.0, 0.2, 1.0) | Chips slide from player bet zone to dealer area |
| Win numeral float | 450ms | Decelerate cubic-bezier(0.0, 0.0, 0.2, 1.0) | Win amount from resolution point to BankrollDisplay |
| Win bloom total | 500ms (150ms in + 150ms hold + 200ms out) | Phase 1 decelerate, Phase 3 accelerate | Screen-edge bloom pulse |
| HandTotalBadge counter | 80ms | — | Value change animation on badge |
| BankrollDisplay counter | 150ms | — | Tabular numeral counter update |

---

### 4.4 Reduced-Motion Behavioral Specification

When `GlobalState.ReducedMotionEnabled == true` (controlled by the animation toggle in `SettingsPanel`, per `product-decisions.md` Q5), the following behaviors apply. State changes still occur in all cases — only the travel and visual animation is removed.

**Card deal arc:** Cards appear at final position immediately. No arc travel. No stagger — all cards appear simultaneously at the start of the `Dealing` phase.

**Card settle (50ms overshoot):** Omitted entirely. Cards appear at their final angle with no settle animation.

**Card flip (hole card):** Instant texture swap from card back to card face. No rotation animation. `FlipCompleted` signal fires immediately to unblock the dealer draw.

**Chip placement arc:** Chip appears at the betting zone destination immediately. No arc travel.

**Chip win collection:** Chips appear at player zone immediately. No slide animation. Win numeral float still plays (see below — win numeral has a reduced-motion variant, not full omission).

**Chip loss collection:** Chips disappear from player zone immediately. No slide animation.

**Win numeral float (reduced-motion variant):** The numeral appears briefly at the `BankrollDisplay` position for 100ms, then disappears. No travel from the resolution point. No scale change. This is the only win signal in reduced-motion mode — `color_win_bloom` is fully omitted.

**Win bloom:** Omitted entirely. The win numeral reduced-motion variant carries the win signal.

**UI panel and modal transitions:** These use AnimationPlayer. A `_reducedMotion` conditional in `BlackjackTable.cs` skips `AnimationPlayer.Play()` calls when reduced motion is active. Panels and modals appear and dismiss instantly.

**HandTotalBadge and BankrollDisplay counter animations (80ms and 150ms respectively):** Values update instantly. No counter animation.

---

## 5. Hierarchy and Spatial Rules

### 5.1 Visual Hierarchy

At any phase in the `GamePhase` enum, one element must be the clear focal point. The hierarchy is phase-dependent and must not be violated by competing elements:

**During `Idle`:** The felt surface (`color_felt`) dominates. The UI chrome is present but recedes — chip tray and bankroll display are visible but not competing for attention. No large numerals on screen.

**During `Betting`:** The current bet total (`text_bet_display`, 42px, Manrope Bold) is the largest numeral on screen. It is larger than the bankroll display (`text_lg`, 18px). The hierarchy communicates that the bet decision is the active priority. The Deal button (`color_gold` accent when `CanDeal == true`) is the highest-contrast interactive element.

**During `Dealing`:** Card deal arcs dominate the viewport. The table surface and card travel are the focal point. UI chrome recedes. All input is suppressed (`_animationsPending > 0`).

**During `PlayerTurn`:** The card zones (`PlayerHandZone`, `DealerHandZone`) occupy the center majority of the viewport. The `BlackjackActionPanel` action buttons (Hit, Stand, Double, Split, Surrender) are large and positioned for immediate mouse access. The hand total badges (`HandTotalBadge`, `text_display_sm`, 36px, Noto Serif) are the largest game-surface text.

**During `Resolution`:** The win numeral float (`text_display_lg`, 52px, `color_gold`) is the dominant element on a win outcome. Nothing else on screen should compete with it in scale or color. On loss and push, no large numeral fires — the chip resolution animation carries the communication.

---

### 5.2 Negative Space Minimums

The Grand Atrium identity requires expansive negative space. These minimums are binding:

**Table surface chrome-free zone:** The felt surface (`color_felt`, 900px wide × 560px tall) must be entirely free of UI chrome panels during an active hand. Chrome panels are positioned at screen edges. Minimum gap between the table surface and the inner edge of each 220px UI chrome panel: 24px (`space_6`). The remaining 290px per side beyond the chrome panel is intentional negative space — do not fill it.

**Table-to-viewport margin:** The table surface is centered in the 1920px viewport with 510px margins on each side. These margins are not available for UI content expansion. They exist as breathing room.

**Card zone inner margin:** 24px (`space_6`) between the card zone boundary and adjacent elements.

**Minimum gap between UI chrome panels and table edge:** 70px (the table surface has a minimum 70px gap to the inner edge of each chrome panel).

**Component internal padding:** All interactive elements use `space_2` (8px) as default internal padding, `space_1` (4px) for tight inset contexts. These values are not overridden for visual density.

**Corner radius:** 6px (0.375rem) on all interactive elements — buttons, input fields, chip tray, card zones, panels, modals. Not applied to the table surface or the rail. Sharp modern — not pill-shaped.

---

### 5.3 Competing-Element Prohibitions

The following combinations are prohibited because they create hierarchy competition that breaks the Grand Atrium identity:

- The win numeral float (`text_display_lg`, `color_gold`) must not appear simultaneously with any other `color_gold` fill element. The Deal button (the only other gold element) is hidden during `Resolution` phase, which is the only phase where the win numeral fires.

- The `InsuranceBetPrompt` overlay (z_index = 3, full-screen modal) must not render simultaneously with the `SideBetResultBanner` (z_index = 2, UI layer). The state machine guarantees this — `InsurancePrompt` phase follows `SideBetResolution` phase completion; banners from `SideBetResolution` are dismissed before `InsurancePrompt` fires.

- The bankroll display and the bet total display must not appear at equal visual weight. During `Betting`, the bet total (`text_bet_display`, 42px) must visually dominate the bankroll (`text_lg`, 18px). During `PlayerTurn` and `DealerTurn`, the bet total display recedes — the card zone and hand total badges are the priority.

- Floating tooltip overlays must not appear on the felt surface during an active hand. If contextual information is needed during a hand, it belongs in a fixed panel at screen edges, not overlaid on the game surface.

- Multiple full-screen overlays (z_index = 3) must never stack. Only one of `InsuranceBetPrompt`, `RulesPanel`, `SettingsPanel`, or `CashierScreen` is visible at a time.

- Borders must not be used to define element boundaries. The system communicates structure through tonal layering between `color_background`, `color_surface_low`, `color_surface`, and `color_surface_high`. Ghost borders (`color_ghost_border` at 15% opacity) are an exception requiring justification — not a default tool.

---

## 6. Win/Loss/Push State Brand Rules

### 6.1 Win Tone

A win is restrained celebration. The brand communicates win through precision signals, not spectacle: the `color_win_bloom` screen-edge pulse (500ms, `color_gold` at 12% opacity maximum, reaching no further than 120px from the nearest viewport edge), the win numeral float (Noto Serif `text_display_lg`, 52px, `color_gold`, traveling from resolution point to bankroll display over 450ms), and the chip win collection animation (350ms slide from dealer area to player bet zone). The SFX win sound (`AudioStreamPlayer`, 300–400ms chip stack sound) plays in parallel.

A win outcome communicates weight and satisfaction. It does not shout. The screen-edge bloom covers a maximum radial gradient from edges inward, never filling the viewport. The win numeral shrinks (from 100% to 60% scale) as it approaches the bankroll display, merging into it rather than arriving as a trophy.

**What is always present on a win:** Chip win collection animation (350ms slide), win numeral float (450ms, `color_gold`, Noto Serif `text_display_lg`), win bloom (500ms, screen-edge only, `color_win_bloom` at 12% max opacity), win SFX. On a blackjack win specifically: blackjack fanfare SFX also plays (`HandOutcome.BlackjackWin`).

**What is never appropriate on a win:** Full-screen color overlay, blocking modal dialog, confetti or particle effects, flashing elements, typographic weight above `text_display_lg` (52px), any color other than `color_gold` and `color_text_primary` in the win signal layer, icons added to the win numeral or the bloom.

---

### 6.2 Loss Tone

A loss is quiet and dignified. The brand communicates loss through the absence of win signals, not through dedicated negative visual feedback. Loss state uses no dedicated color — `color_loss` is defined as `color_surface` (#1e201e), the default surface state returning to neutral. Chips animate away from the player zone toward the dealer area (350ms slide, standard easing). No numeral floats. No screen-edge pulse. No color change on the UI chrome. The loss SFX plays (a single low thud or muted chip sound, distinct from and not a version of the win SFX).

**What is always present on a loss:** Chip loss collection animation (350ms slide from player bet zone toward dealer area), loss SFX. The table then transitions to `Idle` phase after the chip animation completes.

**What is never appropriate on a loss:** Red flash or color wash, a blocking modal for a standard loss (reserve modals for `PlayerBroke` only), any animated text element, any screen-edge pulse, any visual element that dramatizes or intensifies the loss experience beyond what is required to communicate the outcome clearly.

---

### 6.3 Push Tone

A push is neutral. Neither a win nor a loss. The push indicator appears via AnimationPlayer at `transition_panel_enter` timing (400ms decelerate) — a `color_push` (#bfc9c4) neutral element that communicates the outcome without affect. The player's chips are returned to the bet zone (or to the bankroll, per resolution logic). No numeral float. No screen-edge pulse. No SFX beyond the chip movement sound.

**What is always present on a push:** Push indicator (400ms AnimationPlayer, `color_push`), chip return animation, chip clink SFX on chip movement.

**What is never appropriate on a push:** Any use of `color_gold` (the push is not a win), any dramatization, any element that reads as consolation-prize celebration, any blocking modal.

---

### 6.4 Blackjack Win (Natural Blackjack)

A blackjack win is the highest-value outcome and receives additional audio distinction (blackjack fanfare SFX in addition to the win SFX). The visual treatment is identical to a standard win — the same `color_win_bloom`, win numeral float, and chip win collection — because the brand communicates blackjack through the higher payout numeral (3:2 on `MainBet` rather than 1:1), not through a separate visual layer. The fanfare SFX plays in parallel from `AudioStreamPlayer` without blocking state.

**What is never appropriate on a blackjack win:** A separate blocking animation layer, a special full-screen treatment, additional visual effects beyond what applies to any win outcome.

---

### 6.5 Surrender Tone

Surrender is a player decision, not a game outcome. The visual treatment is minimal: the surrendered hand's chips return to the bankroll (`floor(MainBet / 2)` returned), the hand is marked inactive, and the state machine advances to the next hand or `DealerTurn`. No color signal, no SFX beyond chip movement. The tone is transactional.

---

### 6.6 PlayerBroke State

The `PlayerBroke` phase (when `GlobalState.Bankroll == 0` or `GlobalState.Bankroll < MinBet` after `Resolution`) is the only standard win/loss outcome that uses a blocking full-screen modal. The `CashierScreen` opens at `transition_modal_enter` timing (450ms). The tone is matter-of-fact — not punishing, not dramatic, not celebratory. The player reloads via the cashier and the session continues.

---

## 7. Brand Red Lines

These are minimum 10 specific, actionable violations. Any single violation is sufficient to reject a design deliverable or a code implementation at gate review. "Violation" means the element must be corrected before the gate opens.

1. **Pure white (#FFFFFF) used anywhere in the UI.** The maximum brightness in the system is `color_text_primary` (#e2e3df). Using #FFFFFF on any element — text, icon, card face background, card body, UI surface — violates the Grand Atrium palette. Card face paper color must not be pure white.

2. **`color_gold` (#C5A059 or `color_gold_light` #E5C185) applied to any neutral UI element.** Gold is a signal for win states and the single Deal action button when active. Applying gold to any other label, border, icon, panel background, or decorative element destroys the signal value and is a violation regardless of opacity.

3. **Noto Serif used for any element in the Manrope domain (interaction chrome).** Specifically: action button labels (Hit, Stand, Double, Split, Surrender, Deal, Clear Bet), bankroll display, bet total display, chip denominations, input labels, keyboard shortcut hints. Any of these elements rendered in Noto Serif rather than Manrope is a brand violation.

4. **Manrope used for any element in the Noto Serif domain (game surface).** Specifically: felt markings, hand total badges, card rank glyphs, win numeral float, side bet result banners, section titles. Any of these elements rendered in Manrope rather than Noto Serif is a brand violation.

5. **Any UI transition or game animation shorter than 300ms (UI) or appearing as a snap/pop.** The 300ms floor for UI transitions is non-negotiable. A card flip of 150ms, a modal that appears in 200ms, a chip that pops into place — each is a violation. Game object animations (cards, chips) have their own timing tokens; sub-250ms card arcs or sub-210ms chip arcs are also violations against the specified token values.

6. **A blocking modal dialog for any standard game outcome (win, loss, push, blackjack win).** The `InsuranceBetPrompt` and `CashierScreen` are the only approved blocking modals. A modal appearing for a win outcome, a loss outcome, a push, or a blackjack win is a violation. These outcomes communicate through chip animation, the win numeral float, and the screen-edge bloom — not through overlays that block the table.

7. **The win bloom (`color_win_bloom`) extending further than 120px from the nearest viewport edge.** The bloom is a screen-edge pulse, not a fill. Any implementation where the bloom radial gradient reaches further than 120px inward from the nearest edge is a violation of the spatial constraint in `visual-language.md` Section 3.

8. **Felt surface color darker than `color_felt` (#004b3d).** If the felt renders at a value that makes it merge with the background, the table loses its function as the focal surface. Any shader, texture blend, or vignette that pulls the felt below #004b3d in perceived lightness is a violation.

9. **Any red or saturated alarm color used for loss state.** Loss state uses no dedicated color — the surface returns to `color_surface` (#1e201e). A red flash, a red border, a red label, or any saturated negative-signal color on a loss outcome (as distinct from `color_error` on the "BUST" badge, which is the only approved non-neutral color in a negative game state) is a violation of the Grand Atrium restraint principle.

10. **Icon-only action buttons for Hit, Stand, Double, Split, or Surrender.** All primary game action buttons require icon-plus-label rendering at all times. These actions have real monetary consequences and must be unambiguous. An icon-only implementation of any of these five actions is a violation, regardless of icon clarity or size.

11. **Borders used as the primary structural boundary for any element.** The visual language is a no-border system. Tonal layering between surface levels defines all structure. A visible border (any stroke that is not `color_ghost_border` at 15% opacity applied as a documented exception) on a button, panel, card zone, chip tray, or any other element is a violation.

12. **The bankroll display and the current bet total rendered at equal visual weight during `Betting` phase.** The bet total must be the largest numeral on screen during bet placement. Matching the bankroll display size to the bet total, or rendering them at the same `text_lg` / `text_base` scale, collapses the hierarchy the `text_bet_display` (42px) token is specifically defined to establish.

13. **`color_felt_marking` applied at full `#007a62` opacity without the 35% opacity reduction.** Felt markings must render at `#007a62` at 35% opacity over the `color_felt` base. Applying the full `#007a62` color without opacity reduction makes the markings too bright, creates competition with card content, and departs from the subdued felt printing effect the token is designed to achieve.

14. **The `color_surface_modal` backdrop applied opaque or without 20px blur.** Any full-screen overlay (`InsuranceBetPrompt`, `RulesPanel`, `SettingsPanel`, `CashierScreen`) that renders with an opaque `#333533` background or without the paired 20px backdrop blur is a violation. The semi-transparency through to the table surface is load-bearing for the Grand Atrium depth effect.

---

**Brand Guardian:** Phase 8 Design Reference
**Document Date:** 2026-03-31
**Governs:** All design deliverables in `blackjack/designs/` and all visual implementation in `res://games/blackjack/`
**Source documents:** `visual-language.md` v1.0, `ux-research.md`, `blackjack/game-spec.md` v1.1, `blackjack/architecture.md` v1.0, `component-boundaries.md` v1.0, `product-decisions.md`
**Amendment process:** Changes to visual values require amending `visual-language.md` first. This document updates in the same commit to reflect the amended token.
