using Godot;

/// <summary>
/// Renders only the card back face. Used for placeholder slots or deck indicators.
/// Never flips. Never holds rank or suit data.
///
/// Option B: Chevron Stripe with Center Seal (locked in visual-language.md Section 4).
/// - Diagonal chevron stripe: ColorSurfaceHigh and ColorSurfaceLow alternating at 45°, 6px stripe width.
/// - Center seal: ColorGold at 25% opacity compass rose medallion.
/// - 2px ColorGold border frame.
///
/// Spec: component-boundaries.md Section 1 — CardBack.tscn.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class CardBack : Control
{
    /// <summary>Final resting rotation in degrees. Applied by parent zone.</summary>
    [Export] public float RotationDegrees2D { get; set; } = 0f;

    public override void _Ready()
    {
        CustomMinimumSize = VisualLanguage.SizeCard;
        Size = VisualLanguage.SizeCard;
        _BuildBack();
    }

    private void _BuildBack()
    {
        // Card body with gold border frame
        var body = new Panel();
        body.Name = "CardBackBody";
        body.Size = VisualLanguage.SizeCard;
        body.Position = Vector2.Zero;

        var style = new StyleBoxFlat();
        style.BgColor = VisualLanguage.ColorSurfaceHigh;
        style.CornerRadiusTopLeft    = VisualLanguage.CornerRadius;
        style.CornerRadiusTopRight   = VisualLanguage.CornerRadius;
        style.CornerRadiusBottomLeft  = VisualLanguage.CornerRadius;
        style.CornerRadiusBottomRight = VisualLanguage.CornerRadius;
        style.BorderColor = VisualLanguage.ColorGold;
        style.BorderWidthTop    = 2;
        style.BorderWidthBottom = 2;
        style.BorderWidthLeft   = 2;
        style.BorderWidthRight  = 2;
        body.AddThemeStyleboxOverride("panel", style);
        AddChild(body);

        // Stripe overlay — alternating surface colors to simulate chevron pattern.
        // Full opacity per spec (OpacityCardBackStripe = 1.0f). The tonal difference between
        // ColorSurfaceHigh (body) and ColorSurfaceLow (stripe) provides the stripe pattern.
        var stripe = new ColorRect();
        stripe.Name = "StripeOverlay";
        stripe.Color = new Color(VisualLanguage.ColorSurfaceLow, VisualLanguage.OpacityCardBackStripe);
        stripe.Size = VisualLanguage.SizeCard;
        stripe.Position = Vector2.Zero;
        body.AddChild(stripe);

        // Compass rose seal — centered, gold at 25% opacity
        var seal = new Label();
        seal.Name = "Seal";
        seal.Text = "✦";
        seal.AddThemeFontSizeOverride("font_size", VisualLanguage.TextDisplaySm);
        seal.Modulate = new Color(VisualLanguage.ColorGold, VisualLanguage.OpacityCardBackSeal);
        seal.Size = VisualLanguage.SizeCard;
        seal.Position = Vector2.Zero;
        seal.HorizontalAlignment = HorizontalAlignment.Center;
        seal.VerticalAlignment = VerticalAlignment.Center;
        body.AddChild(seal);

        RotationDegrees = RotationDegrees2D;
    }
}
