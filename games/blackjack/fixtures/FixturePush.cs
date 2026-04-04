/// <summary>
/// Fixture: Resolution — Push state.
/// Player and dealer both have 18. Bet returned.
/// Push indicator shown at (960, 480). No gold bloom.
/// Spec: screen-states.md State 13.
/// </summary>
public partial class FixturePush : FixtureBase
{
    public override void _Ready()
    {
        AddBackground();
        AddTable();
        AddBankrollDisplay(amount: 1000);
        AddChipTray(selectedDenomination: 5);

        // Player: 9♠ + 9♣ = 18; zone center y=730 keeps cards within felt
        AddPlayerHand(
            ranks:   new[] { 9, 9 },
            suits:   new[] { "spades", "clubs" },
            faceUp:  new[] { true, true },
            total:   18,
            isSoft:  false,
            isBust:  false,
            isActive: true,
            center:  new Godot.Vector2(960, 730)
        );

        // Dealer: 8♦ + 10♥ = 18
        AddDealerHand(
            ranks:      new[] { 8, 10 },
            suits:      new[] { "diamonds", "hearts" },
            faceUp:     new[] { true, true },
            showTotal:  true,
            total:      18,
            isSoft:     false,
            isBust:     false
        );

        // Chips stay in place on push
        var betZone = AddBetZone(mainChips: new[] { 5, 5 }, isActive: false);
        betZone.BetTotal = 10;
        betZone.Refresh();
        AddSideBetZone();

        // ResultBanner — Push; must call Play() to make the PUSH label visible.
        // The banner positions itself at PosPushIndicator (960, 480) centered on the felt.
        // SourcePosition is used as the push label's initial position.
        var banner = new ResultBanner();
        banner.Name = "ResultBanner";
        banner.Result = ResultBanner.ResultType.Push;
        banner.SourcePosition = VisualLanguage.PosPushIndicator;
        banner.TargetPosition = VisualLanguage.PosPushIndicator;
        banner.ZIndex = 3;
        // Position the banner container at center of viewport so label appears at (960, 480)
        banner.Position = Godot.Vector2.Zero;
        banner.Size = new Godot.Vector2(VisualLanguage.ViewportWidth, VisualLanguage.ViewportHeight);
        AddChild(banner);

        // Play() reveals the PUSH label and runs its animation.
        // In a static fixture, this is appropriate — the viewer sees the push state.
        banner.Play();
    }
}
