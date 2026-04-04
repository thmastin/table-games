using Godot;

/// <summary>
/// Renders a single primary game action button — label plus optional icon.
/// Handles enabled, disabled, and hover states.
/// Does not know which game action it triggers.
///
/// Spec: component-boundaries.md Section 1 — ActionButton.tscn.
/// Annotations: annotations.md Sections 7-13, 16-17.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class ActionButton : Control
{
    // -------------------------------------------------------------------------
    // Signal
    // -------------------------------------------------------------------------

    [Signal] public delegate void ActionPressedEventHandler();

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    /// <summary>Button label text — Manrope, text_base, Bold, all-caps.</summary>
    [Export] public string Label { get; set; } = "ACTION";

    /// <summary>res:// path to SVG icon asset. Empty = no icon.</summary>
    [Export] public string IconPath { get; set; } = "";

    /// <summary>True = interactive; false = dimmed, non-interactive.</summary>
    [Export] public bool IsEnabled { get; set; } = true;

    /// <summary>True = gold accent treatment (Deal button). False = default surface.</summary>
    [Export] public bool IsGoldAccent { get; set; } = false;

    // -------------------------------------------------------------------------
    // Child references
    // -------------------------------------------------------------------------

    private Panel? _background;
    private Label? _label;
    private TextureRect? _icon;

    private bool _isHovered = false;
    private bool _isPressed = false;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        MouseEntered += _OnMouseEntered;
        MouseExited  += _OnMouseExited;

        _BuildNodes();
        _ApplyState();
    }

    // -------------------------------------------------------------------------
    // Input handling
    // -------------------------------------------------------------------------

    public override void _GuiInput(InputEvent @event)
    {
        if (!IsEnabled) return;

        if (@event is InputEventMouseButton mb)
        {
            if (mb.ButtonIndex == MouseButton.Left)
            {
                _isPressed = mb.Pressed;
                _ApplyState();

                if (!mb.Pressed)
                    EmitSignal(SignalName.ActionPressed);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Node construction
    // -------------------------------------------------------------------------

    private void _BuildNodes()
    {
        MouseFilter = MouseFilterEnum.Stop;

        // Background panel
        _background = new Panel();
        _background.Name = "Background";
        _background.Size = Size.Equals(Vector2.Zero) ? new Vector2(VisualLanguage.SizeActionButton.X, VisualLanguage.SizeActionButton.Y) : Size;
        _background.Position = Vector2.Zero;
        _background.MouseFilter = MouseFilterEnum.Ignore;
        AddChild(_background);

        // Label
        _label = new Label();
        _label.Name = "ButtonLabel";
        _label.Text = Label.ToUpper();
        _label.AddThemeFontSizeOverride("font_size", VisualLanguage.TextBase);
        _label.HorizontalAlignment = HorizontalAlignment.Center;
        _label.VerticalAlignment = VerticalAlignment.Center;
        _label.Size = _background.Size;
        _label.Position = Vector2.Zero;
        _label.MouseFilter = MouseFilterEnum.Ignore;
        AddChild(_label);

        // Icon (optional)
        if (!string.IsNullOrEmpty(IconPath))
        {
            _icon = new TextureRect();
            _icon.Name = "Icon";
            _icon.CustomMinimumSize = new Vector2(VisualLanguage.IconBase, VisualLanguage.IconBase);
            _icon.StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered;
            _icon.MouseFilter = MouseFilterEnum.Ignore;
            // Positioned left of label center — offset by icon width + space_2
            float iconX = VisualLanguage.Space4;
            float iconY = (_background.Size.Y - VisualLanguage.IconBase) / 2f;
            _icon.Position = new Vector2(iconX, iconY);
            AddChild(_icon);
        }
    }

    // -------------------------------------------------------------------------
    // State rendering
    // -------------------------------------------------------------------------

    private void _ApplyState()
    {
        if (_background == null || _label == null) return;

        _label.Text = Label.ToUpper();

        Color bgColor;
        Color textColor;

        if (!IsEnabled)
        {
            if (IsGoldAccent)
            {
                bgColor = new Color(VisualLanguage.ColorGold, VisualLanguage.OpacityDisabledPrimary);
                textColor = new Color(VisualLanguage.ColorBackground, VisualLanguage.OpacityDisabledContent);
            }
            else
            {
                bgColor = new Color(VisualLanguage.ColorSurface, VisualLanguage.OpacityDisabledPrimary);
                textColor = new Color(VisualLanguage.ColorTextSecondary, VisualLanguage.OpacityDisabledPrimary);
            }
            MouseFilter = MouseFilterEnum.Ignore;
        }
        else if (_isPressed)
        {
            bgColor = IsGoldAccent
                ? new Color(VisualLanguage.ColorGold, VisualLanguage.OpacityButtonPressed)
                : new Color(VisualLanguage.ColorSurface, VisualLanguage.OpacityButtonPressed);
            textColor = IsGoldAccent ? VisualLanguage.ColorBackground : VisualLanguage.ColorTextPrimary;
            // Press feedback: translate 1px down
            _background.Position = new Vector2(0, 1);
            _label.Position = new Vector2(0, 1);
            MouseFilter = MouseFilterEnum.Stop;
        }
        else if (_isHovered)
        {
            bgColor = IsGoldAccent ? VisualLanguage.ColorGoldLight : VisualLanguage.ColorSurfaceHigh;
            textColor = IsGoldAccent ? VisualLanguage.ColorBackground : VisualLanguage.ColorTextPrimary;
            _background.Position = Vector2.Zero;
            _label.Position = Vector2.Zero;
            MouseFilter = MouseFilterEnum.Stop;
        }
        else
        {
            // Default enabled state
            bgColor = IsGoldAccent ? VisualLanguage.ColorGold : VisualLanguage.ColorSurface;
            textColor = IsGoldAccent ? VisualLanguage.ColorBackground : VisualLanguage.ColorTextPrimary;
            _background.Position = Vector2.Zero;
            _label.Position = Vector2.Zero;
            MouseFilter = MouseFilterEnum.Stop;
        }

        var style = new StyleBoxFlat();
        style.BgColor = bgColor;
        style.CornerRadiusTopLeft    = VisualLanguage.CornerRadius;
        style.CornerRadiusTopRight   = VisualLanguage.CornerRadius;
        style.CornerRadiusBottomLeft  = VisualLanguage.CornerRadius;
        style.CornerRadiusBottomRight = VisualLanguage.CornerRadius;
        _background.AddThemeStyleboxOverride("panel", style);

        _label.AddThemeColorOverride("font_color", textColor);

        if (_icon != null)
        {
            var iconColor = IsGoldAccent
                ? VisualLanguage.ColorBackground
                : (_isHovered ? VisualLanguage.ColorTextPrimary : VisualLanguage.ColorTextSecondary);
            _icon.Modulate = IsEnabled ? iconColor : new Color(iconColor, VisualLanguage.OpacityDisabledContent);
        }
    }

    // -------------------------------------------------------------------------
    // Hover callbacks
    // -------------------------------------------------------------------------

    private void _OnMouseEntered()
    {
        _isHovered = true;
        _ApplyState();
    }

    private void _OnMouseExited()
    {
        _isHovered = false;
        _isPressed = false;
        _ApplyState();
    }
}
