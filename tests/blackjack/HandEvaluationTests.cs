using NUnit.Framework;
using TableGames.Blackjack.Logic;

namespace TableGames.Tests.Blackjack;

/// <summary>
/// Tests for hand total computation, soft/hard classification, bust detection,
/// blackjack detection, and soft 17 detection.
/// Spec references: game-spec.md Sections 3, 4, 5.1.
/// </summary>
[TestFixture]
public class HandEvaluationTests
{
    // Helper: create a card with given rank (suit irrelevant for totals)
    private static Card C(int rank, Suit suit = Suit.Spades) => new Card(rank, suit);

    // ---- Section 3: Card Values / Hand Total Algorithm ----

    [Test]
    public void Hard_Total_Two_Cards_No_Ace()
    {
        var hand = new Hand();
        hand.AddCard(C(10)); // 10
        hand.AddCard(C(5));  // 5
        Assert.That(hand.Total, Is.EqualTo(15));
        Assert.That(hand.IsSoft, Is.False);
    }

    [Test]
    public void Hard_Total_Face_Cards_Count_As_Ten()
    {
        var hand = new Hand();
        hand.AddCard(C(11)); // Jack = 10
        hand.AddCard(C(12)); // Queen = 10
        Assert.That(hand.Total, Is.EqualTo(20));
        Assert.That(hand.IsSoft, Is.False);
    }

    [Test]
    public void King_Counts_As_Ten()
    {
        var hand = new Hand();
        hand.AddCard(C(13)); // King = 10
        hand.AddCard(C(7));
        Assert.That(hand.Total, Is.EqualTo(17));
    }

    [Test]
    public void Soft_Hand_Ace_Plus_Six_Equals_Soft_17()
    {
        var hand = new Hand();
        hand.AddCard(C(1)); // Ace
        hand.AddCard(C(6));
        Assert.That(hand.Total, Is.EqualTo(17));
        Assert.That(hand.IsSoft, Is.True);
    }

    [Test]
    public void Soft_Hand_Reclassified_To_Hard_When_Ace_Would_Bust()
    {
        // Ace + 6 + 8 = hard 15 (Ace reclassified to 1)
        var hand = new Hand();
        hand.AddCard(C(1)); // Ace
        hand.AddCard(C(6));
        hand.AddCard(C(8));
        Assert.That(hand.Total, Is.EqualTo(15));
        Assert.That(hand.IsSoft, Is.False);
    }

