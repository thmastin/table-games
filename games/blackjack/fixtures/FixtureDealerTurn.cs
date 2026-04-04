/// <summary>
/// Fixture: DealerTurn state.
/// Player stood at 18. Dealer's hole card has been flipped. Dealer has 6+9 = 15, drawing.
/// DealerTotalBadge visible. No action buttons. All cards face-up.
/// Spec: screen-states.md State 10.
/// </summary>
public partial class FixtureDealerTurn : FixtureBase
{
    public override void _Ready()
    {
        AddBackground();
        AddTable();
        AddBankrollDisplay(amount: 990);
        AddChipTray(selectedDenomination: 5);

        // Player hand stood at 18: 9♠ + 9♣; zone center y=730 keeps cards within felt
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

        // Dealer hand: 6♦ upcard + 9♥ hole card (now revealed) = 15
        AddDealerHand(
            ranks:      new[] { 6, 9 },
            suits:      new[] { "diamonds", "hearts" },
            faceUp:     new[] { true, true },
            showTotal:  true,
            total:      15,
            isSoft:     false,
            isBust:     false
        );

        var betZone = AddBetZone(mainChips: new[] { 5, 5 }, isActive: false);
        betZone.BetTotal = 10;
        betZone.Refresh();
        AddSideBetZone();
        // No action buttons during DealerTurn
    }
}
