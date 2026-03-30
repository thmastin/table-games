# Visual Language Specification — Casino Table Games Suite

**Version:** 1.0
**Date:** 2026-03-29
**Status:** Authoritative — no visual value may be invented outside this document
**Platform:** Godot 4, desktop only (Windows/Linux), minimum Intel HD Graphics 530

This document is the single source of truth for all visual values. Every component, scene, and shader in the project derives its values from this specification. If a value is not defined here, it does not exist in the project — add it here first.

---

## 1. Color Palette

All hex values are locked from the Stitch design output and ux-research.md. No new colors may be introduced without amending this document.

### Backgrounds and Surfaces

| Role | Token Name | Hex | Opacity | Notes |
|---|---|---|---|---|
| Background | `color_background` | #121412 | 100% | Near-black, slightly warm. No gradient, no texture. Entire viewport base. |
| Section surface | `color_surface_low` | #1a1c1a | 100% | First lift. Defines large structural content regions. |
| Interactive surface | `color_surface` | #1e201e | 100% | Second lift. Buttons, input fields, chip tray. |
| Elevated surface | `color_surface_high` | #292a28 | 100% | Third lift. Cards, raised panel elements. |
| Modal surface | `color_surface_modal` | #333533 | 60% | Paired with 20px backdrop blur. Never rendered opaque. |

### Primary and Accent

| Role | Token Name | Hex | Opacity | Notes |
|---|---|---|---|---|
| Primary / felt | `color_felt` | #004b3d | 100% | Table surface. The focal surface in every scene. Never darker than this value. |
| Gold secondary | `color_gold` | #C5A059 | 100% | Win states, active chip glow, winning amount numerals. Signal color — not decoration. |
| Gold tertiary | `color_gold_light` | #E5C185 | 100% | More restrained than gold secondary. Chip edge highlights, hover states on gold elements only. |

### Text

| Role | Token Name | Hex | Notes |
|---|---|---|---|
| Primary text | `color_text_primary` | #e2e3df | Maximum brightness in the entire system. Never use #FFFFFF. |
| Secondary text / input labels | `color_text_secondary` | #bfc9c4 | Slightly desaturated. Input labels, supporting info, secondary numerals. |

### Rail

| Role | Token Name | Hex | Notes |
|---|---|---|---|
| Rail / table edge | `color_rail` | #3d2210 | Dark mahogany. At least 20% lighter than background in perceived lightness to read as a distinct surface. |

### Felt Markings

| Role | Token Name | Derived From | Opacity | Notes |
|---|---|---|---|---|
| Felt printed text | `color_felt_marking` | #004b3d lightened 35% = #007a62 | 35% | Step 1: Compute lightened base: #004b3d lightened 35% = #007a62. Step 2: Apply #007a62 at 35% opacity over #004b3d felt surface. Do NOT apply full #007a62 without the opacity reduction. The rendered effective color on screen is approximately #004f41. |

### Semantic States

| Role | Token Name | Hex | Notes |
|---|---|---|---|
| Win state | `color_win` | #C5A059 | Gold secondary. Win numerals, edge bloom color. |
| Win bloom | `color_win_bloom` | #C5A059 | 12% opacity at viewport edge. Not a fill — a screen-edge pulse. |
| Loss state | `color_loss` | #1e201e | No dedicated loss color. Loss is the absence of win signal — default surface state returns. |
| Push state | `color_push` | #bfc9c4 | Secondary text color. Neutral — neither win nor loss. |
| Error | `color_error` | #ffb4ab | Used only for system errors and invalid bet states. Not used in game resolution. Muted rose per stitch-design.md — intentional departure from saturated alarm red to stay within Grand Atrium tonality. |
| Ghost border | `color_ghost_border` | #89938f | Applied at 15% opacity only. Exception, not default. |

### Chip Colors by Denomination

These follow standard casino convention. The chip body uses the listed base color; edge segments alternate between the base color and a 30%-lightened version of that base.

