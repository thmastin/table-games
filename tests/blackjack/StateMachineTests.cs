using NUnit.Framework;
using TableGames.Blackjack.Logic;

namespace TableGames.Tests.Blackjack;

/// <summary>
/// Tests for BlackjackStateMachine valid and invalid transitions.
/// Every transition from architecture.md Section 2 transition table is tested.
/// Invalid transitions must throw InvalidTransitionException.
/// Spec references: architecture.md Section 2, game-spec.md Section 15.
/// </summary>
[TestFixture]
public class StateMachineTests
{
    private BlackjackStateMachine CreateMachine(int bankroll = 1000)
    {
        return new BlackjackStateMachine(bankroll, minBet: 25, maxBet: 500);
    }

    // ---- Transition 1: Idle -> Betting ----

    [Test]
    public void Transition_Idle_To_Betting_Via_BeginBetting()
    {
        var machine = CreateMachine();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Idle));
        machine.BeginBetting();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Betting));
    }

    // ---- Transition 2: Betting -> Idle via ClearBet ----

    [Test]
    public void Transition_Betting_To_Idle_Via_ClearBet()
    {
        var machine = CreateMachine();
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.ClearBet();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Idle));
    }

    [Test]
    public void ClearBet_Resets_MainBet_TriLuxBet_LuckyLuckyBet_To_Zero()
    {
        var machine = CreateMachine();
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.PlaceSideBet(SideBetType.TriLux, 25);
        machine.PlaceSideBet(SideBetType.LuckyLucky, 25);
        machine.ClearBet();
        var state = machine.GetState();
        Assert.That(state.MainBet, Is.EqualTo(0));
        Assert.That(state.TriLuxBet, Is.EqualTo(0));
        Assert.That(state.LuckyLuckyBet, Is.EqualTo(0));
    }

    // ---- Transition 3: Betting -> Dealing via DealInitiated ----

    [Test]
    public void Transition_Betting_To_Dealing_Via_DealInitiated()
    {
        var machine = CreateMachine();
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Dealing));
    }

    [Test]
    public void DealInitiated_Deducts_MainBet_From_Bankroll()
    {
        var machine = CreateMachine(bankroll: 500);
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        Assert.That(machine.Bankroll, Is.EqualTo(475));
    }

    [Test]
    public void DealInitiated_Deducts_AllBets_Atomically()
    {
        var machine = CreateMachine(bankroll: 500);
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.PlaceSideBet(SideBetType.TriLux, 25);
        machine.PlaceSideBet(SideBetType.LuckyLucky, 25);
        machine.DealInitiated();
        Assert.That(machine.Bankroll, Is.EqualTo(425)); // 500 - 75
    }

    [Test]
    public void DealInitiated_Fails_When_MainBet_Below_MinBet()
    {
        var machine = CreateMachine();
        machine.BeginBetting();
        machine.PlaceBet(5); // below 25 min
        Assert.Throws<InvalidTransitionException>(() => machine.DealInitiated());
    }

    // ---- Dealing exits: Transitions 4-8 ----

    [Test]
    public void Dealing_Exits_To_SideBetResolution_When_SideBets_Placed()
    {
        var machine = CreateMachine();
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.PlaceSideBet(SideBetType.TriLux, 25);
        var state = machine.DealInitiated();
        // DealInitiated distributes 4 cards and routes
        var finalState = machine.CompleteDealing(); // triggers internal routing
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.SideBetResolution));
    }

    [Test]
    public void Dealing_Exits_To_InsurancePrompt_When_No_SideBets_And_Dealer_Shows_Ace()
    {
        // Dealt with dealer ace, no side bets
        var machine = CreateMachineWithDeal(dealerUpCard: new Card(1, Suit.Spades), dealerHole: new Card(5, Suit.Hearts));
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.InsurancePrompt));
    }

    [Test]
    public void Dealing_Exits_To_PlayerTurn_When_No_SideBets_Dealer_Not_Ace_Not_Ten()
    {
        var machine = CreateMachineWithDeal(dealerUpCard: new Card(7, Suit.Hearts), dealerHole: new Card(5, Suit.Clubs));
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.PlayerTurn));
    }

    [Test]
    public void Dealing_Exits_To_PlayerTurn_When_Dealer_Ten_Value_Peek_No_Blackjack()
    {
        // Dealer shows 10, hole card is 5 (not blackjack)
        var machine = CreateMachineWithDeal(dealerUpCard: new Card(10, Suit.Hearts), dealerHole: new Card(5, Suit.Clubs));
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.PlayerTurn));
    }

    [Test]
    public void Dealing_Exits_To_Resolution_When_Dealer_Blackjack_Confirmed()
    {
        // Dealer shows 10, hole card is Ace = blackjack
        var machine = CreateMachineWithDeal(dealerUpCard: new Card(10, Suit.Hearts), dealerHole: new Card(1, Suit.Clubs));
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Resolution));
    }

    // ---- SideBetResolution exits: Transitions 9-11 ----

    [Test]
    public void SideBetResolution_Exits_To_InsurancePrompt_When_Dealer_Shows_Ace()
    {
        var machine = CreateMachineWithDeal(dealerUpCard: new Card(1, Suit.Spades), dealerHole: new Card(5, Suit.Hearts));
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.PlaceSideBet(SideBetType.TriLux, 25);
        machine.DealInitiated();
        machine.CompleteDealing(); // -> SideBetResolution
        machine.CompleteSideBetResolution();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.InsurancePrompt));
    }

    [Test]
    public void SideBetResolution_Exits_To_PlayerTurn_When_Dealer_Not_Ace_No_Blackjack()
    {
        var machine = CreateMachineWithDeal(dealerUpCard: new Card(7, Suit.Hearts), dealerHole: new Card(5, Suit.Clubs));
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.PlaceSideBet(SideBetType.TriLux, 25);
        machine.DealInitiated();
        machine.CompleteDealing();
        machine.CompleteSideBetResolution();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.PlayerTurn));
    }

    [Test]
    public void SideBetResolution_Exits_To_Resolution_When_Dealer_Blackjack()
    {
        var machine = CreateMachineWithDeal(dealerUpCard: new Card(10, Suit.Hearts), dealerHole: new Card(1, Suit.Clubs));
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.PlaceSideBet(SideBetType.TriLux, 25);
        machine.DealInitiated();
        machine.CompleteDealing();
        machine.CompleteSideBetResolution();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Resolution));
    }

    // ---- InsurancePrompt exits: Transitions 12-14 ----

    [Test]
    public void InsurancePrompt_To_PlayerTurn_When_No_Dealer_Blackjack_No_Player_Blackjack()
    {
        var machine = CreateMachineWithDeal(
            dealerUpCard: new Card(1, Suit.Spades),
            dealerHole: new Card(5, Suit.Hearts),
            playerCards: new[] { new Card(10, Suit.Clubs), new Card(7, Suit.Diamonds) }
        );
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing(); // -> InsurancePrompt
        machine.ResolveInsurance(takesInsurance: false);
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.PlayerTurn));
    }

    [Test]
    public void InsurancePrompt_To_Resolution_When_Player_Has_Blackjack_And_Dealer_No_Blackjack()
    {
        // spec 9.1: InsurancePrompt -> Resolution (PlayerTurn skipped) when player has blackjack
        var machine = CreateMachineWithDeal(
            dealerUpCard: new Card(1, Suit.Spades),
            dealerHole: new Card(5, Suit.Hearts),
            playerCards: new[] { new Card(1, Suit.Clubs), new Card(10, Suit.Diamonds) } // player blackjack
        );
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing();
        machine.ResolveInsurance(takesInsurance: false);
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Resolution));
    }

    [Test]
    public void InsurancePrompt_To_Resolution_When_Dealer_Has_Blackjack()
    {
        var machine = CreateMachineWithDeal(
            dealerUpCard: new Card(1, Suit.Spades),
            dealerHole: new Card(10, Suit.Hearts), // dealer blackjack
            playerCards: new[] { new Card(8, Suit.Clubs), new Card(7, Suit.Diamonds) }
        );
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing();
        machine.ResolveInsurance(takesInsurance: true);
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Resolution));
    }

    // ---- PlayerTurn stays in PlayerTurn: Transitions 15-21 ----

    [Test]
    public void PlayerTurn_Hit_Stays_In_PlayerTurn_When_Total_Under_21()
    {
        var machine = CreateMachineInPlayerTurn(playerCards: new[] { C(5), C(6) }); // total 11
        machine.Hit();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.PlayerTurn));
    }

    [Test]
    public void PlayerTurn_Stand_Stays_In_PlayerTurn_When_Split_Hands_Remain()
    {
        // Set up a split scenario with 2 hands, on first hand
        var machine = CreateMachineWithSplitHands();
        machine.Stand();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.PlayerTurn));
    }

    [Test]
    public void PlayerTurn_DoubleDown_Stays_In_PlayerTurn_When_More_Hands_Remain()
    {
        var machine = CreateMachineWithSplitHands();
        machine.DoubleDown();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.PlayerTurn));
    }

    [Test]
    public void PlayerTurn_Split_Stays_In_PlayerTurn()
    {
        var machine = CreateMachineInPlayerTurn(playerCards: new[] { C(8), C(8) });
        machine.Split();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.PlayerTurn));
    }

    // ---- PlayerTurn -> DealerTurn: Transitions 22-26 ----

    [Test]
    public void PlayerTurn_Stand_Last_Hand_Goes_To_DealerTurn()
    {
        var machine = CreateMachineInPlayerTurn(playerCards: new[] { C(10), C(7) });
        machine.Stand();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.DealerTurn));
    }

    [Test]
    public void PlayerTurn_Hit_Bust_No_More_Hands_Goes_To_DealerTurn()
    {
        var machine = CreateMachineInPlayerTurn(playerCards: new[] { C(10), C(10) }); // 20
        machine.HitWithCard(C(5)); // 25, bust
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.DealerTurn));
    }

    [Test]
    public void PlayerTurn_Hit_Reaches_21_AutoStand_No_More_Hands_Goes_To_DealerTurn()
    {
        var machine = CreateMachineInPlayerTurn(playerCards: new[] { C(10), C(8) }); // 18
        machine.HitWithCard(C(3)); // 21, auto-stand
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.DealerTurn));
    }

    [Test]
    public void PlayerTurn_DoubleDown_No_More_Hands_Goes_To_DealerTurn()
    {
        var machine = CreateMachineInPlayerTurn(playerCards: new[] { C(5), C(6) }); // 11
        machine.DoubleDown();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.DealerTurn));
    }

    [Test]
    public void PlayerTurn_Surrender_No_More_Hands_Goes_To_DealerTurn()
    {
        var machine = CreateMachineInPlayerTurn(playerCards: new[] { C(10), C(6) });
        machine.Surrender();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.DealerTurn));
    }

    // ---- DealerTurn -> Resolution: Transitions 27-28 ----

    [Test]
    public void DealerTurn_Goes_To_Resolution_When_Dealer_Stands()
    {
        var machine = CreateMachineInDealerTurn(dealerTotal: 17);
        machine.CompleteDealerTurn();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Resolution));
    }

    [Test]
    public void DealerTurn_Goes_To_Resolution_When_Dealer_Busts()
    {
        var machine = CreateMachineInDealerTurn(dealerBusts: true);
        machine.CompleteDealerTurn();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Resolution));
    }

    // ---- Resolution -> Idle/PlayerBroke: Transitions 29-30 ----

    [Test]
    public void Resolution_Goes_To_Idle_When_Bankroll_Sufficient()
    {
        var machine = CreateMachineInResolution(bankroll: 500);
        machine.CompleteResolution();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Idle));
    }

    [Test]
    public void Resolution_Goes_To_PlayerBroke_When_Bankroll_Zero()
    {
        var machine = CreateMachineInResolution(bankroll: 0);
        machine.CompleteResolution();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.PlayerBroke));
    }

    [Test]
    public void Resolution_Goes_To_PlayerBroke_When_Bankroll_Below_MinBet()
    {
        var machine = CreateMachineInResolution(bankroll: 10, minBet: 25);
        machine.CompleteResolution();
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.PlayerBroke));
    }

    // ---- Transition 31: PlayerBroke -> Idle ----

    [Test]
    public void PlayerBroke_To_Idle_When_Bankroll_Reloaded()
    {
        var machine = CreateMachineInResolution(bankroll: 0);
        machine.CompleteResolution(); // -> PlayerBroke
        machine.ReloadBankroll(500);
        Assert.That(machine.CurrentPhase, Is.EqualTo(GamePhase.Idle));
    }

    // ---- Invalid Transitions ----

    [Test]
    public void Invalid_Hit_From_Idle_Throws_InvalidTransitionException()
    {
        var machine = CreateMachine();
        Assert.Throws<InvalidTransitionException>(() => machine.Hit());
    }

    [Test]
    public void Invalid_Stand_From_Idle_Throws_InvalidTransitionException()
    {
        var machine = CreateMachine();
        Assert.Throws<InvalidTransitionException>(() => machine.Stand());
    }

    [Test]
    public void Invalid_DealInitiated_From_Idle_Without_Betting_First()
    {
        var machine = CreateMachine();
        Assert.Throws<InvalidTransitionException>(() => machine.DealInitiated());
    }

    [Test]
    public void Invalid_ClearBet_From_Idle_Throws()
    {
        var machine = CreateMachine();
        Assert.Throws<InvalidTransitionException>(() => machine.ClearBet());
    }

    [Test]
    public void Invalid_BeginBetting_From_Betting_Throws()
    {
        var machine = CreateMachine();
        machine.BeginBetting();
        Assert.Throws<InvalidTransitionException>(() => machine.BeginBetting());
    }

    [Test]
    public void Invalid_Hit_From_Betting_Throws()
    {
        var machine = CreateMachine();
        machine.BeginBetting();
        Assert.Throws<InvalidTransitionException>(() => machine.Hit());
    }

    [Test]
    public void Invalid_Hit_From_DealerTurn_Throws()
    {
        var machine = CreateMachineInDealerTurn();
        Assert.Throws<InvalidTransitionException>(() => machine.Hit());
    }

    [Test]
    public void Invalid_Stand_From_Resolution_Throws()
    {
        var machine = CreateMachineInResolution(bankroll: 500);
        Assert.Throws<InvalidTransitionException>(() => machine.Stand());
    }

    [Test]
    public void Invalid_Split_From_DealerTurn_Throws()
    {
        var machine = CreateMachineInDealerTurn();
        Assert.Throws<InvalidTransitionException>(() => machine.Split());
    }

    [Test]
    public void Invalid_Surrender_From_Betting_Throws()
    {
        var machine = CreateMachine();
        machine.BeginBetting();
        Assert.Throws<InvalidTransitionException>(() => machine.Surrender());
    }

    [Test]
    public void Invalid_ResolveInsurance_From_PlayerTurn_Throws()
    {
        var machine = CreateMachineInPlayerTurn(playerCards: new[] { C(10), C(7) });
        Assert.Throws<InvalidTransitionException>(() => machine.ResolveInsurance(false));
    }

    [Test]
    public void Invalid_DoubleDown_From_Idle_Throws()
    {
        var machine = CreateMachine();
        Assert.Throws<InvalidTransitionException>(() => machine.DoubleDown());
    }

    [Test]
    public void Invalid_BeginBetting_From_DealerTurn_Throws()
    {
        var machine = CreateMachineInDealerTurn();
        Assert.Throws<InvalidTransitionException>(() => machine.BeginBetting());
    }

    // ---- State machine preserves immutability ----

    [Test]
    public void State_Returns_New_Record_On_Every_Transition()
    {
        var machine = CreateMachine();
        var state1 = machine.GetState();
        machine.BeginBetting();
        var state2 = machine.GetState();
        Assert.That(state1, Is.Not.SameAs(state2));
        Assert.That(state1.CurrentPhase, Is.EqualTo(GamePhase.Idle));
        Assert.That(state2.CurrentPhase, Is.EqualTo(GamePhase.Betting));
    }

    [Test]
    public void PlaceBet_Updates_MainBet_In_State()
    {
        var machine = CreateMachine();
        machine.BeginBetting();
        machine.PlaceBet(25);
        var state = machine.GetState();
        Assert.That(state.MainBet, Is.EqualTo(25));
    }

    [Test]
    public void PlaceBet_Multiple_Chips_Accumulates()
    {
        var machine = CreateMachine();
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.PlaceBet(25);
        var state = machine.GetState();
        Assert.That(state.MainBet, Is.EqualTo(50));
    }

    [Test]
    public void PlaceBet_Over_MaxBet_Is_Rejected()
    {
        var machine = CreateMachine(bankroll: 2000);
        machine.BeginBetting();
        for (int i = 0; i < 20; i++) machine.PlaceBet(25); // 500 = max
        // One more placement rejected silently (no exception per spec 10.2)
        machine.PlaceBet(25);
        var state = machine.GetState();
        Assert.That(state.MainBet, Is.EqualTo(500));
    }

    [Test]
    public void PlaceSideBet_Replaces_Prior_Value_Not_Accumulate()
    {
        // Side bets are single placement model (spec 16.1)
        var machine = CreateMachine();
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.PlaceSideBet(SideBetType.TriLux, 25);
        machine.PlaceSideBet(SideBetType.TriLux, 50); // replaces, doesn't add
        var state = machine.GetState();
        Assert.That(state.TriLuxBet, Is.EqualTo(50));
    }

    // ---- ShufflePending behavior in state machine ----

    [Test]
    public void ShufflePending_Triggers_Shuffle_Before_DealInitiated()
    {
        var machine = CreateMachineWithShufflePending();
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated(); // shuffle should happen inline
        var state = machine.GetState();
        // After deal+shuffle, shoe is reset
        Assert.That(state.Shoe.ShufflePending, Is.False);
        Assert.That(state.Shoe.TotalDealt, Is.EqualTo(4)); // 4 cards for initial deal
    }

    // ---- Split-Ace auto-stand: ActiveHandIndex in-bounds ----

    [Test]
    public void SplitAces_AutoStand_ActiveHandIndex_InBounds_After_DealerTurn_Transition()
    {
        // Both split-ace hands auto-stand, driving AdvanceOrComplete past the end.
        // The emitted state must have ActiveHandIndex < PlayerHands.Length.
        var machine = new BlackjackStateMachine(
            bankroll: 1000, minBet: 25, maxBet: 500,
            deterministicDealerUp: C(7),
            deterministicDealerHole: C(5),
            deterministicPlayerCards: new[] { C(1), C(1), C(3), C(4) }
            // P1=A, DUp=7, P2=A, DHole=5 (dealt by DealInitiated)
            // remaining queue: C(3) -> hand1's second card, C(4) -> hand2's second card
        );
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing(); // -> PlayerTurn (dealer 7, no blackjack)

        var state = machine.Split(); // both ace hands auto-stand -> DealerTurn

        Assert.That(state.CurrentPhase, Is.EqualTo(GamePhase.DealerTurn));
        Assert.That(state.ActiveHandIndex, Is.LessThan(state.PlayerHands.Length));
    }

    // ---- Surrender eligibility after InsurancePrompt Case B decline ----

    [Test]
    public void Surrender_Available_After_InsurancePrompt_CaseB_Decline()
    {
        // Dealer shows Ace, hole card is not ten-value -> no dealer blackjack.
        // ResolveInsurance(false, dealerHasBlackjack=false) takes the Case B path
        // which sets _dealerPeekedNoBlackjack = true, enabling surrender.
        var machine = CreateMachineWithDeal(
            dealerUpCard: new Card(1, Suit.Spades),
            dealerHole: new Card(5, Suit.Hearts),
            playerCards: new[] { new Card(10, Suit.Clubs), new Card(7, Suit.Diamonds) }
        );
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing(); // -> InsurancePrompt (dealer ace)

        var state = machine.ResolveInsurance(takesInsurance: false); // Case B: no dealer BJ

        Assert.That(state.CurrentPhase, Is.EqualTo(GamePhase.PlayerTurn));
        Assert.That(state.Actions.CanSurrender, Is.True);
    }

    // ---- Helper factory methods ----

    private static Card C(int rank, Suit suit = Suit.Spades) => new Card(rank, suit);

    private BlackjackStateMachine CreateMachineWithDeal(
        Card dealerUpCard, Card dealerHole,
        Card[]? playerCards = null)
    {
        var machine = new BlackjackStateMachine(
            bankroll: 1000, minBet: 25, maxBet: 500,
            deterministicDealerUp: dealerUpCard,
            deterministicDealerHole: dealerHole,
            deterministicPlayerCards: playerCards ?? new[] { C(10), C(7) }
        );
        return machine;
    }

    private BlackjackStateMachine CreateMachineInPlayerTurn(Card[] playerCards)
    {
        // Append a safe hit card (2) so that if the test calls Hit(), the resulting total
        // stays under 21. Without this, the machine falls back to the random shoe and the
        // drawn card may hit exactly 21 or bust, causing AdvanceOrComplete to leave PlayerTurn.
        var cardsWithHitCard = playerCards.Append(C(2)).ToArray();
        var machine = new BlackjackStateMachine(
            bankroll: 1000, minBet: 25, maxBet: 500,
            deterministicDealerUp: C(7),
            deterministicDealerHole: C(5),
            deterministicPlayerCards: cardsWithHitCard
        );
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing();
        // Should be in PlayerTurn now (dealer is 7, no blackjack)
        return machine;
    }

    private BlackjackStateMachine CreateMachineWithSplitHands()
    {
        var machine = new BlackjackStateMachine(
            bankroll: 1000, minBet: 25, maxBet: 500,
            deterministicDealerUp: C(7),
            deterministicDealerHole: C(5),
            deterministicPlayerCards: new[] { C(8), C(8) }
        );
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing();
        machine.Split(); // now has 2 hands, on hand index 0
        return machine;
    }

    private BlackjackStateMachine CreateMachineInDealerTurn(int dealerTotal = 16, bool dealerBusts = false)
    {
        var machine = new BlackjackStateMachine(
            bankroll: 1000, minBet: 25, maxBet: 500,
            deterministicDealerUp: C(7),
            deterministicDealerHole: C(5), // dealer has 12, will draw
            deterministicPlayerCards: new[] { C(10), C(8) }
        );
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing();
        machine.Stand(); // player stands -> DealerTurn
        return machine;
    }

    private BlackjackStateMachine CreateMachineInResolution(int bankroll = 500, int minBet = 25)
    {
        var machine = new BlackjackStateMachine(
            bankroll: bankroll + 25, // will deduct 25 for bet
            minBet: minBet, maxBet: 500,
            deterministicDealerUp: C(7),
            deterministicDealerHole: C(10), // dealer has 17, stands
            deterministicPlayerCards: new[] { C(5), C(6) } // player 11, loses to dealer 17
        );
        machine.BeginBetting();
        machine.PlaceBet(25);
        machine.DealInitiated();
        machine.CompleteDealing();
        machine.Stand();
        machine.CompleteDealerTurn();
        // Override bankroll to test value.
        // Player hand loses (11 < 17) so ResolveAllHands adds 0 delta, preserving the override.
        machine.OverrideBankroll(bankroll);
        return machine;
    }

    private BlackjackStateMachine CreateMachineWithShufflePending()
    {
        var machine = new BlackjackStateMachine(bankroll: 1000, minBet: 25, maxBet: 500);
        machine.ForceShufflePending(); // test hook to set ShufflePending
        return machine;
    }
}
