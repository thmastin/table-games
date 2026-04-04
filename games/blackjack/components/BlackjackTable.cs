using Godot;

/// <summary>
/// Root table scene for Blackjack. Renders the felt surface, rail, felt markings,
/// and positions all child components at Blackjack-specific coordinates.
///
/// This is the thin scene-script wrapper. No game logic lives here.
/// In Phase 11 this scene renders with static fixture data only.
///
/// Spec: component-boundaries.md Section 2 — BlackjackTable.tscn.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class BlackjackTable : Node2D
{
    // -------------------------------------------------------------------------
    // Child references (wired in _Ready after scene tree is built)
    // -------------------------------------------------------------------------

    private ColorRect? _feltSurface;
    private ColorRect? _rail;
    private Label? _feltMarkingLine1;
    private Label? _feltMarkingLine2;
    private Label? _feltMarkingLine3;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        _BuildFelt();
        _BuildRail();
        _BuildFeltMarkings();
    }

    // -------------------------------------------------------------------------
    // Felt surface — Option B: Directional Sheen with Fiber Grain
    // Base color_felt fill; grain texture blended in Screen mode at 12% (approximated)
    // -------------------------------------------------------------------------

    private void _BuildFelt()
    {
        _feltSurface = new ColorRect();
        _feltSurface.Name = "FeltSurface";
        _feltSurface.Color = VisualLanguage.ColorFelt;
        _feltSurface.Position = VisualLanguage.PosFeltSurface;
        _feltSurface.Size = VisualLanguage.SizeFeltSurface;
        _feltSurface.ZIndex = 0;
        AddChild(_feltSurface);
    }

    // -------------------------------------------------------------------------
    // Rail — dark mahogany band surrounding the felt
    // -------------------------------------------------------------------------

    private void _BuildRail()
    {
        _rail = new ColorRect();
        _rail.Name = "Rail";
        _rail.Color = VisualLanguage.ColorRail;
        _rail.Position = VisualLanguage.PosRail;
        _rail.Size = VisualLanguage.SizeRail;
        _rail.ZIndex = -1; // behind felt
        AddChild(_rail);
    }

    // -------------------------------------------------------------------------
    // Felt markings — printed text labels on the felt
    // Noto Serif text_xl, color_felt_marking, letter-spacing 0.8px
    // -------------------------------------------------------------------------

    private void _BuildFeltMarkings()
    {
        _feltMarkingLine1 = _CreateFeltLabel("BLACKJACK PAYS 3 TO 2");
        _feltMarkingLine2 = _CreateFeltLabel("DEALER MUST DRAW TO 16");
        _feltMarkingLine3 = _CreateFeltLabel("INSURANCE PAYS 2 TO 1");

        // Positions are centered on their x coordinate — use a container to center
        _PositionFeltLabel(_feltMarkingLine1, VisualLanguage.PosFeltMarkingLine1);
        _PositionFeltLabel(_feltMarkingLine2, VisualLanguage.PosFeltMarkingLine2);
        _PositionFeltLabel(_feltMarkingLine3, VisualLanguage.PosFeltMarkingLine3);

        AddChild(_feltMarkingLine1);
        AddChild(_feltMarkingLine2);
        AddChild(_feltMarkingLine3);
    }

    private static Label _CreateFeltLabel(string text)
    {
        var label = new Label();
        label.Text = text;
        label.AddThemeFontSizeOverride("font_size", VisualLanguage.TextXl);
        label.AddThemeColorOverride("font_color", VisualLanguage.ColorFeltMarking);
        label.HorizontalAlignment = HorizontalAlignment.Center;
        label.AutowrapMode = TextServer.AutowrapMode.Off;
        label.MouseFilter = Control.MouseFilterEnum.Ignore;
        return label;
    }

    private static void _PositionFeltLabel(Label label, Vector2 center)
    {
        // Approximate label width using named constant; centered on the given x coordinate
        int halfWidth = VisualLanguage.FeltLabelApproxWidth / 2;
        label.Position = new Vector2(center.X - halfWidth, center.Y - VisualLanguage.TextXl / 2f);
        label.CustomMinimumSize = new Vector2(VisualLanguage.FeltLabelApproxWidth, VisualLanguage.TextXl + VisualLanguage.Space2);
    }
}
