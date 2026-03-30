# Technical Architecture — Casino Table Games Suite

**Version:** 1.0
**Date:** 2026-03-29
**Status:** Authoritative — all implementation agents must read this document before writing code
**Platform:** Godot 4, C#, 2D pipeline, desktop only (Windows/Linux)

This document is the complete specification for how the system is built. A developer must be able to implement every part of the system from this document without making architectural decisions themselves. If a decision is not here, raise it before implementing — do not invent a solution on the fly.

---

## 1. Data Flow Diagram

The diagram below shows the path from a user input event to a rendered frame for all significant interactions. Every named arrow is a discrete operation with an owner.

```
USER INPUT
    |
    | (OS input event — mouse click, keyboard press)
    v
GODOT INPUT SYSTEM
    |
    | (_Input / _UnhandledInput on active scene)
    v
SCENE SCRIPT (thin wrapper — e.g. BlackjackTable.cs)
    |
    |-- [if chip placement] --> ChipTray emits DenominationSelected
    |                               |
    |                               v
    |                          Scene receives signal
    |                          Calls BankrollService.CanAfford(denomination)
    |                          If yes: calls GameStateMachine.PlaceBet(denomination)
    |
    |-- [if action button] --> ActionButton emits ActionPressed
    |                               |
    |                               v
    |                          Scene receives signal
    |                          Calls GameStateMachine.ApplyAction(action)
    |
    v
GAME STATE MACHINE (pure C# — e.g. BlackjackGame.cs)
    |
    | Validates transition from current GamePhase
    | Mutates immutable state: returns new GameState record
    | Emits C# event: StateChanged(GameState previous, GameState next)
    |
    v
SCENE SCRIPT (subscribes to StateChanged)
    |
    | Computes diff: what changed between previous and next state
    | Dispatches animation and UI update calls
    |
    |-- [cards changed] --------> PlayerHandZone / DealerHandZone
    |                              Calls DealCard(card) or FlipCard()
    |                              CardFace.tscn plays arc animation
    |                              CardFace emits DealArcCompleted
    |
    |-- [chips changed] --------> BetSpot / ChipStack
    |                              Calls AddChip(denomination) or ClearStack()
    |                              Chip.tscn plays placement arc
    |                              Chip emits PlacementArcCompleted
    |
    |-- [bankroll changed] -----> BankrollDisplay
    |                              Sets Amount property
    |                              Label updates on next _Process frame
    |
    |-- [result ready] ---------> ResultBanner
    |                              Sets Result, Amount, SourcePosition, TargetPosition
    |                              Plays win numeral float + bloom
    |                              Emits AnimationCompleted
    |
    |-- [action availability] --> BlackjackActionPanel
    |                              Sets CanHit, CanStand, CanDouble, etc.
    |                              ActionButton nodes enable/disable
    |
    |-- [phase = PlayerBroke] --> Scene calls GlobalState.SetBrokeState()
    |                              Scene navigates to CashierScreen
    |
    v
GODOT RENDER PIPELINE
    |
    | Composite all CanvasLayers (Background, Felt, Cards, Chips, UI)
    | Apply shaders (felt fiber grain texture, card drop shadows)
    | Output to display at target 60 FPS
    v
DISPLAY FRAME
```

### Key Transition Names

| Transition Name | Trigger | Owner |
|---|---|---|
| `BetPlaced` | Player clicks chip in tray, chip placed on BetSpot | Scene → GameStateMachine |
| `BetCleared` | Player removes bet before deal (if supported by game) | Scene → GameStateMachine |
| `DealInitiated` | Player confirms bet, clicks Deal button | Scene → GameStateMachine |
| `CardDealt` | State machine advances deal sequence | Scene → CardFace.DealArc() |
| `PlayerActionApplied` | Player clicks Hit / Stand / Double / Split / etc. | Scene → GameStateMachine |
| `DealerTurnStarted` | Player stands or busts, dealer turn begins | GameStateMachine internal |
| `HandResolved` | Dealer turn complete, outcomes calculated | GameStateMachine → Scene |
| `BankrollUpdated` | Any change to chip count (win, loss, loan, reload) | Scene → GlobalState → BankrollDisplay |
| `PlayerBroke` | Bankroll reaches zero mid-hand or at bet validation | Scene → CashierScreen |
| `LoanGranted` | Player accepts loan at cashier | CashierScreen signal → GlobalState |
| `SessionReset` | Player initiates new session (tapped out path) | CashierScreen signal → GlobalState → PersistenceService |
| `SettingsChanged` | Player toggles sound or reduced-motion | SettingsPanel signal → GlobalState → PersistenceService |
| `TableEntered` | Player navigates from lobby to a game table | LobbyScene → SceneManager |
| `TableExited` | Player navigates from table back to lobby | TableScene → SceneManager |

