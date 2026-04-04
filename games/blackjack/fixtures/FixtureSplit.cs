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
        AddChipTray(selectedDenomination: 5);

        // Split hand zone centers: Y=730 keeps cardTop=674, within felt (200-760).
        var splitHand0Center = new Godot.Vector2(VisualLanguage.PosSplitHand0Center2.X, 730);
        var splitHand1Center = new Godot.Vector2(VisualLanguage.PosSplitHand1Center2.X, 730);

        // Hand 0 (left, active): 8♠ + 5♦ = 13
        var hand0 = AddPlayerHand(
            ranks:   new[] { 8, 5 },
            suits:   new[] { "spades", "diamonds" },
            faceUp:  new[] { true, true },
            total:   13,
            isSoft:  false,
            isBust:  false,
            isActive: true,
            center:  splitHand0Center
        );
        hand0.Name = "PlayerHandZone0";

        // Hand 1 (right, inactive): 8♣ + 3♥ = 11
        // Apply 60% opacity to the entire zone (cards + badge) per opacity_disabled_primary.
        var hand1 = AddPlayerHand(
            ranks:   new[] { 8, 3 },
            suits:   new[] { "clubs", "hearts" },
            faceUp:  new[] { true, true },
            total:   11,
            isSoft:  false,
            isBust:  false,
            isActive: false,
            center:  splitHand1Center
        );
        hand1.Name = "PlayerHandZone1";
        hand1.Modulate = new Godot.Color(1, 1, 1, VisualLanguage.OpacityDisabledPrimary);

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

        // Two BetSpots — one per hand, positioned below each hand zone.
        // Hand zones are at y=730 (center), cards top at 674, cards bottom at 674+112=786.
        // Bet zones sit just below cards: y = 786 + space_4 (16px) = 802 for center.
        float betCenterY = 730f + VisualLanguage.CardHeight / 2f + VisualLanguage.Space4 + VisualLanguage.SizeMainBetSpot.Y / 2f;

        var betZone0 = new BlackjackBetZone();
        betZone0.Name = "BetZone0";
        betZone0.MainBetChips = new[] { 5, 5 };
        betZone0.BetTotal = 10;
        betZone0.IsMainBetActive = false;
        betZone0.Position = new Godot.Vector2(
            splitHand0Center.X - VisualLanguage.SizeMainBetSpot.X / 2,
            betCenterY - VisualLanguage.SizeMainBetSpot.Y / 2
        );
        betZone0.ZIndex = 1;
        AddChild(betZone0);

        var betZone1 = new BlackjackBetZone();
        betZone1.Name = "BetZone1";
        betZone1.MainBetChips = new[] { 5, 5 };
        betZone1.BetTotal = 10;
        betZone1.IsMainBetActive = false;
        betZone1.Position = new Godot.Vector2(
            splitHand1Center.X - VisualLanguage.SizeMainBetSpot.X / 2,
            betCenterY - VisualLanguage.SizeMainBetSpot.Y / 2
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
