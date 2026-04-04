using Godot;

/// <summary>
/// Renders the 6-chip denomination row at the bottom of the left chrome panel.
/// Each chip is a Chip instance with IsTraySize = true.
/// Highlights the selected denomination and dims unaffordable ones.
///
/// Spec: component-boundaries.md Section 1 — ChipTray.tscn [shared].
/// Annotations: annotations.md Section 2.
/// Screen-states.md Fixed Elements table: position (10, 900), size 200x64.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class ChipTray : Control
{
    // -------------------------------------------------------------------------
    // Signal
    // -------------------------------------------------------------------------

    [Signal] public delegate void DenominationSelectedEventHandler(int denomination);

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    /// <summary>Currently selected denomination (highlighted chip).</summary>
    [Export] public int SelectedDenomination { get; set; } = 0;

    /// <summary>Which denominations are selectable (others dimmed). Empty = all affordable.</summary>
    [Export] public int[] AffordableDenominations { get; set; } = new[] { 1, 5, 25, 100, 500, 1000 };

    // -------------------------------------------------------------------------
    // Denomination set (fixed per spec)
    // -------------------------------------------------------------------------

    private static readonly int[] _denominations = { 1, 5, 25, 100, 500, 1000 };

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        Position = VisualLanguage.PosChipTray;
        Size = VisualLanguage.SizeChipTray;
        CustomMinimumSize = VisualLanguage.SizeChipTray;

        _BuildTray();
    }

    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    private void _BuildTray()
    {
        // Tray background
        var bg = new ColorRect();
        bg.Name = "TrayBackground";
        bg.Color = VisualLanguage.ColorSurface;
        bg.Size = VisualLanguage.SizeChipTray;
        bg.Position = Vector2.Zero;
        bg.MouseFilter = MouseFilterEnum.Ignore;
        AddChild(bg);

        // Chips: 6 denominations spaced evenly across the 200px tray width.
        // Annotations Section 2: chip centers at y = 930 within left chrome panel.
        // Tray is at (10, 900), so local y center = 930 - 900 = 30.
        // x positions (local): 22, 66, 110, 154, 198, 242 — but tray is 200px wide,
        // so spread across available width with diameter 44 and spacing per spec.
        int diameter = VisualLanguage.ChipDiameterTray;
        float localY = (VisualLanguage.SizeChipTray.Y - diameter) / 2f;
        float spacing = VisualLanguage.SizeChipTray.X / _denominations.Length;

        for (int i = 0; i < _denominations.Length; i++)
        {
            int denom = _denominations[i];
            bool isAffordable = _IsAffordable(denom);

            var chip = new Chip();
            chip.Name = $"Chip_{denom}";
            chip.Denomination = denom;
            chip.IsSelected = (denom == SelectedDenomination);
            chip.IsTraySize = true;

            float localX = spacing * i + (spacing - diameter) / 2f;
            chip.Position = new Vector2(localX, localY);

            if (!isAffordable)
                chip.Modulate = new Color(1, 1, 1, VisualLanguage.OpacityDisabledSecondary);

            // Capture loop variable for closure
            int captured = denom;
            chip.ChipClicked += (_) => _OnChipClicked(captured);
            AddChild(chip);
        }
    }

    // -------------------------------------------------------------------------
    // Interaction
    // -------------------------------------------------------------------------

    private void _OnChipClicked(int denomination)
    {
        if (!_IsAffordable(denomination)) return;
        SelectedDenomination = denomination;
        EmitSignal(SignalName.DenominationSelected, denomination);
    }

    private bool _IsAffordable(int denomination)
    {
        if (AffordableDenominations == null || AffordableDenominations.Length == 0)
            return true;
        foreach (var d in AffordableDenominations)
            if (d == denomination) return true;
        return false;
    }
}