| Denomination | Token Name | Hex | Notes |
|---|---|---|---|
| $1 | `color_chip_1` | #d4cfc7 | Off-white. Not pure white — stays within the no-white rule by using a warm near-white. |
| $5 | `color_chip_5` | #cc2222 | Casino red. Standard convention. |
| $25 | `color_chip_25` | #228822 | Casino green. Distinct from felt — saturated, not deep. |
| $100 | `color_chip_100` | #1a1a1a | Near-black with light edge highlight. Edge highlight: #6b6b6b. |
| $500 | `color_chip_500` | #5b3d8a | Casino purple. Standard high-denomination convention. |

---

## 2. Typography Scale

### Font Families

Both fonts are embedded as Godot project assets. System font fallback is not used — embedding is mandatory for cross-platform consistency.

```
Display / Headlines:  Noto Serif
                      Fallback: Georgia, "Times New Roman", serif

UI / Body:            Manrope
                      Fallback: "Segoe UI", Ubuntu, system-ui, sans-serif
```

**Pairing rule:** Wherever a heading appears over a supporting label, use `headline-lg` (Noto Serif) paired with `title-sm` (Manrope) in all-caps at 0.1rem letter-spacing. This is the only approved heading/label combination. 1080p computed equivalent: 1.6px. Use 0.1rem as the authoritative value in Godot theme overrides.

Token mapping: headline-lg = text_display_lg (52px Noto Serif). title-sm = text_sm (13px Manrope).

**Assignment rule:** Noto Serif is for game surface content — table markings, payout text, zone labels, jackpot amounts, win numerals, section titles. Manrope is for interaction chrome — bankroll display, betting odds, action button labels, navigation, input labels. These domains do not mix.

### Named Size Steps (1080p Baseline)

All values are pixel sizes as used in Godot's `font_size` property.

Note: 1440p and 4K scaling strategy deferred. Godot viewport scaling approach to be declared in Phase 5 (Technical Architecture).

| Step | Token Name | px | Font | Primary Use |
|---|---|---|---|---|
| xs | `text_xs` | 11px | Manrope | Micro-labels, keyboard shortcut hints |
| sm | `text_sm` | 13px | Manrope | Secondary supporting text, input labels |
| base | `text_base` | 16px | Manrope | Body text, button labels, navigation items |
| lg | `text_lg` | 18px | Manrope | Prominent UI labels, bet field values |
| xl | `text_xl` | 22px | Noto Serif | Table zone markings, payout table entries |
| 2xl | `text_2xl` | 28px | Noto Serif | Card rank glyphs (minimum readable size) |
| display-sm | `text_display_sm` | 36px | Noto Serif | Section titles, hand total display |
| display-lg | `text_display_lg` | 52px | Noto Serif | Jackpot amounts, primary win numerals |
| bet-display | `text_bet_display` | 42px | Manrope | Current bet total during active betting (largest numeral on screen) |

### Font Weights

| Weight | Value | Usage |
|---|---|---|
| Regular | 400 | Body text, supporting labels, felt markings |
| Medium | 500 | Button labels, input field content, card rank glyphs |
| SemiBold | 600 | Active state labels, bankroll display |
| Bold | 700 | Win numerals, bet-display size, primary CTAs |

### Letter-Spacing Rules

| Context | Tracking | Unit |
|---|---|---|
| All-caps UI labels (Manrope, any size) | 0.1rem | Applied in Godot as `outline_size` offset equivalent — use theme override. 1080p computed equivalent: 1.6px. Use 0.1rem as the authoritative value in Godot theme overrides. |
| Numeric bankroll display | 0px | Tabular figures — no tracking adjustment needed |
| Felt markings (Noto Serif, xl and below) | 0.8px | Slight open tracking for readability on textured surface |
| Card rank glyphs | 0px | Standard spacing — legibility at speed |
| Win numeral display | 0px | Standard — size carries the hierarchy |

### Numeric Display Rule

The bankroll display and bet total must use tabular (monospaced) numeral rendering. In Godot, use a font variant with `font_features` set to `tnum` if available in the Manrope variable font, or use a fixed-width slot for each digit using a Label with fixed minimum width per character. Digits must not shift laterally as values change.

---

## 3. Motion Specification

All durations and easing curves are defined here. Component code uses token names — no hardcoded durations anywhere in the project.

### UI Transitions (Menus, Overlays, Panels, Lobby Navigation)

These govern all non-game animation — any state change in the UI chrome.

