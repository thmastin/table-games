/// <summary>
/// Fixture: Idle state.
/// GamePhase = Idle. No cards. No bet. All interactive elements disabled.
/// Fixed elements visible. Deal button dimmed. Action buttons hidden.
/// Spec: screen-states.md State 1.
/// </summary>
public partial class FixtureIdle : FixtureBase
{
    public override void _Ready()
    {
        AddBackground();
        AddTable();
        AddBankrollDisplay(amount: 1000);
        AddChipTray(selectedDenomination: 5);
        AddBetZone(mainChips: System.Array.Empty<int>(), isActive: false);
        AddSideBetZone();
        AddBettingActionBar(canDeal: false);
    }
}
