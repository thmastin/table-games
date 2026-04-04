/// <summary>
/// Fixture: PlayerBroke state.
/// Resolution completed, bankroll = 0, which is below MinBet ($5).
/// CashierScreen overlay shown over the table.
/// Spec: screen-states.md State 15.
/// </summary>
public partial class FixturePlayerBroke : FixtureBase
{
    public override void _Ready()
    {
        AddBackground();
        AddTable();
        AddBankrollDisplay(amount: 0);
        AddChipTray(selectedDenomination: 5);

        // Last hand cards still visible under the overlay; zone center y=730 keeps cards within felt
        AddPlayerHand(
            ranks:   new[] { 10, 6 },
            suits:   new[] { "hearts", "spades" },
            faceUp:  new[] { true, true },
            total:   16,
            isSoft:  false,
            isBust:  false,
            isActive: false,
            center:  new Godot.Vector2(960, 730)
        );

        AddDealerHand(
            ranks:      new[] { 10, 9 },
            suits:      new[] { "clubs", "diamonds" },
            faceUp:     new[] { true, true },
            showTotal:  true,
            total:      19,
            isSoft:     false,
            isBust:     false
        );

        AddBetZone(mainChips: System.Array.Empty<int>(), isActive: false);
        AddSideBetZone();

        // CashierScreen overlay
        var cashier = new CashierScreen();
        cashier.Name = "CashierScreen";
        cashier.CurrentBankroll = 0;
        cashier.OutstandingLoanAmounts = System.Array.Empty<int>();
        cashier.TotalDebt = 0;
        cashier.DebtCeiling = 3000;
        cashier.LoanFlatFee = 50;
        cashier.IsTappedOut = false;
        cashier.DefaultStartingBankroll = 1000;
        cashier.ZIndex = 3;
        AddChild(cashier);
    }
}
