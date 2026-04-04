using Godot;

/// <summary>
/// Insurance bet prompt modal. 480x200px. Shown during InsurancePrompt phase when
/// dealer shows an Ace. Presents TAKE INSURANCE / DECLINE decision.
///
/// Spec: component-boundaries.md Section 2 — InsuranceBetPrompt.tscn.
/// Annotations: annotations.md Sections 15b, 16, 17, 17b.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class InsuranceBetPrompt : Control
{
    // -------------------------------------------------------------------------
    // Signals
    // -------------------------------------------------------------------------

    [Signal] public delegate void InsuranceAcceptedEventHandler();
    [Signal] public delegate void InsuranceDeclinedEventHandler();

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    /// <summary>Half of the main bet (floor(MainBet/2)). Displayed in the cost label.</summary>
    [Export] public int InsuranceCost { get; set; } = 0;

    // -------------------------------------------------------------------------
    // Child references
    // -------------------------------------------------------------------------

    private Label? _headingLabel;
    private Label? _costLabel;
    private ActionButton? _takeBtn;
    private ActionButton? _declineBtn;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        // Position at top-left (720, 440), size 480x200
        Position = VisualLanguage.PosInsuranceModal;
        Size = VisualLanguage.SizeInsuranceModal;
        CustomMinimumSize = VisualLanguage.SizeInsuranceModal;
        ZIndex = 2;

        _BuildModal();
    }

    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    private void _BuildModal()
    {
        // Modal background — color_surface_modal at 60% opacity.
        // TODO Phase 13: wire shader blur — brand-review.md Section 2.5 requires 20px backdrop blur
        // behind this panel. Godot 4 StyleBoxFlat does not support backdrop blur natively; this
        // requires a BackBufferCopy + shader pass wired in the animation phase. The ColorRect at
        // the correct opacity is the accepted static-phase placeholder.
        var bg = new Panel();
        bg.Name = "ModalBackground";
        bg.Size = VisualLanguage.SizeInsuranceModal;
        bg.Position = Vector2.Zero;
        bg.MouseFilter = MouseFilterEnum.Ignore;

        var bgStyle = new StyleBoxFlat();
        bgStyle.BgColor = VisualLanguage.ColorSurfaceModal;
        bgStyle.CornerRadiusTopLeft    = VisualLanguage.CornerRadius;
        bgStyle.CornerRadiusTopRight   = VisualLanguage.CornerRadius;
        bgStyle.CornerRadiusBottomLeft  = VisualLanguage.CornerRadius;
        bgStyle.CornerRadiusBottomRight = VisualLanguage.CornerRadius;
        bg.AddThemeStyleboxOverride("panel", bgStyle);
        AddChild(bg);

        // Heading — "Insurance?" centered at (960, 440) = local (240, 0) after offset
        _headingLabel = new Label();
        _headingLabel.Name = "Heading";
        _headingLabel.Text = "Insurance?";
        _headingLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextXl);
        _headingLabel.AddThemeColorOverride("font_color", VisualLanguage.ColorTextPrimary);
        _headingLabel.HorizontalAlignment = HorizontalAlignment.Center;
        _headingLabel.Size = new Vector2(VisualLanguage.SizeInsuranceModal.X, VisualLanguage.TextXl + VisualLanguage.Space4);
        // y = 440 - 440 = 0 in local coords; centered vertically within first portion of modal
        _headingLabel.Position = new Vector2(0, VisualLanguage.Space4);
        AddChild(_headingLabel);

        // Insurance cost label — "Costs $[amount]" at (960, 510) = local (240, 70)
        _costLabel = new Label();
        _costLabel.Name = "CostLabel";
        _costLabel.Text = $"Costs ${InsuranceCost}";
        _costLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextBase);
        _costLabel.AddThemeColorOverride("font_color", VisualLanguage.ColorTextSecondary);
        _costLabel.HorizontalAlignment = HorizontalAlignment.Center;
        // Position: (960, 510) is (510 - modal.Y) px below modal top
        float costLabelLocalY = VisualLanguage.PosInsuranceTakeButton.Y - VisualLanguage.PosInsuranceModal.Y - VisualLanguage.Space8 - VisualLanguage.TextBase / 2;
        _costLabel.Position = new Vector2(0, costLabelLocalY);
        _costLabel.Size = new Vector2(VisualLanguage.SizeInsuranceModal.X, VisualLanguage.TextBase + VisualLanguage.Space2);
        AddChild(_costLabel);

        // TAKE INSURANCE button — (752, 578) absolute = (32, 138) local
        _takeBtn = new ActionButton();
        _takeBtn.Name = "TakeInsuranceButton";
        _takeBtn.Label = "TAKE INSURANCE";
        _takeBtn.IsEnabled = true;
        _takeBtn.IsGoldAccent = false;
        _takeBtn.Size = VisualLanguage.SizeInsuranceButton;
        _takeBtn.CustomMinimumSize = VisualLanguage.SizeInsuranceButton;
        // Local position derived from spec: absolute (752, 578) minus modal top-left (720, 440)
        _takeBtn.Position = VisualLanguage.PosInsuranceTakeButton - VisualLanguage.PosInsuranceModal;
        _takeBtn.ActionPressed += () => EmitSignal(SignalName.InsuranceAccepted);
        AddChild(_takeBtn);

        // DECLINE button — (968, 578) absolute = (248, 138) local
        _declineBtn = new ActionButton();
        _declineBtn.Name = "DeclineButton";
        _declineBtn.Label = "DECLINE";
        _declineBtn.IsEnabled = true;
        _declineBtn.IsGoldAccent = false;
        _declineBtn.Size = VisualLanguage.SizeInsuranceButton;
        _declineBtn.CustomMinimumSize = VisualLanguage.SizeInsuranceButton;
        // Local position derived from spec: absolute (968, 578) minus modal top-left (720, 440)
        _declineBtn.Position = VisualLanguage.PosInsuranceDeclineButton - VisualLanguage.PosInsuranceModal;
        _declineBtn.ActionPressed += () => EmitSignal(SignalName.InsuranceDeclined);
        AddChild(_declineBtn);
    }

    // -------------------------------------------------------------------------
    // Prop update
    // -------------------------------------------------------------------------

    public void SetInsuranceCost(int cost)
    {
        InsuranceCost = cost;
        if (_costLabel != null)
            _costLabel.Text = $"Costs ${cost}";
    }
}