---

## 2. State Management

### Approach

Two layers: a **GlobalState Autoload singleton** for data that outlives any scene, and **scene-local state** for data that only matters while a specific table is on screen.

No reactive state library. No event bus beyond Godot's built-in signal system. State mutations happen in one place per concern and emit exactly one signal per mutation.

### GlobalState Autoload

**File:** `res://shared/autoloads/GlobalState.cs`

Registered in Project Settings > Autoload. Available as `GlobalState` from any script via `GetNode<GlobalState>("/root/GlobalState")`.

**What it holds:**

```csharp
public partial class GlobalState : Node
{
    // Bankroll — single source of truth across all games
    public int Bankroll { get; private set; }
    public int[] OutstandingLoanAmounts { get; private set; }  // each loan's principal
    public int TotalDebt { get; private set; }                 // sum of all loan principals
    public bool IsTappedOut { get; private set; }              // debt ceiling reached at zero balance

    // Settings — persisted, loaded at startup
    public bool SoundEnabled { get; private set; }
    public bool ReducedMotionEnabled { get; private set; }

    // Display state — persisted, loaded at startup
    public Window.ModeEnum WindowMode { get; private set; }   // Windowed | Fullscreen | ExclusiveFullscreen

    // Session metadata — not persisted mid-session
    public bool IsFirstLaunch { get; private set; }           // true until first save file written
    public int StartingBankrollChoice { get; private set; }   // player-set on first launch only

    // Signals
    [Signal] public delegate void BankrollChangedEventHandler(int newAmount);
    [Signal] public delegate void LoanStateChangedEventHandler();
    [Signal] public delegate void TappedOutEventHandler();
    [Signal] public delegate void SettingsChangedEventHandler();
}
```

**Mutation rules:**

- `Bankroll` is mutated only through `GlobalState.ApplyBankrollDelta(int delta)`. No scene sets `Bankroll` directly.
- Loans are mutated only through `GlobalState.GrantLoan(int amount)` and `GlobalState.RepayLoan(int index)`.
- Settings are mutated only through `GlobalState.SetSoundEnabled(bool)` and `GlobalState.SetReducedMotionEnabled(bool)`.
- After every mutation, GlobalState calls `PersistenceService.SaveAll()` synchronously.
- No mutation method on GlobalState accepts a Godot type as a parameter. All parameters are plain C# value types.

**Rule:** GlobalState never calls a method on a scene node. It emits signals and returns values. Scenes subscribe to signals and query GlobalState for values.

### Scene-Local State

Each game table scene owns state that only exists while that table is loaded. This includes:

- The `GameStateMachine` instance (e.g., `BlackjackGame`) — instantiated when the table scene loads, released when it unloads
- Current bet composition (`int[] BetDenominations` on the scene script)
- Active hand data (`GameState` — the last value returned by the state machine)
- Animation queue — which components are mid-animation (used to gate input during non-interruptible sequences)

**Rule:** Scene-local state is never written to disk. It is reconstructed on scene load from GlobalState (bankroll) and from the game's own PersistenceService save file if mid-hand recovery is supported (Phase 12 decision — not required for MVP).

### GameState Record

Each game defines a `GameState` record that is the complete, immutable snapshot of game state at a point in time. The state machine returns a new record on every transition — it does not mutate the previous record.

Example for Blackjack:

```csharp
public record BlackjackGameState(
    GamePhase Phase,           // see enum below
    Card[] PlayerCards,
    Card[] DealerCards,
    bool DealerHoleCardFaceUp,
    int MainBet,
    int SideBet,               // double-down amount or 0
    int InsuranceBet,          // insurance amount or 0
    HandResult? Result,        // null until hand resolves
    ActionAvailability Actions // which player actions are legal
);

public enum GamePhase
{
    Idle,           // table loaded, no bet placed
    Betting,        // player is placing chips
    Dealing,        // initial deal animation in progress
    PlayerTurn,     // player deciding on actions
    InsurancePrompt,// dealer shows Ace, waiting for insurance decision
    DealerTurn,     // dealer drawing cards
    Resolution,     // hand over, chips being resolved
    PlayerBroke     // bankroll is zero, routing to cashier
}
```

