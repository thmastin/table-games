/// <summary>
/// Fixture: Resolution — Loss state.
/// Player busted at 24 (drew 10 to hard 14). Dealer shows 20.
/// Player HandTotalBadge shows "BUST" in color_error.
/// Spec: screen-states.md State 12.
/// </summary>
public partial class FixtureLoss : FixtureBase
{
    public override void _Ready()
    {
        AddBackground();
        AddTable();
        AddBankrollDisplay(amount: 980);

        // Player busted: 6♠ + 8♣ + 10♥ = 24
        AddPlayerHand(
            ranks:   new[] { 6, 8, 10 },
            suits:   new[] { "spades", "clubs", "hearts" },
            faceUp:  new[] { true, true, true },
            total:   24,
            isSoft:  false,
            isBust:  true,
            isActive: true,
            center:  VisualLanguage.PosPlayerHandZoneCenter
        );

        // Dealer: K♦ + 10♣ = 20
        AddDealerHand(
            ranks:      new[] { 13, 10 },
            suits:      new[] { "diamonds", "clubs" },
            faceUp:     new[] { true, true },
            showTotal:  true,
            total:      20,
            isSoft:     false,
            isBust:     false
        );

        AddBetZone(mainChips: System.Array.Empty<int>(), isActive: false);
        AddSideBetZone();

        // ResultBanner with Loss — renders nothing visually (loss is absence of signal)
        var banner = new ResultBanner();
        banner.Name = "ResultBanner";
        banner.Result = ResultBanner.ResultType.Loss;
        banner.ZIndex = 3;
        AddChild(banner);
    }
}
