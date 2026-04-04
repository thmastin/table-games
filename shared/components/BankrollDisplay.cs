using Godot;

/// <summary>
/// Renders the player's current bankroll as a tabular numeral display.
/// Manrope SemiBold, text_lg, color_text_primary, dollar sign prefix.
/// Updates with a brief counter animation when the value changes.
/// Display-only — no signals.
///
/// Spec: component-boundaries.md Section 1 — BankrollDisplay.tscn.
/// Annotations: annotations.md Section 1.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class BankrollDisplay : Control
{
    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    private int _amount = 1000;

    /// <summary>Current bankroll in dollars. Display updates on change.</summary>
    [Export]
    public int Amount
    {
        get => _amount;
        set
        {
            _amount = value;
            if (_label != null)
                _UpdateDisplay();
        }
    }

    // -------------------------------------------------------------------------
    // Child references
    // -------------------------------------------------------------------------

    private Label? _label;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        CustomMinimumSize = VisualLanguage.SizeBankrollDisplay;

        _label = new Label();
        _label.Name = "AmountLabel";
        _label.AddThemeFontSizeOverride("font_size", VisualLanguage.TextLg);
        _label.AddThemeColorOverride("font_color", VisualLanguage.ColorTextPrimary);
        _label.Size = VisualLanguage.SizeBankrollDisplay;
        _label.Position = new Vector2(VisualLanguage.Space4, VisualLanguage.Space3);
        _label.VerticalAlignment = VerticalAlignment.Center;
        _label.AutowrapMode = TextServer.AutowrapMode.Off;
        AddChild(_label);

        _UpdateDisplay();
    }

    // -------------------------------------------------------------------------
    // Display
    // -------------------------------------------------------------------------

    private void _UpdateDisplay()
    {
        if (_label == null) return;
        _label.Text = $"${_amount:N0}";
    }
}