### ReducedMotion Propagation

The `ReducedMotionEnabled` flag lives on GlobalState. Components do not query GlobalState directly. The scene script reads `GlobalState.ReducedMotionEnabled` once on scene load and passes it to every component that needs it. If the player changes the setting mid-session, the scene script receives the `SettingsChanged` signal and propagates the new value.

---

## 3. Persistence Model

### Storage Location

All save files are written to Godot's `user://` directory, which resolves to:

- **Linux:** `~/.local/share/godot/app_userdata/[project-name]/`
- **Windows:** `%APPDATA%\Godot\app_userdata\[project-name]\`

The project name in Godot Project Settings is `casino-table-games`. This is the literal string — do not use a display name with spaces.

### File List

| File | Path | Contents | When Written |
|---|---|---|---|
| Bankroll save | `user://saves/bankroll.json` | Bankroll, loans, session metadata | On every bankroll or loan change |
| Settings | `user://saves/settings.json` | Sound, reduced-motion, window mode | On every settings change |
| Game history | `user://saves/history.json` | Recent hand records | On every hand resolution |

No other save files are created. Game state mid-hand is not persisted for MVP (no crash recovery in Phase 12 scope).

### JSON Schemas

Every JSON file includes a `schema_version` integer field. The current version for all files at project start is `1`. Migration functions increment this field when schema changes occur.

**bankroll.json (schema_version: 1)**

```json
{
  "schema_version": 1,
  "bankroll": 1000,
  "loans": [
    { "principal": 500, "fee": 50 }
  ],
  "total_debt": 500,
  "is_tapped_out": false,
  "starting_bankroll_choice": 1000,
  "is_first_launch": false
}
```

Field rules:
- `bankroll`: integer, minimum 0, maximum unbounded
- `loans`: array of loan objects; empty array when no loans outstanding
- `loans[n].principal`: integer, the original loan amount (not including fee)
- `loans[n].fee`: integer, the flat fee charged on repayment (computed at loan time, stored for display)
- `total_debt`: integer, sum of all `principal` values (pre-computed for display; recalculated on load to guard against corruption)
- `is_tapped_out`: boolean — true only when `bankroll == 0` AND `total_debt >= debt_ceiling`
- `starting_bankroll_choice`: integer — player's choice on first launch; immutable after set until new session reset
- `is_first_launch`: boolean — false after first save file write

**Debt ceiling and loan fee values** are NOT stored in the save file. They are constants defined in `res://shared/config/GameConfig.cs`:

```csharp
public static class GameConfig
{
    public const int DefaultStartingBankroll = 1000;
    public const int DebtCeiling = 3000;          // hard cap on total outstanding loans
    public const int LoanIncrement = 500;          // all loans are this amount
    public const int LoanFlatFee = 50;             // fee charged on repayment
}
```

**settings.json (schema_version: 1)**

```json
{
  "schema_version": 1,
  "sound_enabled": true,
  "reduced_motion_enabled": false,
  "window_mode": "windowed"
}
```

Field rules:
- `window_mode`: string enum, exactly one of `"windowed"` | `"borderless"` | `"fullscreen"`
- All boolean fields default to the values above when the file is absent (first launch)

**history.json (schema_version: 1)**

```json
{
  "schema_version": 1,
  "records": [
    {
      "game": "blackjack",
      "timestamp": "2026-03-29T20:15:00Z",
      "result": "win",
      "amount_wagered": 100,
      "amount_won": 150,
      "bankroll_after": 1150
    }
  ]
}
```

Field rules:
- `records`: array of hand records; newest record appended to end
- Maximum 100 records retained; when limit reached, oldest record is removed before appending
- `game`: string identifier matching the game's directory name (e.g., `"blackjack"`, `"uth"`)
- `result`: string enum, exactly one of `"win"` | `"loss"` | `"push"`
- `amount_wagered`: integer, total chips bet on the hand
- `amount_won`: integer, net dollar gain (0 for loss or push, positive for win — does not include wager returned on push)
- `bankroll_after`: integer, bankroll value after resolution

### PersistenceService

**File:** `res://shared/services/PersistenceService.cs`

Pure C# class — no Godot types except `FileAccess` and `JSON`. Instantiated and held by GlobalState. Not an Autoload on its own.

