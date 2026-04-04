using Godot;

/// <summary>
/// Fixture: InsurancePrompt state (State 5).
/// GamePhase = InsurancePrompt.
/// Dealer shows Ace face-up with a face-down hole card.
/// Player hand is 10+8 = 18. InsuranceBetPrompt modal visible over the table.
/// Spec: screen-states.md State 5.
/// </summary>
public partial class FixtureInsurancePrompt : FixtureBase
{
    public override void _Ready()
    {
        AddBackground();
        AddTable();
        AddBankrollDisplay(amount: 975);

        // Main bet placed ($25) and locked
        AddBetZone(mainChips: new[] { 25 }, isActive: false);
        AddSideBetZone(triLuxActive: false, luckyLuckyActive: false);

        // Dealer hand: Ace face-up (index 0), hole card face-down (index 1)
        var dealerZone = AddDealerHand(
            ranks:     new[] { 1, 7 },
            suits:     new[] { "spades", "clubs" },
            faceUp:    new[] { true, false },
            showTotal: false,
            total:     0,
            isSoft:    false,
            isBust:    false);
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

        // InsuranceBetPrompt modal — cost is floor(25/2) = 12
        var insuranceModal = new InsuranceBetPrompt();
        insuranceModal.Name = "InsuranceBetPrompt";
        insuranceModal.InsuranceCost = 12;
        AddChild(insuranceModal);

        // No action bar during InsurancePrompt (only insurance buttons active)
        var actionBar = AddBettingActionBar(canDeal: false);
        actionBar.ShowBettingActions = false;
        actionBar.ShowGameActions = false;
    }
}
