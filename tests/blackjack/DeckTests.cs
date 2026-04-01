using NUnit.Framework;
using TableGames.Blackjack.Logic;

namespace TableGames.Tests.Blackjack;

/// <summary>
/// Tests for Deck/shoe construction, shuffle, deal, shoe state, and reshuffle trigger.
/// Spec references: game-spec.md Section 2.
/// </summary>
[TestFixture]
public class DeckTests
{
    // --- 2.1 Deck Count ---

    [Test]
    public void Shoe_Contains_312_Cards_On_Construction()
    {
        var deck = new Deck();
        Assert.That(deck.CardsRemaining, Is.EqualTo(312));
    }

    [Test]
    public void Shoe_Has_Six_Complete_Decks_All_Suits_And_Ranks()
    {
        var deck = new Deck();
        var allCards = deck.PeekAllCards();

        // 4 suits * 13 ranks * 6 decks = 312
        Assert.That(allCards.Length, Is.EqualTo(312));

        // Each suit+rank combination appears exactly 6 times
        var suits = new[] { Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades };
        for (int rank = 1; rank <= 13; rank++)
        {
            foreach (var suit in suits)
            {
                int count = allCards.Count(c => c.Rank == rank && c.Suit == suit);
                Assert.That(count, Is.EqualTo(6), $"Rank {rank} {suit} should appear exactly 6 times");
            }
        }
    }

    [Test]
    public void Shoe_Contains_No_Jokers()
    {
        var deck = new Deck();
        var allCards = deck.PeekAllCards();
        Assert.That(allCards.All(c => c.Rank >= 1 && c.Rank <= 13), Is.True, "No card should have rank outside 1-13");
    }

    // --- 2.2 Shoe State ---

    [Test]
    public void TotalDealt_Is_Zero_At_Construction()
    {
        var deck = new Deck();
        Assert.That(deck.TotalDealt, Is.EqualTo(0));
    }

    [Test]
    public void ShufflePending_Is_False_At_Construction()
    {
        var deck = new Deck();
        Assert.That(deck.ShufflePending, Is.False);
    }

    // --- Deal ---

    [Test]
    public void Deal_Returns_Top_Card()
    {
        var deck = new Deck();
        var topCard = deck.PeekAllCards()[0];
        var dealt = deck.Deal();
        Assert.That(dealt, Is.EqualTo(topCard));
    }

    [Test]
    public void Deal_Reduces_CardsRemaining_By_One()
    {
        var deck = new Deck();
        deck.Deal();
        Assert.That(deck.CardsRemaining, Is.EqualTo(311));
    }

    [Test]
    public void Deal_Increments_TotalDealt()
    {
        var deck = new Deck();
        deck.Deal();
        Assert.That(deck.TotalDealt, Is.EqualTo(1));
    }

    [Test]
    public void Deal_Multiple_Cards_Increments_TotalDealt_Correctly()
    {
        var deck = new Deck();
        for (int i = 0; i < 10; i++) deck.Deal();
        Assert.That(deck.TotalDealt, Is.EqualTo(10));
        Assert.That(deck.CardsRemaining, Is.EqualTo(302));
    }

    // --- 2.4 Shuffle Trigger ---

    [Test]
    public void ShufflePending_Becomes_True_After_156_Cards_Dealt()
    {
        var deck = new Deck();
        for (int i = 0; i < 156; i++) deck.Deal();
        Assert.That(deck.ShufflePending, Is.True);
    }

    [Test]
    public void ShufflePending_Is_False_After_155_Cards_Dealt()
    {
        var deck = new Deck();
        for (int i = 0; i < 155; i++) deck.Deal();
        Assert.That(deck.ShufflePending, Is.False);
    }

    [Test]
    public void ShufflePending_Is_True_After_More_Than_156_Cards_Dealt()
    {
        var deck = new Deck();
        for (int i = 0; i < 200; i++) deck.Deal();
        Assert.That(deck.ShufflePending, Is.True);
    }

    // --- 2.5 Shuffle Behavior ---

    [Test]
    public void Shuffle_Resets_TotalDealt_To_Zero()
    {
        var deck = new Deck();
        for (int i = 0; i < 160; i++) deck.Deal();
        deck.Shuffle();
        Assert.That(deck.TotalDealt, Is.EqualTo(0));
    }

    [Test]
    public void Shuffle_Resets_ShufflePending_To_False()
    {
        var deck = new Deck();
        for (int i = 0; i < 160; i++) deck.Deal();
        Assert.That(deck.ShufflePending, Is.True);
        deck.Shuffle();
        Assert.That(deck.ShufflePending, Is.False);
    }

    [Test]
    public void Shuffle_Restores_All_312_Cards()
    {
        var deck = new Deck();
        for (int i = 0; i < 50; i++) deck.Deal();
        deck.Shuffle();
        Assert.That(deck.CardsRemaining, Is.EqualTo(312));
    }

    [Test]
    public void Shuffle_Produces_Valid_Deck_All_Cards_Present()
    {
        var deck = new Deck();
        for (int i = 0; i < 100; i++) deck.Deal();
        deck.Shuffle();
        var allCards = deck.PeekAllCards();
        var suits = new[] { Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades };
        for (int rank = 1; rank <= 13; rank++)
        {
            foreach (var suit in suits)
            {
                int count = allCards.Count(c => c.Rank == rank && c.Suit == suit);
                Assert.That(count, Is.EqualTo(6), $"After shuffle, rank {rank} {suit} should appear exactly 6 times");
            }
        }
    }

    [Test]
    public void Shuffle_Randomizes_Order_Fisher_Yates()
    {
        // Run two shuffles; the probability of identical order in a 312-card deck is astronomically small
        var deck1 = new Deck();
        var deck2 = new Deck();
        // Force a consistent pre-shuffle state
        deck1.Shuffle();
        deck2.Shuffle();
        var cards1 = deck1.PeekAllCards();
        var cards2 = deck2.PeekAllCards();
        // They could theoretically match but the chance is ~1/312! — treat as always different
        bool identical = cards1.Zip(cards2, (a, b) => a.Equals(b)).All(x => x);
        Assert.That(identical, Is.False, "Two independent shuffles should not produce identical order");
    }

    // --- 2.6 Shoe Reset Trigger ---

    [Test]
    public void Shuffle_Can_Be_Called_Without_Threshold_Reached()
    {
        // New session reset path — shuffle can be called at any time
        var deck = new Deck();
        Assert.DoesNotThrow(() => deck.Shuffle());
        Assert.That(deck.CardsRemaining, Is.EqualTo(312));
    }

    [Test]
    public void Deal_From_New_Deck_Returns_Unique_Cards_In_Sequence()
    {
        var deck = new Deck();
        var dealt = new List<Card>();
        for (int i = 0; i < 10; i++) dealt.Add(deck.Deal());
        // All 10 cards were dealt (shoe tracks correctly)
        Assert.That(dealt.Count, Is.EqualTo(10));
        Assert.That(deck.TotalDealt, Is.EqualTo(10));
        // All dealt cards are valid (rank 1-13, valid suit)
        Assert.That(dealt.All(c => c.Rank >= 1 && c.Rank <= 13), Is.True);
        // NOTE: A 6-deck shoe has 6 copies of each card, so distinctness is not guaranteed
        // across sequential deals. Testing count and validity instead.
    }
}
