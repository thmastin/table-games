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
        AddChipTray(selectedDenomination: 5);

        // Player hand: A♠ + 8♦ = 19 (soft); zone center y=730 keeps cards within felt
        AddPlayerHand(
            ranks:   new[] { 1, 8 },
            suits:   new[] { "spades", "diamonds" },
            faceUp:  new[] { true, true },
            total:   19,
            isSoft:  true,
            isBust:  false,
            isActive: true,
            center:  new Godot.Vector2(960, 730)
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

        var betZone = AddBetZone(mainChips: new[] { 5, 5 }, isActive: false);
        betZone.BetTotal = 10;
        betZone.Refresh();
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
