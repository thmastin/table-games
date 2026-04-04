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

        _BuildLabel(diameter);
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
    // Draw — circular chip rendered via _Draw() so it is a true circle.
    // -------------------------------------------------------------------------

    public override void _Draw()
    {
        int diameter = IsTraySize ? VisualLanguage.ChipDiameterTray : VisualLanguage.ChipDiameterStandard;
        float radius = diameter / 2f;
        var center = new Vector2(radius, radius);
        Color baseColor = VisualLanguage.ChipColor(Denomination);

        // Glow ring behind chip (selection / hover)
        if (IsSelected)
        {
            float glowR = radius + VisualLanguage.ChipSelectionGlowRadius;
            DrawCircle(center, glowR, new Color(VisualLanguage.ColorGold, VisualLanguage.ChipSelectionGlowOpacity));
        }
        else if (_isHovered)
        {
            float glowR = radius + (VisualLanguage.ChipSelectionGlowRadius / 2f);
            DrawCircle(center, glowR, new Color(VisualLanguage.ColorGold, VisualLanguage.OpacityChipHoverGlow));
        }

        // Chip body — filled circle
        DrawCircle(center, radius, baseColor);

        // Edge segments — 8 alternating arcs (4 base, 4 lightened)
        // Each arc spans 45 degrees. Render as thin arc lines at the chip edge.
        Color lightened = baseColor.Lightened(0.30f);
        float segAngle = Mathf.Tau / VisualLanguage.ChipEdgeSegmentCount;
        float edgeWidth = 4f;
        float edgeRadius = radius - edgeWidth / 2f;
        for (int seg = 0; seg < VisualLanguage.ChipEdgeSegmentCount; seg++)
        {
            Color segColor = (seg % 2 == 0) ? baseColor : lightened;
            float startAngle = seg * segAngle - Mathf.Pi / 2f;
            // Draw as a thick arc by stacking thin DrawArc calls
            DrawArc(center, edgeRadius, startAngle, startAngle + segAngle, 12, segColor, edgeWidth, true);
        }

        // Center gold ring inlay — 1px stroke at 80% radius, gold_light at 50% opacity
        float ringRadius = radius * 0.80f;
        DrawArc(center, ringRadius, 0f, Mathf.Tau, 32,
            new Color(VisualLanguage.ColorGoldLight, 0.50f), 1f, true);
    }

    // -------------------------------------------------------------------------
    // Label construction (created once in _Ready; not in _Draw)
    // -------------------------------------------------------------------------

    private void _BuildLabel(int diameter)
    {
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
    // Hover callbacks — queue redraw so glow updates
    // -------------------------------------------------------------------------

    private void _OnMouseEntered()
    {
        _isHovered = true;
        QueueRedraw();
    }

    private void _OnMouseExited()
    {
        _isHovered = false;
        QueueRedraw();
    }
}
