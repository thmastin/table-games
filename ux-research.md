# UX Research — Casino Table Games Suite

**Phase:** 2
**Status:** PENDING APPROVAL
**Last Updated:** 2026-03-29
**Note:** Updated 2026-03-29 — Stitch aesthetic direction incorporated.

---

## Section 0: Aesthetic Direction — The Grand Atrium

This section establishes the creative north star for the project, derived from Stitch design output. The Stitch work was generated as a web lobby interface and is used here for aesthetic direction only — color palette, typography, surface philosophy, and animation feel. It is not a reference for layout or component structure, which are defined in later phases.

### Creative Direction

"The Grand Atrium" — a private high-roller lounge. Hushed atmosphere, expansive negative space, deep tonal layering, sophisticated typography. This is the opposite of noisy flashing-light casino tropes. Every decision in the visual language should be asked against this direction: does this read as a private room, or does it read as a slot floor?

### Color Palette (Locked)

These values are locked from the Stitch output and are the authoritative source for all color decisions in the visual language.

**Backgrounds and Surfaces**

| Role | Hex | Notes |
|---|---|---|
| Background | #121412 | Near-black, slightly warm. No gradient, no texture. |
| Section surface | #1a1c1a | First lift off background. |
| Interactive surface | #1e201e | Second lift. Buttons, input fields. |
| Elevated surface | #292a28 | Third lift. Cards, chips, raised elements. |
| Modal surface | #333533 at 60% opacity | Paired with 20px backdrop blur. |

**Primary and Accent**

| Role | Hex | Notes |
|---|---|---|
| Primary / felt | #004b3d | Emerald. The table surface color. |
| Gold secondary | #C5A059 | Used sparingly — win states and high-value actions only. |
| Gold tertiary | #E5C185 | Even more restrained than secondary. Highlights, chip glow. |

**Text**

| Role | Hex | Notes |
|---|---|---|
| Body / primary text | #e2e3df | Never pure white. This is the maximum brightness. |
| Input labels | #bfc9c4 | Slightly desaturated from body text. |

### Typography (Locked)

**Display / Headlines:** Noto Serif — for jackpot amounts, section titles, big moments, and all felt markings. This is the personality font.

**UI / Body:** Manrope — for betting odds, bankroll display, labels, navigation, action buttons.

**Pairing rule:** headline-lg Noto Serif paired with title-sm Manrope in all-caps at 0.1rem letter-spacing. This combination appears wherever a heading needs visual hierarchy over a supporting label.

### Surface Philosophy (Locked)

**No borders.** Structure is defined through light and shadow — tonal layering between surface levels. Borders do not exist in this design language except as ghost borders.

**Ghost borders:** outline_variant color at 15% opacity only. Used only when absolutely required to define a boundary that tonal contrast cannot achieve on its own. Treat as an exception, not a default.

**Ambient shadows:** 32px blur, 0px offset, 8% opacity. Soft glow, not a hard cast shadow. Shadows suggest elevation, not edge.

**Modals:** surface_variant at 60% opacity plus 20px backdrop blur behind the modal layer. No opaque modal backgrounds.

### Animation Feel (Locked — UI Transitions Only)

UI transitions: 300–500ms, eased cubic-bezier, described as "heavy and luxurious." Nothing snaps. Nothing flashes. Transitions communicate that moving between states has weight.

This timing applies to UI chrome — menus, overlays, panels, and lobby navigation. Game animation timing (card deal arcs, chip travel) is governed separately by the game-feel specs in Section 2 and is not overridden by this value.

### Components Direction

- Icons: thin-line, 1pt stroke
- Corner radius: 0.375rem (sharp modern, not pill-shaped)
- Chip component: surface_container_highest background, thin gold outline at 20% opacity, glows #C5A059 on selection

---

## Section 1: Encore Casino Games Collection Analysis

### Color Properties

**Background:** Near-black, approximately #0d0d0d–#111111. No gradient, no texture — flat fill that reads as a generic dark environment rather than a casino floor. The darkness is uniform, which loses depth.

