using Godot;

/// <summary>
/// Tip dealer prompt. Shown conditionally during SideBetResolution when TriLux wins
/// and DealerTipEnabled is true. Auto-dismisses after 5 seconds if no interaction.
///
/// Position: (800, 960) per screen-states.md State 4.
/// Size: 320 x 60 per annotations.md Section 19.
/// Background: color_surface at opacity_tip_prompt_fill (90%), 6px corner radius.
///
/// Spec: component-boundaries.md Section 2 — TipPrompt.tscn [BJ-specific].
/// Annotations: annotations.md Section 19.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class TipPrompt : Control
{
    // -------------------------------------------------------------------------
    // Signals
    // -------------------------------------------------------------------------

    [Signal] public delegate void TipAcceptedEventHandler();
    [Signal] public delegate void TipDismissedEventHandler();

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    [Export] public bool IsVisible2 { get; set; } = true;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        Position = VisualLanguage.PosTipPrompt;
        Size = VisualLanguage.SizeTipPrompt;
        CustomMinimumSize = VisualLanguage.SizeTipPrompt;
        Visible = IsVisible2;
        ZIndex = 2;

        _Build();
    }

    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    private void _Build()
    {
        // Background
        var bg = new Panel();
        bg.Name = "TipBackground";
        bg.Size = VisualLanguage.SizeTipPrompt;
        bg.Position = Vector2.Zero;
        bg.MouseFilter = MouseFilterEnum.Ignore;

        var style = new StyleBoxFlat();
        style.BgColor = new Color(VisualLanguage.ColorSurface, VisualLanguage.OpacityTipPromptFill);
        style.CornerRadiusTopLeft    = VisualLanguage.CornerRadius;
        style.CornerRadiusTopRight   = VisualLanguage.CornerRadius;
        style.CornerRadiusBottomLeft  = VisualLanguage.CornerRadius;
        style.CornerRadiusBottomRight = VisualLanguage.CornerRadius;
        bg.AddThemeStyleboxOverride("panel", style);
        AddChild(bg);

        // "TIP DEALER?" label (left portion)
        var label = new Label();
        label.Name = "TipLabel";
        label.Text = "TIP DEALER?";
        label.AddThemeFontSizeOverride("font_size", VisualLanguage.TextBase);
        label.AddThemeColorOverride("font_color", VisualLanguage.ColorTextSecondary);
        label.VerticalAlignment = VerticalAlignment.Center;
        label.Size = new Vector2(160, VisualLanguage.SizeTipPrompt.Y);
        label.Position = new Vector2(VisualLanguage.Space4, 0);
        label.MouseFilter = MouseFilterEnum.Ignore;
        AddChild(label);

        // Yes button
        var yesBtn = new ActionButton();
        yesBtn.Name = "YesButton";
        yesBtn.Label = "YES";
        yesBtn.IsEnabled = true;
        yesBtn.IsGoldAccent = false;
        yesBtn.Size = new Vector2(60, VisualLanguage.SizeTipPrompt.Y - VisualLanguage.Space2 * 2);
        yesBtn.CustomMinimumSize = yesBtn.Size;
        yesBtn.Position = new Vector2(180, VisualLanguage.Space2);
        yesBtn.ActionPressed += () => EmitSignal(SignalName.TipAccepted);
        AddChild(yesBtn);

        // No / dismiss button
        var noBtn = new ActionButton();
        noBtn.Name = "NoButton";
        noBtn.Label = "NO";
        noBtn.IsEnabled = true;
        noBtn.IsGoldAccent = false;
        noBtn.Size = new Vector2(60, VisualLanguage.SizeTipPrompt.Y - VisualLanguage.Space2 * 2);
        noBtn.CustomMinimumSize = noBtn.Size;
        noBtn.Position = new Vector2(250, VisualLanguage.Space2);
        noBtn.ActionPressed += () => EmitSignal(SignalName.TipDismissed);
        AddChild(noBtn);
    }
}