```csharp
public class PersistenceService
{
    public void SaveAll(BankrollSaveData bankroll, SettingsSaveData settings);
    public void AppendHistoryRecord(HandHistoryRecord record);
    public BankrollSaveData LoadBankroll();     // returns defaults if file absent
    public SettingsSaveData LoadSettings();     // returns defaults if file absent
    public List<HandHistoryRecord> LoadHistory(); // returns empty list if file absent
}
```

All write operations use `FileAccess.WRITE` mode with an explicit `Flush()` call before `Close()`. Never use deferred writes.

### Unavailability Handling

"Unavailable" means the save file is absent, unreadable, or contains invalid JSON.

| Scenario | Handling |
|---|---|
| `bankroll.json` absent (first launch) | Use `GameConfig.DefaultStartingBankroll`, `is_first_launch = true` |
| `bankroll.json` corrupt or unparseable | Log error via `GD.PrintErr`. Reset to defaults. Do NOT crash. |
| `settings.json` absent or corrupt | Use hardcoded defaults: sound on, reduced-motion off, windowed |
| `history.json` absent or corrupt | Use empty records list. Do NOT attempt history recovery. |
| Write fails (disk full, permissions) | Log error via `GD.PrintErr`. Display no error to the player — state remains in memory for the session. |

The player is never shown a system error for persistence failures at MVP. Silently degrading to defaults is the correct behavior. This decision is explicitly not permanent — post-MVP a "cloud save unavailable" or "data reset" notification may be appropriate if distribution expands.

### Migration Strategy

Every file has a `schema_version` integer. On load, `PersistenceService` reads the version before parsing the rest of the object.

**Migration rules:**
- If `schema_version` equals the current version, parse normally.
- If `schema_version` is lower than the current version, run the migration chain: a sequence of `Migrate_v1_to_v2()`, `Migrate_v2_to_v3()` functions applied in order until the current version is reached. Each migration function receives the raw `Godot.Collections.Dictionary` and returns a modified one.
- If `schema_version` is higher than the current version (file is from a future build), log an error and reset to defaults. This prevents silent data corruption from downgrading.
- Migration functions live in `res://shared/services/PersistenceMigrations.cs` as static methods.

At project start there are no migrations — only version 1. Migration infrastructure is stubbed with an empty migration chain on load:

```csharp
private Dictionary MigrateToCurrentVersion(Dictionary raw, int fromVersion)
{
    // No migrations yet. When schema_version 2 is added, add:
    // if (fromVersion < 2) raw = Migrate_v1_to_v2(raw);
    return raw;
}
```

---

## 4. Player Broke Handling

### Exact Implementation

When the player's bankroll reaches zero — either at bet placement time or at hand resolution — the following sequence executes:

**Step 1: Detection**

Detection happens in two places:

1. **At bet validation (before dealing):** When the player tries to place a chip and `GlobalState.Bankroll - chipDenomination < 0`, the chip is rejected with no visual or audio feedback. When the player tries to confirm the deal and `GlobalState.Bankroll == 0`, the Deal button is disabled (per `BankrollService.CanAfford(minimumBet)`).

2. **At hand resolution:** After `GlobalState.ApplyBankrollDelta(-lossAmount)`, if `GlobalState.Bankroll == 0`, GlobalState emits `TappedOut` and sets the `PlayerBroke` phase on the game state machine via the scene script.

**Step 2: Game State Transition**

The active game's state machine transitions to `GamePhase.PlayerBroke`. This is a terminal state from which no game action is valid. The scene script receives `StateChanged` with `next.Phase == GamePhase.PlayerBroke`.

**Step 3: Scene Response**

The scene script immediately calls `SceneManager.GoToCashier()`, which:
- Loads `CashierScreen.tscn` as an overlay (CanvasLayer z-index above everything)
- Populates `CashierScreen` props from GlobalState: `CurrentBankroll`, `OutstandingLoanAmounts`, `TotalDebt`, `DebtCeiling`, `LoanFlatFee`, `IsTappedOut`
- Animates the cashier screen in using `transition_modal_enter` (450ms)
- Blocks all input to the underlying table scene while the cashier is open

**Step 4: CashierScreen Renders State**

The `CashierScreen.tscn` component renders one of three states based on the props it receives:

