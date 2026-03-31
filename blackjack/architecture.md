# Blackjack Technical Architecture

**Version:** 1.0
**Date:** 2026-03-30
**Status:** Phase 7 deliverable — pending developer approval
**Phase:** 7
**Depends on:** `technical-architecture.md` (Phase 5), `component-boundaries.md` (Phase 4), `blackjack/game-spec.md` (Phase 6), `visual-language.md` (Phase 3)

Every decision in this document extends or references `technical-architecture.md`. Where a term is used (GameStateMachine, GlobalState, PersistenceService, etc.) it refers to the definition in that document unless explicitly overridden here.

---

## 1. Game State Shape

### 1.1 BlackjackGameState Record

This record is the complete, immutable snapshot of game state at a point in time. The state machine (`BlackjackGame.cs`) returns a new record on every transition. It never mutates the previous record. This extends the skeleton in `technical-architecture.md` Section 2 with the full field set required by game-spec.md Section 8.0, including side bets from Section 16.

```csharp
public record BlackjackGameState(
    // Phase and hand flow
    GamePhase CurrentPhase,             // authoritative phase; written only by state machine; scene reads only
    int ActiveHandIndex,                // 0-based index into PlayerHands; advances through split hands left-to-right

    // Bet fields — all integers, all whole-dollar
    int MainBet,                        // mirrors PlayerHands[ActiveHandIndex].MainBet; convenience accessor
    int DoubleDownBet,                  // doubled-down amount for active hand; 0 until double confirmed; cleared to 0 at hand start
    int InsuranceBet,                   // insurance amount; 0 until player accepts; cleared to 0 after resolution
    int TriLuxBet,                      // TriLux side bet; 0 = not placed; set during Betting; cleared at hand start
    int LuckyLuckyBet,                  // Lucky Lucky side bet; 0 = not placed; set during Betting; cleared at hand start
    int[] BetDenominations,             // ordered chip denomination array for main bet; drives BetSpot display; cleared at hand start

    // Hands
    PlayerHand[] PlayerHands,           // 1 entry before split; up to 4 entries after splits
    DealerHand DealerHand,              // always 2 cards after dealing; hole card face-down state tracked inside DealerHand

    // Shoe
    ShoeState Shoe,                     // full shoe state (remaining cards + TotalDealt + ShufflePending)

    // Action availability — recomputed on every transition; scene reads this, never computes availability itself
    ActionAvailability Actions
);
```

**Lifecycle constraints:**

| Field | Set when | Cleared when |
|---|---|---|
| `MainBet` | `Betting` → chip placed | Start of next hand (`Idle` entry) |
| `DoubleDownBet` | `PlayerTurn` → double confirmed | Start of next hand |
| `InsuranceBet` | `InsurancePrompt` → player accepts | After insurance resolves (Resolution entry) |
| `TriLuxBet` | `Betting` → side bet placed | Start of next hand |
| `LuckyLuckyBet` | `Betting` → side bet placed | Start of next hand |
| `BetDenominations` | `Betting` → chip placed | Start of next hand |
| `PlayerHands` | `Dealing` | Start of next hand |
| `DealerHand` | `Dealing` | Start of next hand |
| `ActiveHandIndex` | `Dealing` (set to 0); advances in `PlayerTurn` on split/stand/bust | Start of next hand |

**Immutability rule:** No record field may be mutated in place. The state machine allocates and returns a new `BlackjackGameState` record for every valid transition. The scene script holds the last returned record in a local field (`_state`). The previous record is discarded.

---

### 1.2 PlayerHand Record

One entry per active hand. Created with one entry at deal. Additional entries created on split, up to four total.

```csharp
public record PlayerHand(
    Card[] Cards,                       // ordered deal sequence; index 0 = first card dealt
    int MainBet,                        // bet for this specific hand; equals original MainBet at deal; each split creates a new hand with its own MainBet
    int DoubleDownBet,                  // doubled-down amount for this hand specifically; 0 if not doubled
    HandResult? Result,                 // null until this hand resolves; set at resolution
    bool IsFromSplit,                   // true if this hand was created by a split; affects blackjack eligibility and surrender eligibility
    bool IsSplitAcesHand,               // true if this hand was created by splitting Aces; disables hit and double
    bool IsStood,                       // true when player stood or auto-stood (21, split Aces, double)
    bool IsBust,                        // true when hand total > 21
    bool IsSurrendered,                 // true when player surrendered
    bool IsDoubled                      // true when player doubled down on this hand
);
```

**Constraints:**
- `Cards.Length` is 2 after initial deal or split fill. May grow to any count via hits (except split Aces hands, which remain at exactly 2).
- A hand with `IsSplitAcesHand == true` never has `Cards.Length > 2`.
- `Result` is always non-null when the hand's `IsStood || IsBust || IsSurrendered` flag is true and the `DealerTurn` has completed. During `PlayerTurn`, `Result` may be null even for stood hands (dealer outcome not yet known).
- `IsFromSplit == true` on all hands except the original hand. The original hand at `PlayerHands[0]` (pre-split) is never `IsFromSplit`. After a split, both resulting hands have `IsFromSplit = true`.

---

### 1.3 DealerHand Record

```csharp
public record DealerHand(
    Card[] Cards,                       // ordered deal sequence; index 0 = upcard (face-up); index 1 = hole card
    bool HoleCardFaceUp,                // false until DealerTurnStarted transition; true at DealerBlackjack reveal or DealerTurn entry
    HandResult? Result                  // null until dealer turn completes
);
```

**Constraints:**
- `Cards.Length` is 2 after initial deal. Grows by 1 on each dealer draw during `DealerTurn`.
- `HoleCardFaceUp = false` for the entire duration of `Dealing`, `SideBetResolution`, `InsurancePrompt`, and `PlayerTurn`. It flips to `true` at `DealerTurn` entry (or at `DealerBlackjack` reveal path from `Dealing`/`SideBetResolution`/`InsurancePrompt`).
- The scene script reads `HoleCardFaceUp` to determine whether to call `CardFace.AnimateFlip = true` on the hole card `CardFace` node.

---

### 1.4 ShoeState Record