**Felt:** Dark green in the #1a5c2a range, flat fill, no texture variation, no directional shading. The felt does not visually distinguish itself from the surrounding dark environment — both read as dark, only the hue separates them. Contrast is insufficient for peripheral readability.

**Rail/Table Edge:** Dark brown to burgundy, approximately #3a1a0f–#4d2010. The rail is thin and low-contrast against the background — functionally present but visually underweighted. No padding, cushion, or beveling that would suggest a physical rail.

**Chip Colors (standard casino mapping):**
- White: $1 — approximately #e8e8e8 with minimal detail
- Red: $5 — approximately #cc2222
- Green: $25 — approximately #228822
- Black: $100 — approximately #1a1a1a with light edge highlight
- There is no $500 chip rendered; higher denominations not visible in the reference

**Card Face Treatment:** White background, standard ANSI red/black for suits. Cards are oversized relative to real scale — approximately 1.5–2x what the table geometry would suggest at the depicted angle. No texture, no paper grain, no drop shadow under cards. Cards do not read as physical objects; they read as UI elements placed on the felt.

**Card Back:** Solid color with simple geometric pattern. No premium feel — reads as a generic playing card stock image.

---

### Table Geometry

**Perspective Angle:** Elevated top-down, approximately 60–70 degrees from horizontal. Not true top-down (90 degrees) — there is slight depth perspective visible on the rail, but foreshortening is minimal. The angle reads more like "viewed from above the dealer's shoulder" than a seated player's view.

**Blackjack Table Shape:** Correct semicircular layout. The arc of the betting circle positions is accurate to a real BJ table. However the felt edge-to-rail transition has no depth — the table looks like a flat 2D sprite rather than a solid object.

**Card Scale Relative to Table:** Cards occupy approximately 8–10% of table width for a single card. At 1080p this reads as comfortably large but the scale mismatch (cards too large for the implied table depth) breaks physical plausibility.

**Chip Scale Relative to Table:** Chips are rendered as stacked counter displays, not physical chip objects. A numeral inside a circle represents the denomination. There is no simulation of a real chip stack — no height, no edge texture, no stacking animation.

**Card/Chip Placement Zones:** Correctly positioned per standard layout (betting circle near player, card zones across the felt). Zone boundaries are implied by placement but not marked — no printed arc lines, text markings, or felt inlays that real casino tables use to delineate zones.

---

### Animation Properties

**Card Deal Speed:** Approximately 150–200ms per card, using frame-skip rather than interpolated motion. Cards appear to jump from deck position to final position in 2–3 discrete frames rather than traveling a visible arc. There is no arc trajectory — the card does not travel across the table.

**Chip Behavior:** No animation. Chips increment as a counter when clicked. No drag, no drop, no placement arc, no stack build.

**Win/Loss Resolution:** Chips are added or removed from the counter display without animation. No visual feedback distinguishing a win from a loss beyond the number changing and a brief color flash.

**Skippability:** Animations are not skippable by the player. The frame-skip speed means this is not a meaningful pain point — the deal sequence is over before impatience registers — but it means there is no animation toggle in the UI.

**State Transitions:** Menu to table is an immediate cut — no transition animation. Sitting down at a table is indistinguishable from navigating between any two screens.

---

### Typography

**Font Category:** Generic sans-serif, likely a system font or a near-system font (appears to be Arial or a close derivative). No display font for headers or table labels.

**Sizing:** Card value glyphs at approximately 18–20px equivalent on a 1080p display. Chip counter numerals at approximately 16px. Both are readable but neither contributes to a premium feel — the type has no personality.

**Numeric Displays:** Monospaced behavior not present — bankroll digits shift slightly as values change, creating visual instability in the counter display.

**Label Hierarchy:** Table name labels and bet field labels use the same weight and size as body text. Nothing is visually elevated.

---

### Keep List — What Encore Does Well