| State | Condition | Content |
|---|---|---|
| Reload | `CurrentBankroll > 0` or loans available, debt below ceiling | Loan offer with amount and fee, "Take Loan" button |
| Tapped Out | `IsTappedOut == true` | No loan option. "Start New Session" button only. Outstanding debt displayed. |
| Post-loan | After `LoanGranted` signal fired | Updated bankroll display. "Return to Table" button active. |

The "Start New Session" option is shown only when `IsTappedOut == true`. It is not available as a casual exit from the normal cashier state — it is a terminal reset.

**Step 5: Signal Handling**

When CashierScreen emits signals:

- `LoanRequested(amount)` → Scene script calls `GlobalState.GrantLoan(amount)` → GlobalState adds loan, increases bankroll by `amount`, emits `BankrollChanged` and `LoanStateChanged`
- `LoanRepaid(index)` → Scene script calls `GlobalState.RepayLoan(index)` → GlobalState deducts `principal + fee` from bankroll, removes loan from array, emits `BankrollChanged` and `LoanStateChanged`
- `NewSessionRequested()` → Scene script calls `GlobalState.ResetSession()` → GlobalState sets bankroll to `DefaultStartingBankroll`, clears all loans, sets `IsTappedOut = false`, writes `bankroll.json`, emits `BankrollChanged`
- `Dismissed()` → Scene script removes CashierScreen overlay, restores input to table scene, sets game phase back to `Idle`

**Step 6: Table Resumes**

After `Dismissed()` fires (only possible when bankroll > 0), the table scene receives control. The game state machine is in `Idle` phase. The player sees a clean table ready for a new bet. The bankroll display reflects the new balance.

### Where in the State Model

| Element | Location |
|---|---|
| Bankroll integer | `GlobalState.Bankroll` |
| Loan array | `GlobalState.OutstandingLoanAmounts` |
| Tapped-out flag | `GlobalState.IsTappedOut` |
| Broke detection logic | `GlobalState.ApplyBankrollDelta()` and scene bet-validation |
| PlayerBroke game phase | `GamePhase` enum on the game state machine |
| Cashier navigation | `SceneManager.GoToCashier()` |

### Which Components Render the Broke State

| Component | Role |
|---|---|
| `CashierScreen.tscn` | Full-screen overlay that shows loan options or tapped-out state |
| `BankrollDisplay.tscn` | Always visible; shows $0 when broke |
| `ChipTray.tscn` | Receives `AffordableDenominations = []` from scene; all chips dimmed |
| `ActionButton.tscn` (Deal button) | Receives `IsEnabled = false` when bankroll is 0 and no bet is placed |
| Game table scene script | Suppresses all input while CashierScreen is active |

---

## 5. Performance Baseline

### Target Values

| Metric | Target | Notes |
|---|---|---|
| Frame rate | 60 FPS sustained | Minimum during animation-heavy sequences (full deal + chip placement + result) |
| Initial load time | Under 4 seconds from launch to lobby interactive | Cold start on minimum-spec hardware (Intel HD Graphics 530, i7-6700, 16GB RAM) |
| Export binary + PCK size | Under 150 MB combined | Single-folder distribution zip. Excludes OS-level .NET runtime which is bundled by Godot's export template |
| Animation frame budget | 16.7ms per frame (60 FPS) | Per-frame budget allocation: 5ms logic + 3ms physics/input + 8.7ms render + 0ms headroom initially, adjust after profiling |

### Measurement Method for Each

**Frame rate — Godot built-in Performance monitor:**

During Phase 13 (Blackjack Animations) and Phase 15 (QA), the developer opens the Godot debugger (Debug > Debugger > Monitor) and records `Time/FPS` during the following scenarios:
1. Full deal animation (4 cards simultaneously with 90ms stagger, all arcs + settles)
2. Chip win collection animation + win bloom + win numeral float simultaneously
3. Split hand deal (6+ cards on screen)

The minimum observed FPS across all three scenarios must not fall below 60. Test is run on the minimum-spec machine (Intel HD 530).

Additional in-game FPS display: in debug builds only, the game renders `Engine.GetFramesPerSecond()` as an overlay label in the top-right corner. This label is not compiled into release builds (`#if DEBUG` conditional).

**Initial load time — manual stopwatch + Godot profiler:**

Measured from OS process launch to the first frame where the lobby scene is interactive (all nodes ready, first `_Ready()` call on the lobby root complete). Measurement procedure:
1. Build a release export (not a debug export)
2. Launch the binary from command line
3. Use Godot's built-in profiler (Debug > Profiler) to measure `_Ready()` completion on the lobby scene root node
4. Record wall-clock time as backup using a stopwatch

