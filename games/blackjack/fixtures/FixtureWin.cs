using Godot;

/// <summary>
/// Fixture: Resolution — Win state.
/// Player 19 beats dealer 15 (dealer busted drawing to 25).
/// ResultBanner shown in Win state. DealerTotalBadge shows "BUST".
/// Spec: screen-states.md State 11.
/// </summary>
public partial class FixtureWin : FixtureBase
{
    public override void _Ready()
    {
        AddBackground();
        AddTable();
        AddBankrollDisplay(amount: 1010);

        // Player hand: A♠ + 8♦ = 19 (soft, but shown as 19)
        AddPlayerHand(
            ranks:   new[] { 1, 8 },
            suits:   new[] { "spades", "diamonds" },
            faceUp:  new[] { true, true },
            total:   19,
            isSoft:  true,
            isBust:  false,
            isActive: true,
            center:  VisualLanguage.PosPlayerHandZoneCenter
        );

        // Dealer hand busted: 6♦ + 9♥ + 10♠ = 25 (bust)
        AddDealerHand(
            ranks:      new[] { 6, 9, 10 },
            suits:      new[] { "diamonds", "hearts", "spades" },
            faceUp:     new[] { true, true, true },
            showTotal:  true,
            total:      25,
            isSoft:     false,
            isBust:     true
        );

        AddBetZone(mainChips: new[] { 5, 5 }, isActive: false);
        AddSideBetZone();

        // ResultBanner in win state
        var banner = new ResultBanner();
        banner.Name = "ResultBanner";
        banner.Result = ResultBanner.ResultType.Win;
        banner.Amount = 10;
        banner.SourcePosition = VisualLanguage.PosMainBetSpotCenter;
        banner.TargetPosition = VisualLanguage.PosBankrollDisplay;
        banner.ZIndex = 3;
        AddChild(banner);
        // In fixture: show static label instead of animating
    }
}
