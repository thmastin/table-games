using Godot;

/// <summary>
/// Renders and manages the set of action buttons for a Blackjack hand:
/// Surrender, Split, Hit, Stand, Double (top to bottom in right chrome panel).
/// Also houses Deal and Clear Bet buttons used during Betting/Idle phases.
///
/// Shows/hides button groups based on the current phase.
/// Individual button enabled/disabled state set via ActionAvailability props.
///
/// Spec: component-boundaries.md Section 2 — BlackjackActionPanel.tscn.
/// Annotations: annotations.md Sections 7-13.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class BlackjackActionBar : Control
{
    // -------------------------------------------------------------------------
    // Signals
    // -------------------------------------------------------------------------

    [Signal] public delegate void HitPressedEventHandler();
    [Signal] public delegate void StandPressedEventHandler();
    [Signal] public delegate void DoublePressedEventHandler();
    [Signal] public delegate void SplitPressedEventHandler();
    [Signal] public delegate void SurrenderPressedEventHandler();
    [Signal] public delegate void DealPressedEventHandler();
    [Signal] public delegate void ClearBetPressedEventHandler();

    // -------------------------------------------------------------------------
    // Props — ActionAvailability
    // -------------------------------------------------------------------------

    [Export] public bool CanHit       { get; set; } = false;
    [Export] public bool CanStand     { get; set; } = false;
    [Export] public bool CanDouble    { get; set; } = false;
    [Export] public bool CanSplit     { get; set; } = false;
    [Export] public bool CanSurrender { get; set; } = false;
    [Export] public bool CanDeal      { get; set; } = false;
    [Export] public bool CanClearBet  { get; set; } = false;
    [Export] public bool ShowGameActions { get; set; } = false;
    [Export] public bool ShowBettingActions { get; set; } = true;

    // -------------------------------------------------------------------------
    // Child button references
    // -------------------------------------------------------------------------

    private ActionButton? _hitBtn;
    private ActionButton? _standBtn;
    private ActionButton? _doubleBtn;
    private ActionButton? _splitBtn;
    private ActionButton? _surrenderBtn;
    private ActionButton? _dealBtn;
    private ActionButton? _clearBtn;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        _BuildButtons();
        _ApplyState();
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public void Refresh()
    {
        _ApplyState();
    }

    // -------------------------------------------------------------------------
    // Button construction
    // -------------------------------------------------------------------------

    private void _BuildButtons()
    {
        // Game action buttons (PlayerTurn phase) — order: Surrender, Split, Hit, Stand, Double
        // Icon assets added in Phase 14 polish
        _surrenderBtn = _MakeButton("SURRENDER", VisualLanguage.PosSurrenderButton,
            VisualLanguage.SizeActionButton, false, "res://assets/icons/surrender.svg");
        _surrenderBtn.ActionPressed += () => EmitSignal(SignalName.SurrenderPressed);

        _splitBtn = _MakeButton("SPLIT", VisualLanguage.PosSplitButton,
            VisualLanguage.SizeActionButton, false, "res://assets/icons/split.svg");
        _splitBtn.ActionPressed += () => EmitSignal(SignalName.SplitPressed);

        _hitBtn = _MakeButton("HIT", VisualLanguage.PosHitButton,
            VisualLanguage.SizeActionButton, false, "res://assets/icons/hit.svg");
        _hitBtn.ActionPressed += () => EmitSignal(SignalName.HitPressed);

        _standBtn = _MakeButton("STAND", VisualLanguage.PosStandButton,
            VisualLanguage.SizeActionButton, false, "res://assets/icons/stand.svg");
        _standBtn.ActionPressed += () => EmitSignal(SignalName.StandPressed);

        _doubleBtn = _MakeButton("DOUBLE", VisualLanguage.PosDoubleButton,
            VisualLanguage.SizeActionButton, false, "res://assets/icons/double.svg");
        _doubleBtn.ActionPressed += () => EmitSignal(SignalName.DoublePressed);

        // Betting phase buttons — Deal (gold accent) and Clear Bet
        // Icon assets added in Phase 14 polish
        _dealBtn = _MakeButton("DEAL", VisualLanguage.PosDealButton,
            VisualLanguage.SizeActionButton, true, "res://assets/icons/deal.svg");
        _dealBtn.ActionPressed += () => EmitSignal(SignalName.DealPressed);

        _clearBtn = _MakeButton("CLEAR", VisualLanguage.PosClearBetButton,
            VisualLanguage.SizeClearBetButton, false, "res://assets/icons/clear.svg");
        _clearBtn.ActionPressed += () => EmitSignal(SignalName.ClearBetPressed);
    }

    private ActionButton _MakeButton(string label, Vector2 position, Vector2 size, bool goldAccent,
        string iconPath = "")
    {
        var btn = new ActionButton();
        btn.Name = $"Btn_{label}";
        btn.Label = label;
        btn.IsGoldAccent = goldAccent;
        btn.IsEnabled = false;
        btn.IconPath = iconPath; // Icon assets added in Phase 14 polish
        btn.Position = position;
        btn.Size = size;
        btn.CustomMinimumSize = size;
        AddChild(btn);
        return btn;
    }

    // -------------------------------------------------------------------------
    // State rendering
    // -------------------------------------------------------------------------

    private void _ApplyState()
    {
        // Game action buttons — visible only during PlayerTurn
        bool showGame = ShowGameActions;

        _surrenderBtn!.Visible = showGame;
        _splitBtn!.Visible = showGame;
        _hitBtn!.Visible = showGame;
        _standBtn!.Visible = showGame;
        _doubleBtn!.Visible = showGame;

        if (showGame)
        {
            _surrenderBtn.IsEnabled = CanSurrender;
            _splitBtn.IsEnabled     = CanSplit;
            _hitBtn.IsEnabled       = CanHit;
            _standBtn.IsEnabled     = CanStand;
            _doubleBtn.IsEnabled    = CanDouble;
        }

        // Betting buttons — visible during Idle and Betting phases
        bool showBet = ShowBettingActions;
        _dealBtn!.Visible  = showBet;
        _clearBtn!.Visible = showBet;

        if (showBet)
        {
            _dealBtn.IsEnabled  = CanDeal;
            _clearBtn.IsEnabled = CanClearBet;
        }
    }
}
