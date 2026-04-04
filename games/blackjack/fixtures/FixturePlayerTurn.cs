/// <summary>
/// Fixture: PlayerTurn state (single hand).
/// Player has: 7 of spades + 9 of hearts = hard 16.
/// Dealer shows: King of clubs (upcard) + face-down hole card.
/// Actions: Hit=true, Stand=true, Double=true, Split=false, Surrender=true.
/// DoubleDownBetSpot ghost zone shown (CanDouble=true).
/// Spec: screen-states.md State 6.
/// </summary>
public partial class FixturePlayerTurn : FixtureBase
{
    public override void _Ready()
    {
        AddBackground();
        AddTable();
        AddBankrollDisplay(amount: 990);
        AddChipTray(selectedDenomination: 5);

        // Player hand: 7♠ + 9♥ = 16 hard
        // ZoneCenter.Y = 730 puts cardTop at 730-56=674, well within felt (200-760).
        AddPlayerHand(
            ranks:   new[] { 7, 9 },
            suits:   new[] { "spades", "hearts" },
            faceUp:  new[] { true, true },
            total:   16,
            isSoft:  false,
            isBust:  false,
            isActive: true,
            center:  new Godot.Vector2(960, 730)
        );

        // Dealer hand: K♣ (upcard) + face-down hole card
        AddDealerHand(
            ranks:      new[] { 13, 5 },
            suits:      new[] { "clubs", "diamonds" },
            faceUp:     new[] { true, false },
            showTotal:  false,
            total:      0,
            isSoft:     false,
            isBust:     false
        );

        // Main bet with chips ($10 placed), show double-down ghost zone
        var betZone = AddBetZone(
            mainChips:   new[] { 5, 5 },
            isActive:    false,
            showDouble:  true,
            doubleChips: System.Array.Empty<int>()
        );
        betZone.BetTotal = 10;
        betZone.Refresh();
        AddSideBetZone();

        AddPlayerTurnActionBar(
            canHit:       true,
            canStand:     true,
            canDouble:    true,
            canSplit:     false,
            canSurrender: true
        );
    }
}
