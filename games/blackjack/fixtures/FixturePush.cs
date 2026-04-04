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

        // Player: 9♠ + 9♣ = 18
        AddPlayerHand(
            ranks:   new[] { 9, 9 },
            suits:   new[] { "spades", "clubs" },
            faceUp:  new[] { true, true },
            total:   18,
            isSoft:  false,
            isBust:  false,
            isActive: true,
            center:  VisualLanguage.PosPlayerHandZoneCenter
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
        AddBetZone(mainChips: new[] { 5, 5 }, isActive: false);
        AddSideBetZone();

        // ResultBanner — Push
        var banner = new ResultBanner();
        banner.Name = "ResultBanner";
        banner.Result = ResultBanner.ResultType.Push;
        banner.SourcePosition = VisualLanguage.PosPushIndicator;
        banner.TargetPosition = VisualLanguage.PosPushIndicator;
        banner.ZIndex = 3;
        AddChild(banner);
    }
}