    [Test]
    public void Two_Aces_Equals_Soft_12()
    {
        // Ace + Ace = soft 12 (one Ace at 11, one at 1)
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(1));
        Assert.That(hand.Total, Is.EqualTo(12));
        Assert.That(hand.IsSoft, Is.True);
    }

    [Test]
    public void Two_Aces_Plus_Nine_Equals_Hard_11()
    {
        // Ace + Ace + 9 = hard 11 (both Aces at 1)
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(1));
        hand.AddCard(C(9));
        Assert.That(hand.Total, Is.EqualTo(11));
        Assert.That(hand.IsSoft, Is.False);
    }

    [Test]
    public void Ace_Plus_Ten_Equals_Soft_21()
    {
        var hand = new Hand();
        hand.AddCard(C(1)); // Ace
        hand.AddCard(C(10));
        Assert.That(hand.Total, Is.EqualTo(21));
        Assert.That(hand.IsSoft, Is.True);
    }

    [Test]
    public void Ace_Plus_Jack_Equals_21()
    {
        var hand = new Hand();
        hand.AddCard(C(1));  // Ace
        hand.AddCard(C(11)); // Jack
        Assert.That(hand.Total, Is.EqualTo(21));
    }

    [Test]
    public void Ace_Plus_Queen_Equals_21()
    {
        var hand = new Hand();
        hand.AddCard(C(1));  // Ace
        hand.AddCard(C(12)); // Queen
        Assert.That(hand.Total, Is.EqualTo(21));
    }

    [Test]
    public void Ace_Plus_King_Equals_21()
    {
        var hand = new Hand();
        hand.AddCard(C(1));  // Ace
        hand.AddCard(C(13)); // King
        Assert.That(hand.Total, Is.EqualTo(21));
    }

    [Test]
    public void Hard_Hand_No_Aces()
    {
        var hand = new Hand();
        hand.AddCard(C(10));
        hand.AddCard(C(5));
        Assert.That(hand.IsSoft, Is.False);
        Assert.That(hand.Total, Is.EqualTo(15));
    }

    [Test]
    public void Ace_Plus_5_Plus_5_Equals_21_Soft()
    {
        var hand = new Hand();
        hand.AddCard(C(1)); // Ace
        hand.AddCard(C(5));
        hand.AddCard(C(5));
        // Ace(11)+5+5 = 21, soft
        Assert.That(hand.Total, Is.EqualTo(21));
        Assert.That(hand.IsSoft, Is.True);
    }

    [Test]
    public void Multi_Ace_Hand_Only_One_Counts_As_11()
    {
        // Three aces: 11+1+1 = 13 (soft)
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(1));
        hand.AddCard(C(1));
        Assert.That(hand.Total, Is.EqualTo(13));
        Assert.That(hand.IsSoft, Is.True);
    }

    [Test]
    public void Hand_Algorithm_Sum_As_One_First_Then_Promote()
    {
        // Algorithm: sum all as 1, then add +10 for each Ace while total <= 21
        // Ace + 5 = 1+5=6, +10 = 16. soft 16.
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(5));
        Assert.That(hand.Total, Is.EqualTo(16));
        Assert.That(hand.IsSoft, Is.True);
    }

    // ---- Bust Detection ----

    [Test]
    public void Hand_Is_Bust_When_Total_Exceeds_21()
    {
        var hand = new Hand();
        hand.AddCard(C(10));
        hand.AddCard(C(10));
        hand.AddCard(C(5));
        Assert.That(hand.IsBust, Is.True);
        Assert.That(hand.Total, Is.EqualTo(25));
    }

    [Test]
    public void Hand_Is_Not_Bust_At_21()
    {
        var hand = new Hand();
        hand.AddCard(C(10));
        hand.AddCard(C(10));
        hand.AddCard(C(1));
        // 10+10+Ace: 1+10+10=21 with Ace at 1, soft check: 1+10=11 <=21, +10=21 <= 21, so Ace=11: 11+10+... wait
        // 10+10 = 20, +Ace: sum=1+10+10=21 base, bonus aces=1: 21+10=31 > 21, so Ace stays 1
        // Total = 21, hard
        Assert.That(hand.Total, Is.EqualTo(21));
        Assert.That(hand.IsBust, Is.False);
    }

    [Test]
    public void Hand_Is_Not_Bust_At_22_With_Ace_Reclassified()
    {
        // Ace + 10 + 10 would be 31 if Ace=11, so Ace reclassifies to 1: total = 21
        var hand = new Hand();
        hand.AddCard(C(1));  // Ace
        hand.AddCard(C(10));
        hand.AddCard(C(10));
        Assert.That(hand.Total, Is.EqualTo(21));
        Assert.That(hand.IsBust, Is.False);
    }

    [Test]
    public void Bust_On_Three_Tens()
    {
        var hand = new Hand();
        hand.AddCard(C(10));
        hand.AddCard(C(10));
        hand.AddCard(C(10));
        Assert.That(hand.IsBust, Is.True);
        Assert.That(hand.Total, Is.EqualTo(30));
    }

    // ---- Section 4: Blackjack Detection ----

    [Test]
    public void Blackjack_Ace_Plus_Ten()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(10));
        Assert.That(hand.IsBlackjack, Is.True);
    }

    [Test]
    public void Blackjack_Ace_Plus_Jack()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(11));
        Assert.That(hand.IsBlackjack, Is.True);
    }

    [Test]
    public void Blackjack_Ace_Plus_Queen()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(12));
        Assert.That(hand.IsBlackjack, Is.True);
    }

    [Test]
    public void Blackjack_Ace_Plus_King()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(13));
        Assert.That(hand.IsBlackjack, Is.True);
    }

    [Test]
    public void Blackjack_Ten_Plus_Ace()
    {
        // Order doesn't matter for blackjack determination
        var hand = new Hand();
        hand.AddCard(C(10));
        hand.AddCard(C(1));
        Assert.That(hand.IsBlackjack, Is.True);
    }

    [Test]
    public void Not_Blackjack_Three_Card_21()
    {
        // Three-card 21 is NOT blackjack (spec 4)
        var hand = new Hand();
        hand.AddCard(C(7));
        hand.AddCard(C(7));
        hand.AddCard(C(7));
        Assert.That(hand.Total, Is.EqualTo(21));
        Assert.That(hand.IsBlackjack, Is.False);
    }

    [Test]
    public void Not_Blackjack_Two_Tens()
    {
        // Pair of 10s is not blackjack
        var hand = new Hand();
        hand.AddCard(C(10));
        hand.AddCard(C(10));
        Assert.That(hand.Total, Is.EqualTo(20));
        Assert.That(hand.IsBlackjack, Is.False);
    }

    [Test]
    public void Not_Blackjack_Non_21_Total()
    {
        var hand = new Hand();
        hand.AddCard(C(10));
        hand.AddCard(C(5));
        Assert.That(hand.IsBlackjack, Is.False);
    }

    [Test]
    public void Blackjack_Is_Also_21()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(10));
        Assert.That(hand.Total, Is.EqualTo(21));
        Assert.That(hand.IsBlackjack, Is.True);
    }

    // ---- Section 5.1: Soft 17 Detection ----

    [Test]
    public void IsSoft17_True_For_Ace_Plus_Six()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(6));
        Assert.That(hand.IsSoft17, Is.True);
    }

    [Test]
    public void IsSoft17_False_For_Hard_17()
    {
        var hand = new Hand();
        hand.AddCard(C(10));
        hand.AddCard(C(7));
        Assert.That(hand.IsSoft17, Is.False);
    }

    [Test]
    public void IsSoft17_False_For_Soft_16()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(5));
        Assert.That(hand.IsSoft17, Is.False);
    }

    [Test]
    public void IsSoft17_False_For_Soft_18()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(7));
        Assert.That(hand.IsSoft17, Is.False);
    }

    [Test]
    public void IsSoft17_False_For_Three_Card_Soft_17()
    {
        // Ace + 3 + 3 = soft 17, but it's three cards. IsSoft17 is about value, not card count.
        // Per spec 5.1 soft 17 is: total is 17 AND hand is soft
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(3));
        hand.AddCard(C(3));
        // 1+3+3=7 base, +10 = 17, soft 17
        Assert.That(hand.Total, Is.EqualTo(17));
        Assert.That(hand.IsSoft, Is.True);
        Assert.That(hand.IsSoft17, Is.True);
    }

    // ---- Spec examples from Section 3 ----

    [Test]
    public void Spec_Example_Ace_Plus_6_Equals_Soft_17()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(6));
        Assert.That(hand.Total, Is.EqualTo(17));
        Assert.That(hand.IsSoft, Is.True);
    }

    [Test]
    public void Spec_Example_Ace_6_8_Equals_Hard_15()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(6));
        hand.AddCard(C(8));
        Assert.That(hand.Total, Is.EqualTo(15));
        Assert.That(hand.IsSoft, Is.False);
    }

    [Test]
    public void Spec_Example_Ace_Ace_Equals_Soft_12()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(1));
        Assert.That(hand.Total, Is.EqualTo(12));
        Assert.That(hand.IsSoft, Is.True);
    }

    [Test]
    public void Spec_Example_Ace_Ace_9_Equals_Hard_11()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        hand.AddCard(C(1));
        hand.AddCard(C(9));
        Assert.That(hand.Total, Is.EqualTo(11));
        Assert.That(hand.IsSoft, Is.False);
    }

    [Test]
    public void Spec_Example_10_5_Equals_Hard_15()
    {
        var hand = new Hand();
        hand.AddCard(C(10));
        hand.AddCard(C(5));
        Assert.That(hand.Total, Is.EqualTo(15));
        Assert.That(hand.IsSoft, Is.False);
    }

    // ---- Edge cases ----

    [Test]
    public void Empty_Hand_Total_Is_Zero()
    {
        var hand = new Hand();
        Assert.That(hand.Total, Is.EqualTo(0));
    }

    [Test]
    public void Single_Ace_Has_Total_11_And_Is_Soft()
    {
        var hand = new Hand();
        hand.AddCard(C(1));
        Assert.That(hand.Total, Is.EqualTo(11));
        Assert.That(hand.IsSoft, Is.True);
    }

    [Test]
    public void Four_Aces_Has_Total_14_Soft()
    {
        // 4 aces: sum=4 base, +10=14, try +10=24>21, so only one bonus. Soft 14.
        var hand = new Hand();
        for (int i = 0; i < 4; i++) hand.AddCard(C(1));
        Assert.That(hand.Total, Is.EqualTo(14));
        Assert.That(hand.IsSoft, Is.True);
    }

    [Test]
    public void CardCount_Tracks_Correctly()
    {
        var hand = new Hand();
        Assert.That(hand.CardCount, Is.EqualTo(0));
        hand.AddCard(C(5));
        Assert.That(hand.CardCount, Is.EqualTo(1));
        hand.AddCard(C(3));
        Assert.That(hand.CardCount, Is.EqualTo(2));
    }

    [Test]
    public void Two_Card_Hand_Not_Bust_Not_21_Has_Total_Less_Than_21()
    {
        var hand = new Hand();
        hand.AddCard(C(9));
        hand.AddCard(C(8));
        Assert.That(hand.Total, Is.EqualTo(17));
        Assert.That(hand.IsBust, Is.False);
        Assert.That(hand.IsBlackjack, Is.False);
    }
}
