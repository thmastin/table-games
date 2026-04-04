using Godot;

/// <summary>
/// Renders the win numeral float animation, the screen-edge bloom, and the push indicator.
/// For loss results, renders nothing.
///
/// Win: gold numeral travels from SourcePosition toward TargetPosition, shrinking and fading.
/// Push: neutral secondary-text "PUSH" indicator, no float travel.
/// Loss: no visual output.
///
/// Spec: component-boundaries.md Section 1 — ResultBanner.tscn.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class ResultBanner : Control
{
    // -------------------------------------------------------------------------
    // Signal
    // -------------------------------------------------------------------------

    [Signal] public delegate void AnimationCompletedEventHandler();

    // -------------------------------------------------------------------------
    // Result type enum
    // -------------------------------------------------------------------------

    public enum ResultType { Win, Push, Loss }

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    [Export] public ResultType Result { get; set; } = ResultType.Loss;
    [Export] public int Amount { get; set; } = 0;
    [Export] public Vector2 SourcePosition { get; set; } = Vector2.Zero;
    [Export] public Vector2 TargetPosition { get; set; } = Vector2.Zero;

    // -------------------------------------------------------------------------
    // Child references
    // -------------------------------------------------------------------------

    private Label? _numeralLabel;
    private Label? _pushLabel;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        MouseFilter = MouseFilterEnum.Ignore;

        // Win numeral label
        _numeralLabel = new Label();
        _numeralLabel.Name = "WinNumeral";
        _numeralLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextDisplayLg);
        _numeralLabel.AddThemeColorOverride("font_color", VisualLanguage.ColorWin);
        _numeralLabel.HorizontalAlignment = HorizontalAlignment.Center;
        _numeralLabel.MouseFilter = MouseFilterEnum.Ignore;
        _numeralLabel.Visible = false;
        AddChild(_numeralLabel);

        // Push indicator label
        _pushLabel = new Label();
        _pushLabel.Name = "PushIndicator";
        _pushLabel.Text = "PUSH";
        _pushLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextBase);
        _pushLabel.AddThemeColorOverride("font_color", VisualLanguage.ColorPush);
        _pushLabel.HorizontalAlignment = HorizontalAlignment.Center;
        _pushLabel.MouseFilter = MouseFilterEnum.Ignore;
        _pushLabel.Visible = false;
        AddChild(_pushLabel);
    }

    // -------------------------------------------------------------------------
    // Public API — call to trigger the result animation
    // -------------------------------------------------------------------------

    public void Play()
    {
        switch (Result)
        {
            case ResultType.Win:
                _PlayWinAnimation();
                break;
            case ResultType.Push:
                _PlayPushAnimation();
                break;
            case ResultType.Loss:
                // Loss renders nothing — signal immediately
                EmitSignal(SignalName.AnimationCompleted);
                break;
        }
    }

    // -------------------------------------------------------------------------
    // Win animation
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // Win bloom effect stub
    // -------------------------------------------------------------------------

    /// <summary>
    /// Triggers the screen-edge gold bloom effect (color_win_bloom at opacity_win_bloom,
    /// 120px inward from all screen edges).
    /// TODO Phase 13: wire win bloom CanvasLayer shader — this requires a full-screen
    /// CanvasLayer effect not available in the static UI phase.
    /// </summary>
    private void _PlayBloomEffect()
    {
        // TODO Phase 13: wire win bloom CanvasLayer shader
    }

    private void _PlayWinAnimation()
    {
        if (_numeralLabel == null) return;

        _numeralLabel.Text = $"+${Amount}";
        _numeralLabel.Position = SourcePosition;
        _numeralLabel.Scale = Vector2.One;
        _numeralLabel.Modulate = VisualLanguage.ColorWin;
        _numeralLabel.Visible = true;

        // Trigger bloom effect (wired for Phase 13; no-op in static phase)
        _PlayBloomEffect();

        var tween = CreateTween();

        // Travel from source to target
        tween.TweenProperty(_numeralLabel, "position", TargetPosition,
            VisualLanguage.AnimWinNumeralFloat)
            .SetEase(Tween.EaseType.Out)
            .SetTrans(Tween.TransitionType.Sine);

        // Scale 100% → 60%
        tween.Parallel().TweenProperty(_numeralLabel, "scale",
            new Vector2(0.6f, 0.6f), VisualLanguage.AnimWinNumeralFloat)
            .SetEase(Tween.EaseType.Out)
            .SetTrans(Tween.TransitionType.Sine);

        // Alpha fade in final AnimWinNumeralFadeDuration (100ms)
        float fadeDuration = VisualLanguage.AnimWinNumeralFadeDuration;
        float fadeDelay = VisualLanguage.AnimWinNumeralFloat - fadeDuration;
        tween.Parallel().TweenProperty(_numeralLabel, "modulate",
            new Color(VisualLanguage.ColorWin, 0f), fadeDuration)
            .SetDelay(fadeDelay);

        tween.TweenCallback(Callable.From(_OnWinAnimComplete));
    }

    private void _OnWinAnimComplete()
    {
        if (_numeralLabel != null) _numeralLabel.Visible = false;
        EmitSignal(SignalName.AnimationCompleted);
    }

    // -------------------------------------------------------------------------
    // Push animation
    // -------------------------------------------------------------------------

    private void _PlayPushAnimation()
    {
        if (_pushLabel == null) return;

        _pushLabel.Position = SourcePosition;
        _pushLabel.Modulate = new Color(VisualLanguage.ColorPush, 0f);
        _pushLabel.Visible = true;

        var tween = CreateTween();

        // Fade in via transition_panel_enter (400ms)
        tween.TweenProperty(_pushLabel, "modulate",
            VisualLanguage.ColorPush, VisualLanguage.TransitionPanelEnter)
            .SetEase(Tween.EaseType.Out)
            .SetTrans(Tween.TransitionType.Sine);

        // Hold AnimPushHoldDuration (400ms)
        tween.TweenInterval(VisualLanguage.AnimPushHoldDuration);

        // Fade out
        tween.TweenProperty(_pushLabel, "modulate",
            new Color(VisualLanguage.ColorPush, 0f), VisualLanguage.TransitionFadeOut)
            .SetEase(Tween.EaseType.In)
            .SetTrans(Tween.TransitionType.Sine);

        tween.TweenCallback(Callable.From(_OnPushAnimComplete));
    }

    private void _OnPushAnimComplete()
    {
        if (_pushLabel != null) _pushLabel.Visible = false;
        EmitSignal(SignalName.AnimationCompleted);
    }
}
