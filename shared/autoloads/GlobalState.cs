using Godot;

/// <summary>
/// GlobalState autoload singleton. Single source of truth for bankroll, settings,
/// and session metadata. Available from any script via GetNode&lt;GlobalState&gt;("/root/GlobalState").
///
/// Mutation rules:
///   - Bankroll is mutated only through ApplyBankrollDelta(int delta).
///   - Loans are mutated only through GrantLoan(int amount) and RepayLoan(int index).
///   - Settings are mutated only through SetSoundEnabled(bool) and SetReducedMotionEnabled(bool).
///   - After every mutation, GlobalState calls PersistenceService.SaveAll() synchronously.
///   - GlobalState never calls a method on a scene node — it emits signals and returns values.
/// </summary>
public partial class GlobalState : Node
{
    // Bankroll — single source of truth across all games
    public int Bankroll { get; private set; }
    public int[] OutstandingLoanAmounts { get; private set; }
    public int TotalDebt { get; private set; }
    public bool IsTappedOut { get; private set; }

    // Settings — persisted, loaded at startup
    public bool SoundEnabled { get; private set; }
    public bool ReducedMotionEnabled { get; private set; }

    // Display state — persisted, loaded at startup
    public Window.ModeEnum WindowMode { get; private set; }

    // Session metadata — not persisted mid-session
    public bool IsFirstLaunch { get; private set; }
    public int StartingBankrollChoice { get; private set; }

    // Signals
    [Signal] public delegate void BankrollChangedEventHandler(int newAmount);
    [Signal] public delegate void LoanStateChangedEventHandler();
    [Signal] public delegate void TappedOutEventHandler();
    [Signal] public delegate void SettingsChangedEventHandler();

    public GlobalState()
    {
        Bankroll = 1000; // GameConfig.DefaultStartingBankroll
        OutstandingLoanAmounts = System.Array.Empty<int>();
        TotalDebt = 0;
        IsTappedOut = false;
        SoundEnabled = true;
        ReducedMotionEnabled = false;
        WindowMode = Window.ModeEnum.Windowed;
        IsFirstLaunch = true;
        StartingBankrollChoice = 1000; // GameConfig.DefaultStartingBankroll
    }
}
