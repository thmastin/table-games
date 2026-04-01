using NUnit.Framework;
using TableGames.Blackjack.Logic;

namespace TableGames.Tests.Blackjack;

/// <summary>
/// Tests for action availability: Hit, Stand, Double Down, Split, Surrender, Insurance.
/// Spec references: game-spec.md Sections 6, 8.
/// </summary>
[TestFixture]
public class PlayerActionTests
{
    private static Card C(int rank, Suit suit = Suit.Spades) => new Card(rank, suit);

    // ---- 6.1 Hit ----

    [Test]
    public void Hit_Enabled_When_PlayerTurn_And_Hand_Under_21_And_Not_SplitAces()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(5), C(6) }, // total 11
            dealerUp: C(10),
            bankroll: 1000,
            splitAces: false
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanHit, Is.True);
    }

    [Test]
    public void Hit_Disabled_When_Phase_Is_Not_PlayerTurn()
    {
        var state = TestStateBuilder.WithPhase(GamePhase.Betting);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanHit, Is.False);
    }

    [Test]
    public void Hit_Disabled_When_Hand_Total_Is_21()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(10), C(11) }, // 20... no: 10+J=20
            dealerUp: C(7),
            bankroll: 1000
        );
        // Build state with exactly 21
        var state21 = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(10), C(5), C(6) }, // 21
            dealerUp: C(7),
            bankroll: 1000
        );
        var avail = ActionAvailabilityCalculator.Compute(state21);
        Assert.That(avail.CanHit, Is.False);
    }

    [Test]
    public void Hit_Disabled_When_Hand_Is_Bust()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(10), C(10), C(5) }, // 25, bust
            dealerUp: C(7),
            bankroll: 1000,
            isBust: true
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanHit, Is.False);
    }

    [Test]
    public void Hit_Disabled_On_SplitAces_Hand()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(1), C(5) }, // Ace + 5, split aces hand
            dealerUp: C(7),
            bankroll: 1000,
            splitAces: true
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanHit, Is.False);
    }

    // ---- 6.2 Stand ----

    [Test]
    public void Stand_Enabled_When_PlayerTurn_And_Hand_Not_Bust()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(10), C(7) }, // 17
            dealerUp: C(8),
            bankroll: 1000
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanStand, Is.True);
    }

    [Test]
    public void Stand_Disabled_When_Phase_Is_Not_PlayerTurn()
    {
        var state = TestStateBuilder.WithPhase(GamePhase.Dealing);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanStand, Is.False);
    }

    [Test]
    public void Stand_Disabled_When_Hand_Is_Bust()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(10), C(10), C(5) },
            dealerUp: C(7),
            bankroll: 1000,
            isBust: true
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanStand, Is.False);
    }

    // ---- 6.3 Double Down ----

    [Test]
    public void Double_Enabled_When_PlayerTurn_TwoCards_NotSplitAces_SufficientBankroll()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(5), C(6) }, // 2 cards
            dealerUp: C(10),
            bankroll: 1000,
            mainBet: 25,
            splitAces: false
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanDouble, Is.True);
    }

    [Test]
    public void Double_Disabled_When_Three_Or_More_Cards()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(3), C(4), C(5) }, // 3 cards
            dealerUp: C(10),
            bankroll: 1000,
            mainBet: 25
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanDouble, Is.False);
    }

    [Test]
    public void Double_Disabled_When_SplitAces_Hand()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(1), C(7) },
            dealerUp: C(10),
            bankroll: 1000,
            mainBet: 25,
            splitAces: true
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanDouble, Is.False);
    }

    [Test]
    public void Double_Disabled_When_Insufficient_Bankroll()
    {
        // bankroll < mainBet
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(5), C(6) },
            dealerUp: C(10),
            bankroll: 20, // less than mainBet of 25
            mainBet: 25
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanDouble, Is.False);
    }

    [Test]
    public void Double_Enabled_After_Split_With_Two_Card_Hand()
    {
        // Double after split is allowed (spec 6.3)
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(8), C(3) }, // split hand, 2 cards
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25,
            isFromSplit: true
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanDouble, Is.True);
    }

    [Test]
    public void Double_Disabled_When_Phase_Is_Not_PlayerTurn()
    {
        var state = TestStateBuilder.WithPhase(GamePhase.Dealing);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanDouble, Is.False);
    }

    // ---- 6.4 Split ----

    [Test]
    public void Split_Enabled_When_TwoCards_EqualRank_SplitCountUnder3_SufficientBankroll()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(8, Suit.Hearts), C(8, Suit.Diamonds) }, // pair of 8s
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25,
            splitCount: 0
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSplit, Is.True);
    }

    [Test]
    public void Split_Enabled_For_Two_Ten_Value_Cards_Of_Different_Ranks()
    {
        // 10 + Jack: both 10-value, split eligible (spec 6.4)
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(10), C(11) }, // 10 + Jack
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25,
            splitCount: 0
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSplit, Is.True);
    }

    [Test]
    public void Split_Enabled_For_Jack_Plus_Queen()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(11), C(12) },
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25,
            splitCount: 0
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSplit, Is.True);
    }

    [Test]
    public void Split_Enabled_For_Pair_Of_Aces()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(1), C(1) },
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25,
            splitCount: 0
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSplit, Is.True);
    }

    [Test]
    public void Split_Disabled_For_Different_Non_Ten_Ranks()
    {
        // 7 + 8: not splittable
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(7), C(8) },
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSplit, Is.False);
    }

    [Test]
    public void Split_Disabled_For_Ace_Plus_Non_Ace()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(1), C(7) }, // Ace + 7, not a pair
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSplit, Is.False);
    }

    [Test]
    public void Split_Disabled_When_Split_Count_Already_3()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(8), C(8) },
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25,
            splitCount: 3 // maximum splits reached
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSplit, Is.False);
    }

    [Test]
    public void Split_Disabled_When_Insufficient_Bankroll()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(8), C(8) },
            dealerUp: C(7),
            bankroll: 20, // less than mainBet
            mainBet: 25,
            splitCount: 0
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSplit, Is.False);
    }

    [Test]
    public void Split_Disabled_When_Three_Or_More_Cards()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(8), C(8), C(2) },
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSplit, Is.False);
    }

    [Test]
    public void Split_Disabled_When_Phase_Is_Not_PlayerTurn()
    {
        var state = TestStateBuilder.WithPhase(GamePhase.Dealing);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSplit, Is.False);
    }

    // ---- Re-split rules ----

    [Test]
    public void Resplit_Non_Ace_Allowed_When_SplitCount_Under_3()
    {
        // Player splits 8+8, receives another 8 on first split hand: can resplit (spec 9.14)
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(8), C(8) },
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25,
            splitCount: 1,
            isFromSplit: true
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSplit, Is.True);
    }

    [Test]
    public void Resplit_Aces_Not_Allowed()
    {
        // Re-split Aces not allowed (spec 6.4 and 9.13)
        // A split-aces hand that receives another Ace is IsSplitAcesHand=true,
        // auto-stands, so split is never evaluated. Test that IsSplitAcesHand blocks all actions.
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(1), C(1) },
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25,
            splitCount: 1,
            splitAces: true,   // this hand IS a split-aces hand
            isFromSplit: true
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        // SplitAcesHand cannot split again
        Assert.That(avail.CanSplit, Is.False);
        Assert.That(avail.CanHit, Is.False);
        Assert.That(avail.CanDouble, Is.False);
    }

    // ---- 6.5 Surrender ----

    [Test]
    public void Surrender_Enabled_When_TwoCards_NotSplitHand_DealerPeekedNoBlackjack()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(10), C(6) }, // 2 cards
            dealerUp: C(7),
            bankroll: 1000,
            mainBet: 25,
            isFromSplit: false,
            dealerPeekedNoBlackjack: true
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSurrender, Is.True);
    }

    [Test]
    public void Surrender_Disabled_When_Three_Or_More_Cards()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(5), C(6), C(4) }, // 3 cards
            dealerUp: C(7),
            bankroll: 1000,
            isFromSplit: false,
            dealerPeekedNoBlackjack: true
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSurrender, Is.False);
    }

    [Test]
    public void Surrender_Disabled_On_Split_Hand()
    {
        var state = TestStateBuilder.PlayerTurnWith(
            playerCards: new[] { C(10), C(6) },
            dealerUp: C(7),
            bankroll: 1000,
            isFromSplit: true, // split hand — surrender not available
            dealerPeekedNoBlackjack: true
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSurrender, Is.False);
    }

    [Test]
    public void Surrender_Disabled_When_Phase_Is_Not_PlayerTurn()
    {
        var state = TestStateBuilder.WithPhase(GamePhase.Dealing);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanSurrender, Is.False);
    }

    // ---- 6.6 Insurance ----

    [Test]
    public void Insurance_Enabled_When_InsurancePrompt_Phase_And_Sufficient_Bankroll()
    {
        var state = TestStateBuilder.InsurancePromptWith(
            mainBet: 50,
            bankroll: 100 // floor(50/2) = 25, 100 >= 25
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanInsurance, Is.True);
    }

    [Test]
    public void Insurance_Disabled_When_Phase_Is_Not_InsurancePrompt()
    {
        var state = TestStateBuilder.WithPhase(GamePhase.PlayerTurn);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanInsurance, Is.False);
    }

    [Test]
    public void Insurance_Disabled_When_Insufficient_Bankroll_For_Half_Main_Bet()
    {
        // floor(50/2) = 25, bankroll = 20 < 25
        var state = TestStateBuilder.InsurancePromptWith(
            mainBet: 50,
            bankroll: 20
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanInsurance, Is.False);
    }

    [Test]
    public void Insurance_Prompt_Still_Shown_When_Cannot_Afford_But_CanInsurance_False()
    {
        // The prompt is shown but CanInsurance = false (spec 9.10)
        // Test that state is InsurancePrompt phase but CanInsurance is false
        var state = TestStateBuilder.InsurancePromptWith(
            mainBet: 50,
            bankroll: 5 // cannot afford insurance
        );
        Assert.That(state.CurrentPhase, Is.EqualTo(GamePhase.InsurancePrompt));
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanInsurance, Is.False);
    }

    [Test]
    public void Insurance_Exact_Boundary_Bankroll_Equals_FloorHalfMainBet()
    {
        // floor(50/2) = 25, bankroll = 25: exactly enough
        var state = TestStateBuilder.InsurancePromptWith(
            mainBet: 50,
            bankroll: 25
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanInsurance, Is.True);
    }

    [Test]
    public void Insurance_Odd_MainBet_Floor_Calculation()
    {
        // floor(5/2) = 2, bankroll = 2: exactly enough
        var state = TestStateBuilder.InsurancePromptWith(
            mainBet: 5,
            bankroll: 2
        );
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanInsurance, Is.True);
    }

    // ---- Section 8.1 Availability by Phase ----

    [Test]
    public void All_Actions_Disabled_In_Idle_Phase()
    {
        var state = TestStateBuilder.WithPhase(GamePhase.Idle);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanHit, Is.False);
        Assert.That(avail.CanStand, Is.False);
        Assert.That(avail.CanDouble, Is.False);
        Assert.That(avail.CanSplit, Is.False);
        Assert.That(avail.CanSurrender, Is.False);
        Assert.That(avail.CanInsurance, Is.False);
    }

    [Test]
    public void Deal_Disabled_In_Idle_Phase()
    {
        var state = TestStateBuilder.WithPhase(GamePhase.Idle);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanDeal, Is.False);
    }

    [Test]
    public void Deal_Enabled_In_Betting_Phase_When_MainBet_Meets_MinBet()
    {
        var state = TestStateBuilder.BettingWith(mainBet: 25, minBet: 25);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanDeal, Is.True);
    }

    [Test]
    public void Deal_Disabled_In_Betting_Phase_When_MainBet_Below_MinBet()
    {
        var state = TestStateBuilder.BettingWith(mainBet: 5, minBet: 25);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanDeal, Is.False);
    }

    [Test]
    public void All_Player_Actions_Disabled_In_DealerTurn_Phase()
    {
        var state = TestStateBuilder.WithPhase(GamePhase.DealerTurn);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanHit, Is.False);
        Assert.That(avail.CanStand, Is.False);
        Assert.That(avail.CanDouble, Is.False);
        Assert.That(avail.CanSplit, Is.False);
        Assert.That(avail.CanSurrender, Is.False);
    }

    [Test]
    public void All_Actions_Disabled_In_Resolution_Phase()
    {
        var state = TestStateBuilder.WithPhase(GamePhase.Resolution);
        var avail = ActionAvailabilityCalculator.Compute(state);
        Assert.That(avail.CanHit, Is.False);
        Assert.That(avail.CanStand, Is.False);
        Assert.That(avail.CanDouble, Is.False);
        Assert.That(avail.CanSplit, Is.False);
        Assert.That(avail.CanSurrender, Is.False);
        Assert.That(avail.CanInsurance, Is.False);
    }
}