```csharp
public record ShoeState(
    Card[] Cards,                       // remaining cards in draw order; index 0 = next card to deal
    int TotalDealt,                     // cards dealt since last shuffle
    bool ShufflePending                 // true when TotalDealt >= 156 (50% of 312)
);
```

**Constraints:**
- `Cards` is a 312-element array at initialization (6 decks × 52 cards, Fisher-Yates shuffled).
- `TotalDealt` increments by 1 on every `Card` drawn from the shoe. It does not decrement.
- `ShufflePending` is set to `true` after any hand that pushes `TotalDealt >= 156`. The shuffle executes before the next `DealInitiated` transition. The scene renders a shuffle indicator during this interstitial.
- The shoe is never modified mid-hand. All cards drawn in a hand are drawn from the same shoe state that existed at `DealInitiated`.

---

### 1.5 ActionAvailability Record

```csharp
public record ActionAvailability(
    bool CanHit,
    bool CanStand,
    bool CanDouble,
    bool CanSplit,
    bool CanSurrender,
    bool CanInsurance,                  // true only during InsurancePrompt phase; drives InsuranceBetPrompt accept button
    bool CanDeal                        // true only during Betting phase with MainBet >= MinBet
);
```

**Rule:** `ActionAvailability` is computed by `BlackjackRules.cs` and embedded in the returned state record on every transition. The scene script reads these fields directly to set `BlackjackActionPanel` props and the `InsuranceBetPrompt` accept button state. The scene script never evaluates rule conditions itself — that is logic layer work.

---

### 1.6 HandResult Record

```csharp
public record HandResult(
    HandOutcome Outcome,                // see enum below
    int NetDelta,                       // bankroll delta applied at resolution (0 for losses/bust — already deducted)
    bool IsBlackjack                    // true only for original two-card natural blackjack; false on split hands
);

public enum HandOutcome
{
    BlackjackWin,    // player natural blackjack, dealer no blackjack; pays 3:2
    Win,             // player total > dealer total or dealer bust; pays 1:1
    Push,            // equal totals or both blackjack; MainBet returned
    Loss,            // player bust or dealer wins; no return
    Surrender        // player surrendered; half-MainBet returned at surrender time
}
```

---

### 1.7 GamePhase Enum

```csharp
public enum GamePhase
{
    Idle,                // table loaded; no bet; ChipTray inactive
    Betting,             // player placing chips; ChipTray active; side bet spots active
    Dealing,             // initial deal animation in progress; all input disabled
    SideBetResolution,   // side bet evaluation; automatic; no player input (except tip prompt)
    InsurancePrompt,     // dealer shows Ace; waiting for insurance decision
    PlayerTurn,          // player acting on active hand
    DealerTurn,          // dealer hole card revealed; dealer draws to stand/bust
    Resolution,          // outcomes computed; chip animations; bankroll deltas applied
    PlayerBroke,         // terminal; bankroll == 0 or < MinBet after resolution; routes to CashierScreen
    DealerBlackjack      // not a named phase; dealer blackjack is a Resolution path, not a separate phase
                         // Note: DealerBlackjack is handled via Resolution with a specific DealerHand.Result;
                         // no separate GamePhase enum value is needed
}
```

**Note on DealerBlackjack:** The game spec names `DealerBlackjack` in several places as a state. After review, it does not require its own `GamePhase` value. The peek that confirms dealer blackjack routes directly to `Resolution` (as specified in game-spec.md Section 15). The `DealerHand.Result` and `DealerHand.HoleCardFaceUp` flag carry sufficient information to distinguish this path inside `Resolution`. Adding a `DealerBlackjack` phase would create an unnecessary transient state with no player interaction and no distinct UI rendering. The `Resolution` phase handles all dealer-blackjack-specific logic.

---

## 2. State Machine Transitions

This table is the authoritative transition reference. Every valid transition is listed. The state machine must reject any transition not in this table with a `GD.PrintErr` log and no state change.

The "Trigger" column names the method called on `BlackjackGame.cs` (the state machine). The "Condition" column is evaluated inside the state machine, not by the scene.

