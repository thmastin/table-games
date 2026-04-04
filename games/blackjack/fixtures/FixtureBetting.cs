/// <summary>
/// Fixture: Betting state.
/// GamePhase = Betting. Main bet spot active with chips ($5 x 2 = $10 bet).
/// Side bet spots active (MainBet > 0). Deal button enabled. Clear Bet enabled.
/// Spec: screen-states.md State 2.
/// </summary>
public partial class FixtureBetting : FixtureBase
{
    public override void _Ready()
    {
        AddBackground();
        AddTable();
        AddBankrollDisplay(amount: 990);
        AddBetZone(mainChips: new[] { 5, 5 }, isActive: true);
        AddSideBetZone(triLuxActive: true, luckyLuckyActive: true);

        var actionBar = AddBettingActionBar(canDeal: true);
        // Clear bet enabled when MainBet > 0 — set via CanClearBet prop
        actionBar.ShowBettingActions = true;
        actionBar.CanDeal = true;
        actionBar.CanClearBet = true; // MainBet > 0 in this fixture
    }
}
