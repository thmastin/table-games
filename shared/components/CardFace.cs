using Godot;

/// <summary>
/// Renders a single playing card face — rank glyph, suit symbol, card body with drop shadow.
/// Handles face-up and face-down states. Executes the card flip animation on demand.
/// Does not know what hand it belongs to or how many cards are in that hand.
///
/// Props: Rank (1-13), Suit, FaceUp, AnimateFlip, RotationDegrees.
/// Signals: FlipCompleted, DealArcCompleted.
/// Spec: component-boundaries.md Section 1 — CardFace.tscn.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class CardFace : Control
{
    // -------------------------------------------------------------------------
    // Signals
    // -------------------------------------------------------------------------

    [Signal] public delegate void FlipCompletedEventHandler();
    [Signal] public delegate void DealArcCompletedEventHandler();

    // -------------------------------------------------------------------------
    // Exported props
    // -------------------------------------------------------------------------

    /// <summary>Card rank: 1=Ace, 2-10=pip, 11=Jack, 12=Queen, 13=King.</summary>
    [Export] public int Rank { get; set; } = 1;

    /// <summary>Card suit: "clubs" | "diamonds" | "hearts" | "spades".</summary>
    [Export] public string Suit { get; set; } = "spades";

    /// <summary>True = show rank/suit face. False = show card back (Option B: Chevron Stripe).</summary>
    [Export] public bool FaceUp { get; set; } = true;

    /// <summary>If true, play flip animation on FaceUp change; if false, instant swap.</summary>
    [Export] public bool AnimateFlip { get; set; } = false;

    /// <summary>Final resting rotation in degrees after deal settle. Applied by parent zone.</summary>
    [Export] public float RotationDegrees2D { get; set; } = 0f;

    // -------------------------------------------------------------------------
    // Child node references (assigned in _Ready)
    // -------------------------------------------------------------------------

    private Panel? _cardBody;
    private Label? _rankLabel;
    private Label? _suitLabel;
    private Panel? _cardBack;
    private ColorRect? _backStripe1;
    private ColorRect? _backStripe2;
    private Label? _backSeal;

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    private bool _isFlipping = false;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        CustomMinimumSize = VisualLanguage.SizeCard;
        Size = VisualLanguage.SizeCard;

        _BuildCardBody();
        _ApplyCurrentState();
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /// <summary>
    /// Set FaceUp and optionally trigger the flip animation.
    /// If AnimateFlip is true, plays the 200ms two-phase horizontal flip.
    /// If AnimateFlip is false or reduced-motion is active, snaps instantly.
    /// </summary>
    public void SetFaceUp(bool faceUp, bool animate = false)
    {
        if (FaceUp == faceUp) return;
        FaceUp = faceUp;
        AnimateFlip = animate;

        if (animate && !_isFlipping)
            _PlayFlipAnimation();
        else
            _ApplyCurrentState();
    }

    // -------------------------------------------------------------------------
    // Node construction — builds card visual hierarchy programmatically
    // -------------------------------------------------------------------------

    private void _BuildCardBody()
    {
        // Card body panel (face side)
        _cardBody = new Panel();
        _cardBody.Name = "CardBody";
        _cardBody.Size = VisualLanguage.SizeCard;
        _cardBody.Position = Vector2.Zero;

        var bodyStyle = new StyleBoxFlat();
        bodyStyle.BgColor = VisualLanguage.ColorSurfaceHigh;
        bodyStyle.CornerRadiusTopLeft = VisualLanguage.CornerRadius;
        bodyStyle.CornerRadiusTopRight = VisualLanguage.CornerRadius;
        bodyStyle.CornerRadiusBottomLeft = VisualLanguage.CornerRadius;
        bodyStyle.CornerRadiusBottomRight = VisualLanguage.CornerRadius;
        // Drop shadow simulated via border
        bodyStyle.ShadowColor = new Color(0, 0, 0, VisualLanguage.CardShadowOpacity);
        bodyStyle.ShadowSize = (int)VisualLanguage.CardShadowBlur;
        bodyStyle.ShadowOffset = new Vector2(0, 2);
        _cardBody.AddThemeStyleboxOverride("panel", bodyStyle);
        AddChild(_cardBody);

        // Rank label — top-left corner
        _rankLabel = new Label();
        _rankLabel.Name = "RankLabel";
        _rankLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.Text2Xl);
        _rankLabel.Position = new Vector2(VisualLanguage.Space2, VisualLanguage.Space2);
        _rankLabel.AutowrapMode = TextServer.AutowrapMode.Off;
        _cardBody.AddChild(_rankLabel);

        // Suit label — below rank, top-left
        _suitLabel = new Label();
        _suitLabel.Name = "SuitLabel";
        _suitLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextXl);
        _suitLabel.Position = new Vector2(VisualLanguage.Space2, VisualLanguage.Space2 + VisualLanguage.Text2Xl + VisualLanguage.Space1);
        _suitLabel.AutowrapMode = TextServer.AutowrapMode.Off;
        _cardBody.AddChild(_suitLabel);

        // Card back panel (back side — Option B: Chevron Stripe with Center Seal)
        _cardBack = new Panel();
        _cardBack.Name = "CardBack";
        _cardBack.Size = VisualLanguage.SizeCard;
        _cardBack.Position = Vector2.Zero;

        var backStyle = new StyleBoxFlat();
        backStyle.BgColor = VisualLanguage.ColorSurfaceHigh;
        backStyle.CornerRadiusTopLeft = VisualLanguage.CornerRadius;
        backStyle.CornerRadiusTopRight = VisualLanguage.CornerRadius;
        backStyle.CornerRadiusBottomLeft = VisualLanguage.CornerRadius;
        backStyle.CornerRadiusBottomRight = VisualLanguage.CornerRadius;
        // Gold 2px border frame
        backStyle.BorderColor = VisualLanguage.ColorGold;
        backStyle.BorderWidthTop = 2;
        backStyle.BorderWidthBottom = 2;
        backStyle.BorderWidthLeft = 2;
        backStyle.BorderWidthRight = 2;
        _cardBack.AddThemeStyleboxOverride("panel", backStyle);
        AddChild(_cardBack);

        // Stripe overlay (alternate colors simulating diagonal chevron stripe)
        // Stripe 1 — ColorSurfaceLow at full opacity per spec (OpacityCardBackStripe = 1.0f).
        // The tonal difference between ColorSurfaceHigh (body) and ColorSurfaceLow (stripe)
        // provides the visual stripe pattern without an opacity reduction.
        _backStripe1 = new ColorRect();
        _backStripe1.Name = "BackStripe1";
        _backStripe1.Color = new Color(VisualLanguage.ColorSurfaceLow, VisualLanguage.OpacityCardBackStripe);
        _backStripe1.Size = VisualLanguage.SizeCard;
        _backStripe1.Position = Vector2.Zero;
        _cardBack.AddChild(_backStripe1);

        // Compass rose seal label (center third of card, gold at 25% opacity)
        _backSeal = new Label();
        _backSeal.Name = "BackSeal";
        _backSeal.Text = "✦"; // compass rose approximation using unicode symbol
        _backSeal.AddThemeFontSizeOverride("font_size", VisualLanguage.TextDisplaySm);
        _backSeal.Modulate = new Color(VisualLanguage.ColorGold, VisualLanguage.OpacityCardBackSeal);
        // Center the seal
        _backSeal.Size = new Vector2(VisualLanguage.CardWidth, VisualLanguage.CardHeight);
        _backSeal.Position = Vector2.Zero;
        _backSeal.HorizontalAlignment = HorizontalAlignment.Center;
        _backSeal.VerticalAlignment = VerticalAlignment.Center;
        _cardBack.AddChild(_backSeal);
    }

    // -------------------------------------------------------------------------
    // State rendering
    // -------------------------------------------------------------------------

    private void _ApplyCurrentState()
    {
        if (_cardBody == null || _cardBack == null) return;

        if (FaceUp)
        {
            _cardBody.Visible = true;
            _cardBack.Visible = false;
            _UpdateFaceLabels();
        }
        else
        {
            _cardBody.Visible = false;
            _cardBack.Visible = true;
        }

        RotationDegrees = RotationDegrees2D;
    }

    private void _UpdateFaceLabels()
    {
        if (_rankLabel == null || _suitLabel == null) return;

        _rankLabel.Text = _RankGlyph(Rank);
        _suitLabel.Text = _SuitGlyph(Suit);

        var suitColor = (Suit == "hearts" || Suit == "diamonds")
            ? VisualLanguage.ColorSuitRed
            : VisualLanguage.ColorTextPrimary;

        _rankLabel.AddThemeColorOverride("font_color", suitColor);
        _suitLabel.AddThemeColorOverride("font_color", suitColor);
    }

    private static string _RankGlyph(int rank) => rank switch
    {
        1  => "A",
        11 => "J",
        12 => "Q",
        13 => "K",
        _  => rank.ToString()
    };

    private static string _SuitGlyph(string suit) => suit switch
    {
        "clubs"    => "♣",
        "diamonds" => "♦",
        "hearts"   => "♥",
        "spades"   => "♠",
        _          => "?"
    };

    // -------------------------------------------------------------------------
    // Flip animation (200ms two-phase horizontal rotation)
    // Spec: visual-language.md Section 3 — Card Flip
    // -------------------------------------------------------------------------

    private void _PlayFlipAnimation()
    {
        _isFlipping = true;
        var tween = CreateTween();

        // Phase 1: rotate from 0° to 90° (back toward edge) — accelerate
        tween.TweenProperty(this, "scale:x", 0f,
            VisualLanguage.AnimCardFlipPhase1)
            .SetEase(Tween.EaseType.In)
            .SetTrans(Tween.TransitionType.Sine);

        // At midpoint: swap face/back visibility
        tween.TweenCallback(Callable.From(_SwapVisibility));

        // Phase 2: rotate from 90° to 180° (edge to face) — decelerate
        tween.TweenProperty(this, "scale:x", 1f,
            VisualLanguage.AnimCardFlipPhase2)
            .SetEase(Tween.EaseType.Out)
            .SetTrans(Tween.TransitionType.Sine);

        tween.TweenCallback(Callable.From(_OnFlipComplete));
    }

    private void _SwapVisibility()
    {
        _ApplyCurrentState();
    }

    private void _OnFlipComplete()
    {
        _isFlipping = false;
        EmitSignal(SignalName.FlipCompleted);
    }
}
