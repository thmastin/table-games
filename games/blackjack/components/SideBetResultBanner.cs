using Godot;

/// <summary>
/// Renders the win or lose result banner for a single side bet (TriLux or LuckyLucky).
/// Shown during SideBetResolution phase over the respective BetSpot.
///
/// Win state: color_surface_high at opacity_side_bet_banner_fill (80%), color_gold thin border
///            at opacity_side_bet_banner_border (40%), payout text in Noto Serif text_base.
/// Lose state: transparent with muted secondary text.
/// Size: 200x80 per annotations.md Section 18.
///
/// Spec: component-boundaries.md Section 2 — SideBetResultBanner.tscn [BJ-specific].
/// Annotations: annotations.md Section 18.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class SideBetResultBanner : Control
{
    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    /// <summary>Bet type label displayed in top line. E.g. "TRILUX" or "LUCKY LUCKY".</summary>
    [Export] public string BetType { get; set; } = "";

    /// <summary>"Win" or "Lose".</summary>
    [Export] public string Outcome { get; set; } = "Lose";

    /// <summary>Payout label displayed below bet type on win. E.g. "+$25".</summary>
    [Export] public string PayoutLabel { get; set; } = "";

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        Size = VisualLanguage.SizeSideBetBanner;
        CustomMinimumSize = VisualLanguage.SizeSideBetBanner;

        _Build();
    }

    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    private void _Build()
    {
        bool isWin = Outcome == "Win";

        // Background panel
        var bg = new Panel();
        bg.Name = "BannerBackground";
        bg.Size = VisualLanguage.SizeSideBetBanner;
        bg.Position = Vector2.Zero;
        bg.MouseFilter = MouseFilterEnum.Ignore;

        var style = new StyleBoxFlat();
        if (isWin)
        {
            style.BgColor = new Color(
                VisualLanguage.ColorSurfaceHigh,
                VisualLanguage.OpacitySideBetBannerFill);
            style.BorderColor = new Color(
                VisualLanguage.ColorGold,
                VisualLanguage.OpacitySideBetBannerBorder);
            style.BorderWidthTop    = 1;
            style.BorderWidthBottom = 1;
            style.BorderWidthLeft   = 1;
            style.BorderWidthRight  = 1;
        }
        else
        {
            // Lose state: transparent background
            style.BgColor = new Color(0, 0, 0, 0);
        }
        style.CornerRadiusTopLeft    = VisualLanguage.CornerRadius;
        style.CornerRadiusTopRight   = VisualLanguage.CornerRadius;
        style.CornerRadiusBottomLeft  = VisualLanguage.CornerRadius;
        style.CornerRadiusBottomRight = VisualLanguage.CornerRadius;
        bg.AddThemeStyleboxOverride("panel", style);
        AddChild(bg);

        // Bet type label (top line)
        var typeLabel = new Label();
        typeLabel.Name = "BetTypeLabel";
        typeLabel.Text = BetType.ToUpper();
        typeLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextBase);
        typeLabel.AddThemeColorOverride("font_color",
            isWin ? VisualLanguage.ColorGold : VisualLanguage.ColorTextSecondary);
        typeLabel.HorizontalAlignment = HorizontalAlignment.Center;
        typeLabel.Size = new Vector2(VisualLanguage.SizeSideBetBanner.X, VisualLanguage.TextBase + VisualLanguage.Space2);
        typeLabel.Position = new Vector2(0, VisualLanguage.Space3);
        typeLabel.MouseFilter = MouseFilterEnum.Ignore;
        AddChild(typeLabel);

        // Payout label (bottom line — win only)
        if (isWin && !string.IsNullOrEmpty(PayoutLabel))
        {
            var payoutLabel = new Label();
            payoutLabel.Name = "PayoutLabel";
            payoutLabel.Text = PayoutLabel;
            payoutLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextDisplaySm);
            payoutLabel.AddThemeColorOverride("font_color", VisualLanguage.ColorGold);
            payoutLabel.HorizontalAlignment = HorizontalAlignment.Center;
            payoutLabel.Size = new Vector2(VisualLanguage.SizeSideBetBanner.X, VisualLanguage.SizeSideBetBanner.Y - VisualLanguage.TextBase - VisualLanguage.Space3 - VisualLanguage.Space2);
            payoutLabel.Position = new Vector2(0, VisualLanguage.TextBase + VisualLanguage.Space3 + VisualLanguage.Space2);
            payoutLabel.MouseFilter = MouseFilterEnum.Ignore;
            AddChild(payoutLabel);
        }
        else if (!isWin)
        {
            // Lose: show "—" muted text
            var loseLabel = new Label();
            loseLabel.Name = "LoseLabel";
            loseLabel.Text = "—";
            loseLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextBase);
            loseLabel.AddThemeColorOverride("font_color", VisualLanguage.ColorTextSecondary);
            loseLabel.HorizontalAlignment = HorizontalAlignment.Center;
            loseLabel.Size = new Vector2(VisualLanguage.SizeSideBetBanner.X, VisualLanguage.SizeSideBetBanner.Y - VisualLanguage.TextBase - VisualLanguage.Space3 - VisualLanguage.Space2);
            loseLabel.Position = new Vector2(0, VisualLanguage.TextBase + VisualLanguage.Space3 + VisualLanguage.Space2);
            loseLabel.MouseFilter = MouseFilterEnum.Ignore;
            AddChild(loseLabel);
        }
    }
}
