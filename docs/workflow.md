# Table Games — Development Workflow

This is the canonical process document. All future work follows this workflow.

Gate approval requires the developer to provide explicit written "APPROVED" before any phase begins. A list of required changes is equally valid — work restarts on the failed phase until the gate opens. Silence is not approval.

## Structural Rules

- One game at a time, end-to-end
- No phase begins without explicit written "APPROVED"
- Agents do all implementation work — developer reviews, approves, and decides only
- All agents that write code run with `isolation: "worktree"`
- Independent agents within a phase run in parallel
- Phase ordering is fixed — no skipping, no merging
- TDD: tests written before implementation in all logic phases

## Gate Approval Protocol

The developer responds with one of two things:

1. **"APPROVED"** — phase complete, next phase begins
2. **A list of required changes** — work restarts on the current phase; no item is marked resolved without developer confirmation

---

## PART 0 — FOUNDATION

### Phase 0 — Tech Stack Decision

**Agents:** Software Architect + Reality Checker (parallel)

**Deliverables:**
- `tech-stack-decision.md` — framework, build tool, CSS approach, state management, testing framework; each with rationale and rejected alternatives with one-line reasons
- `risk-register.md` — risks for each chosen technology (browser support, bundle size, ecosystem maturity)

**Gate question:** Is the tech stack appropriate for a browser-based casino suite with smooth animations, component reuse across games, and long-term maintainability?

**Gate opens when:** Both files exist with all required sections populated.

---

### Phase 1 — Product Decisions

**Agents:** Plan agent

**Deliverables:**
- `product-decisions.md` with explicit answers (no TBD entries) to:
  - What happens when the player goes broke?
  - Persistent bankroll across games or per-game balance?
  - Starting bankroll amount
  - Minimum and maximum bet
  - Settings panel: in scope? If yes, what is configurable?
  - Sound: in scope? If yes, what triggers?
  - Onboarding/tutorial: in scope?
  - In-scope browsers and devices (defines test matrix for all future phases)

**Gate question:** Are all product decisions locked with no TBD entries?

**Gate opens when:** Every line item answered explicitly.

---

### Phase 2 — UX Research

**Agents:** UX Researcher

**Deliverables:**
- `ux-research.md` with three required sections:

  **1. Encore Casino Games Collection Analysis**
  - Exact color properties: background tone, felt color, chip colors, card face treatment
  - Table geometry: perspective angle, table edge treatment, card/chip scale relative to table
  - Animation properties: deal speed, chip toss speed, whether animations are skippable
  - Typography: font categories, sizing relative to table
  - Keep list (what the suite does well)
  - Do-not-repeat list (what feels dated or wrong)

  **2. Do/Don't Decision List**
  Minimum 15 specific, actionable decisions in this format:
  - DO: [specific thing]
  - DO NOT: [specific thing]

  **3. Open Questions**
  Visual or UX questions raised by research that cannot be answered without seeing a design.

**Gate question:** Is the Do/Don't list specific enough that two different designers would produce similar outputs?

**Gate opens when:** All three sections populated. Do/Don't list has minimum 15 entries. All Encore analysis properties filled in.

---

### Phase 3 — Visual Language

**Agents:** Brand Guardian + UI Designer (parallel)

**Deliverables:**
- `visual-language.md` — every section must contain specific values; no ranges, no "approximately":

  - **Color palette:** all hex values by role (background, surface, felt, border, text-primary, text-secondary, accent, chip colors by denomination, win/loss/push states)
  - **Typography scale:** font families with fallback stacks, size scale with rem values, weight usage rules, letter-spacing rules for numeric displays
  - **Motion specification:** all named animation types with duration (ms), named cubic-bezier easing, interruptibility, reduced-motion fallback behavior
  - **Component options:** two candidates each for card back design, chip style, and table surface treatment — developer selects one per pair
  - **Spacing and sizing system:** base unit, scale steps, card dimensions (aspect ratio + base size), chip dimensions

**Gate question:** Can a developer implement pixel-accurate components from this spec alone without making visual judgment calls?