| # | From | To | Trigger | Condition |
|---|---|---|---|---|
| 1 | `Idle` | `Betting` | `BeginBetting()` | Player clicks chip denomination or "Place Bet" affordance |
| 2 | `Betting` | `Idle` | `ClearBet()` | Player presses Clear Bet; clears MainBet, TriLuxBet, LuckyLuckyBet |
| 3 | `Betting` | `Dealing` | `DealInitiated()` | `MainBet >= MinBet`; bankroll deducted for all bets; deal sequence begins |
| 4 | `Dealing` | `SideBetResolution` | internal (deal complete) | `TriLuxBet > 0` OR `LuckyLuckyBet > 0` |
| 5 | `Dealing` | `InsurancePrompt` | internal (deal complete) | No side bets placed; dealer upcard is Ace |
| 6 | `Dealing` | `PlayerTurn` | internal (deal complete) | No side bets placed; dealer upcard is not Ace; dealer upcard is not 10-value (no peek needed) |
| 7 | `Dealing` | `PlayerTurn` | internal (deal complete + peek) | No side bets placed; dealer upcard is 10-value; peek confirms no blackjack |
| 8 | `Dealing` | `Resolution` | internal (deal complete + peek) | No side bets placed; dealer upcard is 10-value; peek confirms dealer blackjack |
| 9 | `SideBetResolution` | `InsurancePrompt` | internal (side bets resolved) | Dealer upcard is Ace |
| 10 | `SideBetResolution` | `PlayerTurn` | internal (side bets resolved + peek) | Dealer upcard is not Ace; dealer upcard is not 10-value (no peek needed) OR dealer upcard is 10-value and peek confirms no blackjack |
| 11 | `SideBetResolution` | `Resolution` | internal (side bets resolved + peek) | Dealer upcard is 10-value; peek confirms dealer blackjack |
| 12 | `InsurancePrompt` | `PlayerTurn` | `ResolveInsurance(bool takesInsurance)` | Dealer does not have blackjack; player does not have blackjack |
| 13 | `InsurancePrompt` | `Resolution` | `ResolveInsurance(bool takesInsurance)` | Dealer does not have blackjack; player has blackjack (PlayerTurn skipped) |
| 14 | `InsurancePrompt` | `Resolution` | `ResolveInsurance(bool takesInsurance)` | Dealer has blackjack |
| 15 | `PlayerTurn` | `PlayerTurn` | `Hit()` | Active hand total <= 20 after card dealt; hand not bust; new total != 21 |
| 16 | `PlayerTurn` | `PlayerTurn` | `Hit()` (auto-stand applied) | Active hand reaches total 21; auto-stand fires; additional split hands remain |
| 17 | `PlayerTurn` | `PlayerTurn` | `Stand()` | Additional split hands remain after current hand stands |
| 18 | `PlayerTurn` | `PlayerTurn` | `DoubleDown()` | Active hand doubled; hand not bust; additional split hands remain |
| 19 | `PlayerTurn` | `PlayerTurn` | `DoubleDown()` (auto-stand) | Active hand doubled; hand busts; additional split hands remain |
| 20 | `PlayerTurn` | `PlayerTurn` | `Split()` | Split performed; new hands created; player now acts on first split hand |
| 21 | `PlayerTurn` | `PlayerTurn` | `Surrender()` | Player surrenders active hand; additional split hands remain |
| 22 | `PlayerTurn` | `DealerTurn` | `Hit()` → bust, no more hands | All player hands resolved by bust; no remaining hands to act on |
| 23 | `PlayerTurn` | `DealerTurn` | `Stand()` → no more hands | Last hand stood; no remaining split hands |
| 24 | `PlayerTurn` | `DealerTurn` | `DoubleDown()` → no more hands | Last hand doubled (bust or not); no remaining split hands |
| 25 | `PlayerTurn` | `DealerTurn` | `Surrender()` → no more hands | Last hand surrendered; no remaining split hands |
| 26 | `PlayerTurn` | `DealerTurn` | `Hit()` → total 21 auto-stand, no more hands | Last hand auto-stood at 21 |
| 27 | `DealerTurn` | `Resolution` | internal (dealer draw loop) | Dealer reaches hard/soft total >= 17 (stands) |
| 28 | `DealerTurn` | `Resolution` | internal (dealer draw loop) | Dealer total > 21 (busts) |
| 29 | `Resolution` | `Idle` | internal (resolution animation complete) | `GlobalState.Bankroll >= MinBet` after all deltas applied |
| 30 | `Resolution` | `PlayerBroke` | internal (resolution animation complete) | `GlobalState.Bankroll == 0` OR `GlobalState.Bankroll < MinBet` after all deltas applied |
| 31 | `PlayerBroke` | `Idle` | `GlobalState.BankrollChanged` signal received | `GlobalState.Bankroll >= MinBet` (player reloaded via CashierScreen) |

**Additional constraint — transitions 4–11 (peek behavior):**
The dealer peek is not a phase or a transition; it is logic executed inline during the exit of `Dealing` or `SideBetResolution`. The peek evaluates `DealerHand.Cards[1].Rank` against `DealerHand.Cards[0]`. The result routes to the correct destination phase. The hole card does not flip visually during peek — `HoleCardFaceUp` remains `false`. The peek is invisible to the player.

**Additional constraint — transition 3 (DealInitiated):**
`GlobalState.ApplyBankrollDelta(-(MainBet + TriLuxBet + LuckyLuckyBet))` is called once, atomically. The bankroll display updates before the deal animation begins.

**Additional constraint — ShufflePending:**
If `ShoeState.ShufflePending == true` when `BeginBetting()` is called, the shuffle executes before any cards are dealt. A shuffle indicator is shown in the UI (see Section 4). The shuffle is not a phase transition — it is performed inline at `DealInitiated` entry if pending.

---

## 3. Component Decomposition

### 3.1 Scene File Tree

All Blackjack-specific files live under `res://games/blackjack/`. No file in this directory imports from `res://games/uth/` or any other game directory. Shared components (marked with `[shared]`) are referenced from their canonical path at `res://shared/components/` after the Extraction Gate. During Blackjack development, they live in `res://shared/components/` per component-boundaries.md (first game to build owns the file; subsequent games reference the same path).

```
res://games/blackjack/
│
├── logic/                              # Pure C# — no Godot types — NUnit tests cover all of this
│   ├── BlackjackGame.cs                # State machine coordinator; owns all GamePhase transitions
│   ├── BlackjackHand.cs                # Hand value computation; soft/hard classification; bust check
│   ├── BlackjackDeck.cs                # Shoe management; Fisher-Yates shuffle; penetration tracking
│   ├── BlackjackRules.cs               # ActionAvailability recomputation on every state transition
│   ├── BlackjackBetResolver.cs         # Win/loss/push payout calculation; bankroll delta values
│   ├── TriLuxEvaluator.cs              # Three-card hand ranking; TriLux pay table lookup
│   └── LuckyLuckyEvaluator.cs         # Three-card total evaluation; Lucky Lucky pay table lookup
│
├── BlackjackTable.tscn                 # Root table scene — instantiated by SceneManager.LoadTable()
├── BlackjackTable.cs                   # Scene script — thin wrapper; owns signal connections; no game logic
│
├── PlayerHandZone.tscn                 # Card display zone for one player hand
├── PlayerHandZone.cs
│
├── DealerHandZone.tscn                 # Dealer card area; hole card flip coordination
├── DealerHandZone.cs
│
├── BlackjackActionPanel.tscn           # Composes ActionButton instances for Hit/Stand/Double/Split/Surrender
├── BlackjackActionPanel.cs
│
├── InsuranceBetPrompt.tscn             # Insurance Yes/No overlay; shown during InsurancePrompt phase
├── InsuranceBetPrompt.cs
│
├── BlackjackBetZone.tscn               # Composes BetSpot for main bet; includes double-down bet spot position
├── BlackjackBetZone.cs
│
├── SideBetZone.tscn                    # Composes two BetSpot instances for TriLux and Lucky Lucky
├── SideBetZone.cs
│
├── SideBetResultBanner.tscn            # Displays TriLux and Lucky Lucky win/lose banners during SideBetResolution
├── SideBetResultBanner.cs
│
├── TipPrompt.tscn                      # "Tip Dealer" button + dismiss; shown after TriLux win if DealerTipEnabled
├── TipPrompt.cs
│
└── designs/                            # Phase 8 deliverables — design references, not runtime assets
```

---

### 3.2 BlackjackTable.tscn Node Tree

