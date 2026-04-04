using System;
using System.Collections.Generic;
using System.Linq;

namespace TableGames.Blackjack.Logic;

/// <summary>
/// Six-deck shoe. Fisher-Yates shuffle. Tracks penetration for reshuffle trigger.
/// Spec: game-spec.md Section 2.
/// </summary>
public class Deck
{
    private const int NumDecks = 6;
    private const int CardsPerDeck = 52;
    private const int TotalCards = NumDecks * CardsPerDeck; // 312
    private const int ShuffleThreshold = TotalCards / 2;    // 156

    private Card[] _shoe;
    private int _topIndex; // next card to deal is at _shoe[_topIndex]

    public int TotalDealt { get; private set; }
    public bool ShufflePending => TotalDealt >= ShuffleThreshold;
    public int CardsRemaining => TotalCards - _topIndex;

    public Deck()
    {
        _shoe = BuildSortedShoe();
        TotalDealt = 0;
        _topIndex = 0;
        Shuffle();
    }

    /// <summary>Peek all remaining cards without dealing them. For testing only.</summary>
    public Card[] PeekAllCards()
    {
        var result = new Card[CardsRemaining];
        Array.Copy(_shoe, _topIndex, result, 0, CardsRemaining);
        return result;
    }

    /// <summary>Deal the top card from the shoe.</summary>
    public Card Deal()
    {
        if (_topIndex >= TotalCards)
            throw new InvalidOperationException("Shoe is empty — this is a fatal error state per spec section 2.4");
        var card = _shoe[_topIndex++];
        TotalDealt++;
        return card;
    }

    /// <summary>
    /// Fisher-Yates in-place shuffle of all 312 cards.
    /// Resets TotalDealt to 0 and ShufflePending to false.
    /// Spec: game-spec.md Section 2.5.
    /// </summary>
    public void Shuffle()
    {
        // Rebuild full shoe from index 0
        _shoe = BuildSortedShoe();
        _topIndex = 0;
        TotalDealt = 0;

        // Fisher-Yates
        var rng = new Random();
        for (int i = TotalCards - 1; i > 0; i--)
        {
            int j = rng.Next(i + 1);
            (_shoe[i], _shoe[j]) = (_shoe[j], _shoe[i]);
        }
    }

    private static Card[] BuildSortedShoe()
    {
        var shoe = new Card[TotalCards];
        int index = 0;
        for (int deck = 0; deck < NumDecks; deck++)
        {
            foreach (Suit suit in Enum.GetValues<Suit>())
            {
                for (int rank = 1; rank <= 13; rank++)
                {
                    shoe[index++] = new Card(rank, suit);
                }
            }
        }
        return shoe;
    }
}
