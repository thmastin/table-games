using Godot;

/// <summary>
/// Renders a labeled betting zone on the felt. Contains a ChipStack child.
/// Displays the printed felt marking for the bet zone.
/// Communicates when clicked so the parent scene can place a chip.
/// Does not know the bet's meaning or how it resolves.
///
/// Spec: component-boundaries.md Section 1 — BetSpot.tscn.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class BetSpot : Control
{
    // -------------------------------------------------------------------------
    // Signal
    // -------------------------------------------------------------------------

    [Signal] public delegate void BetSpotClickedEventHandler();

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    /// <summary>Felt marking text (e.g., "ANTE", "BLIND", "BET"). Noto Serif, color_felt_marking.</summary>
    [Export] public string Label { get; set; } = "";

    /// <summary>Chip denominations passed through to internal ChipStack.</summary>
    [Export] public int[] ChipDenominations { get; set; } = System.Array.Empty<int>();

    /// <summary>True = accepts chip placement input; false = dimmed, non-interactive.</summary>
    [Export] public bool IsActive { get; set; } = false;

    /// <summary>True = render felt marking label; false = no label (implied zones).</summary>
    [Export] public bool ShowLabel { get; set; } = true;

    // -------------------------------------------------------------------------
    // Child node references
    // -------------------------------------------------------------------------

    private Label? _feltLabel;
    private ChipStack? _chipStack;
    private Panel? _ghostBorder;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        _BuildNodes();
        _ApplyState();
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /// <summary>Update active state and re-render.</summary>
    public void SetActive(bool active)
    {
        IsActive = active;
        _ApplyState();
    }

    /// <summary>Set chip stack denominations and re-render.</summary>
    public void SetChips(int[] denominations)
    {
        ChipDenominations = denominations;
        if (_chipStack != null)
            _chipStack.ChipDenominations = denominations;
    }

    // -------------------------------------------------------------------------
    // Input handling
    // -------------------------------------------------------------------------

    public override void _GuiInput(InputEvent @event)
    {
        if (!IsActive) return;
        if (@event is InputEventMouseButton mb && mb.Pressed && mb.ButtonIndex == MouseButton.Left)
            EmitSignal(SignalName.BetSpotClicked);
    }

    // -------------------------------------------------------------------------
    // Node construction
    // -------------------------------------------------------------------------

    private void _BuildNodes()
    {
        // Ghost border overlay (shows when active)
        _ghostBorder = new Panel();
        _ghostBorder.Name = "GhostBorder";
        _ghostBorder.Size = Size;
        _ghostBorder.Position = Vector2.Zero;
        _ghostBorder.MouseFilter = MouseFilterEnum.Ignore;

        var ghostStyle = new StyleBoxFlat();
        ghostStyle.BgColor = Colors.Transparent;
        ghostStyle.BorderColor = VisualLanguage.ColorGhostBorder;
        ghostStyle.BorderWidthTop    = 1;
        ghostStyle.BorderWidthBottom = 1;
        ghostStyle.BorderWidthLeft   = 1;
        ghostStyle.BorderWidthRight  = 1;
        ghostStyle.CornerRadiusTopLeft    = VisualLanguage.CornerRadius;
        ghostStyle.CornerRadiusTopRight   = VisualLanguage.CornerRadius;
        ghostStyle.CornerRadiusBottomLeft  = VisualLanguage.CornerRadius;
        ghostStyle.CornerRadiusBottomRight = VisualLanguage.CornerRadius;
        _ghostBorder.AddThemeStyleboxOverride("panel", ghostStyle);
        AddChild(_ghostBorder);

        // Felt label — Noto Serif text_xl, color_felt_marking
        _feltLabel = new Label();
        _feltLabel.Name = "FeltLabel";
        _feltLabel.Text = Label;
        _feltLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextXl);
        _feltLabel.AddThemeColorOverride("font_color", VisualLanguage.ColorFeltMarking);
        _feltLabel.HorizontalAlignment = HorizontalAlignment.Center;
        _feltLabel.VerticalAlignment = VerticalAlignment.Center;
        _feltLabel.Size = Size;
        _feltLabel.Position = Vector2.Zero;
        _feltLabel.MouseFilter = MouseFilterEnum.Ignore;
        AddChild(_feltLabel);

        // ChipStack — chip denominations rendered inside the zone
        _chipStack = new ChipStack();
        _chipStack.Name = "ChipStack";
        _chipStack.ChipDenominations = ChipDenominations;
        // Center the chip stack within the zone
        var chipOffset = new Vector2(
            (Size.X - VisualLanguage.ChipDiameterStandard) / 2f,
            (Size.Y - VisualLanguage.ChipDiameterStandard) / 2f
        );
        _chipStack.Position = chipOffset;
        _chipStack.MouseFilter = MouseFilterEnum.Ignore;
        AddChild(_chipStack);
    }

    // -------------------------------------------------------------------------
    // State rendering
    // -------------------------------------------------------------------------

    private void _ApplyState()
    {
        if (_feltLabel != null)
        {
            _feltLabel.Visible = ShowLabel;
            _feltLabel.Text = Label;
        }

        if (_ghostBorder != null)
            _ghostBorder.Visible = IsActive;

        // Dim the whole zone when inactive
        Modulate = IsActive
            ? Colors.White
            : new Color(1, 1, 1, VisualLanguage.OpacityDisabledSecondary);

        MouseFilter = IsActive ? MouseFilterEnum.Stop : MouseFilterEnum.Ignore;
    }
}