The table scene is the root of everything the player sees and interacts with at the Blackjack table. All shared components are children or grandchildren of this scene. Indentation indicates parent/child relationship.

```
BlackjackTable (Node2D)
│   Script: BlackjackTable.cs
│   Holds: _game (BlackjackGame instance), _state (BlackjackGameState last value)
│
├── Background (CanvasLayer, z_index = 0)
│   └── FeltSurface (Sprite2D)
│       Texture: felt_fiber_grain.png tiled over color_felt; Screen blend at 12% opacity
│       Shader: directional sheen — Option B locked in visual-language.md
│
├── Table (CanvasLayer, z_index = 1)
│   ├── Rail (Sprite2D)
│   │   Texture: rail_bevel.png; color_rail (#3d2210)
│   │
│   ├── FeltMarkings (Node2D)
│   │   Label nodes: "INSURANCE PAYS 2 TO 1", "DEALER MUST DRAW TO 16", "BLACKJACK PAYS 3 TO 2"
│   │   Font: Noto Serif text_xl; color_felt_marking; letter-spacing 0.8px
│   │
│   ├── DealerHandZone (DealerHandZone.tscn)           [Blackjack-specific]
│   │
│   ├── PlayerHandZone (PlayerHandZone.tscn)            [Blackjack-specific]
│   │   Note: One PlayerHandZone per active hand; additional zones instantiated on split
│   │
│   ├── BlackjackBetZone (BlackjackBetZone.tscn)       [Blackjack-specific]
│   │   Contains: BetSpot (main bet) + DoubleDownBetSpot position marker
│   │
│   └── SideBetZone (SideBetZone.tscn)                 [Blackjack-specific]
│       Contains: BetSpot (TriLux) + BetSpot (Lucky Lucky)
│
├── UI (CanvasLayer, z_index = 2)
│   ├── BankrollDisplay (BankrollDisplay.tscn)          [shared]
│   ├── ChipTray (ChipTray.tscn)                        [shared]
│   ├── BlackjackActionPanel (BlackjackActionPanel.tscn) [Blackjack-specific]
│   │   Children: ActionButton × 5 (Hit, Stand, Double, Split, Surrender)
│   │   Additional: ActionButton (Deal, gold accent), ActionButton (Clear Bet)
│   │
│   ├── InsuranceBetPrompt (InsuranceBetPrompt.tscn)    [Blackjack-specific]
│   ├── SideBetResultBanner (SideBetResultBanner.tscn)  [Blackjack-specific]
│   └── TipPrompt (TipPrompt.tscn)                      [Blackjack-specific]
│
├── Overlays (CanvasLayer, z_index = 3)
│   ├── ResultBanner (ResultBanner.tscn)                [shared]
│   ├── RulesPanel (RulesPanel.tscn)                    [shared]
│   ├── SettingsPanel (SettingsPanel.tscn)              [shared]
│   └── CashierScreen (CashierScreen.tscn)              [shared]
│
└── Audio (Node)
    └── AudioStreamPlayer nodes for each SFX category (card, chip, win, loss, bust, blackjack, shuffle)
```

**CanvasLayer z-index rationale:**
- z=0 Background: felt and rail; never interactive
- z=1 Table: game objects (cards, chips, hand zones); interactive during PlayerTurn
- z=2 UI: chrome and controls (bankroll, chip tray, action buttons, prompts)
- z=3 Overlays: full-screen panels that block everything beneath (RulesPanel, CashierScreen, SettingsPanel)

This matches the render layer ordering in `technical-architecture.md` Section 1 data flow.

---

### 3.3 PlayerHandZone.tscn Detail

`PlayerHandZone.tscn` manages card display for one player hand. The table scene instantiates additional `PlayerHandZone` instances dynamically when a split occurs (up to 3 additional, for 4 total). Each zone positions its cards independently.

```
PlayerHandZone (Node2D)
├── Cards (Node2D)
│   └── [CardFace.tscn instances added dynamically on deal/hit]
└── HandTotalBadge (Label)
    Font: Noto Serif text_display_sm; color_text_primary
    Updates on every StateChanged signal where this hand's card count changes
    Shows "BUST" in color_error when IsBust == true
    Hidden during Idle and Betting phases
```

**Card layout:** 28px horizontal offset per card (overlapping fan). Offset is applied by `PlayerHandZone.cs` when instantiating each `CardFace` node. This offset is a Blackjack-specific layout value — it lives in `PlayerHandZone.cs` as a constant, not in visual-language.md (which does not define per-game layout constants).

---

### 3.4 DealerHandZone.tscn Detail

```
DealerHandZone (Node2D)
├── Cards (Node2D)
│   └── [CardFace.tscn instances added dynamically on deal/draw]
└── DealerTotalBadge (Label)
    Font: Noto Serif text_display_sm; color_text_primary
    Visible only during DealerTurn and Resolution phases
    Hidden during all earlier phases (hole card value is unknown)
```

---

### 3.5 BlackjackBetZone.tscn Detail

```
BlackjackBetZone (Node2D)
├── MainBetSpot (BetSpot.tscn)          [shared]
│   Label: "" (no printed label; arc marking is the visual cue; ShowLabel = false)
│   IsActive: driven by phase (active during Betting; false otherwise)
└── DoubleDownBetSpot (BetSpot.tscn)    [shared]
    Label: "" (ShowLabel = false)
    IsActive: false at all times except when CanDouble == true and player confirms double
    Note: DoubleDown chip placement uses a separate BetSpot positioned to the right of MainBetSpot
```

---

### 3.6 SideBetZone.tscn Detail

```
SideBetZone (Node2D)
├── TriLuxBetSpot (BetSpot.tscn)        [shared]
│   Label: "TRILUX" (ShowLabel = true; color_felt_marking)
│   IsActive: driven by phase (active during Betting when MainBet > 0; false otherwise)
│   Note: TriLux accepts a single chip denomination click; replaces prior value if already set
└── LuckyLuckyBetSpot (BetSpot.tscn)   [shared]
    Label: "LUCKY LUCKY" (ShowLabel = true; color_felt_marking)
    IsActive: driven by phase (active during Betting when MainBet > 0; false otherwise)
    Note: Same single-placement model as TriLux
```

---

## 4. Animation Approach