| Transition Name | Duration | Easing | Cubic-Bezier | Description |
|---|---|---|---|---|
| `transition_panel_enter` | 400ms | Decelerate | cubic-bezier(0.0, 0.0, 0.2, 1.0) | Panels, overlays sliding into position. Fast entry, gradual settle. |
| `transition_panel_exit` | 300ms | Accelerate | cubic-bezier(0.4, 0.0, 1.0, 1.0) | Panels dismissed. Quicker exit than entry — decisive. |
| `transition_modal_enter` | 450ms | Decelerate | cubic-bezier(0.0, 0.0, 0.2, 1.0) | Modals and full-screen overlays. Heavier than panel — carries more weight. |
| `transition_modal_exit` | 350ms | Accelerate | cubic-bezier(0.4, 0.0, 1.0, 1.0) | Modal dismissal. |
| `transition_lobby_to_table` | 500ms | Standard | cubic-bezier(0.4, 0.0, 0.2, 1.0) | Camera-approach sit-down. Table surface grows to fill screen. Maximum allowed UI transition duration. |
| `transition_table_to_lobby` | 500ms | Standard | cubic-bezier(0.4, 0.0, 0.2, 1.0) | Reverse camera-retreat. Table shrinks as surround comes into view. |
| `transition_fade_in` | 350ms | Decelerate | cubic-bezier(0.0, 0.0, 0.2, 1.0) | Alpha fade for UI elements appearing. |
| `transition_fade_out` | 300ms | Accelerate | cubic-bezier(0.4, 0.0, 1.0, 1.0) | Alpha fade for UI elements disappearing. |

**Rule:** No UI transition may be shorter than 300ms. No UI transition may exceed 500ms. Fast transitions break the Grand Atrium atmosphere.

### Game Animations (Card Deals, Chip Movement, Reveals)

These govern all on-table physical-object animations. Separate from UI transitions.

#### Card Deal Arc

| Property | Value |
|---|---|
| Duration per card | 250ms |
| Easing | Ease-out: cubic-bezier(0.0, 0.0, 0.2, 1.0) |
| Path type | Lateral arc across felt surface (not vertical drop) |
| Arc peak height | 18px above table surface plane at mid-travel |
| Stagger between cards | 90ms (each card's animation starts 90ms after the previous card's animation starts, not after it completes) |
| Interruptibility | Yes — on player input event, skip to final position within one frame |
| Reduced-motion fallback | Cards appear at final position immediately. No travel. Stagger removed — all cards appear simultaneously. |

#### Card Settle

Immediately follows the deal arc, applied to each card on landing.

| Property | Value |
|---|---|
| Duration | 50ms |
| Easing | Ease-in-out: cubic-bezier(0.4, 0.0, 0.6, 1.0) |
| Behavior | 2.5-degree rotation overshoot in direction of travel, corrects to final angle |
| Interruptibility | No — 50ms is within the 400ms interrupt threshold. Completes before input is processed. |
| Reduced-motion fallback | Omitted entirely. Cards appear at final angle with no settle. |

#### Card Flip (Face Reveal)

| Property | Value |
|---|---|
| Duration | 200ms total |
| Phase 1 (back to edge) | 100ms — horizontal axis rotation 0° to 90°, easing: cubic-bezier(0.4, 0.0, 1.0, 1.0) |
| Phase 2 (edge to face) | 100ms — texture swap at 90°, then 90° to 180°, easing: cubic-bezier(0.0, 0.0, 0.2, 1.0) |
| Rotation axis | X-axis (horizontal flip, as if card is being turned toward player) |
| Interruptibility | Yes — on player input event, snap to face-visible final state within one frame |
| Reduced-motion fallback | Instant texture swap from back to face. No rotation. |

#### Chip Placement

| Property | Value |
|---|---|
| Duration | 210ms |
| Easing | Ease-out: cubic-bezier(0.0, 0.0, 0.2, 1.0) |
| Path type | Arc from chip tray to betting zone |
| Arc peak height | 20px above table surface plane at mid-travel |
| Scale behavior | No scale change — chip is full size for entire arc |
| Interruptibility | Yes — snap to betting zone final position within one frame on input |
| Reduced-motion fallback | Chip appears at betting zone immediately. No arc. |

#### Chip Stack Offset