Acceptance criterion: lobby interactive within 4 seconds on a cold start (no OS file cache). Test is run on the minimum-spec machine. The primary cause of slow load is expected to be font embedding and texture atlas import — if the target is missed, address those first.

**Binary + PCK size — file system measurement:**

After each Godot export:
1. Export to `export/windows/` and `export/linux/`
2. Run `du -sh export/windows/` and `du -sh export/linux/`
3. Record the combined size of all files in the export directory

This is checked at the end of Phase 9 (scaffold) to establish a baseline, and again at Phase 13 and Phase 16 (adversarial review). If the 150 MB budget is approached, the primary targets are:
- Embedded fonts (Noto Serif and Manrope — confirm only required weights are exported, not all 9 axes)
- Texture atlases (confirm PNG compression is applied via Godot importer settings)
- Audio files (confirm `.ogg` compression, not raw `.wav`, for all sounds except ultra-short SFX)

---

## 6. Folder Structure

```
res://
├── project.godot                    # Godot project settings — Autoloads registered here
├── export_presets.cfg               # Windows + Linux export configs — committed to git
│
├── shared/                          # Everything usable by more than one game
│   ├── autoloads/
│   │   └── GlobalState.cs           # Bankroll, settings, session data — registered as Autoload
│   │
│   ├── components/                  # Shared scenes — extracted at Extraction Gate
│   │   ├── CardFace.tscn
│   │   ├── CardFace.cs
│   │   ├── CardBack.tscn
│   │   ├── CardBack.cs
│   │   ├── Chip.tscn
│   │   ├── Chip.cs
│   │   ├── ChipStack.tscn
│   │   ├── ChipStack.cs
│   │   ├── ChipTray.tscn
│   │   ├── ChipTray.cs
│   │   ├── BetSpot.tscn
│   │   ├── BetSpot.cs
│   │   ├── ActionButton.tscn
│   │   ├── ActionButton.cs
│   │   ├── ResultBanner.tscn
│   │   ├── ResultBanner.cs
│   │   ├── RulesPanel.tscn
│   │   ├── RulesPanel.cs
│   │   ├── CashierScreen.tscn
│   │   ├── CashierScreen.cs
│   │   ├── SettingsPanel.tscn
│   │   ├── SettingsPanel.cs
│   │   ├── BankrollDisplay.tscn
│   │   └── BankrollDisplay.cs
│   │
│   ├── logic/                       # Pure C# — no Godot types — NUnit tests cover these
│   │   ├── Card.cs                  # Card value object + Rank enum
│   │   ├── Deck.cs                  # 52-card deck, shuffle, deal
│   │   └── HandRank.cs              # Enum: HighCard through RoyalFlush
│   │
│   ├── services/                    # Pure C# service layer
│   │   ├── PersistenceService.cs    # Read/write JSON via FileAccess
│   │   ├── PersistenceMigrations.cs # Migration chain — currently empty, infrastructure only
│   │   └── BankrollService.cs       # Loan math, debt ceiling checks, broke detection
│   │
│   ├── config/
│   │   └── GameConfig.cs            # Constants: DefaultStartingBankroll, DebtCeiling, LoanIncrement, LoanFlatFee
│   │
│   ├── utils/
│   │   └── SceneManager.cs          # Scene transition helpers — GoToCashier(), GoToLobby(), LoadTable()
│   │
│   └── theme/
│       └── GameTheme.tres           # Godot Theme resource — font sizes, colors, corner radius from visual-language.md
│
├── games/
│   ├── blackjack/                   # All Blackjack scenes, scripts, and logic
│   │   ├── logic/                   # Pure C# — NUnit tests cover these
│   │   │   ├── BlackjackGame.cs     # State machine + coordinator
│   │   │   ├── BlackjackHand.cs     # Hand representation, value computation
│   │   │   ├── BlackjackDeck.cs     # Shoe management, shuffle trigger
│   │   │   ├── BlackjackBetResolver.cs  # Win/loss/push + payout calculation
│   │   │   └── BlackjackRules.cs    # Action availability: CanHit, CanSplit, etc.
│   │   ├── BlackjackTable.tscn      # Root table scene
│   │   ├── BlackjackTable.cs        # Scene script — thin wrapper
│   │   ├── PlayerHandZone.tscn
│   │   ├── PlayerHandZone.cs
│   │   ├── DealerHandZone.tscn
│   │   ├── DealerHandZone.cs
│   │   ├── BlackjackActionPanel.tscn
│   │   ├── BlackjackActionPanel.cs
│   │   ├── InsuranceBetPrompt.tscn
│   │   ├── InsuranceBetPrompt.cs
│   │   ├── BlackjackBetZone.tscn
│   │   ├── BlackjackBetZone.cs
│   │   └── designs/                 # Phase 8 deliverables — design references, not runtime assets
│   │
│   └── uth/                         # Ultimate Texas Hold'Em (Phase structure mirrors blackjack/)
│       ├── logic/
│       │   ├── UTHGame.cs
│       │   ├── UTHHand.cs
│       │   ├── UTHHandEvaluator.cs
│       │   ├── UTHBetResolver.cs
│       │   └── UTHRules.cs
│       ├── UTHTable.tscn
│       ├── UTHTable.cs
│       └── ...
│
├── lobby/                           # Game selection / table tier selection
│   ├── LobbyScene.tscn
│   └── LobbyScene.cs
│
├── assets/                          # All imported assets — no runtime code
│   ├── fonts/
│   │   ├── NotoSerif-Regular.ttf    # Embedded font — required weights only
│   │   ├── NotoSerif-Medium.ttf
│   │   ├── NotoSerif-SemiBold.ttf
│   │   ├── NotoSerif-Bold.ttf
│   │   ├── Manrope-Regular.ttf
│   │   ├── Manrope-Medium.ttf
│   │   ├── Manrope-SemiBold.ttf
│   │   └── Manrope-Bold.ttf
│   ├── icons/                       # SVG icon sources — imported as Godot ImageTexture
│   │   └── *.svg
│   ├── cards/                       # Adrian Kennard CC0 SVG deck — rasterized PNG atlases
│   │   ├── card_faces.png           # Atlas: all 52 face-up cards
│   │   ├── card_faces.png.import
│   │   └── card_back_chevron.png    # Single card back (Option B locked)
│   ├── textures/
│   │   ├── felt_fiber_grain.png     # 512x512 tileable — Option B directional sheen
│   │   ├── felt_fiber_grain.png.import
│   │   └── rail_bevel.png           # 12px-wide pre-baked bevel strip
│   └── audio/
│       ├── sfx/
│       │   ├── chip_clink_01.ogg    # Pitch-randomized at playback (±8%)
│       │   ├── chip_clink_02.ogg
│       │   ├── chip_clink_03.ogg
│       │   ├── card_slide.ogg
│       │   ├── win_stack.ogg
│       │   ├── loss_thud.ogg
│       │   ├── loan_taken.ogg
│       │   └── loan_repaid.ogg
│       └── music/                   # Post-MVP — ambient casino loop placeholder
│
├── tests/                           # NUnit test project — references logic/ only, no .tscn files
│   ├── TableGames.Tests.csproj
│   ├── shared/
│   │   ├── CardTests.cs
│   │   └── DeckTests.cs
│   └── blackjack/
│       ├── BlackjackHandTests.cs
│       ├── BlackjackDeckTests.cs
│       ├── BlackjackBetResolverTests.cs
│       ├── BlackjackRulesTests.cs
│       └── BlackjackGameTests.cs    # State machine transitions
│
└── export/                          # Export output — gitignored
    ├── windows/
    └── linux/
```