### 4.1 System Selection

Blackjack uses **Tween** for all game object animations (cards, chips) and **AnimationPlayer** for UI element transitions (panels, overlays, banners). No AnimationTree is needed — there are no blended or state-driven skeletal animations.

**Rationale:**
- `Tween` provides per-instance, runtime-created tweens with dynamic start/end positions. Card deal arcs vary by destination position (different hand zones, dealer zone, split zones) — these cannot be pre-authored in AnimationPlayer without per-position tracks. Tween handles this naturally.
- `AnimationPlayer` is appropriate for fixed UI transitions (panel slide-in, overlay fade) where the animation is identical every time and positions are fixed in scene layout.
- `GlobalState.ReducedMotionEnabled` is read once on scene load by `BlackjackTable.cs` and stored in `_reducedMotion`. All Tween creation checks this flag first. AnimationPlayer clips check a `_reducedMotion` conditional in `BlackjackTable.cs` before calling `Play()`.

### 4.2 Animation Inventory

Every animatable event is listed below. Duration values come from `visual-language.md` Section 3 motion spec. "Blocks transition" means the state machine does not advance to the next phase until this animation completes and emits its signal. "Parallel" means it runs alongside other animations or alongside a completed state transition.

| Event | System | Duration | Blocks state transition | Notes |
|---|---|---|---|---|
| Card deal arc (each card) | Tween | 250ms + 50ms settle | Yes (during Dealing phase; all 4 cards must complete before phase exits) | 90ms stagger between cards; arc peaks 18px above table surface; settle is 2.5-degree overshoot correcting to final angle |
| Card deal arc — reduced motion | — | 0ms | No | All cards appear at final position simultaneously; no stagger |
| Card flip (hole card reveal) | Tween | 200ms (100ms back-to-edge + 100ms edge-to-face) | Yes (DealerTurn entry; hole card flip must complete before dealer draws first card) | X-axis rotation; texture swap at 90°; interruptible by input snap to final |
| Card flip — reduced motion | — | 0ms | No | Instant texture swap |
| Card deal (additional hit/dealer draw) | Tween | 250ms + 50ms settle | Yes (each card deal must complete before next action is accepted) | Same arc spec as initial deal; no stagger (single card) |
| Chip placement arc (main bet) | Tween | 210ms | No (parallel; player can continue placing chips) | Arc 20px peak height; chip appears at stacked position on landing |
| Chip placement arc (side bet) | Tween | 210ms | No (parallel) | Same arc spec; destination is TriLuxBetSpot or LuckyLuckyBetSpot |
| Chip placement arc (double down) | Tween | 210ms | No (parallel with deal arc of doubled card) | Destination is DoubleDownBetSpot |
| Chip placement — reduced motion | — | 0ms | No | Chip appears at destination immediately |
| Chip win collection | Tween | 350ms | Yes (wait for all win chips to reach destination before Idle transition) | Straight slide from dealer area toward player bet zone |
| Chip loss collection | Tween | 350ms | Yes (same rationale) | Straight slide from player bet zone toward dealer area |
| Chip resolution — reduced motion | — | 0ms | No | Chips appear/disappear at destination immediately; win numeral still plays |
| Win numeral float | Tween | 450ms | No (parallel with chip resolution) | Source: chip resolution point; target: BankrollDisplay position; scale 100%→60%; alpha fade in final 100ms |
| Win numeral float — reduced motion | Tween | 100ms | No | Appears at BankrollDisplay position; fades out; no travel |
| Win bloom (screen-edge pulse) | AnimationPlayer | 500ms (150ms in + 150ms hold + 200ms out) | No (parallel) | color_win_bloom at 12% opacity max; radial from edges inward max 120px |
| Win bloom — reduced motion | — | 0ms | No | Omitted entirely |
| Push indicator appear | AnimationPlayer | 400ms (transition_panel_enter) | No | Neutral; color_push; no bloom |
| Side bet win banner | AnimationPlayer | 400ms (transition_panel_enter) + 400ms hold | Yes (SideBetResolution holds until banner animation sequence completes, or tip prompt resolves) | Separate banner per side bet (TriLux, Lucky Lucky); positioned over respective bet spot |
| Side bet lose indicator | AnimationPlayer | 300ms (transition_fade_in) + 200ms hold | No | Brief; fades out; no hold |
| Tip prompt appear | AnimationPlayer | 400ms (transition_panel_enter) | Yes (SideBetResolution holds until tip prompt is dismissed or auto-timeout fires at 5s) | Only appears when TriLux wins and DealerTipEnabled == true |
| Tip prompt dismiss | AnimationPlayer | 300ms (transition_panel_exit) | No | |
| Insurance prompt appear | AnimationPlayer | 450ms (transition_modal_enter) | Yes (InsurancePrompt phase; all input to table scene blocked; prompt awaits player decision) | Full-screen modal per CashierScreen pattern |
| Insurance prompt dismiss | AnimationPlayer | 350ms (transition_modal_exit) | No | |
| Shuffle indicator appear | AnimationPlayer | 400ms (transition_panel_enter) | Yes (shown before DealInitiated deal begins; clears before first card arc starts) | Brief overlay; text "Shuffling..."; dismisses after 400ms automatically |
| Bust banner | AnimationPlayer | 300ms (transition_fade_in) | No | Rendered by DealerHandZone or PlayerHandZone; "BUST" label node; color_error |
| Blackjack fanfare | AudioStreamPlayer only | 0ms (audio-only; no visual animation) | No | SFX plays on blackjack win; no blocking |
| RulesPanel open | AnimationPlayer | 450ms (transition_modal_enter) | No | Player-triggered; game continues behind it |
| RulesPanel close | AnimationPlayer | 350ms (transition_modal_exit) | No | |
| SettingsPanel open | AnimationPlayer | 400ms (transition_panel_enter) | No | |
| SettingsPanel close | AnimationPlayer | 300ms (transition_panel_exit) | No | |
| CashierScreen open | AnimationPlayer | 450ms (transition_modal_enter) | Yes (PlayerBroke phase; all table input blocked until dismissed) | |
| CashierScreen close | AnimationPlayer | 350ms (transition_modal_exit) | No | |
| HandTotalBadge update | Tween | 80ms | No | Brief counter animation on value change; reduced motion: instant |
| BankrollDisplay counter | Tween | 150ms | No | Tabular numeral counter update; reduced motion: instant |