**Gate opens when:** Every section populated with specific values. Developer has selected one option for each of the three component option pairs.

---

### Phase 4 — Component Boundary Definition

**Agents:** Software Architect

**Deliverables:**
- `component-boundaries.md` with:
  - **Shared components:** name, props (named and typed), variants, rationale for each
  - **Game-specific components:** list for Blackjack, anticipated list for UTH
  - **Boundary rules:** named rules for when something is shared vs. game-specific; how to handle similar-but-not-identical components across games
  - **Deferred extraction list:** components expected to be promoted to shared after Extraction Gate but not now

**Gate question:** Is the shared/game-specific split clear enough that a developer will never wonder where a new component belongs?

**Gate opens when:** All sections populated. Every shared component has named, typed props defined.

---

### Phase 5 — Technical Architecture

**Agents:** Software Architect → Reality Checker (sequential)

**Deliverables:**
- `technical-architecture.md` with:
  - **Data flow diagram:** visual or ASCII showing state flow from user action to render; every major transition named
  - **State management:** approach named, rationale, what lives in global vs. local state, mutation rules
  - **Persistence model:** localStorage keys and data shapes, ephemeral vs. persisted, unavailability handling, migration strategy
  - **Player broke handling:** exact implementation of Phase 1 decision, where in state model, which components render it
  - **Performance baseline:** target fps, target initial load time, bundle size budget, measurement method for each
  - **Folder structure:** proposed directory layout with rationale

**Gate question:** Can a developer build the entire system from this document without making architectural decisions themselves?

**Gate opens when:** All sections populated. Data flow diagram present. All four performance baseline values specified.

---

## PART 1 — BLACKJACK

### Phase 6 — Blackjack Game Specification

**Agents:** Game Designer → Reality Checker (sequential)

**Deliverables:**
- `blackjack/game-spec.md`:
  - Deck count, shuffle trigger, dealer rules (soft 17 handling)
  - All player options with exact conditions: hit, stand, double down, split (re-split rules, split aces), surrender (early/late/none), insurance
  - Blackjack payout ratio (3:2 or 6:5 — one chosen)
  - All edge cases enumerated
  - Action availability rules: exactly when each button is active/inactive
  - Shoe state: management, reset trigger, shuffle behavior
  - Bet placement flow: when chips place, when they lock, when they clear
  - Win/loss/push resolution: full sequence from dealer reveals to chips moving

**Gate question:** Is every rule and edge case specific enough that two developers would implement identical behavior?

**Gate opens when:** All sections present. No "standard rules apply" shortcuts — every rule written out explicitly.

---

### Phase 7 — Blackjack Technical Architecture

**Agents:** Software Architect

**Note:** Architecture before design — animation system must be chosen before designs are created.

**Deliverables:**
- `blackjack/architecture.md`:
  - Game state shape
  - State machine transitions table (all valid transitions)
  - Component decomposition specific to Blackjack
  - Animation approach: what animates, triggers, system used
  - Integration points with shared components from `component-boundaries.md`

**Gate question:** Does the Blackjack architecture fit cleanly within the system architecture from Phase 5?

**Gate opens when:** All sections present. Every state transition named. Animation system explicitly chosen.

---

### Phase 8 — Blackjack High-Fidelity Design

**Agents:** UI Designer + Brand Guardian (parallel)

**Note:** Comes after Phase 7 — animation system constraints are known.

**Deliverables:**
- `blackjack/designs/` with screen designs for:
  - Idle state (no hand, bet not placed)
  - Bet placement state
  - Hand in progress — all player action states
  - Dealer reveal
  - Win, loss, push states
  - Split hand layout
  - Player broke state
- Annotation document: every interactive element labeled with state, size, behavior
- Responsive breakpoint decisions
- All values reference `visual-language.md` by name — no new values introduced

**Gate question:** Can a developer build every screen state without making a single visual judgment call?

**Gate opens when:** All screen states designed. Annotation document complete. No values present that aren't in `visual-language.md`.

---

### Phase 9 — Project Scaffold