1. **Dark ambient palette as foundation.** The near-black background with colored felt is correct for the target feel. The color direction is right even if the contrast execution is wrong.
2. **Standard chip color coding.** The denomination-to-color mapping matches real casino conventions exactly. Players who have been to a casino will recognize it immediately.
3. **Correct table geometry.** The semicircular BJ table, the craps layout geometry, the placement of betting zones — these are accurate. The underlying spatial logic is sound.
4. **Oversized cards.** Reading card values quickly during play is more important than spatial realism. The scale choice is correct even if the execution lacks physical quality.
5. **No gamification.** No XP bar, no achievement popups, no level-up animations. The restraint is correct — it preserves the casino feel.
6. **No avatar heads on the player side.** The player side of the table is clean. Only the dealer side has the problematic avatar.

---

### Do-Not-Repeat List — What Is Dated or Wrong

1. **Floating dealer avatar heads.** Cartoon/CGI bust-style avatars are the single most criticized visual element. They introduce a tone mismatch — the table is attempting premium, the avatar is arcade.
2. **Frame-skip card dealing.** Cards should travel across the felt. A frame-skip deal has no physical plausibility and undermines the "weighty object" feel target.
3. **Abstract chip counter display.** A number in a circle is a UI widget, not a casino chip. It does not satisfy the tactile feel of chip placement.
4. **Uniform darkness with insufficient contrast.** When background and felt are both near-dark values, the table surface does not read as a distinct lit surface. The table should be the brightest, most saturated element in the scene — not just slightly lighter than the background.
5. **Flat felt with no texture or lighting.** The felt reads as a filled rectangle. Real casino felt has directional pile, sheen variation, and edge wear. Micro-texture and directional light would add significant physical plausibility at low performance cost.
6. **Generic jazz loops.** No ambient casino sound (murmur, distant slots, AC hum). No positional audio on chip or card events. Audio contributes nothing to the experience.
7. **System font typography.** A well-chosen display font for table labels and numerals would add 80% of the visual character upgrade at nearly zero implementation cost.
8. **Immediate-cut navigation.** No transition when moving from lobby to table. The "sitting down" moment is a natural cinematic beat that should feel different from a menu navigation.
9. **No printed table markings.** Real felt has printed text — "INSURANCE PAYS 2 TO 1," "DEALER MUST DRAW TO 16," payout tables, betting circle arcs. These are free visual texture that also serve as reference for players.
10. **No shadow under cards.** Cards placed on a lit surface cast a shadow. Without it, they read as UI stickers, not objects.

---

## Section 2: Do/Don't Decision List

### Color