**Input gate rule during Dealing:** The scene script tracks a `_animationsPending` counter. Each blocking animation increments this counter on start and decrements it on completion signal. Player input to the game state machine is suppressed while `_animationsPending > 0`. This is the "animation queue" described in `technical-architecture.md` Section 2 (Scene-Local State).

---

## 5. Integration Points — Shared Components

This section specifies exactly how each of the 12 shared components is used by Blackjack. For each component: whether it is used, how it is instantiated, what signals Blackjack listens to, and what props/state it receives.

---

### 5.1 CardFace.tscn

**Used by Blackjack:** Yes.

**Instantiation:** `BlackjackTable.cs` does not instantiate `CardFace` nodes directly. `PlayerHandZone.cs` instantiates a new `CardFace` node for each card dealt to a player hand. `DealerHandZone.cs` instantiates `CardFace` nodes for each dealer card. Both use `GD.Load<PackedScene>("res://shared/components/CardFace.tscn").Instantiate()`.

**Props set by Blackjack:**

| Prop | Set by | When | Value |
|---|---|---|---|
| `Rank` | `PlayerHandZone.cs` or `DealerHandZone.cs` | On StateChanged diff: new card in hand | Card rank integer (1–13) |
| `Suit` | Same | Same | "clubs" / "diamonds" / "hearts" / "spades" |
| `FaceUp` | `DealerHandZone.cs` | Hole card: `false` on deal; `true` on DealerTurn entry | `DealerHand.HoleCardFaceUp` |
| `FaceUp` | `PlayerHandZone.cs` | All player cards: `true` immediately | `true` always for player cards |
| `AnimateFlip` | `DealerHandZone.cs` | On hole card flip | `!_reducedMotion` |
| `RotationDegrees` | `PlayerHandZone.cs` | On card settle | Slight random variation ±2° applied per card for natural look |

**Signals listened to by Blackjack:**

| Signal | Handler | Action |
|---|---|---|
| `DealArcCompleted` | `BlackjackTable.cs` | Decrements `_animationsPending`; when all deal arcs complete, unblocks phase exit from `Dealing` |
| `FlipCompleted` | `DealerHandZone.cs` → bubbled to `BlackjackTable.cs` | Decrements `_animationsPending`; hole card flip unblocks first dealer draw |

---

### 5.2 CardBack.tscn

**Used by Blackjack:** Yes, with limitations.

**Instantiation:** `DealerHandZone.cs` may optionally use `CardBack.tscn` as a placeholder for the hole card slot before the deal animation begins, if a placeholder is needed for layout purposes. Once the actual `CardFace` node is instantiated with `FaceUp = false`, `CardBack` is not needed and not used. At MVP, `CardFace` with `FaceUp = false` is sufficient for the hole card — `CardBack` has no use in the Blackjack deal flow. It is available if design requires a deck-indicator element in the shoe position, but no such element is specified for Blackjack at this time.

**Signals:** None listened to.

---

### 5.3 Chip.tscn

**Used by Blackjack:** Yes, indirectly through `ChipStack.tscn`.

**Instantiation:** `Chip.tscn` is instantiated by `ChipStack.cs`, not directly by Blackjack scenes. `BlackjackTable.cs` never instantiates `Chip` nodes directly.

**Signals listened to by Blackjack:**

| Signal | Handler | Action |
|---|---|---|
| `PlacementArcCompleted` | Bubbled through `ChipStack.cs` → `BetSpot.cs` | Scene plays chip clink SFX on each completion if `GlobalState.SoundEnabled` |
| `ChipClicked` | Bubbled through `ChipStack.cs` → `BetSpot.cs` → `BlackjackBetZone.cs` → `BlackjackTable.cs` | Not used for placed chips; chip tray selection is handled by `ChipTray.tscn` |

---

### 5.4 ChipStack.tscn

**Used by Blackjack:** Yes, as a child of `BetSpot.tscn`.

**Instantiation:** Owned by `BetSpot.tscn`; not instantiated directly by Blackjack scenes.

**Methods called by Blackjack (via BetSpot):**

| Method | Called by | When |
|---|---|---|
| `AddChip(denomination)` | `BlackjackTable.cs` → `BetSpot` | On `PlaceBet` state transition (chip placed in main bet or side bet) |
| `AddChip(denomination)` | `BlackjackTable.cs` | On double down confirmed (chip placed in DoubleDownBetSpot) |
| `ClearStack()` | `BlackjackTable.cs` | After resolution animation completes; chips already animated away |

**Signals listened to:** `StackChanged` — not directly listened to by Blackjack table scene; BetSpot intermediates.

---

### 5.5 ChipTray.tscn

**Used by Blackjack:** Yes.

**Instantiation:** Placed in `BlackjackTable.tscn` scene tree as a child of the `UI` CanvasLayer. One instance only.

**Props set by Blackjack:**

| Prop | Set by | When | Value |
|---|---|---|---|
| `SelectedDenomination` | `BlackjackTable.cs` | On `DenominationSelected` signal received; or 0 when ChipTray deactivated | Active denomination or 0 |
| `AffordableDenominations` | `BlackjackTable.cs` | On `StateChanged` (bankroll changes or phase changes) | Computed by `BankrollService.GetAffordableDenominations(GlobalState.Bankroll, remainingBetCapacity)` |

**Signals listened to by Blackjack:**

| Signal | Handler | Action |
|---|---|---|
| `DenominationSelected(denomination)` | `BlackjackTable.cs` | If phase is `Betting` and denomination is affordable and `MainBet + denomination <= MaxBet`: calls `_game.PlaceBet(denomination)` for main bet; or side bet if side bet spot is focused |

**Activation:** `ChipTray` is visually active only during `Betting` phase. During all other phases, the scene does not process `DenominationSelected` signals (the `BlackjackActionPanel` and `BetSpot` `IsActive` flags enforce this). The ChipTray itself is always visible — it does not hide — but denomination chips are dimmed when `AffordableDenominations` is empty.

---

### 5.6 BetSpot.tscn

