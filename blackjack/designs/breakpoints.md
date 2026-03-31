# Blackjack Responsive Design — Breakpoints

**Version:** 1.0
**Date:** 2026-03-30
**Phase:** 8
**Design resolution:** 1920 x 1080 (origin top-left, design baseline)
**Windowed default:** 1280 x 720

---

## Viewport Scaling Strategy

From `technical-architecture.md` Section 4 (Viewport Scaling):

```
window/size/viewport_width  = 1920
window/size/viewport_height = 1080
window/stretch/mode         = "canvas_items"
window/stretch/aspect       = "expand"
```

Godot's `canvas_items` stretch mode with `expand` aspect means:

- At **1920x1080**: pixels are 1:1. All values in `visual-language.md` and `screen-states.md` render exactly as specified.
- At **resolutions above 1080p** (1440p, 4K): Godot scales all canvas items proportionally upward. The table grows to fill the display. All positions and sizes in this document scale proportionally — no layout changes needed.
- At **resolutions below 1080p** (e.g., 1280x720): Godot scales all canvas items down proportionally. The design shrinks uniformly. Critical check: no UI element must be clipped or become unreadably small at 1280x720.
- **Windowed mode** (default 1280x720 on first launch): the game window is a physical 1280x720 pixel window. Godot renders the 1920x1080 design scaled down to fit — effective scale factor 0.667x in each axis.

This means there is no CSS-style layout reflow. The design does not reorganize — it scales. The only breakpoint considerations are:

1. Minimum readable sizes at 1280x720 (scale 0.667x)
2. Whether any element becomes too small to click accurately at the minimum window size
3. Whether critical text becomes unreadable at scaled-down sizes

---

## Scale Factor Reference Table

| Window size | Scale factor | Effective table width | Effective BankrollDisplay text |
|---|---|---|---|
| 1920 x 1080 | 1.000x | 900px | `text_lg` = 18px |
| 1600 x 900 | 0.833x | 750px | ~15px |
| 1280 x 720 | 0.667x | 600px | ~12px |
| 1024 x 576 | 0.533x | 480px | ~10px (below minimum — see flag below) |

---

## Breakpoint 1: 1920x1080 (Design Baseline)

All values from `screen-states.md` and `annotations.md` apply exactly. No layout changes.

**Table surface:** 900 x 560px. Margins: 510px each side.
**Left chrome panel:** 220px wide. Right chrome panel: 220px wide.
**Negative space per side:** 290px (beyond chrome panel inner edge). This is intentional — Grand Atrium expansive margin principle.

No scaling concerns at this resolution.

---

## Breakpoint 2: 1280x720 (Minimum Target — Default Window)

**Scale factor:** 0.667x

This is the most common player window size on first launch. All elements scale proportionally to 0.667x of their 1920x1080 positions and sizes.

### Effective Dimensions at 1280x720

| Element | Design size (1080p) | Effective size (720p) | Readable? |
|---|---|---|---|
| Table surface | 900 x 560 | 600 x 373 | Yes |
| Card width | 80px | 53px | Yes — rank glyphs at effective 19px (28px * 0.667), above minimum |
| Card height | 112px | 75px | Yes |
| HandTotalBadge font | `text_display_sm` 36px | ~24px | Yes — clear at 24px |
| BankrollDisplay font | `text_lg` 18px | ~12px | Marginal — see note |
| Action button size | 180 x 52 | 120 x 35 | Acceptable — hit area adequate |
| Chip diameter (standard) | 52px | 35px | Yes — clearly visible |
| Chip diameter (tray) | 44px | 29px | Marginal — see note |
| Deal button | 180 x 52 | 120 x 35 | Yes |
| Win numeral float | `text_display_lg` 52px | ~35px | Yes |

### Notes on Marginal Elements at 1280x720

**BankrollDisplay (`text_lg` 18px → ~12px effective):**
At 12px effective, Manrope SemiBold is still legible for a numeric display. The bankroll is a reference number, not a rapid-read in-play value. Acceptable without modification.

**ChipTray chips (44px → ~29px effective):**
29px tray chips are small but usable — casino chip color coding is the primary differentiator, and colors remain distinct at this size. Click targets at 0.667x remain at approximately 29x29px, above the floor for desktop mouse interaction. No change required.

**Felt markings (Noto Serif `text_xl` 22px → ~15px effective):**
Felt markings ("BLACKJACK PAYS 3 TO 2" etc.) at 15px effective are readable. These are reference text, not time-critical UI. No change required.

**SideBetZone labels ("TRILUX", "LUCKY LUCKY") at `text_xl` 22px → ~15px:**
Same as felt markings. Readable at 15px. No change required.

### What Stays Fixed (Does Not Scale)

Nothing in this design is pinned at fixed pixel sizes independent of the viewport scale. The `canvas_items` stretch mode scales all canvas elements uniformly. There are no fixed-position HUD overlays with absolute pixel locks.

The only exception is the Godot window chrome (title bar, borders) in windowed mode — these are OS-managed and not part of the game canvas.

---

## Breakpoint 3: Minimum Supported (1024x576 or lower)

**Scale factor:** 0.533x or less

At this scale, several elements approach or breach readability thresholds:

