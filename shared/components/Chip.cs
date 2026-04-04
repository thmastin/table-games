using Godot;

/// <summary>
/// Renders a single chip as a colored circle. Handles selected glow state.
/// Does not know what bet or tray it belongs to.
///
/// Spec: component-boundaries.md Section 1 — Chip.tscn [shared].
/// Annotations: annotations.md Section 2.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class Chip : Control
{
    // -------------------------------------------------------------------------
    // Signal
    // -------------------------------------------------------------------------

    [Signal] public delegate void ChipClickedEventHandler(int denomination);

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    /// <summary>Denomination determines chip color from VisualLanguage chip color constants.</summary>
    [Export] public int Denomination { get; set; } = 1;

    /// <summary>True = show selection glow ring (8px radius, opacity_chip_hover_glow opacity).</summary>
    [Export] public bool IsSelected { get; set; } = false;

    /// <summary>True = tray-size rendering (44px diameter). False = standard (52px diameter).</summary>
    [Export] public bool IsTraySize { get; set; } = false;

    // -------------------------------------------------------------------------
    // Internal state
    // -------------------------------------------------------------------------

    private bool _isHovered = false;
    private ColorRect? _body;
    private ColorRect? _glowRing;
    private Label? _label;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        int diameter = IsTraySize ? VisualLanguage.ChipDiameterTray : VisualLanguage.ChipDiameterStandard;
        CustomMinimumSize = new Vector2(diameter, diameter);
        Size = new Vector2(diameter, diameter);

        MouseEntered += _OnMouseEntered;
        MouseExited  += _OnMouseExited;
        MouseFilter  = MouseFilterEnum.Stop;

        _BuildChip(diameter);
        _ApplyState(diameter);
    }

    // -------------------------------------------------------------------------
    // Input
    // -------------------------------------------------------------------------

    public override void _GuiInput(InputEvent @event)
    {
        if (@event is InputEventMouseButton mb
            && mb.ButtonIndex == MouseButton.Left
            && !mb.Pressed)
        {
            EmitSignal(SignalName.ChipClicked, Denomination);
        }
    }

    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    private void _BuildChip(int diameter)
    {
        // Glow ring — rendered beneath the chip body, visible only when selected or hovered
        _glowRing = new ColorRect();
        _glowRing.Name = "GlowRing";
        int glowPad = (int)VisualLanguage.ChipSelectionGlowRadius;
        _glowRing.Size = new Vector2(diameter + glowPad * 2, diameter + glowPad * 2);
        _glowRing.Position = new Vector2(-glowPad, -glowPad);
        _glowRing.Color = new Color(VisualLanguage.ColorGold, 0f);
        _glowRing.Visible = false;
        AddChild(_glowRing);

        // Chip body
        _body = new ColorRect();
        _body.Name = "ChipBody";
        _body.Size = new Vector2(diameter, diameter);
        _body.Position = Vector2.Zero;
        _body.Color = VisualLanguage.ChipColor(Denomination);
        _body.MouseFilter = MouseFilterEnum.Ignore;
        AddChild(_body);

        // Denomination label
        _label = new Label();
        _label.Name = "DenomLabel";
        _label.Text = $"${Denomination}";
        _label.AddThemeFontSizeOverride("font_size", VisualLanguage.TextSm);
        _label.AddThemeColorOverride("font_color", VisualLanguage.ColorTextPrimary);
        _label.HorizontalAlignment = HorizontalAlignment.Center;
        _label.VerticalAlignment = VerticalAlignment.Center;
        _label.Size = new Vector2(diameter, diameter);
        _label.Position = Vector2.Zero;
        _label.MouseFilter = MouseFilterEnum.Ignore;
        AddChild(_label);
    }

    // -------------------------------------------------------------------------
    // State rendering
    // -------------------------------------------------------------------------

    private void _ApplyState(int diameter)
    {
        if (_glowRing == null || _body == null) return;

        if (IsSelected)
        {
            // Selection glow: color_gold at ChipSelectionGlowOpacity (40%)
            _glowRing.Color = new Color(VisualLanguage.ColorGold, VisualLanguage.ChipSelectionGlowOpacity);
            _glowRing.Visible = true;
        }
        else if (_isHovered)
        {
            // Hover glow: color_gold at opacity_chip_hover_glow (20%)
            _glowRing.Color = new Color(VisualLanguage.ColorGold, VisualLanguage.OpacityChipHoverGlow);
            _glowRing.Visible = true;
        }
        else
        {
            _glowRing.Visible = false;
        }
    }

    // -------------------------------------------------------------------------
    // Hover callbacks
    // -------------------------------------------------------------------------

    private void _OnMouseEntered()
    {
        _isHovered = true;
        int diameter = IsTraySize ? VisualLanguage.ChipDiameterTray : VisualLanguage.ChipDiameterStandard;
        _ApplyState(diameter);
    }

    private void _OnMouseExited()
    {
        _isHovered = false;
        int diameter = IsTraySize ? VisualLanguage.ChipDiameterTray : VisualLanguage.ChipDiameterStandard;
        _ApplyState(diameter);
    }
}
