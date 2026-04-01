using NUnit.Framework;
using TableGames.Blackjack.Logic;

namespace TableGames.Tests.Blackjack;

/// <summary>
/// Tests for TriLux and Lucky Lucky side bet evaluation and payout.
/// Spec references: game-spec.md Sections 16.3, 16.4.
/// </summary>
[TestFixture]
public class SideBetTests
{
    // ---- TriLux ----

    [Test]
    public void TriLux_Straight_Flush_Pays_40_To_1()
    {
        // Ace-2-3 suited
        var cards = new[]
        {
            new Card(1, Suit.Hearts),
            new Card(2, Suit.Hearts),
            new Card(3, Suit.Hearts)
        };
        var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(TriLuxOutcome.StraightFlush));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 40)); // 1025
    }

    [Test]
    public void TriLux_Straight_Flush_Q_K_A_Suited()
    {
        var cards = new[]
        {
            new Card(12, Suit.Diamonds), // Queen
            new Card(13, Suit.Diamonds), // King
            new Card(1, Suit.Diamonds),  // Ace (as 14)
        };
        var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(TriLuxOutcome.StraightFlush));
    }

    [Test]
    public void TriLux_Three_Of_A_Kind_Pays_25_To_1()
    {
        var cards = new[]
        {
            new Card(7, Suit.Clubs),
            new Card(7, Suit.Diamonds),
            new Card(7, Suit.Hearts)
        };
        var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(TriLuxOutcome.ThreeOfAKind));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 25)); // 650
    }

    [Test]
    public void TriLux_Straight_Pays_10_To_1()
    {
        // 8-9-10 mixed suits
        var cards = new[]
        {
            new Card(8, Suit.Clubs),
            new Card(9, Suit.Diamonds),
            new Card(10, Suit.Hearts)
        };
        var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(TriLuxOutcome.Straight));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 10)); // 275
    }

    [Test]
    public void TriLux_Flush_Pays_5_To_1()
    {
        // All clubs, not consecutive
        var cards = new[]
        {
            new Card(2, Suit.Clubs),
            new Card(5, Suit.Clubs),
            new Card(9, Suit.Clubs)
        };
        var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(TriLuxOutcome.Flush));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 5)); // 150
    }

    [Test]
    public void TriLux_No_Win_Loses()
    {
        var cards = new[]
        {
            new Card(2, Suit.Clubs),
            new Card(7, Suit.Hearts),
            new Card(13, Suit.Diamonds)
        };
        var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(TriLuxOutcome.Lose));
        Assert.That(result.BankrollDelta, Is.EqualTo(0));
    }

    [Test]
    public void TriLux_Straight_Flush_Beats_Three_Of_A_Kind()
    {
        // If all three same rank AND same suit... impossible (can't have 3 of same rank+suit in standard eval),
        // but straight flush always evaluated first per spec 16.3 algorithm
        // Test: 3 kings of spades can't happen but test algorithm order with suited straight
        var cards = new[]
        {
            new Card(9, Suit.Spades),
            new Card(10, Suit.Spades),
            new Card(11, Suit.Spades) // J-10-9 suited
        };
        var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(TriLuxOutcome.StraightFlush));
    }

    [Test]
    public void TriLux_Three_Of_A_Kind_Outranks_Flush()
    {
        // Three 7s, same suit — spec says three of a kind outranks flush (spec 16.3 edge case)
        var cards = new[]
        {
            new Card(7, Suit.Clubs),
            new Card(7, Suit.Clubs), // In 6-deck shoe, duplicates exist
            new Card(7, Suit.Clubs)
        };
        var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
        // Three of a kind outranks flush regardless of suits
        Assert.That(result.Outcome, Is.EqualTo(TriLuxOutcome.ThreeOfAKind));
    }

    [Test]
    public void TriLux_Straight_Ace_Low_A_2_3()
    {
        // Ace-2-3 mixed suits = straight (spec 16.3 straights)
        var cards = new[]
        {
            new Card(1, Suit.Clubs),  // Ace as rank 1
            new Card(2, Suit.Hearts),
            new Card(3, Suit.Spades)
        };
        var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(TriLuxOutcome.Straight));
    }

    [Test]
    public void TriLux_Straight_Ace_High_Q_K_A()
    {
        // Q-K-A = straight (Ace as rank 14, spec 16.3)
        var cards = new[]
        {
            new Card(12, Suit.Clubs),
            new Card(13, Suit.Hearts),
            new Card(1, Suit.Spades)  // Ace as 14
        };
        var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(TriLuxOutcome.Straight));
    }

    [Test]
    public void TriLux_K_A_2_Is_Not_A_Straight()
    {
        // Ace does not wrap: K-A-2 is not valid (spec 16.3)
        var cards = new[]
        {
            new Card(13, Suit.Clubs),
            new Card(1, Suit.Hearts),
            new Card(2, Suit.Spades)
        };
        var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.Not.EqualTo(TriLuxOutcome.Straight));
        Assert.That(result.Outcome, Is.Not.EqualTo(TriLuxOutcome.StraightFlush));
    }

    [Test]
    public void TriLux_All_Valid_Straights_Recognized()
    {
        // Test a sample of valid straight sequences
        var straights = new[]
        {
            new[] { 2, 3, 4 },
            new[] { 5, 6, 7 },
            new[] { 9, 10, 11 },   // 9-10-J
            new[] { 10, 11, 12 },  // 10-J-Q
            new[] { 11, 12, 13 },  // J-Q-K
        };
        foreach (var ranks in straights)
        {
            var cards = new[]
            {
                new Card(ranks[0], Suit.Clubs),
                new Card(ranks[1], Suit.Hearts),
                new Card(ranks[2], Suit.Spades)
            };
            var result = TriLuxEvaluator.Evaluate(cards, bet: 25);
            Assert.That(result.Outcome, Is.EqualTo(TriLuxOutcome.Straight),
                $"Ranks {ranks[0]}-{ranks[1]}-{ranks[2]} should be a straight");
        }
    }

    // ---- Lucky Lucky ----

    [Test]
    public void LuckyLucky_Suited_777_Pays_200_To_1()
    {
        var cards = new[]
        {
            new Card(7, Suit.Hearts),
            new Card(7, Suit.Hearts),
            new Card(7, Suit.Hearts)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Suited777));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 200)); // 5025
    }

    [Test]
    public void LuckyLucky_Suited_678_Pays_100_To_1()
    {
        var cards = new[]
        {
            new Card(6, Suit.Diamonds),
            new Card(7, Suit.Diamonds),
            new Card(8, Suit.Diamonds)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Suited678));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 100)); // 2525
    }

    [Test]
    public void LuckyLucky_Unsuited_777_Pays_30_To_1()
    {
        var cards = new[]
        {
            new Card(7, Suit.Clubs),
            new Card(7, Suit.Diamonds),
            new Card(7, Suit.Hearts)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Unsuited777));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 30)); // 775
    }

    [Test]
    public void LuckyLucky_Unsuited_678_Pays_10_To_1()
    {
        var cards = new[]
        {
            new Card(6, Suit.Clubs),
            new Card(7, Suit.Diamonds),
            new Card(8, Suit.Hearts)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Unsuited678));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 10)); // 275
    }

    [Test]
    public void LuckyLucky_678_Any_Order_Qualifies()
    {
        // 8-6-7 order: any order counts (spec 16.4)
        var cards = new[]
        {
            new Card(8, Suit.Clubs),
            new Card(6, Suit.Diamonds),
            new Card(7, Suit.Hearts)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Unsuited678));
    }

    [Test]
    public void LuckyLucky_Any_21_Pays_3_To_1()
    {
        // 7+7+7 is handled by the 777 check above; test a non-special 21
        // Ace+10+Jack-ish... need non-678, non-777 21: 5+7+9=21
        var cards = new[]
        {
            new Card(5, Suit.Clubs),
            new Card(7, Suit.Hearts),
            new Card(9, Suit.Spades)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Any21));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 3)); // 100
    }

    [Test]
    public void LuckyLucky_Total_20_Pays_2_To_1()
    {
        var cards = new[]
        {
            new Card(10, Suit.Clubs),
            new Card(5, Suit.Hearts),
            new Card(5, Suit.Spades)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Twenty));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 2)); // 75
    }

    [Test]
    public void LuckyLucky_Total_19_Pays_1_To_1()
    {
        var cards = new[]
        {
            new Card(10, Suit.Clubs),
            new Card(5, Suit.Hearts),
            new Card(4, Suit.Spades)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Nineteen));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 1)); // 50
    }

    [Test]
    public void LuckyLucky_Total_18_Or_Less_Loses()
    {
        var cards = new[]
        {
            new Card(5, Suit.Clubs),
            new Card(6, Suit.Hearts),
            new Card(7, Suit.Spades) // total 18
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        // Note: 5+6+7=18, not a 6-7-8 combo (no 8), not 7-7-7
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Lose));
        Assert.That(result.BankrollDelta, Is.EqualTo(0));
    }

    [Test]
    public void LuckyLucky_Suited_777_Beats_Any_21()
    {
        // 7+7+7=21 but pays 777 rate not Any21 rate
        var cards = new[]
        {
            new Card(7, Suit.Spades),
            new Card(7, Suit.Spades),
            new Card(7, Suit.Spades)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Suited777));
        Assert.That(result.BankrollDelta, Is.EqualTo(25 + 25 * 200));
    }

    [Test]
    public void LuckyLucky_Suited_678_Beats_Any_21()
    {
        // 6+7+8=21 but pays 678 rate not Any21 rate
        var cards = new[]
        {
            new Card(6, Suit.Hearts),
            new Card(7, Suit.Hearts),
            new Card(8, Suit.Hearts)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Suited678));
    }

    [Test]
    public void LuckyLucky_Ace_Counts_As_11_For_Total()
    {
        // Ace + 5 + 5 = 21 (Ace as 11)
        var cards = new[]
        {
            new Card(1, Suit.Clubs),  // Ace = 11
            new Card(5, Suit.Hearts),
            new Card(5, Suit.Spades)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Any21));
    }

    [Test]
    public void LuckyLucky_Ace_Reclassifies_To_1_When_Needed()
    {
        // Ace + King + 5 = 26 -> Ace = 1 -> 16, loses
        var cards = new[]
        {
            new Card(1, Suit.Clubs),   // Ace
            new Card(13, Suit.Hearts), // King = 10
            new Card(5, Suit.Spades)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Lose));
    }

    [Test]
    public void LuckyLucky_Ace_In_678_Does_Not_Qualify_As_678()
    {
        // Ace cannot substitute for 6 in 6-7-8 check (spec 16.4)
        var cards = new[]
        {
            new Card(1, Suit.Clubs), // Ace, not a 6
            new Card(7, Suit.Hearts),
            new Card(8, Suit.Spades)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        // Should not be 678, check total: 1+11=16? No: Ace+7+8=26->Ace=1->16. Loses.
        Assert.That(result.Outcome, Is.Not.EqualTo(LuckyLuckyOutcome.Suited678));
        Assert.That(result.Outcome, Is.Not.EqualTo(LuckyLuckyOutcome.Unsuited678));
    }

    [Test]
    public void LuckyLucky_Ace_Contributing_To_21_Total_Qualifies_As_Any21()
    {
        // Player Ace + player 6 + dealer 4 = 21 (Ace at 11), spec 16.4 example
        var cards = new[]
        {
            new Card(1, Suit.Clubs),  // Ace = 11
            new Card(6, Suit.Hearts),
            new Card(4, Suit.Spades)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Any21));
    }

    [Test]
    public void LuckyLucky_Unsuited_777_Wins_Before_Any21_Check()
    {
        // 7+7+7=21 but checked as 777 before Any21
        var cards = new[]
        {
            new Card(7, Suit.Clubs),
            new Card(7, Suit.Diamonds),
            new Card(7, Suit.Hearts)
        };
        var result = LuckyLuckyEvaluator.Evaluate(cards, bet: 25);
        Assert.That(result.Outcome, Is.EqualTo(LuckyLuckyOutcome.Unsuited777));
    }
}