### Rationale for Top-Level Directory Choices

**`shared/`** — separates all cross-game concerns from game-specific code. Autoloads, shared components, shared logic, and persistence are all in here. Nothing in `games/` may import from another game's directory.

**`games/`** — one subdirectory per game, self-contained. A developer working on Blackjack never needs to look outside `games/blackjack/` and `shared/`. This boundary is enforced by the component boundary rules in `component-boundaries.md`.

**`lobby/`** — the lobby is not a game but requires its own scene and layout distinct from any game's table. Placing it at the top level alongside `games/` signals that it is a peer scene, not a game.

**`assets/`** — all imported files (fonts, textures, audio, SVGs) in one directory. No assets live inside `games/` or `shared/` — the asset directory is clean of code. This matters for the binary size measurement and for the Godot exporter's asset compression settings, which are applied per import directory.

**`tests/`** — the NUnit test project lives in the Godot `res://` tree for project organization, but references only pure C# logic files. It is excluded from the Godot export via export presets filter (`!tests/**`).

**`export/`** — gitignored export output. Never committed.

---

## 7. Viewport Scaling Strategy

This section was deferred from Phase 3 (visual-language.md noted it as a Phase 5 decision).

**Approach:** Fixed 1920x1080 design resolution with Godot's stretch mode set to `canvas_items`, scale mode set to `expand`.

