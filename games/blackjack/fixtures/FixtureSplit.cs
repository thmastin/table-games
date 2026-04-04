/// <summary>
/// Fixture: PlayerTurn — Split Hand Layout (2 hands).
/// Player split a pair of 8s. Hand 0 (left) is active with 8+5=13. Hand 1 (right) has 8+3=11.
/// Two PlayerHandZone instances. Two BetSpots.
/// Spec: screen-states.md State 7.
/// </summary>
public partial class FixtureSplit : FixtureBase
{
    public override void _Ready()
    {
        AddBackground();
        AddTable();
        AddBankrollDisplay(amount: 980);

        // Hand 0 (left, active): 8♠ + 5♦ = 13
        var hand0 = AddPlayerHand(
            ranks:   new[] { 8, 5 },
            suits:   new[] { "spades", "diamonds" },
            faceUp:  new[] { true, true },
            total:   13,
            isSoft:  false,
            isBust:  false,
            isActive: true,
            center:  VisualLanguage.PosSplitHand0Center2
        );
        hand0.Name = "PlayerHandZone0";

        // Hand 1 (right, inactive): 8♣ + 3♥ = 11
        var hand1 = AddPlayerHand(
            ranks:   new[] { 8, 3 },
            suits:   new[] { "clubs", "hearts" },
            faceUp:  new[] { true, true },
            total:   11,
            isSoft:  false,
            isBust:  false,
            isActive: false,
            center:  VisualLanguage.PosSplitHand1Center2
        );
        hand1.Name = "PlayerHandZone1";

        // Dealer: A♦ upcard + face-down hole card
        AddDealerHand(
            ranks:      new[] { 1, 7 },
            suits:      new[] { "diamonds", "clubs" },
            faceUp:     new[] { true, false },
            showTotal:  false,
            total:      0,
            isSoft:     false,
            isBust:     false
        );

        // Two BetSpots — one per hand under each zone
        var betZone0 = new BlackjackBetZone();
        betZone0.Name = "BetZone0";
        betZone0.MainBetChips = new[] { 5, 5 };
        betZone0.IsMainBetActive = false;
        // Center at (810, 870) → top-left = (810-44, 870-40) = (766, 830)
        betZone0.Position = new Godot.Vector2(
            VisualLanguage.PosSplitBet0Center2.X - VisualLanguage.SizeMainBetSpot.X / 2,
            VisualLanguage.PosSplitBet0Center2.Y - VisualLanguage.SizeMainBetSpot.Y / 2
        );
        betZone0.ZIndex = 1;
        AddChild(betZone0);

        var betZone1 = new BlackjackBetZone();
        betZone1.Name = "BetZone1";
        betZone1.MainBetChips = new[] { 5, 5 };
        betZone1.IsMainBetActive = false;
        betZone1.Position = new Godot.Vector2(
            VisualLanguage.PosSplitBet1Center2.X - VisualLanguage.SizeMainBetSpot.X / 2,
            VisualLanguage.PosSplitBet1Center2.Y - VisualLanguage.SizeMainBetSpot.Y / 2
        );
        betZone1.ZIndex = 1;
        AddChild(betZone1);

        AddSideBetZone();

        // Action bar for active hand (Hand 0): can Hit, Stand, Double; cannot Split or Surrender
        AddPlayerTurnActionBar(
            canHit:       true,
            canStand:     true,
            canDouble:    true,
            canSplit:     false,
            canSurrender: false
        );
    }
}