| Element | Effective size at 1024x576 | Status |
|---|---|---|
| Card rank glyph (`text_2xl` 28px → ~15px) | ~15px | At minimum readable edge |
| HandTotalBadge (`text_display_sm` 36px → ~19px) | ~19px | Acceptable |
| ChipTray chips (44px → ~23px) | ~23px | Small but usable |
| Action buttons (180x52 → ~96x28) | ~96x28 | Hit area adequate; label at ~8px effective — marginal |
| BankrollDisplay (`text_lg` 18px → ~10px) | ~10px | Marginal |

**Recommendation:** 1024x576 is the practical minimum for acceptable usability. The project spec identifies the windowed default as 1280x720 and does not define a minimum resolution floor. If a minimum is to be enforced, 1280x720 is the appropriate lower bound. Operation below 1280x720 is not blocked but is untested and outside the design guarantee.

**No layout changes are specified for resolutions below 1280x720.** The uniform scale behavior of `canvas_items` mode means the design degrades gracefully — it becomes smaller uniformly — rather than breaking. Specifying custom layout reflows for sub-720p would require switching to a layout-aware approach (anchored nodes, containers) and is explicitly out of scope for this phase.

---

## What Scales vs. What Stays Fixed — Summary

### Scales with viewport (canvas_items behavior)

- All table surface positions and dimensions
- All card positions and sizes
- All chip sizes and positions
- All text elements (font sizes scale proportionally)
- All spacing values (gap between elements scales with canvas)
- All animation arc peaks (18px card arc peak, 20px chip arc peak — scale with canvas)
- All shadow blur radii and offsets
- All UI chrome panel dimensions and positions
- Modal and overlay sizes

### Does Not Scale (OS-level, not canvas)

- Window chrome (title bar, resize handles) in windowed mode — OS-managed
- System cursor — OS-managed
- Audio volume — not a visual element

### Opacity and Color — Unchanged at Any Scale

All color token values and opacity levels are resolution-independent. `color_felt_marking` at 35% opacity renders identically at any scale. No opacity values change at different window sizes.

---

## Split-Hand Layout at 1280x720

The split-hand zones (2, 3, and 4 hands) defined in `screen-states.md` use minimum inter-zone clearances at 1080p. At 1280x720 (0.667x):

| Configuration | 1080p inter-zone clearance | 1280x720 effective clearance |
|---|---|---|
| 2-hand split (300px zone separation) | ~100px per side clearance | ~67px |
| 3-hand split (250px zone separation) | ~45px per side | ~30px |
| 4-hand split (213px zone separation) | ~25px per side | ~17px |

The 4-hand layout at 1280x720 produces approximately 17px effective clearance between adjacent card fans at the card edge — tight but not overlapping, given the 108px card fan width scales to ~72px. The layout does not require reorganization at this scale.

If the player has multiple hit cards in a 4-hand split (extending each fan's width), overlap is possible at 1280x720. The architecture.md note flags this as an implementation constraint at 1080p; it is more acute at smaller window sizes. The developer should test this edge case with maximum hand sizes during implementation.

---

## Higher Resolutions (1440p, 4K)

At 2560x1440 (1.333x scale) and 3840x2160 (2.0x scale), all elements render larger and sharper. The 290px negative space margins at 1080p grow to 387px at 1440p and 580px at 4K. The Grand Atrium expansive margin principle is reinforced at higher resolutions — the table surface occupies a smaller proportion of the viewport, surrounded by more atmospheric dark space. This is correct and desirable.

No layout changes are needed for high-resolution displays. The `canvas_items` mode ensures font rendering remains sharp (vector fonts re-render at physical pixel density).

---

## Fullscreen Mode

When the player switches to fullscreen via the SettingsPanel, Godot expands the game window to fill the display at its native resolution. The `canvas_items` + `expand` strategy applies identically to fullscreen. On a 1920x1080 display in fullscreen, the game renders at 1:1. On a 2560x1440 display in fullscreen, the effective scale is 1.333x.

No additional breakpoint handling is needed for fullscreen. The settings window mode transition uses Godot's `DisplayServer.window_set_mode()` — a system call, not a scene change. The scene layout is unaffected.

---

## Reduced Motion and Breakpoints

Reduced motion (`GlobalState.ReducedMotionEnabled`) is an accessibility setting, not a resolution breakpoint. It operates independently of window size. At any resolution, reduced motion replaces arc animations with immediate placement. This does not affect layout positions — only whether elements travel to their positions or appear at them instantly.

---

## Design Flags — Breakpoint-Specific

1. **No minimum window size enforcement:** The project does not currently enforce a minimum window size. If the developer wants to prevent resizing below 1280x720, this must be set via `DisplayServer.window_set_min_size(new Vector2I(1280, 720))` in the `_Ready()` method of the main scene. This is outside the scope of this design document but is recommended.

2. **Action button column in right chrome panel at 1280x720:** At 0.667x, the right chrome panel shrinks to approximately 147px effective width (220px * 0.667). Action buttons at 120px effective width fit within 147px. No clipping expected, but the developer should verify the full 5-button column fits vertically (5 buttons * 35px + 4 gaps * ~8px = 207px effective; this fits in the right chrome panel height).

3. **BankrollDisplay at sub-720p:** Below 1280x720, the BankrollDisplay `text_lg` (18px) drops below 12px effective size. If the product formally supports resolutions below 1280x720 in the future, a minimum font-size clamp via Godot's `Control.custom_minimum_size` on the BankrollDisplay node would prevent the text from scaling below 11px (`text_xs` token value). This is a future concern, not an MVP requirement.
