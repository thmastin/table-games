using Godot;

/// <summary>
/// Full-screen overlay for bankroll management. Shown when PlayerBroke phase is entered.
/// Handles: reload state, loan interface, and tapped-out state.
///
/// Spec: component-boundaries.md Section 1 — CashierScreen.tscn [shared].
/// Screen-states.md Section 15.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class CashierScreen : Control
{
    // -------------------------------------------------------------------------
    // Signals
    // -------------------------------------------------------------------------

    [Signal] public delegate void LoanRequestedEventHandler(int amount);
    [Signal] public delegate void LoanRepaidEventHandler(int loanIndex);
    [Signal] public delegate void NewSessionRequestedEventHandler();
    [Signal] public delegate void DismissedEventHandler();

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    [Export] public int  CurrentBankroll          { get; set; } = 0;
    [Export] public int[] OutstandingLoanAmounts  { get; set; } = System.Array.Empty<int>();
    [Export] public int  TotalDebt                { get; set; } = 0;
    [Export] public int  DebtCeiling              { get; set; } = 3000;
    [Export] public int  LoanFlatFee              { get; set; } = 50;
    [Export] public bool IsTappedOut              { get; set; } = false;
    [Export] public bool IsNewSession             { get; set; } = false;
    [Export] public int  DefaultStartingBankroll  { get; set; } = 1000;

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        // Full-screen overlay
        Position = Vector2.Zero;
        Size = new Vector2(VisualLanguage.ViewportWidth, VisualLanguage.ViewportHeight);
        ZIndex = 3;

        _BuildOverlay();
    }

    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    private void _BuildOverlay()
    {
        // Full-screen backdrop at OpacityCashierBackdrop (80%).
        // TODO Phase 13: wire shader blur — brand-review.md Section 2.5 requires 20px backdrop blur
        // on modal surfaces. Godot 4 StyleBoxFlat does not support backdrop blur natively; this
        // requires a BackBufferCopy + shader pass wired in the animation phase. The ColorRect at
        // OpacityCashierBackdrop is the accepted static-phase placeholder.
        var backdrop = new ColorRect();
        backdrop.Name = "Backdrop";
        backdrop.Color = new Color(VisualLanguage.ColorBackground, VisualLanguage.OpacityCashierBackdrop);
        backdrop.Size = Size;
        backdrop.Position = Vector2.Zero;
        backdrop.MouseFilter = MouseFilterEnum.Ignore;
        AddChild(backdrop);

        // Panel container — 800x600 centered
        var panel = new Panel();
        panel.Name = "CashierPanel";
        panel.Size = VisualLanguage.SizeCashierPanel;
        panel.Position = VisualLanguage.PosCashierPanel;

        var panelStyle = new StyleBoxFlat();
        panelStyle.BgColor = VisualLanguage.ColorSurfaceModal;
        panelStyle.CornerRadiusTopLeft    = VisualLanguage.CornerRadius;
        panelStyle.CornerRadiusTopRight   = VisualLanguage.CornerRadius;
        panelStyle.CornerRadiusBottomLeft  = VisualLanguage.CornerRadius;
        panelStyle.CornerRadiusBottomRight = VisualLanguage.CornerRadius;
        panel.AddThemeStyleboxOverride("panel", panelStyle);
        AddChild(panel);

        // Heading — "ADD CHIPS" or "TAPPED OUT"
        var heading = new Label();
        heading.Name = "Heading";
        heading.Text = IsTappedOut ? "TAPPED OUT" : "ADD CHIPS";
        heading.AddThemeFontSizeOverride("font_size", VisualLanguage.TextDisplaySm);
        heading.AddThemeColorOverride("font_color", VisualLanguage.ColorTextPrimary);
        heading.HorizontalAlignment = HorizontalAlignment.Center;
        heading.Size = new Vector2(VisualLanguage.SizeCashierPanel.X, VisualLanguage.TextDisplaySm + VisualLanguage.Space4);
        // (960, 300) absolute = local y = CashierHeadingLocalY within panel at (560, 240)
        heading.Position = new Vector2(0, VisualLanguage.CashierHeadingLocalY);
        panel.AddChild(heading);

        // Bankroll display
        var bankrollLabel = new Label();
        bankrollLabel.Name = "BankrollLabel";
        bankrollLabel.Text = $"Balance: ${CurrentBankroll}";
        bankrollLabel.AddThemeFontSizeOverride("font_size", VisualLanguage.TextLg);
        bankrollLabel.AddThemeColorOverride("font_color", VisualLanguage.ColorTextSecondary);
        bankrollLabel.HorizontalAlignment = HorizontalAlignment.Center;
        bankrollLabel.Size = new Vector2(VisualLanguage.SizeCashierPanel.X, VisualLanguage.TextLg + VisualLanguage.Space4);
        bankrollLabel.Position = new Vector2(0, VisualLanguage.CashierBankrollLocalY);
        panel.AddChild(bankrollLabel);

        // Loan button (if not tapped out)
        if (!IsTappedOut)
        {
            var loanBtn = new ActionButton();
            loanBtn.Name = "LoanButton";
            loanBtn.Label = $"BORROW ${VisualLanguage.LoanIncrement}";
            loanBtn.IsEnabled = true;
            loanBtn.IsGoldAccent = false;
            loanBtn.Size = VisualLanguage.SizeCashierButton;
            loanBtn.Position = new Vector2(VisualLanguage.CashierLoanButtonLocalX, VisualLanguage.CashierLoanButtonLocalY);
            loanBtn.ActionPressed += () => EmitSignal(SignalName.LoanRequested, VisualLanguage.LoanIncrement);
            panel.AddChild(loanBtn);
        }

        // New Session button (tapped out only)
        if (IsTappedOut || IsNewSession)
        {
            var newSessionBtn = new ActionButton();
            newSessionBtn.Name = "NewSessionButton";
            newSessionBtn.Label = "NEW SESSION";
            newSessionBtn.IsEnabled = true;
            newSessionBtn.IsGoldAccent = false;
            newSessionBtn.Size = VisualLanguage.SizeCashierButton;
            newSessionBtn.Position = new Vector2(VisualLanguage.CashierLoanButtonLocalX, VisualLanguage.CashierNewSessionLocalY);
            newSessionBtn.ActionPressed += () => EmitSignal(SignalName.NewSessionRequested);
            panel.AddChild(newSessionBtn);
        }

        // Return to Table button (if bankroll > 0)
        if (CurrentBankroll > 0)
        {
            var returnBtn = new ActionButton();
            returnBtn.Name = "ReturnButton";
            returnBtn.Label = "RETURN TO TABLE";
            returnBtn.IsEnabled = true;
            returnBtn.IsGoldAccent = true;
            returnBtn.Size = VisualLanguage.SizeCashierButton;
            returnBtn.Position = new Vector2(VisualLanguage.CashierLoanButtonLocalX, VisualLanguage.CashierReturnLocalY);
            returnBtn.ActionPressed += () => EmitSignal(SignalName.Dismissed);
            panel.AddChild(returnBtn);
        }
    }
}