**Agents:** Frontend Developer

**Deliverables:**
- Working repository: chosen stack installed and running
- Folder structure matching `technical-architecture.md`
- Linting and formatting configured
- Testing framework installed with one passing smoke test
- Performance measurement tooling in place
- Empty `blackjack/` module placeholder
- `README.md` with setup instructions

**Gate question:** Does the dev server start without errors? Do tests pass? Is the folder structure correct?

**Gate opens when:** Developer runs project locally and confirms all three conditions.

---

### Phase 10 — Blackjack Game Logic (TDD)

**Agents:** Senior Developer → Code Reviewer (sequential)

**TDD requirement:** Tests are written first against `blackjack/game-spec.md`. Implementation is written to make tests pass. No implementation code before tests.

**Deliverables:**
- `blackjack/logic/`: deck management, hand evaluation, all player actions, bet resolution, state machine with enforced valid transitions
- Test files: 100% coverage of logic module; every edge case from spec has a named test; every split/double/surrender/insurance condition tested explicitly

**Gate question:** Do all tests pass? Does every edge case from the game spec have a corresponding named test?

**Gate opens when:** All tests pass. Coverage report shows 100% for logic module. Every edge case in `blackjack/game-spec.md` has a corresponding named test.

---

### Phase 11 — Blackjack Static UI

**Agents:** Frontend Developer → UI Designer (sequential — Frontend builds, UI Designer verifies)

**Deliverables:**
- All Blackjack components rendering in all screen states
- Components match `blackjack/designs/` at pixel level
- All values sourced from `visual-language.md` — no hardcoded colors, sizes, or timing
- Shared components in shared location; game-specific in `blackjack/components/`
- Every component viewable in every state via static fixtures
- No logic wired — all props driven by static fixtures

**Gate question:** Do all components match the designs? Can every screen state be rendered?

**Gate opens when:** Every screen state renderable. Developer has visually verified against designs. No values in components not sourced from visual language spec.

---

### Phase 12 — Blackjack Logic Integration

**Agents:** Senior Developer → Code Reviewer (sequential)

**Deliverables:**
- Fully playable Blackjack: bet, deal, all player actions, resolution, new hand
- State management wired per `technical-architecture.md`
- localStorage persistence working per persistence model
- Player broke state implemented
- All action buttons activate/deactivate correctly per spec
- Integration tests: full hand happy path, split flow, double down, dealer blackjack, player blackjack, push, player goes broke

**Gate question:** Is the game fully playable through all paths including split/double/surrender?

**Gate opens when:** All integration tests pass. Developer has played minimum 20 hands without a bug or incorrect behavior.

---

### Phase 13 — Blackjack Animations

**Agents:** Frontend Developer → UI Designer (sequential)

**Technical gate only** — correctness and performance. Aesthetics are Phase 14.

**Deliverables:**
- All animations from `visual-language.md` motion spec: card deal, card flip, chip placement, chip resolution, state transitions
- Reduced-motion fallback implemented
- Performance: target frame rate met on mid-range device (per Phase 5 baseline)
- All existing integration tests still pass

**Gate question:** Do all animations match the motion spec? Does the game hit target frame rate? Does reduced-motion mode work?

**Gate opens when:** All animations implemented. Performance target met. Reduced-motion tested. All integration tests pass.

---

### Phase 14 — Blackjack Polish

**Agents:** UI Designer + Frontend Developer (UI Designer leads)

**Aesthetic gate** — feel and visual refinement. Separate from animations.

**Deliverables:**
- Visual refinements from live review: spacing, shadows, contrast, micro-interactions
- Typography rendering verified across target browsers
- Visual rough edges resolved
- Updated `blackjack/designs/` if any polish decisions diverge from original spec (delta documented)

**Gate question:** Does the game look and feel like a finished product that references the Encore Casino aesthetic?

**Gate opens when:** Developer has reviewed the game in motion in a real browser and provides explicit written aesthetic approval.

---

### Phase 15 — Cross-Browser and Device Testing

**Agents:** QA agent

