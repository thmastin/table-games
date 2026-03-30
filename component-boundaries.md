# Component Boundary Definition — Casino Table Games Suite

**Version:** 1.0
**Date:** 2026-03-29
**Status:** Authoritative — all agents writing code in this project must read this document before touching any component
**Platform:** Godot 4 (C#, 2D pipeline), desktop only (Windows/Linux)

This document defines what is shared versus game-specific before any code is written. It is the reference for every agent that creates or modifies a component. When in doubt, consult the Boundary Rules in Section 4.

Extraction timing: shared components are NOT extracted into `res://shared/components/` until after the Extraction Gate (Blackjack AND UTH both complete and passed all gates). During Blackjack and UTH development, components intended to become shared are designed generically per this document but live in the first game that builds them. The Deferred Extraction List in Section 5 tracks these.

---

## 1. Shared Components

These components are genuinely reusable across all or most games. They must be designed generically from day one — no game-specific logic, labels, or state. They are extracted to `res://shared/components/` at the Extraction Gate.

Until extraction, the first game to implement a shared component owns the file. Subsequent games reference the same file. No duplication.

---

### CardFace.tscn

**What it does:** Renders a single playing card face — rank glyph, suit symbol, and card body with drop shadow. Handles both face-up and face-down states. Executes the card flip animation (horizontal axis rotation) on demand. Does not know what hand it belongs to or how many cards are in that hand.

**Props (C# public fields on attached script):**

```csharp
// Card identity
public int Rank { get; set; }          // 1–13 (1=Ace, 11=Jack, 12=Queen, 13=King)
public string Suit { get; set; }       // "clubs" | "diamonds" | "hearts" | "spades"

// Display state
public bool FaceUp { get; set; }       // true = show rank/suit; false = show card back
public bool AnimateFlip { get; set; }  // if true, play flip animation on FaceUp change; if false, instant swap
public float RotationDegrees { get; set; }  // final resting angle after deal settle (degrees)
```

**Signals:**

```csharp
[Signal] public delegate void FlipCompletedEventHandler();  // emitted when flip animation finishes
[Signal] public delegate void DealArcCompletedEventHandler(); // emitted when deal arc + settle finishes
```

**Variants it must support:**
- Face-up, any rank and suit combination (52 combinations)
- Face-down (card back — Option B: Chevron Stripe with Center Seal, locked in visual-language.md)
- Reduced-motion mode: no arc, no flip animation; instant state at final position

**What it explicitly does NOT do:**
- Does not know its position in a hand (index 0, 1, 2, etc.)
- Does not calculate hand value (that is logic layer)
- Does not render a hand-total badge
- Does not know whether it belongs to a player hand or dealer hand
- Does not trigger any sound — sound is triggered by the scene that calls the deal or flip
- Does not manage its own position on the table — position is set by the parent scene

**Why it is shared, not game-specific:** Every card game uses a standard 52-card deck. The card face visual is identical across Blackjack, UTH, Baccarat, Three-Card Poker, and all other planned games. Rank, suit, face-up state, and flip behavior are universal. Nothing in this component is specific to any game's rules.

---

### CardBack.tscn

**What it does:** Renders only the card back face — used when a card needs to be represented as a placeholder slot before it is dealt (e.g., a burned card indicator, a deck representation). Distinct from `CardFace.tscn` in face-down state because this component never has a face-up state and never flips.

**Props:**

```csharp
public float RotationDegrees { get; set; }  // resting angle, same token as CardFace
```

**Signals:** None.

**Variants:** Single variant. No flip, no rank, no suit.

**What it explicitly does NOT do:** Does not flip. Does not carry rank or suit data. Does not animate.

**Why it is shared:** Deck indicators and burn-card representations appear across multiple games. Keeping this as a zero-logic stub avoids embedding display-only rendering inside CardFace unnecessarily.

---

### Chip.tscn

**What it does:** Renders a single physical casino chip at standard or tray size. Handles selected glow state. Executes the placement arc animation from tray origin to betting zone destination on demand. Does not manage stacking — stacking offset is applied by ChipStack.

**Props:**

```csharp
public int Denomination { get; set; }      // 1 | 5 | 25 | 100 | 500 — maps to color token
public bool IsSelected { get; set; }       // true = apply color_gold glow at 40% opacity, 8px blur
public bool IsTraySize { get; set; }       // true = render at 44px diameter; false = 52px standard
```

**Signals:**

```csharp
[Signal] public delegate void PlacementArcCompletedEventHandler();
[Signal] public delegate void ChipClickedEventHandler(int denomination);
```

**Variants it must support:**
- All five denominations: $1, $5, $25, $100, $500 (chip color tokens from visual-language.md)
- Selected (glow) vs. unselected
- Standard size (52px) vs. tray size (44px)
- Reduced-motion mode: arc omitted, chip appears at destination immediately

**What it explicitly does NOT do:**
- Does not know its position in a stack
- Does not know what bet it belongs to
- Does not track bankroll or bet totals
- Does not decide which denomination is selectable — the parent (ChipTray) controls that
- Does not play the chip clink sound — the parent scene handles sound on PlacementArcCompleted

**Why it is shared:** Chips are identical across all casino table games. Denomination, color, and placement arc behavior are universal. No game-specific rule touches a chip's visual representation.

---

### ChipStack.tscn

**What it does:** Renders an ordered collection of Chip nodes as a physical stack. Handles the 4px-per-chip vertical offset. Provides methods to add and remove chips from the stack. Does not know what the stack represents (bet, bankroll, pot).

**Props:**

```csharp
public int[] ChipDenominations { get; set; }  // ordered array, index 0 = bottom chip
```

**Signals:**

```csharp
[Signal] public delegate void StackChangedEventHandler(int[] newDenominations);
```

**Methods (called by parent scene, not exposed as props):**

```csharp
public void AddChip(int denomination)     // appends chip, triggers placement arc on new chip
public void RemoveTopChip()               // removes topmost chip with exit animation
public void ClearStack()                  // removes all chips instantly (used on hand resolution)
public int GetTotalValue()                // returns sum of all chip denominations in stack
```

**Variants it must support:**
- Empty stack (zero chips, renders nothing)
- Single chip
- Multi-chip stack up to the visual depth that fits the betting zone height (approximately 10 chips before visual clipping risk)

**What it explicitly does NOT do:**
- Does not enforce bet limits — the game scene enforces min/max
- Does not know whether it represents a main bet, side bet, or any other bet type
- Does not render a total label — that belongs to a BetSpot label node, not this component

**Why it is shared:** Stacked chips are a visual primitive used identically in Blackjack bet spots, UTH ante/blind/trips spots, and every other table game. The stacking geometry and chip rendering are not game-specific.

---

### ChipTray.tscn

**What it does:** Renders the player's chip tray — a row of five Chip nodes (one per denomination) displayed at tray size (44px). Communicates which chip denomination the player has selected. Does not display the bankroll total — that is a separate display component. Does not enforce whether a denomination is affordable — the scene layer does that.

**Props:**

```csharp
public int SelectedDenomination { get; set; }   // currently highlighted denomination; 0 = none
public int[] AffordableDenominations { get; set; }  // denominations player can afford; others are dimmed
```

**Signals:**

```csharp
[Signal] public delegate void DenominationSelectedEventHandler(int denomination);
```

**Variants it must support:**
- All denominations available
- Some denominations dimmed (player cannot afford them based on bankroll)
- No denomination selected (default state when not in betting phase)
- Reduced-motion: no changes needed — chip tray has no arc animations

**What it explicitly does NOT do:**
- Does not know the player's bankroll amount — it receives `AffordableDenominations` from the scene
- Does not place chips on the table — selection signal is received by the game scene, which then calls ChipStack.AddChip
- Does not enforce how many times a denomination can be selected

**Why it is shared:** The chip tray is a universal UI element. Every table game uses the same five denominations, the same tray layout, and the same selection behavior. The scene layer handles the game-specific affordability rules.

---

### BetSpot.tscn

**What it does:** Renders a labeled betting zone on the felt. Contains a ChipStack child. Displays the printed felt marking for the bet zone (e.g., a circle arc, a rectangle). Communicates when it is clicked so the scene can place a chip. Does not know the bet's meaning or how it resolves.

**Props:**

```csharp
public string Label { get; set; }            // felt marking text (e.g., "ANTE", "BLIND", "BET") — Noto Serif, color_felt_marking
public int[] ChipDenominations { get; set; } // passed through to internal ChipStack
public bool IsActive { get; set; }           // true = accepts chip placement input; false = dimmed, non-interactive
public bool ShowLabel { get; set; }          // true = render felt marking; false = no label (used for games with implied zones)
```

**Signals:**

```csharp
[Signal] public delegate void BetSpotClickedEventHandler();  // player clicked to place a chip here
```

**Variants it must support:**
- Active (accepting input) vs. inactive (locked during hand)
- With label vs. without label
- Empty stack vs. chips present
- Any label string — label text is a prop, not hardcoded

**What it explicitly does NOT do:**
- Does not know what "ANTE" means vs. "BLIND" vs. "BET" — it just renders the label it receives
- Does not enforce bet minimum or maximum
- Does not know the game or hand state
- Does not resolve wins or losses — chips are animated out by the parent scene

**Why it is shared:** Every table game has one or more labeled bet zones. The geometry (circle, rectangle, printed label) and chip-accepting behavior are the same pattern across all games. The number of bet spots and their labels are game-specific, but the spot itself is not. Games compose multiple BetSpot instances rather than inheriting from it.

---

### ActionButton.tscn

**What it does:** Renders a single primary game action button — icon plus label, per the iconography rules. Handles enabled, disabled, and hover states. Does not know which game action it triggers.

**Props:**

```csharp
public string Label { get; set; }           // button label text — Manrope, text_base, Bold
public string IconPath { get; set; }        // res:// path to SVG icon asset
public bool IsEnabled { get; set; }         // true = interactive; false = dimmed, non-interactive
public bool IsGoldAccent { get; set; }      // true = apply gold accent treatment (used for Deal/primary CTA only)
```

**Signals:**

```csharp
[Signal] public delegate void ActionPressedEventHandler();
```

**Variants it must support:**
- Enabled vs. disabled
- Gold accent (primary CTA, Deal button with active bet) vs. default surface
- Any label and icon combination — these are props, never hardcoded

**What it explicitly does NOT do:**
- Does not know what game action it triggers — the parent scene connects ActionPressed
- Does not manage its own keyboard shortcut — shortcut registration is the scene's responsibility
- Does not emit sound on hover — only the parent scene triggers sound on ActionPressed
- Does not appear or disappear based on game state — visibility is controlled by the parent scene

**Why it is shared:** Action buttons with icon-plus-label, enabled/disabled state, and gold CTA treatment are a universal pattern. Hit, Stand, Double, Fold, Check, Raise — all use the same component with different label and icon props. The game scene decides which buttons are visible and enabled; the button itself is stateless.

---

### ResultBanner.tscn

**What it does:** Renders the win numeral float animation — a floating Noto Serif numeral in color_gold that travels from a source position toward the bankroll display, shrinking and fading. Also coordinates the screen-edge win bloom. For push results, renders the push indicator in color_push. For loss, renders nothing (loss is the absence of signal).

**Props:**

```csharp
public enum ResultType { Win, Push, Loss }
public ResultType Result { get; set; }
public int Amount { get; set; }               // dollar amount; ignored for Loss and Push results with no amount
public Vector2 SourcePosition { get; set; }   // screen position the numeral animates FROM (chip resolution point)
public Vector2 TargetPosition { get; set; }   // screen position the numeral animates TOWARD (bankroll display)
```

**Signals:**

```csharp
[Signal] public delegate void AnimationCompletedEventHandler();  // emitted when all result animations finish
```

**Variants it must support:**
- Win: gold numeral float + screen-edge bloom
- Push: secondary-text neutral indicator, no bloom
- Loss: no visual output (component renders nothing)
- Reduced-motion: numeral appears briefly at TargetPosition (100ms), no travel; bloom omitted

**What it explicitly does NOT do:**
- Does not move chips — chip resolution animation is managed by the game scene
- Does not update the bankroll display — it only animates the visual signal toward it
- Does not know the game or hand context
- Does not block input — all result animations are interruptible (see visual-language.md)

**Why it is shared:** Win/push/loss presentation is visually identical across all games. The gold numeral float, the screen-edge bloom, and the push indicator use the same tokens and the same animation spec regardless of game. Only the source position and amount differ, and both are props.

---

### RulesPanel.tscn

**What it does:** Renders the full-screen dismissible overlay for the game's rules and payout reference. Animates in/out using transition_modal_enter and transition_modal_exit. Renders static content provided to it. Does not generate content.

**Props:**

```csharp
public string GameTitle { get; set; }           // displayed at top of panel, Noto Serif headline-lg
public RulesPanelSection[] Sections { get; set; }  // ordered array of content sections (see type below)
public bool IsVisible { get; set; }             // drives modal enter/exit animation
```

**Supporting type:**

```csharp
public class RulesPanelSection
{
    public string Heading { get; set; }    // section heading, Noto Serif text_xl
    public string[] Lines { get; set; }   // body lines, Manrope text_base
}
```

**Signals:**

```csharp
[Signal] public delegate void DismissedEventHandler();  // player closed the panel
```

**Variants it must support:**
- Any number of sections (scrollable if content exceeds viewport height)
- Modal surface rendering: color_surface_modal at 60% opacity with 20px backdrop blur
- Reduced-motion: panel appears at full opacity immediately, no enter animation

**What it explicitly does NOT do:**
- Does not fetch rules content — content is passed in as props by the game scene
- Does not know which game it is serving
- Does not render interactive elements beyond the close/dismiss control

**Why it is shared:** Every game has a rules/payout overlay. The modal presentation, typography, and dismiss behavior are identical. The content varies per game, but that content is a prop.

---

### CashierScreen.tscn

**What it does:** Full-screen overlay for bankroll management. Handles three states: reload (player broke, add chips to continue), loan interface (take a loan with flat repayment fee), and tapped-out state (debt ceiling reached). Displays current bankroll, outstanding loans, and debt ceiling status.

**Props:**

```csharp
public int CurrentBankroll { get; set; }         // current chip balance
public int[] OutstandingLoanAmounts { get; set; } // each active loan's principal
public int TotalDebt { get; set; }                // sum of all outstanding loan principals
public int DebtCeiling { get; set; }              // hard cap from product-decisions.md
public int LoanFlatFee { get; set; }              // flat repayment fee per loan
public bool IsTappedOut { get; set; }             // true = debt ceiling reached with zero bankroll
public bool IsNewSession { get; set; }            // true = player can initiate new session (wipes debt, resets bankroll)
public int DefaultStartingBankroll { get; set; }  // used in tapped-out new-session display
```

**Signals:**

```csharp
[Signal] public delegate void LoanRequestedEventHandler(int amount);    // player requested a loan
[Signal] public delegate void LoanRepaidEventHandler(int loanIndex);    // player repaid a specific loan
[Signal] public delegate void NewSessionRequestedEventHandler();         // player initiated session reset
[Signal] public delegate void DismissedEventHandler();                   // player returned to table (only available when bankroll > 0)
```

**Variants it must support:**
- Standard reload state (bankroll > 0, no loans)
- Loan available (bankroll = 0 or low, debt below ceiling)
- Tapped-out (debt at ceiling, bankroll = 0) — new session option presented
- Post-loan state (active loans shown with repayment option)

**What it explicitly does NOT do:**
- Does not modify bankroll — it signals intent; the game state layer executes the change
- Does not know which game the player is at — it is called from any game
- Does not enforce the debt ceiling itself — it reads `IsTappedOut` from state and presents accordingly
- Does not handle starting bankroll adjustment (that is a first-launch setting, not cashier behavior)

**Why it is shared:** Bankroll management is explicitly a single shared bankroll across all games (product-decisions.md Q2). The cashier screen, loan mechanics, and tapped-out flow are game-agnostic. Every game routes to the same screen when the player cannot continue.

---

### SettingsPanel.tscn

**What it does:** Renders the settings overlay with sound toggle and reduced-motion toggle. Animates in/out using transition_panel_enter and transition_panel_exit.

**Props:**

```csharp
public bool SoundEnabled { get; set; }         // current sound state
public bool ReducedMotionEnabled { get; set; } // current reduced-motion state
```

**Signals:**

```csharp
[Signal] public delegate void SoundToggledEventHandler(bool enabled);
[Signal] public delegate void ReducedMotionToggledEventHandler(bool enabled);
[Signal] public delegate void DismissedEventHandler();
```

**Variants it must support:**
- Sound on vs. off
- Reduced-motion on vs. off
- Panel enter/exit animations

**What it explicitly does NOT do:**
- Does not write to settings storage — signals intent; the scene layer persists
- Does not know which game is active
- Does not contain any game-specific settings — future game-specific settings belong in a game's own settings extension, not here

**Why it is shared:** Sound and reduced-motion toggles are universal across all games (product-decisions.md Q5). The settings panel has no game-specific content at MVP.

---

### BankrollDisplay.tscn

**What it does:** Renders the player's current bankroll as a tabular numeral display in Manrope SemiBold. Updates with a brief counter animation when the value changes. This is always visible on screen during play — it is part of the UI chrome, not the felt.

**Props:**

```csharp
public int Amount { get; set; }   // current bankroll in dollars; display updates on change
```

**Signals:** None. This is a display-only component.

**Variants it must support:**
- Any dollar amount from 0 to the maximum representable value
- The display must use tabular numerals (no digit-shift on update)
- Reduced-motion: counter updates instantly with no animation

**What it explicitly does NOT do:**
- Does not format cents — all amounts in this suite are whole-dollar integers
- Does not know how the bankroll changed (win, loss, loan, reload)
- Does not trigger sounds

**Why it is shared:** The bankroll is a single shared value across all games. The display treatment (Manrope SemiBold, tabular numerals, color_text_primary, positioned at screen edge) is identical in every game.

---

## 2. Anticipated Game-Specific Components — Blackjack

These components live in `res://games/blackjack/` and are NOT candidates for extraction. They encode Blackjack-specific layout and mechanics.

---

### BlackjackTable.tscn

**What it does:** The root table scene for Blackjack. Composes the felt surface, dealer zone, up to three player positions, rail, and felt markings specific to Blackjack ("INSURANCE PAYS 2 TO 1", "DEALER MUST DRAW TO 16", "BLACKJACK PAYS 3 TO 2"). Owns the table geometry and position of all child components. Instantiates and positions BetSpot, CardFace, and other shared components at Blackjack-specific coordinates.

**Why game-specific:** The semicircular table shape, the number and arc position of player positions, the dealer zone dimensions, and the printed felt text are all specific to Blackjack. UTH uses a different table shape and different zone arrangements. This scene cannot be parameterized into a generic table without encoding game-specific layout knowledge.

---

### PlayerHandZone.tscn

**What it does:** Manages the card display area for a single player hand in Blackjack. Handles the horizontal card overlap layout (28px offset per card), the hand-total badge rendering (current point value, Noto Serif text_display_sm), and split-hand visual separation. Instantiates CardFace nodes.

**Why game-specific:** The hand-total badge (showing 17, soft 18, 21, BUST) is a Blackjack-specific concept. UTH does not show running totals mid-hand. Free Bet Blackjack shares this pattern but is a later game — extraction is deferred to the Extraction Gate. The split-hand layout (two simultaneous hand zones) is a Blackjack-specific interaction pattern.

---

### DealerHandZone.tscn

**What it does:** Manages the dealer's card area. Handles the hole card (face-down initial deal, flip on dealer turn), the dealer hand-total display during dealer turn only, and the dealer-bust indicator.

**Why game-specific:** The hole card mechanic (one card face-down, revealed at a specific game state) is specific to Blackjack (and some variants). The dealer hand-total display timing — shown only during the dealer's turn — is a Blackjack rule, not a generic behavior. UTH has no dealer hole card in the same sense.

---

### BlackjackActionPanel.tscn

**What it does:** Renders and manages the set of action buttons for a Blackjack hand: Hit, Stand, Double Down, Split, Surrender. Composes ActionButton instances. Enables and disables individual buttons based on the current hand state passed in.

**Props:**

```csharp
public bool CanHit { get; set; }
public bool CanStand { get; set; }
public bool CanDouble { get; set; }
public bool CanSplit { get; set; }
public bool CanSurrender { get; set; }
```

**Why game-specific:** The specific set of actions (Hit, Stand, Double, Split, Surrender) and their availability rules are entirely Blackjack-specific. UTH has Fold, Check, Play 4x, Play 2x, Play 1x — a completely different action set. The ActionButton component is shared; this panel that selects and arranges those buttons for Blackjack is not.

---

### InsuranceBetPrompt.tscn

**What it does:** Renders the insurance bet prompt that appears when the dealer shows an Ace. Presents a Yes/No decision with the insurance bet amount (half of current bet, pre-calculated). Dismisses on either choice.

**Why game-specific:** Insurance is a Blackjack-exclusive mechanic. No other planned game has an insurance side bet with this decision pattern.

---

### BlackjackBetZone.tscn

**What it does:** Composes a BetSpot (the shared component) with the Blackjack-specific circle arc felt marking and positions it within the BlackjackTable layout at the correct arc position for the player seat. Adds the double-down chip placement logic specific to Blackjack (second bet spot alongside the primary).

**Why game-specific:** While BetSpot is shared, the Blackjack table has a specific semicircular arc arrangement of betting circles. The double-down side bet position (adjacent to the primary bet spot, Blackjack-specific) adds geometry that is not expressible as a generic BetSpot prop.

---

## 3. Anticipated Game-Specific Components — UTH

This is an anticipation. It will be reviewed and updated before UTH begins, informed by what Blackjack actually produced. Components listed here are predictions based on UTH rules — not commitments.

---

### UTHTable.tscn

**What it does:** Root table scene for UTH. Composes the linear/rectangular table layout with five labeled bet spots (Ante, Blind, Trips, Play), community card zone, and player card zone. Positions all child components at UTH-specific coordinates.

**Why game-specific:** UTH uses a different table shape from Blackjack (typically an elongated oval or rectangular felt, not semicircular). The five-bet-spot arrangement and the community card zone (flop, turn, river positions) are entirely UTH-specific.

---

### UTHPlayerHandZone.tscn

**What it does:** Renders the player's two hole cards. Does not show a running hand total — UTH hand evaluation is done at showdown, not incrementally. Handles card deal animation to the player's hole card positions.

**Why game-specific:** UTH hole cards are always dealt face-down initially and revealed only at showdown in some variants. The hole-card presentation and the absence of running hand totals distinguishes this from BlackjackPlayerHandZone.

---

### CommunityCardZone.tscn

**What it does:** Renders the five community cards across flop (3), turn (1), and river (1) positions. Manages the reveal animation for each street. Tracks which cards have been revealed.

**Why game-specific:** Community cards are a UTH/Texas Hold'em concept. No other game in the suite uses shared community cards. This component encodes the three-street reveal structure (flop/turn/river) which is specific to Hold'em variants.

---

### UTHActionPanel.tscn

**What it does:** Renders the UTH action buttons for each decision point: Fold (pre-flop), Check/Play 4x (pre-flop), Check/Play 2x (post-flop), Check/Play 1x (post-river). Manages which actions are available at each street.

**Props:**

```csharp
public enum UTHStreet { PreFlop, PostFlop, PostRiver }
public UTHStreet CurrentStreet { get; set; }
public bool CanFold { get; set; }
public bool CanCheck { get; set; }
public bool CanPlay { get; set; }
public int PlayMultiplier { get; set; }  // 4, 2, or 1 — displayed on the Play button
```

**Why game-specific:** The action set and its street-dependent availability (4x only pre-flop, 2x only post-flop, 1x post-river) are UTH-specific rules. The ActionButton component is shared; this panel's logic is not.

---

### UTHBetLayout.tscn

**What it does:** Composes five BetSpot instances (Ante, Blind, Trips, Play) into the UTH-specific linear arrangement on the felt. Manages the Trips bet as an optional side bet with its own enable/disable state.

**Why game-specific:** The five-spot arrangement and the specific labels (Ante, Blind, Trips, Play) are UTH-specific. The Play bet is placed mid-hand, not at the start — the timing of chip placement is driven by UTH rules, not a generic betting pattern.

---

### UTHShowdownDisplay.tscn

**What it does:** Renders the showdown sequence — reveals player and dealer hands, evaluates best five-card combination, displays hand rank labels ("Two Pair", "Full House"), and triggers the blind bet resolution based on hand rank against the pay table.

**Why game-specific:** Showdown with hand-rank display and the blind bet pay table lookup are UTH-specific. Blackjack has no showdown in this sense. The blind pay table (straight pays 1:1, flush 3:2, full house 3:1, four-of-a-kind 10:1, straight flush 50:1, royal flush 500:1) is a UTH configuration — the display component that renders it is game-specific.

---

## 4. Boundary Rules

These rules are applied by every developer when creating or placing a component. They are not guidelines — they are enforced constraints.

---

### Rule 1: The Two-Game Test for Shared Status

A component may be placed in `res://shared/components/` only if it will be used, without modification, in at least two games. "Without modification" means: no game-specific branching inside the component, no game-specific props added for one game, no conditionals keyed on a game name or game type. If a component is only used in one game today, it stays game-specific even if you believe it will be shared later — put it on the Deferred Extraction List (Section 5).

Exception: components that are architectural primitives (CardFace, Chip, ActionButton) are shared from the start even before a second game exists, because they are designed generically and will unambiguously serve every game. These are flagged "shared from day one" in their definitions above.

---

### Rule 2: Similar-But-Not-Identical — Diverge, Parameterize, or Duplicate

When a component appears in two games but is not identical, apply this decision tree:

**Parameterize** if: the difference is purely in data (different label text, different color token from the approved palette, different number of items). The component's structure, behavior, and animation are identical. Props cover the difference. BetSpot with a `Label` prop is the correct answer — not a BlackjackBetSpot and a UTHBetSpot.

**Duplicate** if: the component's internal structure or behavior differs between games in a way that cannot be expressed as a clean prop. Two components that share a name but would require an `if (gameType == "blackjack")` branch inside are not the same component — duplicate them and keep them game-specific. Duplication is preferable to a shared component that contains game-specific logic.

**Diverge** if: the components started similar but are evolving in different directions based on game-specific design requirements. When a shared component receives a third prop that only one game uses, consider whether it should diverge back into game-specific components. A shared component with more than two props that are only used by a single game is a signal that extraction was premature or incorrect.

Never add a prop named `GameType`, `Mode`, or any equivalent. A shared component that switches behavior based on which game it is in is not a shared component — it is a poorly bounded game-specific component living in the wrong directory.

---

### Rule 3: What Is Never Allowed in a Shared Component

The following are absolute prohibitions. A code reviewer must reject any pull request that violates these in a shared component:

- **No game state.** A shared component holds no knowledge of hand state, bet state, shoe state, street, or any game-specific variable. It receives state as props and emits signals. It does not read from or write to the game state layer.
- **No game-specific logic.** No hand evaluation, no bet resolution, no rule enforcement. These belong in the logic layer (Section 6).
- **No hardcoded game labels.** String literals like "BLACKJACK PAYS 3:2", "ANTE", "FOLD", "HIT" do not appear in shared components. All display text is a prop.
- **No game-type conditionals.** No `if (gameName == "blackjack")`, no `switch (gameType)`, no enums that enumerate game names.
- **No references to game-specific scenes or scripts.** A shared component does not instantiate or reference a node type from `res://games/[any-game]/`.
- **No hardcoded positions.** A shared component does not know where on the screen it lives. Position is set by the parent scene.
- **No violation of visual language tokens.** A shared component uses only the named tokens from `visual-language.md`. No hex literals, no inline px sizes, no hardcoded animation durations. Token names are used.

---

### Rule 4: What Is Never Allowed in a Game-Specific Component

- **No visual language token violations.** A game-specific component uses the same named tokens as shared components. `color_felt`, `color_gold`, `text_base`, `space_4`, `transition_panel_enter` — these are used by name. A game-specific component does not invent its own colors, sizes, or durations.
- **No layout assumptions about other games.** A game-specific component does not assume the viewport margins, chrome panel positions, or table dimensions of any other game. Each game's layout is self-contained.
- **No business logic in scene scripts.** Scene scripts are thin wrappers (see Section 6). Game rules belong in the logic layer.
- **No direct node path dependencies across game boundaries.** A Blackjack component does not reference nodes in `res://games/uth/` or anywhere outside its own game directory and `res://shared/`.

---

### Rule 5: The Logic Layer Is Sacrosanct

Nothing in any component (shared or game-specific) calls a method on a logic layer class that returns a Godot type. The logic layer is pure C# (see Section 6). Components communicate with the logic layer through the scene scripts only, which translate between Godot signals and logic layer events. This rule exists to keep the NUnit test suite independent of Godot.

---

### Rule 6: The Signal Direction Rule

Shared components emit signals upward to their parent scene. They do not call methods on their parents. They do not hold references to sibling nodes. The scene script is the coordinator — it connects signals and calls methods. Components are leaves; scenes are branches.

Game-specific components follow the same rule within their own scope.

---

### Rule 7: When to Update This Document

This document must be updated when:
- A new component is added to shared (add its full definition to Section 1)
- A game-specific component is added before a new game phase begins (add to the relevant Section 2 or 3)
- A component is promoted to shared at the Extraction Gate (move from Section 5 to Section 1, add full typed props)
- A boundary rule proves ambiguous in practice (add a clarifying sub-rule and note the date)

This document is not updated speculatively. It reflects the current agreed-upon boundary, not aspirational architecture.

---

## 5. Deferred Extraction List

These components are intentionally NOT shared during Blackjack and UTH development. They will be evaluated for extraction at the Extraction Gate (Phase E1). The signal column defines what evidence would confirm extraction is appropriate.

---

| Component | Current Location | Why Deferred | Extraction Signal |
|---|---|---|---|
| `PlayerHandZone.tscn` (Blackjack variant) | `res://games/blackjack/` | Hand-total display logic and split-hand layout are Blackjack-specific. Free Bet Blackjack will likely need the same pattern, but it is a Part 3 game. Extracting before seeing the second use case risks encoding assumptions. | Free Bet Blackjack or another game requires a hand zone with running totals and identical split behavior. Two games using the same component without modification triggers extraction evaluation. |
| `ActionButton.tscn` | Shared from day one (see Section 1) | N/A — this is already shared. Listed here only to document that the action panel compositions (BlackjackActionPanel, UTHActionPanel) remain game-specific even after extraction. | Panels are not extracted — only the button primitive. |
| `HandTotalBadge` (inline in PlayerHandZone) | `res://games/blackjack/` | The running hand total is a Blackjack concept. If extracted, the badge would need a `DisplayMode` prop to handle games that show totals differently. Not enough information before UTH to define that prop correctly. | UTH or a second game requires a hand-total display with the same visual treatment. Evaluate whether it can be cleanly parameterized at that point. |
| `WinBloomEffect` (inline in ResultBanner) | `res://shared/components/` | ResultBanner is shared and contains the bloom. The bloom itself is not a separate component — it is an internal animation sequence inside ResultBanner. Listed here because a future game might want a bloom without a numeral float, which would require splitting ResultBanner. | A game needs only the bloom without the numeral, or needs a bloom with different parameters. At that point, split ResultBanner into BloomEffect and WinNumeralFloat and add both to shared. |
| `ChipWinSlide` / `ChipLossSlide` animation logic | Inside game scene scripts | Win/loss chip movement is triggered by game scenes, not a component. The animation spec is identical across games (350ms, straight slide), but the source and destination positions are game-specific. | After three games have identical chip resolution animation with only position differences, extract an `AnimateChipResolution` utility (not a scene — a static helper class) into `res://shared/utils/`. |
| `UTHShowdownDisplay.tscn` | `res://games/uth/` | Showdown display with hand-rank labels and blind pay table is UTH-specific now. Mississippi Stud and Three-Card Poker have showdown displays but with different hand ranks and different pay tables. | Two games share a showdown display structure that can be expressed purely as data props (pay table array, hand rank labels array). At that point, extract a generic `ShowdownDisplay.tscn` with a pay table prop. |

---

## 6. Logic Layer Boundary

This section defines the boundary between Godot scene scripts and pure C# logic classes. These rules exist to keep the NUnit test suite free of Godot dependencies and to make game logic independently verifiable.

---

### Directory Structure

```
res://games/blackjack/
    logic/
        BlackjackGame.cs         // main game state machine and coordinator
        BlackjackHand.cs         // hand representation and evaluation
        BlackjackDeck.cs         // shoe management, shuffle, deal
        BlackjackBetResolver.cs  // win/loss/push calculation for all bet types
        BlackjackRules.cs        // action availability rules (CanHit, CanSplit, etc.)
    BlackjackTable.tscn + BlackjackTable.cs   // scene script — thin wrapper
    BlackjackActionPanel.tscn + BlackjackActionPanel.cs
    ...

res://games/uth/
    logic/
        UTHGame.cs
        UTHHand.cs
        UTHHandEvaluator.cs      // 5-card best-hand from 7 cards
        UTHBetResolver.cs
        UTHRules.cs
    ...

res://shared/
    logic/
        Card.cs                  // plain card value object (no Godot types)
        Deck.cs                  // standard 52-card deck, shared deck operations
        HandRank.cs              // enum: HighCard through RoyalFlush
    components/
        CardFace.tscn + CardFace.cs
        ...
```

The NUnit test project references only `res://games/[game]/logic/` and `res://shared/logic/`. It does not reference any `.tscn` file or any C# class that inherits from a Godot type.

---

### What Belongs in the Logic Layer (Pure C#)

- All game rules: which actions are available, under what conditions, what the valid game state transitions are
- All hand evaluation: card value computation, hand ranking, comparison
- Deck and shoe management: deck construction, shuffle algorithm, deal sequence, shoe penetration tracking
- Bet resolution: win/loss/push determination, payout ratio calculation, push conditions
- Game state machine: the current phase of the game (Idle, Betting, Dealing, PlayerTurn, DealerTurn, Resolution), what transitions are valid from each state
- Any pure computation that can be expressed without knowledge of where cards are rendered on screen

A class in the logic layer is any class that does not inherit from `Node`, `Resource`, or any other Godot type. It is instantiated with `new`, not with `GD.Load` or scene instantiation.

---

### What Belongs in Scene Scripts (Godot Node Subclasses)

- Receiving signals from child components and calling logic layer methods with the signal data
- Calling logic layer methods and translating the return values into component prop updates
- Positioning and showing/hiding nodes based on game state
- Triggering animations (via Tween) based on logic layer state transitions
- Triggering sound bus events based on logic layer events
- Managing the Godot scene tree: instantiating, reparenting, removing nodes

Scene scripts are thin wrappers. A scene script method body that exceeds approximately 20 lines is a signal that logic has leaked into the scene layer. Move it to the logic layer.

---

### The Hard Rule: No Godot Types in the Logic Layer

No class in `res://games/[game]/logic/` or `res://shared/logic/` may reference any of the following:

- `Node` or any subclass (`Node2D`, `Control`, `CanvasItem`, etc.)
- `Vector2`, `Vector3`, `Rect2`, `Transform2D`
- `Resource` or any subclass (`Texture2D`, `Font`, `AudioStream`, etc.)
- `GD` (the Godot static utility class)
- `Input`
- Any `@GDScript` attribute or Godot annotation
- Any type from the `Godot` namespace

If a logic class needs a position concept (e.g., "deal this card to position 2"), it uses an `int` index or a plain data structure. The scene script translates that index into a `Vector2` for rendering purposes. The logic layer never knows screen coordinates.

---

### How Logic Communicates with the Scene Layer

The logic layer uses C# events (not Godot signals) to communicate state changes upward to the scene script. The scene script subscribes to these events in `_Ready()` and unsubscribes in `_ExitTree()`.

Pattern:

```csharp
// In logic layer (BlackjackGame.cs)
public event Action<GameState> StateChanged;
public event Action<int, bool> CardDealt;   // (handIndex, faceUp)
public event Action<BetResult> HandResolved; // plain data struct, no Godot types

public struct BetResult   // plain data, no Godot types
{
    public ResultType Outcome;   // Win | Push | Loss
    public int Amount;
    public int[] ChipDenominations;  // chips to animate for resolution
}
```

```csharp
// In scene script (BlackjackTable.cs) — thin wrapper
public override void _Ready()
{
    _game = new BlackjackGame();
    _game.CardDealt += OnCardDealt;
    _game.HandResolved += OnHandResolved;
}

private void OnCardDealt(int handIndex, bool faceUp)
{
    // translate to scene: get the right CardFace node, set props, trigger animation
    var card = _playerHandZone.GetCardNode(handIndex);
    card.FaceUp = faceUp;
    card.AnimateFlip = !faceUp;  // only animate flip if revealing
}
```

The scene script never calls logic methods from within an animation callback. Logic is driven by player input events and game state machine transitions, not by animation timing. Animations are fire-and-forget from the scene's perspective; they do not gate logic progression.

---

**Document Author:** Software Architect Agent
**Document Date:** 2026-03-29
**Governs:** All component creation and placement decisions in the Casino Table Games Suite
**Amendment Process:** Update this file and note the version and date at the top when any section changes. Do not amend speculatively — only update when a decision is made.
