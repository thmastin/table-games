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
		AddChipTray(selectedDenomination: 5);

		// BetZone with chips and bet total ($10 = 5+5)
		var betZone = AddBetZone(mainChips: new[] { 5, 5 }, isActive: true);
		betZone.BetTotal = 10;
		betZone.Refresh();

		AddSideBetZone(triLuxActive: true, luckyLuckyActive: true);

		// Action bar: Deal and Clear both enabled (MainBet >= MinBet, MainBet > 0)
		var actionBar = new BlackjackActionBar();
		actionBar.Name = "ActionBar";
		actionBar.ShowBettingActions = true;
		actionBar.ShowGameActions = false;
		actionBar.CanDeal = true;
		actionBar.CanClearBet = true;
		actionBar.ZIndex = 2;
		AddChild(actionBar);
	}
}
