using Godot;

/// <summary>
/// Fixture: SideBetResolution state (State 4).
/// GamePhase = SideBetResolution.
/// Table with four dealt cards, two SideBetResultBanner components showing a win result,
/// and TipPrompt visible (TriLux win + DealerTipEnabled scenario).
/// Spec: screen-states.md State 4.
/// </summary>
public partial class FixtureSideBetResolution : FixtureBase
{
    public override void _Ready()
    {
        AddBackground();
        AddTable();
        AddBankrollDisplay(amount: 1025);

        // Bet zones — bet is locked during SideBetResolution
        AddBetZone(mainChips: new[] { 25 }, isActive: false);
        AddSideBetZone(
            triLuxChips: new[] { 5 },
            luckyLuckyChips: new[] { 5 },
            triLuxActive: false,
            luckyLuckyActive: false);

        // Dealer hand: Ace face-up, hole card face-down
        var dealerZone = AddDealerHand(
            ranks:    new[] { 1, 7 },
            suits:    new[] { "spades", "hearts" },
            faceUp:   new[] { true, false },
            showTotal: false,
            total:    0,
            isSoft:   false,
            isBust:   false);
        dealerZone.CardsFaceUp = new[] { true, false };

        // Player hand: 10 + 8 = 18
        AddPlayerHand(
            ranks:    new[] { 10, 8 },
            suits:    new[] { "clubs", "diamonds" },
            faceUp:   new[] { true, true },
            total:    18,
            isSoft:   false,
            isBust:   false,
            isActive: true,
            center:   VisualLanguage.PosPlayerHandZoneCenter);

        // SideBetResultBanner — TriLux win
        var triLuxBanner = new SideBetResultBanner();
        triLuxBanner.Name = "TriLuxBanner";
        triLuxBanner.BetType = "TriLux";
        triLuxBanner.Outcome = "Win";
        triLuxBanner.PayoutLabel = "+$25";
        triLuxBanner.Position = VisualLanguage.PosSideBetBannerTriLux;
        triLuxBanner.ZIndex = 2;
        AddChild(triLuxBanner);

        // SideBetResultBanner — LuckyLucky win
        var luckyBanner = new SideBetResultBanner();
        luckyBanner.Name = "LuckyLuckyBanner";
        luckyBanner.BetType = "Lucky Lucky";
        luckyBanner.Outcome = "Win";
        luckyBanner.PayoutLabel = "+$10";
        luckyBanner.Position = VisualLanguage.PosSideBetBannerLuckyLucky;
        luckyBanner.ZIndex = 2;
        AddChild(luckyBanner);

        // TipPrompt — visible because TriLux won and DealerTipEnabled
        var tipPrompt = new TipPrompt();
        tipPrompt.Name = "TipPrompt";
        tipPrompt.IsVisible2 = true;
        AddChild(tipPrompt);

        // No action bar shown during SideBetResolution (all input blocked)
        var actionBar = AddBettingActionBar(canDeal: false);
        actionBar.ShowBettingActions = false;
        actionBar.ShowGameActions = false;
    }
}