| Property | Value |
|---|---|
| Vertical offset per chip | 4px upward from previous chip center |
| Visual layering | Each chip in stack renders above previous (higher z-index) |
| No animation | Stack offset is applied immediately on placement — the arc animation lands the chip at its stacked position |

#### Chip Win Collection

| Property | Value |
|---|---|
| Duration | 350ms |
| Easing | Standard: cubic-bezier(0.4, 0.0, 0.2, 1.0) |
| Path type | Straight slide from dealer area toward player betting zone |
| Interruptibility | No — resolution animation must complete to communicate outcome. Exception: if duration exceeds 400ms total, allow skip. At 350ms this is within threshold. |
| Reduced-motion fallback | Chips appear at player zone. No slide. Win numeral still plays. |

#### Chip Loss Collection

| Property | Value |
|---|---|
| Duration | 350ms |
| Easing | Standard: cubic-bezier(0.4, 0.0, 0.2, 1.0) |
| Path type | Straight slide from player betting zone toward dealer area |
| Interruptibility | No — same rationale as win collection. |
| Reduced-motion fallback | Chips disappear from player zone. No slide. |

#### Win State Pulse (Screen-Edge Bloom)

| Property | Value |
|---|---|
| Duration | 500ms total |
| Phase 1 (bloom in) | 150ms — alpha 0% to 12%, easing: cubic-bezier(0.0, 0.0, 0.2, 1.0) |
| Phase 2 (bloom hold) | 150ms — hold at 12% opacity |
| Phase 3 (bloom out) | 200ms — alpha 12% to 0%, easing: cubic-bezier(0.4, 0.0, 1.0, 1.0) |
| Color | `color_win_bloom` (#C5A059 at 12% opacity) |
| Coverage | Viewport edge only — radial gradient from edges inward, reaching no further than 120px from nearest edge |
| Interruptibility | Yes — bloom can be interrupted by next betting action |
| Reduced-motion fallback | Omitted entirely. Win numeral animation is the only win signal. |

#### Win Numeral Float

| Property | Value |
|---|---|
| Duration | 450ms |
| Easing | Decelerate: cubic-bezier(0.0, 0.0, 0.2, 1.0) |
| Path | Animates from chip resolution point toward bankroll display position |
| Scale | Starts at 100%, shrinks to 60% as it approaches bankroll |
| Alpha | Starts at 100%, fades to 0% in final 100ms |
| Font | `text_display_lg` Noto Serif, `color_gold` (#C5A059) |
| Interruptibility | Yes — can be interrupted by next betting action |
| Reduced-motion fallback | Numeral appears briefly at bankroll position (100ms), then disappears. No travel. |

---

## 4. Component Options

The developer must choose one option per pair before Phase 4 begins. No default is recommended — both options are valid for this aesthetic.

---

### Card Back Design

**Option A: Lattice Diamond**
A repeating diamond lattice pattern in two tones of deep emerald. The diamond grid uses `color_felt` (#004b3d) as the background and a fine 1px line grid in a 15%-lightened version of the felt (#007a62). A thin gold border frame — 2px, `color_gold` (#C5A059) at 60% opacity — runs 6px inside the card edge. The overall impression is a premium geometric card stock that references casino green without being a felt swatch. No logo, no central motif. Pattern scale: diamond cells are 8px wide at base card size.

Note: Pattern scale behavior at non-base card sizes (e.g., split-hand reduced scale) is deferred to Phase 8 (Blackjack High-Fidelity Design).

**Option B: Chevron Stripe with Center Seal**
A diagonal chevron stripe pattern running at 45 degrees, using `color_surface_high` (#292a28) and `color_surface_low` (#1a1c1a) as the two alternating stripe colors. Stripe width: 6px at base card size. Over the center third of the card, a circular medallion seal is stamped in `color_gold` (#C5A059) at 25% opacity — a simple eight-pointed compass rose, 1pt stroke, no fill. The same 2px gold border frame as Option A at the card edge. Reads as a private-club playing card — the stripe pattern recedes, the faint seal gives it identity without being a gamification logo.

---

### Chip Style

**Option A: Classic Casino Inlay**
Circular chip with a flat face. Background fill uses the denomination's base color (see chip color tokens). The chip edge features 8 alternating segments — 4 in the base color, 4 in a 30%-lightened version of the base color — each segment is 12px wide at standard chip diameter. Center face has a thin gold ring inlay at 80% radius — 1px stroke, `color_gold_light` (#E5C185) at 50% opacity — and the denomination numeral rendered in `text_base` (16px) Manrope SemiBold at `color_text_primary` (#e2e3df). No texture, no emboss — flat face with the inlay ring. Top surface has a single radial highlight: a soft white ellipse at 40% opacity in the upper-left quadrant, 24px wide, to suggest a convex dome surface.

**Option B: Textured Rim with Denomination Plaque**
Circular chip with a slightly more dimensional approach. The rim (outer 14px of diameter) is rendered with a fine crosshatch texture in the chip's base color — achieved via a tileable rim texture asset, not a shader. The flat center area uses `color_surface_high` (#292a28) regardless of denomination — the denomination color only appears in the rim. Center area contains the denomination text in `text_lg` (18px) Manrope Bold at `color_text_primary` (#e2e3df), and below it in `text_xs` (11px) Manrope Regular at `color_text_secondary` (#bfc9c4), the dollar amount spelled with a "$" prefix (e.g., "$25"). The denomination color coding is communicated entirely by the rim, making the chip face legible even at small sizes.

Exception: $100 chip (near-black rim on #292a28 center). Apply a 1px inner highlight ring at color_surface_highest (#333533) at 60% opacity to provide minimum legibility separation. The denomination label must use color_text_primary (#e2e3df) not a darkened variant.

---

### Table Surface Treatment

**Option A: Subtle Noise Texture with Radial Vignette**
The felt surface uses a tileable noise texture asset (512x512px tileable PNG) blended over the base `color_felt` (#004b3d) at 8% opacity in Multiply blend mode. This approximates felt pile variation at minimal GPU cost. A radial gradient vignette is applied over the texture: table center is 12% brighter than `color_felt`, edges fade back to exact `color_felt` value. Felt markings (betting arcs, zone labels) are rendered as flat `color_felt_marking` (#007a62 at 35% opacity) text and vector shapes with no additional texture. Rail is a solid `color_rail` (#3d2210) band with a 4px inner shadow (inward, toward felt, 8% black opacity) on its felt-facing edge to suggest depth — as if the felt surface sits in a recessed inlay.

**Option B: Directional Sheen with Fiber Grain**
The felt surface uses two layered elements: a base `color_felt` (#004b3d) fill, and a directional fiber grain texture (512x512px tileable PNG with a consistent directional weave pattern) blended at 12% opacity in Screen blend mode. The sheen direction runs from lower-left to upper-right at approximately 35 degrees, mimicking how casino felt reflects light from an overhead source. No radial vignette — the directionality of the fiber sheen itself provides the lighting illusion, with the upper-left quadrant of the table appearing slightly brighter than the lower-right. Felt markings use the same `color_felt_marking` token as Option A. Rail uses `color_rail` (#3d2210) with a pre-baked bevel sprite (a 12px-wide gradient strip from #3d2210 at 100% to #3d2210 at 0%) overlapping the felt edge, suggesting the rail overhangs the recessed felt surface.

---

## 5. Spacing and Sizing System

### Base Unit

**8px.** All spacing values are multiples of this unit. The 4px half-unit is available for fine-grained internal component padding only — not for layout spacing between components.

### Named Scale Steps

| Token Name | px Value | Usage |
|---|---|---|
| `space_1` | 4px | Internal component padding (icon-to-label gap, inset padding tight) |
| `space_2` | 8px | Default component internal padding, small gaps |
| `space_3` | 12px | Medium internal spacing, compact list item padding |
| `space_4` | 16px | Standard component padding, gap between related elements |
| `space_6` | 24px | Gap between distinct UI elements, card zone inner margin |
| `space_8` | 32px | Section spacing, gap between major zones |
| `space_12` | 48px | Large section margins, lobby item spacing |
| `space_16` | 64px | Hero margins, major panel padding |
| `space_20` | 80px | Maximum panel inset, full-screen overlay padding |

### Corner Radius

**Single value — 6px** (equivalent to 0.375rem at 16px base). Applied to all interactive elements: buttons, input fields, chip tray, card zones, panels, modals. Not applied to the table surface itself or the rail.

### Card Dimensions

| Property | Value | Notes |
|---|---|---|
| Aspect ratio | 2.5 : 3.5 (standard poker card) | Width to height |
| Base width at 1080p | 80px | Single card in standard hand state |
| Base height at 1080p | 112px | Derived from aspect ratio |
| Maximum width | 80px | Cards must not exceed 9% of table width at 1080p (table width ~900px; 9% = 81px, rounded to 80px) |
| Card overlap in hand | 28px | Horizontal offset between cards in a multi-card hand |
| Drop shadow blur | 4px | Per-card shadow |
| Drop shadow offset | 0px horizontal, 2px vertical | Downward, suggesting overhead light source |
| Drop shadow opacity | 25% black | Consistent across all cards — back and face |

### Chip Dimensions

| Property | Value | Notes |
|---|---|---|
| Standard diameter | 52px | At 1080p |
| Stack offset (vertical) | 4px | Each chip in a stack renders 4px above the previous |
| Tray chip diameter | 44px | Chips in the chip tray are 85% of standard size |
| Selection glow radius | 8px | Blur radius of `color_gold` (#C5A059) glow on selected chip |
| Selection glow opacity | 40% | |
| Edge segment count | 8 | 4 base color + 4 lightened alternating |

### Table Layout (1080p Reference)

| Zone | Dimension | Notes |
|---|---|---|
| Table surface width | 900px | Centered in 1920px viewport, 510px on each side of margins |
| Table surface height | 560px | From rail top to rail bottom |
| Rail width | 28px | Uniform band around the felt edge |
| Viewport horizontal margin | 510px each side | Space for UI chrome panels |
| Player betting zone — width per seat | 88px | Centered on each player position arc |
| Player betting zone — height | 80px | |
| Card deal zone — width | 200px | Dealer card area at table top |
| Card deal zone — height | 130px | Accommodates two cards without overlap issues |
| UI chrome panel width (left) | 220px | Bankroll, chip tray |
| UI chrome panel width (right) | 220px | Action buttons, hand total |
| Minimum gap between table and UI chrome | 24px (`space_6`) | Felt must be chrome-free |

The remaining 290px per side (beyond the 220px UI chrome panels) is intentional negative space consistent with the Grand Atrium expansive margin principle. UI chrome panels are positioned flush to the viewport edge. The table surface has a minimum 70px gap to the inner edge of each chrome panel.

---

## 6. Iconography

### Stroke Weight

**1pt (1px at 1x resolution).** All icons in the system use thin-line strokes. No filled icons, no heavy-weight styles. This is a hard rule — icon libraries with 2pt or filled variants are not used.

### Size Scale

| Token Name | px | Context |
|---|---|---|
| `icon_sm` | 16px | Inline with `text_sm` labels, tight UI contexts |
| `icon_base` | 20px | Default size — button labels, navigation items |
| `icon_lg` | 24px | Standalone icons, prominent action contexts |
| `icon_xl` | 32px | Large contextual icons, empty state illustrations |

### Usage Rules

1. **Icon-plus-label required for all primary game action buttons** (Hit, Stand, Double, Split, Surrender). Icon-only is never used for actions with real monetary consequences.
2. **Icon color follows text color.** Icons in default state use `color_text_secondary` (#bfc9c4). Icons in active or hover state use `color_text_primary` (#e2e3df). Icons on gold-accent elements use `color_background` (#121412) for contrast.
3. **No icon on the gold win signal.** The win numeral float and the screen-edge bloom are type and color only. Adding an icon to a win state reads as gamification.
4. **Touch target rule does not apply** (desktop only). However, click target for any icon-bearing button must have a minimum 36px hit area on both axes, even if the visual icon is smaller.
5. **SVG assets only.** No rasterized icon textures. Godot imports SVG natively — use SVG source at 24px base size and scale via `icon_base`/`icon_sm`/`icon_lg` tokens.
6. **Stroke cap:** Round cap, round join on all icon strokes. Square caps are not used.

---

**Visual Language Author:** Phase 3 Agent
**Document Date:** 2026-03-29
**Governs:** All Godot 4 scenes, components, shaders, and assets in the Casino Table Games Suite
**Amendment Process:** Changes require updating this file and noting the version and date of change at the top.