Configuration in `project.godot`:

```
[display]
window/size/viewport_width = 1920
window/size/viewport_height = 1080
window/stretch/mode = "canvas_items"
window/stretch/aspect = "expand"
```

**Behavior:**
- At 1920x1080, pixels are 1:1 — all visual-language.md values render exactly as specified.
- At higher resolutions (1440p, 4K), Godot scales all canvas items proportionally. Pixel values in the visual language spec scale up. The result is a larger, sharper game — no UI elements are cut off.
- At lower resolutions, the viewport shrinks the content. The minimum-spec machine (Intel HD 530) will typically run at 1920x1080 or lower — test at 1280x720 to confirm no critical UI is clipped.
- Windowed mode: the game window defaults to 1280x720 on first launch to fit smaller displays without cropping. This is separate from the internal design resolution.

**Why not `viewport` stretch mode:** `viewport` mode renders at exactly 1920x1080 and then scales the entire image up as a texture. This produces blurry text and art at larger display sizes. `canvas_items` mode preserves crispness because Godot re-renders each element at the physical pixel density.

**Font rendering:** Both Noto Serif and Manrope are embedded as `.ttf` vector fonts. At any scale above 1:1, Godot re-renders them at the higher density — no blur. This is the primary reason to use embedded `.ttf` rather than pre-rasterized fonts.

---

## 8. CanvasLayer Stack

Godot's 2D scene tree is drawn in z-order. For this project, the following CanvasLayer stack is used consistently across all game scenes:

| Layer | CanvasLayer Index | Contents |
|---|---|---|
| Background | 0 | Solid `color_background` fill |
| Table felt + rail | 1 | Table surface, fiber grain shader, rail bevel sprite |
| Felt markings | 2 | Printed table text, betting zone arcs |
| Cards + chips | 3 | All CardFace, CardBack, Chip, ChipStack, BetSpot nodes |
| UI chrome | 4 | BankrollDisplay, ChipTray, ActionPanel, BetTotal |
| Overlays | 5 | RulesPanel, SettingsPanel (enter/exit animated) |
| Full-screen modals | 6 | CashierScreen |
| Win effects | 7 | Win bloom (screen-edge radial), win numeral float |
| Debug | 100 | FPS counter — debug builds only |

CanvasLayer nodes are instantiated in the table scene root. Overlay and modal scenes (RulesPanel, CashierScreen) are added as children of their target layer node when triggered, then removed on dismiss.

---

## 9. Audio Bus Layout

Defined in `project.godot` Audio Bus settings and saved to `default_bus_layout.tres`:

```
Master
├── Music          (ambient — post-MVP, bus exists now)
└── SFX
    ├── Chips      (chip_clink — pitch randomization applied here)
    ├── Cards      (card_slide)
    └── UI         (win_stack, loss_thud, loan_taken, loan_repaid)
```

**Volume control:** `SettingsPanel` toggles `AudioServer.SetBusMute(busIndex, !enabled)` on the Master bus for the sound toggle. Individual bus volumes are not exposed to the player at MVP — the toggle is all-or-nothing. Per-bus tuning is done in the Godot Audio Bus editor by the developer, not at runtime.

**Positional audio:** Chip placement arc animations use `AudioStreamPlayer2D` on the Chip node. The 2D position tracks the chip's position during the arc. All other SFX use `AudioStreamPlayer` (non-positional) in the table scene root.

**Pitch randomization for chip clinks:** Three chip clink samples (`chip_clink_01.ogg`, `chip_clink_02.ogg`, `chip_clink_03.ogg`) are played randomly by the table scene script. No single sample plays twice consecutively. Godot's `AudioStreamPlayer.pitch_scale` applies ±8% pitch variation: `pitchScale = 0.92f + GD.Randf() * 0.16f`.

---

**Technical Architecture Author:** Phase 5 Agent
**Document Date:** 2026-03-29
**Governs:** All Godot 4 project structure, data flow, persistence, and state management decisions
**Amendment Process:** Changes require updating this file with version and date. The gate question is: can a developer build the entire system from this document without making architectural decisions themselves?
