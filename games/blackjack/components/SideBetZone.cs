using Godot;

/// <summary>
/// Composes two BetSpot instances for TriLux and LuckyLucky side bets.
/// Positions them at their spec coordinates on the felt.
///
/// Spec: component-boundaries.md Section 2 — SideBetZone.tscn.
/// Annotations: annotations.md Sections 4, 5.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class SideBetZone : Control
{
    // -------------------------------------------------------------------------
    // Signals
    // -------------------------------------------------------------------------

    [Signal] public delegate void TriLuxBetClickedEventHandler();
    [Signal] public delegate void LuckyLuckyBetClickedEventHandler();

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    [Export] public int[]  TriLuxChips      { get; set; } = System.Array.Empty<int>();
    [Export] public int[]  LuckyLuckyChips  { get; set; } = System.Array.Empty<int>();
    [Export] public bool   IsTriLuxActive   { get; set; } = false;
    [Export] public bool   IsLuckyLuckyActive { get; set; } = false;

    // -------------------------------------------------------------------------
    // Child references
    // -------------------------------------------------------------------------

    private BetSpot? _triLux;
    private BetSpot? _luckyLucky;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        _BuildZone();
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
    // Construction
    // -------------------------------------------------------------------------

    private void _BuildZone()
    {
        // TriLux BetSpot
        _triLux = new BetSpot();
        _triLux.Name = "TriLuxBetSpot";
        _triLux.Label = "TRILUX";
        _triLux.ShowLabel = true;
        _triLux.Size = VisualLanguage.SizeTriLuxBetSpot;
        _triLux.Position = VisualLanguage.PosTriLuxBetSpotTopLeft;
        _triLux.ChipDenominations = TriLuxChips;
        _triLux.BetSpotClicked += () => EmitSignal(SignalName.TriLuxBetClicked);
        AddChild(_triLux);

        // LuckyLucky BetSpot
        _luckyLucky = new BetSpot();
        _luckyLucky.Name = "LuckyLuckyBetSpot";
        _luckyLucky.Label = "LUCKY LUCKY";
        _luckyLucky.ShowLabel = true;
        _luckyLucky.Size = VisualLanguage.SizeLuckyLuckyBetSpot;
        _luckyLucky.Position = VisualLanguage.PosLuckyLuckyBetSpotTopLeft;
        _luckyLucky.ChipDenominations = LuckyLuckyChips;
        _luckyLucky.BetSpotClicked += () => EmitSignal(SignalName.LuckyLuckyBetClicked);
        AddChild(_luckyLucky);
    }

    // -------------------------------------------------------------------------
    // State rendering
    // -------------------------------------------------------------------------

    private void _ApplyState()
    {
        if (_triLux != null)
        {
            _triLux.IsActive = IsTriLuxActive;
            _triLux.ChipDenominations = TriLuxChips;
        }

        if (_luckyLucky != null)
        {
            _luckyLucky.IsActive = IsLuckyLuckyActive;
            _luckyLucky.ChipDenominations = LuckyLuckyChips;
        }
    }
}
