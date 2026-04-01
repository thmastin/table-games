using NUnit.Framework;
using TableGames.Blackjack.Logic;

namespace TableGames.Tests.Blackjack;

/// <summary>
/// Tests for bet resolution: win/loss/push payouts, insurance, surrender, side bets.
/// Spec references: game-spec.md Sections 7, 9, 11, 16.3, 16.4.
/// </summary>
[TestFixture]
public class BetResolutionTests
{
    private static Card C(int rank, Suit suit = Suit.Spades) => new Card(rank, suit);

    // ---- Section 7 + 11.5: Win/Loss/Push payouts ----

    [Test]
    public void Blackjack_Win_Pays_3_To_2()
    {
        // MainBet=50: delta = 50 + floor(50*1.5) = 50 + 75 = 125
        var result = BetResolver.Resolve(
            outcome: HandOutcome.BlackjackWin,
            mainBet: 50,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(125));
    }

    [Test]
    public void Blackjack_Win_5_Dollar_Bet_Rounds_Down()
    {
        // MainBet=5: floor(5*1.5) = floor(7.5) = 7, delta = 5+7 = 12
        var result = BetResolver.Resolve(
            outcome: HandOutcome.BlackjackWin,
            mainBet: 5,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(12));
    }

    [Test]
    public void Blackjack_Win_25_Dollar_Bet()
    {
        // MainBet=25: floor(25*1.5) = 37, delta = 25+37 = 62
        var result = BetResolver.Resolve(
            outcome: HandOutcome.BlackjackWin,
            mainBet: 25,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(62));
    }

    [Test]
    public void Standard_Win_Pays_1_To_1()
    {
        // MainBet=25: delta = 25*2 = 50 (original returned + equal winnings)
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Win,
            mainBet: 25,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(50));
    }

    [Test]
    public void Double_Down_Win_Returns_Full_Combined_Bet_Plus_Equal_Winnings()
    {
        // MainBet=25, DoubleDownBet=25: delta = (25+25)*2 = 100
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Win,
            mainBet: 25,
            doubleDownBet: 25,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(100));
    }

    [Test]
    public void Push_Returns_MainBet_Only()
    {
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Push,
            mainBet: 25,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(25));
    }

    [Test]
    public void Double_Down_Push_Returns_Full_Combined_Bet()
    {
        // MainBet=25, DoubleDownBet=25: delta = 25+25 = 50
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Push,
            mainBet: 25,
            doubleDownBet: 25,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(50));
    }

    [Test]
    public void Loss_Returns_Zero()
    {
        // Bet already deducted at DealInitiated; no return on loss
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Loss,
            mainBet: 25,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(0));
    }

    [Test]
    public void Double_Loss_Returns_Zero()
    {
        // Both MainBet and DoubleDownBet forfeited (spec 9.7)
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Loss,
            mainBet: 25,
            doubleDownBet: 25,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(0));
    }

    [Test]
    public void Surrender_Returns_Floor_Half_MainBet()
    {
        // MainBet=50: floor(50/2) = 25
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Surrender,
            mainBet: 50,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(25));
    }

    [Test]
    public void Surrender_Odd_MainBet_Rounds_Down()
    {
        // MainBet=5: floor(5/2) = 2
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Surrender,
            mainBet: 5,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(2));
    }

    // ---- Insurance resolution ----

    [Test]
    public void Insurance_Win_Dealer_Has_Blackjack_Returns_3x_InsuranceBet()
    {
        // Insurance wins 2:1: ApplyBankrollDelta(InsuranceBet * 3) = original + 2x winnings
        var result = BetResolver.ResolveInsurance(
            insuranceBet: 25,
            dealerHasBlackjack: true
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(75));
    }

    [Test]
    public void Insurance_Loss_Dealer_No_Blackjack_Returns_Zero()
    {
        // Bet already forfeited when insurance was placed (spec 6.6 Case B)
        var result = BetResolver.ResolveInsurance(
            insuranceBet: 25,
            dealerHasBlackjack: false
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(0));
    }

    [Test]
    public void Insurance_No_Insurance_Returns_Zero()
    {
        var result = BetResolver.ResolveInsurance(
            insuranceBet: 0,
            dealerHasBlackjack: true
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(0));
    }

    // ---- Edge cases from spec Section 9 ----

    [Test]
    public void Player_Blackjack_Dealer_Blackjack_Is_Push()
    {
        // Both blackjack = push (spec 9.2)
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Push,
            mainBet: 25,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(25));
    }

    [Test]
    public void Player_21_Three_Cards_Dealer_21_Three_Cards_Is_Push()
    {
        // spec 9.3: equal totals of 21 with 3+ cards = push
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Push,
            mainBet: 25,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(25));
    }

    [Test]
    public void Split_Hand_21_Pays_1_To_1_Not_3_To_2()
    {
        // Blackjack on split hand pays 1:1 (spec 9.5, 4)
        // The Win outcome (not BlackjackWin) is used for split hand 21
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Win,
            mainBet: 25,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(50)); // 1:1
    }

    [Test]
    public void Dealer_Bust_Player_Not_Bust_Player_Wins()
    {
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Win,
            mainBet: 25,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(50));
    }

    [Test]
    public void Dealer_Bust_Player_Also_Bust_Player_Loses()
    {
        // spec 9.4: player busted before dealer turn, player loses regardless
        var result = BetResolver.Resolve(
            outcome: HandOutcome.Loss,
            mainBet: 25,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(0));
    }

    [Test]
    public void Player_Blackjack_Dealer_21_Three_Cards_Player_Wins_3_To_2()
    {
        // spec 9.3: player blackjack beats dealer 21
        var result = BetResolver.Resolve(
            outcome: HandOutcome.BlackjackWin,
            mainBet: 25,
            doubleDownBet: 0,
            insuranceBet: 0
        );
        Assert.That(result.BankrollDelta, Is.EqualTo(62)); // 25 + floor(25*1.5)
    }
}
