using Godot;

/// <summary>
/// Composes a BetSpot (shared) for the main bet with the Blackjack-specific
/// circle arc felt marking. Adds the double-down chip placement position marker.
///
/// Spec: component-boundaries.md Section 2 — BlackjackBetZone.tscn.
/// Annotations: annotations.md Sections 3, 6.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class BlackjackBetZone : Control
{
    // -------------------------------------------------------------------------
    // Signals — bubbled from child BetSpot
    // -------------------------------------------------------------------------

    [Signal] public delegate void MainBetClickedEventHandler();

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    /// <summary>Chip denominations for the main bet stack.</summary>
    [Export] public int[] MainBetChips { get; set; } = System.Array.Empty<int>();

    /// <summary>True = accepting bet input (Betting phase). False = locked.</summary>
    [Export] public bool IsMainBetActive { get; set; } = false;

    /// <summary>True = show the double-down bet spot ghost zone marker (CanDouble = true).</summary>
    [Export] public bool ShowDoubleDownZone { get; set; } = false;

    /// <summary>Chip denominations for the double-down bet stack (after double confirmed).</summary>
    [Export] public int[] DoubleDownChips { get; set; } = System.Array.Empty<int>();

    // -------------------------------------------------------------------------
    // Child references
    // -------------------------------------------------------------------------

    private BetSpot? _mainBetSpot;
    private Panel?   _doubleDownZone;
    private BetSpot? _doubleDownBetSpot;

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
        // Main bet spot — centered at (960, 700)
        _mainBetSpot = new BetSpot();
        _mainBetSpot.Name = "MainBetSpot";
        _mainBetSpot.Label = "";
        _mainBetSpot.ShowLabel = false;
        _mainBetSpot.Size = VisualLanguage.SizeMainBetSpot;
        _mainBetSpot.Position = VisualLanguage.PosMainBetSpotTopLeft;
        _mainBetSpot.ChipDenominations = MainBetChips;
        _mainBetSpot.BetSpotClicked += () => EmitSignal(SignalName.MainBetClicked);
        AddChild(_mainBetSpot);

        // Betting arc marking — semicircle arc on felt
        // Rendered as a circular label/panel element centered at (960, 700)
        var arcMarking = new Panel();
        arcMarking.Name = "ArcMarking";
        arcMarking.Size = VisualLanguage.SizeMainBetSpot;
        arcMarking.Position = VisualLanguage.PosMainBetSpotTopLeft;
        arcMarking.MouseFilter = Control.MouseFilterEnum.Ignore;
        var arcStyle = new StyleBoxFlat();
        arcStyle.BgColor = Colors.Transparent;
        arcStyle.BorderColor = VisualLanguage.ColorFeltMarking;
        arcStyle.BorderWidthTop    = 1;
        arcStyle.BorderWidthBottom = 1;
        arcStyle.BorderWidthLeft   = 1;
        arcStyle.BorderWidthRight  = 1;
        arcStyle.CornerRadiusTopLeft    = (int)(VisualLanguage.SizeMainBetSpot.X / 2);
        arcStyle.CornerRadiusTopRight   = (int)(VisualLanguage.SizeMainBetSpot.X / 2);
        arcStyle.CornerRadiusBottomLeft  = (int)(VisualLanguage.SizeMainBetSpot.X / 2);
        arcStyle.CornerRadiusBottomRight = (int)(VisualLanguage.SizeMainBetSpot.X / 2);
        arcMarking.AddThemeStyleboxOverride("panel", arcStyle);
        AddChild(arcMarking);

        // Double-down bet spot ghost zone — 124px right of main bet center
        // Visible as an empty ghost when CanDouble = true
        _doubleDownZone = new Panel();
        _doubleDownZone.Name = "DoubleDownZone";
        _doubleDownZone.Size = VisualLanguage.SizeMainBetSpot;
        _doubleDownZone.Position = VisualLanguage.PosDoubleDownBetSpotTopLeft;
        _doubleDownZone.Visible = false;
        _doubleDownZone.MouseFilter = Control.MouseFilterEnum.Ignore;

        var ddStyle = new StyleBoxFlat();
        ddStyle.BgColor = Colors.Transparent;
        ddStyle.BorderColor = VisualLanguage.ColorGhostBorder;
        ddStyle.BorderWidthTop    = 1;
        ddStyle.BorderWidthBottom = 1;
        ddStyle.BorderWidthLeft   = 1;
        ddStyle.BorderWidthRight  = 1;
        ddStyle.CornerRadiusTopLeft    = VisualLanguage.CornerRadius;
        ddStyle.CornerRadiusTopRight   = VisualLanguage.CornerRadius;
        ddStyle.CornerRadiusBottomLeft  = VisualLanguage.CornerRadius;
        ddStyle.CornerRadiusBottomRight = VisualLanguage.CornerRadius;
        _doubleDownZone.AddThemeStyleboxOverride("panel", ddStyle);
        AddChild(_doubleDownZone);

        // Double-down chip bet spot (when chips have been placed)
        _doubleDownBetSpot = new BetSpot();
        _doubleDownBetSpot.Name = "DoubleDownBetSpot";
        _doubleDownBetSpot.ShowLabel = false;
        _doubleDownBetSpot.IsActive = false;
        _doubleDownBetSpot.Size = VisualLanguage.SizeMainBetSpot;
        _doubleDownBetSpot.Position = VisualLanguage.PosDoubleDownBetSpotTopLeft;
        _doubleDownBetSpot.ChipDenominations = DoubleDownChips;
        _doubleDownBetSpot.Visible = false;
        AddChild(_doubleDownBetSpot);
    }

    // -------------------------------------------------------------------------
    // State rendering
    // -------------------------------------------------------------------------

    private void _ApplyState()
    {
        if (_mainBetSpot != null)
        {
            _mainBetSpot.IsActive = IsMainBetActive;
            _mainBetSpot.ChipDenominations = MainBetChips;
        }

        if (_doubleDownZone != null)
            _doubleDownZone.Visible = ShowDoubleDownZone && DoubleDownChips.Length == 0;

        if (_doubleDownBetSpot != null)
        {
            _doubleDownBetSpot.Visible = DoubleDownChips.Length > 0;
            _doubleDownBetSpot.ChipDenominations = DoubleDownChips;
        }
    }
}