**Used by Blackjack:** Yes. Multiple instances: one for main bet (inside `BlackjackBetZone`), one for double-down bet (inside `BlackjackBetZone`), one for TriLux (inside `SideBetZone`), one for Lucky Lucky (inside `SideBetZone`).

**Instantiation:** Each `BetSpot` is a child node in its parent Blackjack-specific component scene. Not instantiated dynamically.

**Props set by Blackjack:**

| Prop | Set by | When | Value |
|---|---|---|---|
| `Label` | Scene editor (static) | Fixed per spot | "TRILUX", "LUCKY LUCKY", or "" for main/double-down |
| `ShowLabel` | Scene editor (static) | Fixed | `true` for side bets; `false` for main and double-down |
| `IsActive` | `BlackjackTable.cs` | On `StateChanged` phase change | `true` during `Betting` for all spots; `false` otherwise (double-down spot activates briefly at double confirm) |
| `ChipDenominations` | `BlackjackTable.cs` | On `StateChanged` (bet changes) | Current chip array for this bet spot's stack |

**Signals listened to by Blackjack:**

| Signal | Handler | Action |
|---|---|---|
| `BetSpotClicked` (main bet spot) | `BlackjackBetZone.cs` → `BlackjackTable.cs` | If phase is `Betting` and a denomination is selected in ChipTray: calls `_game.PlaceBet(denomination)` |
| `BetSpotClicked` (TriLux spot) | `SideBetZone.cs` → `BlackjackTable.cs` | If phase is `Betting` and MainBet > 0 and denomination selected: calls `_game.PlaceTriLuxBet(denomination)` |
| `BetSpotClicked` (Lucky Lucky spot) | `SideBetZone.cs` → `BlackjackTable.cs` | Same pattern for Lucky Lucky: calls `_game.PlaceLuckyLuckyBet(denomination)` |

---

### 5.7 ActionButton.tscn

**Used by Blackjack:** Yes. Instances: Hit, Stand, Double Down, Split, Surrender (inside `BlackjackActionPanel.tscn`), Deal (gold accent, inside `BlackjackActionPanel.tscn`), Clear Bet (inside `BlackjackActionPanel.tscn`).

**Instantiation:** All `ActionButton` instances are placed in `BlackjackActionPanel.tscn` in the scene editor. Not instantiated dynamically.

**Props set by Blackjack:**

| Button | `Label` | `IconPath` | `IsEnabled` set by | `IsGoldAccent` |
|---|---|---|---|---|
| Hit | "HIT" | `res://assets/icons/hit.svg` | `Actions.CanHit` | `false` |
| Stand | "STAND" | `res://assets/icons/stand.svg` | `Actions.CanStand` | `false` |
| Double | "DOUBLE" | `res://assets/icons/double.svg` | `Actions.CanDouble` | `false` |
| Split | "SPLIT" | `res://assets/icons/split.svg` | `Actions.CanSplit` | `false` |
| Surrender | "SURRENDER" | `res://assets/icons/surrender.svg` | `Actions.CanSurrender` | `false` |
| Deal | "DEAL" | `res://assets/icons/deal.svg` | `Actions.CanDeal` | `true` |
| Clear Bet | "CLEAR BET" | `res://assets/icons/clear.svg` | `MainBet > 0 && phase == Betting` | `false` |

**Signals listened to by Blackjack:**

| Button | Signal | Handler |
|---|---|---|
| Hit | `ActionPressed` | `BlackjackTable.cs` → `_game.Hit()` |
| Stand | `ActionPressed` | `BlackjackTable.cs` → `_game.Stand()` |
| Double | `ActionPressed` | `BlackjackTable.cs` → `GlobalState.ApplyBankrollDelta(-MainBet)` then `_game.DoubleDown()` |
| Split | `ActionPressed` | `BlackjackTable.cs` → `GlobalState.ApplyBankrollDelta(-MainBet)` then `_game.Split()` |
| Surrender | `ActionPressed` | `BlackjackTable.cs` → `_game.Surrender()` |
| Deal | `ActionPressed` | `BlackjackTable.cs` → `GlobalState.ApplyBankrollDelta(-(MainBet + TriLuxBet + LuckyLuckyBet))` then `_game.DealInitiated()` |
| Clear Bet | `ActionPressed` | `BlackjackTable.cs` → `_game.ClearBet()` |

---

### 5.8 ResultBanner.tscn

**Used by Blackjack:** Yes. One instance in the `Overlays` CanvasLayer.

**Instantiation:** Placed in `BlackjackTable.tscn` scene tree. One instance reused for each hand result. For split hands with multiple results, `ResultBanner` is called sequentially (left-to-right per game-spec.md Section 11.2) — the banner instance is reused for each call; it does not persist between hands.

**Props set by Blackjack:**

| Prop | Value |
|---|---|
| `Result` | `ResultType.Win`, `ResultType.Push`, or `ResultType.Loss` mapped from `HandOutcome` |
| `Amount` | Net win amount (0 for loss/push-with-no-amount) |
| `SourcePosition` | Screen-space position of the resolved BetSpot's ChipStack |
| `TargetPosition` | Screen-space position of the `BankrollDisplay` node |

**Signals listened to by Blackjack:**

| Signal | Handler | Action |
|---|---|---|
| `AnimationCompleted` | `BlackjackTable.cs` | Decrements `_animationsPending`; when all hands resolved and all banners completed, phase advances to `Idle` or `PlayerBroke` |

---

### 5.9 RulesPanel.tscn

**Used by Blackjack:** Yes. One instance in the `Overlays` CanvasLayer.

**Instantiation:** Placed in `BlackjackTable.tscn` scene tree. `IsVisible = false` at scene load. Toggled by a rules button in the UI chrome (not specified as its own ActionButton — it is a secondary icon button outside `BlackjackActionPanel`).

**Props set by Blackjack:**

| Prop | Value |
|---|---|
| `GameTitle` | "Blackjack" |
| `Sections` | Static content array from game-spec.md Section 14; set once at `_Ready()` |
| `IsVisible` | Toggled on rules button press and on `Dismissed` signal |

**Signals listened to by Blackjack:**

| Signal | Handler | Action |
|---|---|---|
| `Dismissed` | `BlackjackTable.cs` | Sets `RulesPanel.IsVisible = false` |

---

### 5.10 CashierScreen.tscn