- DO: Use #004b3d as the primary felt color. This is locked from the Stitch palette and replaces the previously open range of #1a3a2a–#1f5c35.
- DO NOT: Use a felt color darker than #004b3d — below this threshold the felt merges with the background and loses its function as the focal surface.
- DO: Set the background color to #121412. This is locked from the Stitch palette and replaces the previously open range of #0a0a0a–#0f0f0f.
- DO: Use the Stitch surface stack for all non-felt surfaces: #1a1c1a for sections, #1e201e for interactive elements, #292a28 for elevated elements. Do not invent intermediate values outside this stack.
- DO: Apply a subtle radial vignette from table center — felt slightly brighter at center, fading toward rail — to simulate a spotlight-on-felt effect. The center brightness should not exceed 15% lightness increase over the edge felt value.
- DO NOT: Use the same lightness value for the rail/frame and the background. The rail must read as a physical boundary between felt and floor.
- DO: Use #2a1a0a–#3d2210 for the rail, dark mahogany tone, at least 20% lighter than the background so it reads as a separate surface.
- DO: Use #C5A059 (gold secondary) and #E5C185 (gold tertiary) sparingly — only for win states and high-value actions. Gold is a signal, not a decoration.
- DO NOT: Use gold (#C5A059 or #E5C185) for neutral UI elements, labels, or borders. Overuse destroys its signal value.
- DO NOT: Use pure white (#FFFFFF) anywhere in the UI. The maximum text brightness is #e2e3df. Use #bfc9c4 for input labels and secondary text.

### Typography

- DO: Use Noto Serif as the display font for all table labels, payout text, zone markings, jackpot amounts, and section titles. This is locked from the Stitch palette and replaces the previously open "display/serif or stylized sans-serif" guidance.
- DO: Use Manrope as the UI font for bankroll display, betting odds, button labels, and navigation. These two fonts are the complete typeface set — no others.
- DO: Apply the pairing rule wherever a heading appears over a supporting label: headline-lg Noto Serif + title-sm Manrope in all-caps at 0.1rem letter-spacing.
- DO NOT: Use the same font for table labels as for UI chrome. Noto Serif is for the game surface and big moments; Manrope is for interaction chrome.
- DO: Render card rank glyphs (the A, K, 5, etc. on the card face) at a minimum equivalent to 28px at 1080p. This is the primary readability target.
- DO: Use tabular/monospaced numerals for the bankroll display so the digit width does not shift as values change.
- DO NOT: Use all-caps for card suit labels or rank labels — standard mixed case or symbol glyphs are more legible at speed.

### Surface and Border

- DO NOT: Use visible borders to define element boundaries. Structure is communicated through tonal layering — each surface level in the stack (#1a1c1a → #1e201e → #292a28) provides sufficient contrast to define spatial hierarchy without borders.
- DO: Use ghost borders (outline_variant at 15% opacity) only when tonal contrast genuinely cannot define a required boundary. Treat as an exception requiring justification.
- DO: Apply ambient shadows at 32px blur, 0px offset, 8% opacity — not hard-edged drop shadows. Shadows suggest elevation, not edge.
- DO: Render modals with surface #333533 at 60% opacity plus 20px backdrop blur. Never an opaque modal background.
- DO: Use 0.375rem corner radius on all interactive elements. Sharp modern — not pill-shaped.

### Animation Style (UI Transitions)

- DO: Animate all UI transitions (menus, overlays, panels, lobby navigation) at 300–500ms with an eased cubic-bezier curve. The feel target is "heavy and luxurious."
- DO NOT: Use snap, pop, or sub-200ms transitions for UI chrome — fast transitions read as cheap and break the atrium atmosphere.
- DO: Apply the 300–500ms UI transition timing to the lobby-to-table sit-down transition, which is also a UI state change.
- DO: Implement all card and chip animations using Godot's Tween system with named easing curves defined in the visual language spec. No hardcoded durations in component code.
- DO: Honor the reduced-motion toggle (from product-decisions.md Q5) by replacing all arc/travel animations with immediate placement at final position. State changes still occur — only the travel is removed.
- DO NOT: Make any animation during a hand non-interruptible for longer than 400ms. If the player clicks a game action during an animation, the animation should complete or skip to final state within one frame on the next input event.
- DO: Stagger multi-card deals — each card's animation starts 80–100ms after the previous card's animation starts, not after it completes. This matches the rhythm of a real deal while keeping total deal time reasonable.

### Card Presentation

- DO: Animate card dealing as a continuous arc from deck position to final resting position. The arc should take 220–280ms with an ease-out curve (fast start, gradual deceleration to landing).
- DO: On landing, apply a 40–60ms settle animation — a slight overshoot (2–3 degrees rotation) that corrects back to final angle — to simulate the weight of a card landing on felt.
- DO NOT: Animate card placement using a vertical drop from above the table — cards should travel laterally across the felt surface, consistent with a dealer slide deal.
- DO: On face-up reveal, animate the card flip as a horizontal axis rotation: 0 to 90 degrees showing card back, then swap texture and continue 90 to 180 degrees showing card face. Total duration 180–240ms.
- DO: Render a drop shadow under each card — approximately 4px blur, 2px vertical offset, 25% black opacity — that updates as cards stack to simulate increasing height.
- DO NOT: Allow card backs and card faces to use different drop shadow values — shadow consistency is what makes the stack read as a coherent physical pile.

### Table Geometry

- DO: Maintain the elevated top-down perspective, approximately 60–70 degrees from horizontal. This is the established reference view for this genre and players expect it.
- DO: Render the table rail with visible depth — a subtle bevel or drop shadow on the inner rail edge so the felt appears to sit below the rail surface, not on the same plane.
- DO: Print standard table markings on the felt as texture — betting circle arcs, zone labels, minimum/maximum bet display — using Noto Serif at low opacity (approximately 30–40% of the felt highlight color, not white).
- DO NOT: Scale cards larger than approximately 9% of the table width for a single card at standard hand state. Beyond this threshold, multiple cards overlap excessively.

### Chip Behavior

- DO: Render chips as physical circular objects with visible edge detail (alternating color segments on the rim) and a subtle top-surface highlight suggesting a convex form.
- DO: Use surface_container_highest as the chip background, with a thin gold outline at 20% opacity. On selection, glow the chip with #C5A059.
- DO: Animate chip placement as a drop arc from the chip tray to the betting zone. Arc peak should reach approximately 20px above the table surface at mid-travel. Total duration 180–240ms with ease-out.
- DO NOT: Animate chip placement using a scale pop (scale from 0 to 1 in place) — this reads as a UI appearance, not a physical placement.
- DO: Visually stack chips when multiple chips occupy the same betting zone — each additional chip renders offset 3–4px upward from the previous, creating a visible stack with proportional height increase.
- DO: On win resolution, animate chips sliding from dealer area toward player betting zone. On loss, animate chips sliding away from player zone toward dealer area. Duration 300–400ms.
- DO NOT: Resolve wins and losses by incrementing a counter display — chip movement is the resolution animation.

### Sound Triggers

- DO: Trigger a chip clink sound on every chip placement event (single chip drop). Use a short sample, 80–120ms, with slight pitch randomization (plus or minus 8%) to prevent repetition fatigue.
- DO: Trigger a card slide sound on every card deal event — a brief fabric-on-felt sound, 60–100ms.
- DO: Trigger a distinct win sound (chip stack sound, 300–400ms) on win resolution, separate from the chip movement sound.
- DO: Trigger a distinct loss sound (single low thud or silence with a brief muted chip sound) on loss resolution that is not a version of the win sound.
- DO NOT: Trigger sound on button hover states — only on confirmed actions (placement, deal, action selection, resolution).

### UI Chrome

- DO: Keep all UI chrome (bankroll display, bet total, action buttons) outside the table surface area — positioned at screen edges or corners. The felt should be chrome-free.
- DO NOT: Place floating tooltip overlays on the felt during a hand — if contextual information is needed, it belongs in a fixed panel, not overlaid on the game surface.
- DO: Display the rules/payout reference (from product-decisions.md Q7) as a full-screen dismissible overlay, not a slide-out panel that covers part of the table.
- DO: Use icon-plus-label buttons for primary game actions (Hit, Stand, Double, Split, Surrender) at all times — never icon-only. These actions have real consequences and must be unambiguous.
- DO: Use thin-line icons (1pt stroke) throughout all UI chrome — no filled or heavy-weight icon styles.

### Information Hierarchy

- DO: Make the current bet total the largest numeral on screen during active betting — larger than the bankroll display — because the immediate decision (how much to bet) is the highest-priority information at that moment.
- DO NOT: Display the bankroll and current bet at equal visual weight — the bet is transactional and should dominate during bet placement, then recede once the hand starts.
- DO: During an active hand, move the primary focus to the card zone — action buttons should be large and thumb-reachable from a desktop mouse position, but the card area should occupy the center majority of the viewport.

### Win/Loss Presentation

- DO: Use a brief screen-edge color pulse on win — a subtle green bloom at the viewport edge lasting 400–600ms — in addition to chip movement. Do not use a full-screen overlay.
- DO NOT: Use a modal dialog or blocking overlay for standard win/loss outcomes. Reserve modal states for significant events only (player broke, session end, error).
- DO: Display the win amount as a floating numeral in Noto Serif that animates from the resolution point to the bankroll display over 400–500ms, then merges into the bankroll counter. The numeral should use #C5A059 (gold secondary) to signal the win state.

### Navigation Between Tables

- DO: Animate the transition from lobby to table as a camera-approach motion — the table surface grows to fill the screen over 400–600ms — to simulate sitting down.
- DO NOT: Use an immediate cut between lobby and table. The transition is a meaningful contextual shift and deserves a beat.
- DO: Animate the transition from table back to lobby as a reverse camera-retreat — the table surface shrinks as the surrounding casino environment comes into view.

---

## Section 3: Open Questions

These questions are raised by this research but cannot be answered without seeing a design. They are inputs to Phase 3 (Visual Language) and Phase 4 (Component Boundary Definition).

1. **Felt texture rendering method.** A micro-texture on the felt can be achieved via a tileable texture asset, a procedural shader, or a noise-based Godot material. The choice affects performance on Intel HD 530 and affects the Phase 3 visual spec. Which approach is feasible within the GPU constraint?

2. **Directional lighting source.** The vignette/spotlight effect requires a defined light direction or a radial source. If a single overhead source, is it centered on the table or offset toward the dealer? This affects card shadow direction and felt shading and must be locked before any component using shadow is specced.

3. **Card back design.** The reference establishes that card backs need premium treatment, but does not specify: classic two-color geometric (casino standard), a custom pattern, or a solid color with edge treatment? Two candidates should be offered in Phase 3 for developer selection.

4. **Rail depth rendering approach.** The rail bevel can be achieved through a sprite with pre-baked lighting, a Godot CanvasItem shader, or a layered sprite approach. The choice must be made before Phase 4 defines whether the rail is a shared component or game-specific geometry.

5. **Printed table marking opacity and color.** The Do/Don't list specifies 30–40% opacity felt-highlight color for felt markings using Noto Serif. The exact color relationship to the felt base (#004b3d) needs to be locked in the visual language. Too light and they vanish; too dark and they compete with cards.

6. **Chip denomination set for MVP.** Product decisions lock three table tiers (Low: $5–$100, Standard: $25–$500, High: $100–$1000). The chip denominations needed to cover these tiers span at least $5, $25, $100, $500. Does the $500 chip get a unique color, or does it reuse an existing convention (purple is common in real casinos)? This must be decided before the chip component is specced.

7. **Action button layout during split hands.** When a player splits in Blackjack, two simultaneous hands are active and the action buttons must address one hand at a time. The spatial layout of two card zones plus action buttons has not been defined. Does the active hand move to a canonical position, or do action buttons relocate toward the active hand? This is a Phase 8 design question but has Phase 4 component boundary implications.

8. **Lobby / table selection screen.** The research covers the table surface in detail, but the lobby (game selection, table tier selection) has no established layout or component structure. The Stitch output provides aesthetic direction but was generated as a web interface and does not translate directly to a Godot desktop lobby. Phase 3 must define the lobby layout independently using the Grand Atrium palette and type system.

9. **Typography loading on Linux.** Noto Serif and Manrope are now locked as the typeface pair. Both must be embedded as project assets in the Godot binary — do not rely on system font availability. Verify that both fonts are licensed for embedding and that the Godot font import pipeline handles both correctly before Phase 3 proceeds.

10. **Camera approach animation and table geometry reveal.** The sit-down transition (camera approach) requires knowing what surrounds the table during the animation. If the background is pure black (#121412), the approach is trivial. If there is environmental context (other tables visible, floor texture, ceiling lights), that environment must be designed before the transition can be animated. Phase 3 needs to make a binary call: pure environment (#121412 surround, table only) or implied casino floor. The Grand Atrium direction (negative space, deep tonal layering) suggests the pure environment approach is consistent with the aesthetic, but this must be confirmed by the developer.

11. **Gold accent threshold in context.** The rule is that gold (#C5A059, #E5C185) is used only for win states and high-value actions. "High-value action" needs a concrete definition before component work begins. Candidates: only the Deal button when a non-zero bet is placed? The highest-denomination chip? All primary CTA buttons? A permissive reading will pollute the signal; a restrictive reading may make the UI feel cold. Phase 3 must produce an exhaustive list of every element that qualifies before the component spec is written.

---

**UX Researcher:** Phase 2 Agent
**Research Date:** 2026-03-29
**Gates This Document:** Phase 3 (Visual Language) — no visual spec work begins until this document is APPROVED
**Next Step:** Developer review and explicit written APPROVED or required changes list
