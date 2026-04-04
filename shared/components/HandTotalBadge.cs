using Godot;

/// <summary>
/// Renders the hand total for a player or dealer hand.
/// Noto Serif text_display_sm (36px), color_text_primary for normal totals.
/// Shows "BUST" in color_error on bust. Shows "soft 18" as two-line badge.
/// Inactive hands (split layout) render at opacity_disabled_primary (60%).
///
/// Spec: component-boundaries.md + annotations.md Sections 14, 15.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class HandTotalBadge : Control
{
    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    private int _total = 0;
    private bool _isSoft = false;
    private bool _isBust = false;
    private bool _isActiveHand = true;

    /// <summary>Numeric hand total (0 = hidden/empty).</summary>
    [Export]
    public int Total
    {
        get => _total;
        set { _total = value; if (_mainLabel != null) _Refresh(); }
    }

    /// <summary>True if the hand is a soft total (e.g., Ace+7 = soft 18).</summary>
    [Export]
    public bool IsSoft
    {
        get => _isSoft;
        set { _isSoft = value; if (_mainLabel != null) _Refresh(); }
    }

    /// <summary>True if the hand is bust (total > 21). Shows "BUST" in color_error.</summary>
    [Export]
    public bool IsBust
    {
        get => _isBust;
        set { _isBust = value; if (_mainLabel != null) _Refresh(); }
    }

    /// <summary>
    /// In split layout: true = active hand (full opacity), false = inactive (60% opacity).
    /// </summary>
    [Export]
    public bool IsActiveHand
    {
        get => _isActiveHand;
        set { _isActiveHand = value; if (_mainLabel != null) _Refresh(); }
    }

    // -------------------------------------------------------------------------
    // Child references
    // -------------------------------------------------------------------------

    private Label? _softPrefixLabel; // "soft" in text_sm color_text_secondary
    private Label? _mainLabel;       // numeric total or "BUST" in text_display_sm

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        CustomMinimumSize = new Vector2(80, 44);

        // "soft" prefix — text_sm, color_text_secondary, above the number
        _softPrefixLabel = new Label();
        _softPrefixLabel.Name = "SoftPrefix";
        _softPrefixLabel.Text = "soft";
        _softPrefixLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextSm);
        _softPrefixLabel.AddThemeColorOverride("font_color", VisualLanguage.ColorTextSecondary);
        _softPrefixLabel.HorizontalAlignment = HorizontalAlignment.Center;
        _softPrefixLabel.AutowrapMode = TextServer.AutowrapMode.Off;
        _softPrefixLabel.Position = new Vector2(0, 0);
        AddChild(_softPrefixLabel);

        // Main total label — text_display_sm, Noto Serif
        _mainLabel = new Label();
        _mainLabel.Name = "TotalLabel";
        _mainLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextDisplaySm);
        _mainLabel.HorizontalAlignment = HorizontalAlignment.Center;
        _mainLabel.AutowrapMode = TextServer.AutowrapMode.Off;
        _mainLabel.Position = new Vector2(0, VisualLanguage.TextSm + VisualLanguage.Space1);
        AddChild(_mainLabel);

        _Refresh();
    }

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    private void _Refresh()
    {
        if (_mainLabel == null || _softPrefixLabel == null) return;

        Visible = _total > 0 || _isBust;

        if (_isBust)
        {
            _softPrefixLabel.Visible = false;
            _mainLabel.Text = "BUST";
            _mainLabel.AddThemeColorOverride("font_color", VisualLanguage.ColorError);
            _mainLabel.Position = new Vector2(0, 0);
        }
        else
        {
            _mainLabel.Text = _total.ToString();
            _mainLabel.AddThemeColorOverride("font_color", VisualLanguage.ColorTextPrimary);

            if (_isSoft)
            {
                _softPrefixLabel.Visible = true;
                _mainLabel.Position = new Vector2(0, VisualLanguage.TextSm + VisualLanguage.Space1);
            }
            else
            {
                _softPrefixLabel.Visible = false;
                _mainLabel.Position = new Vector2(0, 0);
            }
        }

        // Split layout opacity
        Modulate = _isActiveHand
            ? Colors.White
            : new Color(1, 1, 1, VisualLanguage.OpacityDisabledPrimary);
    }
}