**Used by Blackjack:** Yes. Loaded as an overlay by `SceneManager.GoToCashier()` per `technical-architecture.md` Section 4, Step 3.

**Instantiation:** Not pre-placed in `BlackjackTable.tscn`. `SceneManager.GoToCashier()` instantiates and adds it to the scene tree as a `CanvasLayer` above z_index 3 when `PlayerBroke` phase is reached. All table input is blocked while active.

**Props set by Blackjack:** `BlackjackTable.cs` passes all props to `CashierScreen` on instantiation:

| Prop | Source |
|---|---|
| `CurrentBankroll` | `GlobalState.Bankroll` |
| `OutstandingLoanAmounts` | `GlobalState.OutstandingLoanAmounts` |
| `TotalDebt` | `GlobalState.TotalDebt` |
| `DebtCeiling` | `GameConfig.DebtCeiling` |
| `LoanFlatFee` | `GameConfig.LoanFlatFee` |
| `IsTappedOut` | `GlobalState.IsTappedOut` |
| `IsNewSession` | `GlobalState.IsTappedOut` (same flag) |
| `DefaultStartingBankroll` | `GameConfig.DefaultStartingBankroll` |

**Signals listened to by Blackjack:**

| Signal | Handler | Action |
|---|---|---|
| `LoanRequested(amount)` | `BlackjackTable.cs` | Calls `GlobalState.GrantLoan(amount)` |
| `LoanRepaid(index)` | `BlackjackTable.cs` | Calls `GlobalState.RepayLoan(index)` |
| `NewSessionRequested` | `BlackjackTable.cs` | Calls `GlobalState.ResetSession()` |
| `Dismissed` | `BlackjackTable.cs` | Removes CashierScreen overlay; restores table input; state machine transitions `PlayerBroke` → `Idle` per transition #31 |

---

### 5.11 SettingsPanel.tscn

**Used by Blackjack:** Yes. One instance in the `Overlays` CanvasLayer.

**Instantiation:** Placed in `BlackjackTable.tscn`. `IsVisible = false` at scene load. Toggled by a settings icon button in the UI chrome.

**Props set by Blackjack:**

| Prop | Value |
|---|---|
| `SoundEnabled` | `GlobalState.SoundEnabled` (read on `SettingsChanged` signal) |
| `ReducedMotionEnabled` | `GlobalState.ReducedMotionEnabled` (read on `SettingsChanged` signal) |

**Signals listened to by Blackjack:**

| Signal | Handler | Action |
|---|---|---|
| `SoundToggled(enabled)` | `BlackjackTable.cs` | Calls `GlobalState.SetSoundEnabled(enabled)` |
| `ReducedMotionToggled(enabled)` | `BlackjackTable.cs` | Calls `GlobalState.SetReducedMotionEnabled(enabled)`; propagates new value to all components that hold `_reducedMotion` |
| `Dismissed` | `BlackjackTable.cs` | Sets `SettingsPanel.IsVisible = false` |

---

### 5.12 BankrollDisplay.tscn

**Used by Blackjack:** Yes. One instance in the `UI` CanvasLayer. Always visible.

**Instantiation:** Placed in `BlackjackTable.tscn` scene tree.

**Props set by Blackjack:**

| Prop | Set by | When | Value |
|---|---|---|---|
| `Amount` | `BlackjackTable.cs` | On `GlobalState.BankrollChanged` signal | `GlobalState.Bankroll` |

**Signals:** None. `BankrollDisplay` is display-only; it emits no signals.

**Initialization:** `BlackjackTable.cs` sets `BankrollDisplay.Amount = GlobalState.Bankroll` in `_Ready()` before any game interaction is possible.

---

### 5.13 CardBack.tscn (summary)

Addressed in Section 5.2. Not actively used in the Blackjack deal flow at MVP. Available if a shoe indicator is added to the table design in Phase 8.

---

## 6. Gate Criterion Check

This section explicitly verifies that the Blackjack architecture fits cleanly within the system architecture from Phase 5.

| Criterion | Status | Evidence |
|---|---|---|
| `BlackjackGameState` is immutable | Satisfied | Section 1: "state machine allocates and returns a new record for every valid transition" |
| State machine returns new record on every transition | Satisfied | Section 1.1 immutability rule; Section 2 transition table triggers map to state machine methods |
| `GlobalState` owns bankroll; scenes read, never write directly | Satisfied | Section 5 integration points: all bankroll changes go through `GlobalState.ApplyBankrollDelta()` or `GlobalState.GrantLoan()` etc. |
| No scene in `games/blackjack/` imports from another game's directory | Satisfied | Section 3.1: all imports are from `res://shared/` or `res://games/blackjack/` |
| Side bets (TriLux, Lucky Lucky) accommodated | Satisfied | Sections 1 (state fields), 2 (transitions 4, 9–11), 3 (`SideBetZone.tscn`), 4 (animation), 5.6 (BetSpot integration) |
| `SideBet` renamed to `DoubleDownBet` | Satisfied | Section 1.1: `DoubleDownBet` used throughout; no `SideBet` field exists |
| Data flow matches `technical-architecture.md` Section 1 | Satisfied | User input → scene → state machine → `StateChanged` → scene diff → component updates; identical pattern |
| ReducedMotion propagation matches Phase 5 spec | Satisfied | Section 4.1: read once at scene load; re-propagated on `SettingsChanged` signal |
| PersistenceService used for history recording | Satisfied | `BlackjackBetResolver.cs` hands `HandRecord` to `PersistenceService.AppendHistoryRecord()` after each `Resolution`; invoked from `BlackjackTable.cs` |
| `PlayerBroke` → `CashierScreen` flow matches Phase 5 Section 4 | Satisfied | Section 5.10; transitions #30 and #31; `SceneManager.GoToCashier()` used |
| Shared components used generically; no game-specific logic in them | Satisfied | Section 5 documents only props and signals; no Blackjack conditionals leak into shared components |
| Animation budget: blocking animations identified and gated | Satisfied | Section 4.2 "Blocks state transition" column; `_animationsPending` counter pattern described |
| `DealerBlackjack` handled without a spurious GamePhase entry | Satisfied | Section 1.7 note; peek inline logic in Section 2 transitions 8 and 11 route directly to `Resolution` |