**Deliverables:**
- `blackjack/qa-report.md`: test matrix for every in-scope browser/device from `product-decisions.md`, result per combination, bugs with reproduction steps and severity, performance on lowest-spec in-scope device

**Gate question:** Does the game pass on every in-scope browser and device?

**Gate opens when:** Report exists. All failures fixed or explicitly accepted with written rationale.

---

### Phase 16 — Blackjack Adversarial Review

**Agents:** Reality Checker + Code Reviewer (parallel)

**Mandatory checklist — not open-ended:**

- **Rules correctness:** every rule in spec implemented, every edge case correct, attempts to trigger invalid states
- **State integrity:** refresh mid-hand, two tabs open, localStorage exhausted
- **Player broke path:** play to zero, broke flow triggers, no bets at zero balance
- **Performance:** frame rate during animation-heavy sequences, initial load time vs. baseline
- **Accessibility:** keyboard navigation, accessible labels, reduced-motion activation, WCAG AA color contrast
- **Visual regression:** no component values deviating from `visual-language.md`, all screen states render as designed

**Deliverables:**
- `blackjack/adversarial-report.md`: pass/fail for every checklist item, reproduction steps for any failure

**Gate question:** Does every checklist item pass?

**Gate opens when:** Report exists. All failures resolved and retested, or explicitly accepted with written rationale.

---

## PART 2 — ULTIMATE TEXAS HOLD'EM

Same phase structure as Blackjack (Phases 6–16) with these differences:

- All deliverables in `uth/` directory
- Before Phase 6: review `component-boundaries.md` — update anticipated UTH component list based on what Blackjack actually produced
- Phase 6 equivalent must explicitly cover: ante/blind/trips/play bet structure, 4x/2x/1x/fold decision points at each street, blind bet resolution matrix by hand rank, trips pay table, qualifying hand definition
- Phase 8 equivalent: produce a UX delta document before designs — what is new vs. Blackjack (new layout zones, new interaction patterns, what reuses directly)

---

## EXTRACTION GATE

**Trigger:** Blackjack AND UTH both complete and passed all gates.

### Phase E1 — Extraction Analysis

**Agents:** Software Architect

**Deliverables:**
- `shared/extraction-analysis.md`:
  - Full inventory of components from both games
  - Each categorized: identical (extract as-is) / similar-but-different (parameterization decision needed) / game-specific (stays put)
  - Proposed props interface for every component being extracted
  - Components not extracted with rationale
  - Breaking changes extraction would cause to existing games

**Gate question:** Is the extraction plan conservative enough that it won't require reworking Blackjack or UTH?

**Gate opens when:** Document exists. Developer has approved the specific component list and proposed interfaces.

### Phase E2 — Extraction Implementation

**Agents:** Senior Developer → Code Reviewer (sequential)

**Deliverables:**
- `shared/components/` with extracted components: typed props (no `any`), all variants documented, inline documentation
- Blackjack and UTH refactored to use shared components
- All Blackjack tests pass. All UTH tests pass.
- `shared/components/README.md` documenting every component, props, and variants

**Gate question:** Do both games still pass all tests? Does every shared component have typed props and documented variants?

**Gate opens when:** All tests pass. README complete. TypeScript strict compilation passes.

---

## PART 3+ — SUBSEQUENT GAMES

**Game order:** Free Bet Blackjack → Mississippi Stud → Baccarat → Pai Gow → Three-Card Poker → Let It Ride

Each game follows Phases 6–16 with these modifications:

- Before Phase 6: review `shared/components/` and `component-boundaries.md` — identify shared components available and new game-specific components needed
- Phase 6: full game spec, no shortcuts
- Phase 8: UX delta document before designs — what is new vs. existing games
- All deliverables in `[game-name]/` directory
- After each game: note any components that are candidates for shared promotion. Formal extraction only at designated gates. Three or more games sharing an unextracted component triggers a scheduled extraction pass.

### Craps and Roulette

Not part of this workflow. When scoped, they receive their own workflow document given their significantly different complexity.
