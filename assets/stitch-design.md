# Design System Strategy: Luxurious Nightlife

## 1. Overview & Creative North Star
**The Creative North Star: "The Grand Atrium"**
This design system is built to evoke the high-stakes, hushed atmosphere of a private high-roller lounge. We are moving away from the "noisy," flashing-light tropes of traditional digital casinos. Instead, we embrace **The Grand Atrium**—an editorial-inspired aesthetic characterized by expansive negative space, deep tonal layering, and sophisticated typography. 

By leveraging intentional asymmetry and overlapping elements (e.g., a serif headline breaking the boundary of a glass-morphic card), we create a sense of architectural depth. This isn't just a UI; it is a curated environment that feels immersive, expensive, and fundamentally trustworthy.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the "No-Line" Rule. We define structure through light and shadow, not borders.

### The Palette
- **The Emerald Base:** `primary` (#004b3d) for key brand moments and active states.
- **The Golden Accent:** `secondary` (#C5A059) and `tertiary` (#E5C185). These represent the "gold" of the casino—to be used sparingly for high-value CTAs and win states.
- **The Charcoal Foundation:** `background` (#121412) and the `surface` stack.

### Surface Hierarchy & Nesting
To create a premium feel, treat the UI as stacked sheets of tinted glass. 
- **Base Level:** `surface` (#121412) for the main viewport.
- **Structural Sections:** Use `surface_container_low` (#1a1c1a) to define large content areas.
- **Interactive Cards:** Use `surface_container` (#1e201e) or `surface_container_high` (#292a28) to pull elements toward the user.

**The "Glass & Gradient" Rule:** 
For modal overlays and floating navigation, use `surface_variant` (#333533) with a 60% opacity and a `20px` backdrop-blur. Apply a subtle linear gradient from `primary_container` to `surface` at a 45-degree angle to create a "Signature Texture" that feels like brushed velvet.

---

## 3. Typography
Our typography pairing balances heritage with modern performance.

- **Display & Headlines (Noto Serif):** These are our "Heritage" elements. Use `display-lg` for jackpot amounts and `headline-md` for section titles. The serif evokes the history of classic Monte Carlo establishments.
- **UI & Body (Manrope):** This is our "Precision" element. Manrope’s geometric clarity ensures that betting odds, terms, and navigational labels remain legible at small sizes (`label-sm`).
- **The Hierarchy Rule:** Always pair a `headline-lg` (Serif) with a `title-sm` (Sans-serif) in all-caps with 0.1rem letter-spacing to create an editorial, high-fashion look.

---

## 4. Elevation & Depth
We forbid the use of standard 1px solid dividers. Depth is achieved through **Tonal Layering**.

- **The Layering Principle:** A list item should not have a border. Instead, the container should be `surface_container_low`, and the hovered item should shift to `surface_container_high`.
- **Ambient Shadows:** For floating elements like dropdowns, use a shadow with a 32px blur, 0px offset, and 8% opacity using the `on_surface` color. This creates a soft "glow" rather than a harsh drop shadow.
- **The Ghost Border:** If a form field requires a boundary, use `outline_variant` at 15% opacity. This "Ghost Border" provides enough contrast for accessibility without breaking the fluid dark aesthetic.

---

## 5. Components

### Buttons
- **Primary:** Use a gradient from `primary` (#004b3d) to `primary_container` (#004b3d). Apply a 4px outer glow (using `primary` at 30% opacity) to make it feel tactile and illuminated.
- **Secondary:** Transparent background with a `secondary` (#C5A059) "Ghost Border" and serif text.
- **Shape:** Use `roundedness.md` (0.375rem) for a sharp, modern look. Avoid `full` rounding unless it’s a floating action button.

### Cards & Lists
- **No-Divider Policy:** Separate list items using `spacing.4` (1.4rem) of vertical white space or a subtle background shift to `surface_container_lowest`. 
- **Interaction:** On hover, cards should scale by 1.02x and shift from `surface_container` to `surface_bright`.

### Inputs
- **Style:** Understated. Use `surface_container_highest` for the background. Labels must use `label-md` in `on_surface_variant` (#bfc9c4).
- **Error State:** Use the `error` token (#ffb4ab) as a 2px bottom-border glow, never a full box outline.

### Signature Component: The "High-Roller" Chip
A custom selection chip for betting. Uses `surface_container_highest`, a thin-line gold `outline` (#89938f) at 20% opacity, and `title-sm` typography. When selected, it glows with a `secondary` (#C5A059) drop shadow.

---

## 6. Do’s and Don’ts

### Do
- **Do** use `spacing.16` (5.5rem) or `spacing.20` (7rem) for hero section margins to create an "expensive" sense of space.
- **Do** use thin-line icons (1pt stroke) to maintain a sophisticated feel.
- **Do** use overlapping elements (e.g., an image of a card deck partially covering a serif headline) to break the grid.

### Don't
- **Don't** use 100% white (#FFFFFF). Always use `on_surface` (#e2e3df) to keep the "nightlife" vibe easy on the eyes.
- **Don't** use high-contrast borders. If you think you need a line, try a 1px shift in background tone instead.
- **Don't** use aggressive, fast animations. Transitions should be eased (cubic-bezier) and slightly slower (300ms-500ms) to feel heavy and luxurious.