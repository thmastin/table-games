using System.Collections.Generic;
using System.Linq;

namespace TableGames.Blackjack.Logic;

/// <summary>
/// Mutable hand for use during test-level hand evaluation.
/// Implements the hand total algorithm from game-spec.md Section 3.
/// </summary>
public class Hand
{
    private readonly List<Card> _cards = new();

    public int CardCount => _cards.Count;

    public IReadOnlyList<Card> Cards => _cards;

    public void AddCard(Card card)
    {
        _cards.Add(card);
    }

    /// <summary>
    /// Best total per game-spec.md Section 3 algorithm:
    /// 1. Sum all cards treating Aces as 1.
    /// 2. Count Aces.
    /// 3. While bonus aces remain and sum+10 <= 21: add 10, decrement bonus count.
    /// 4. Return sum.
    /// </summary>
    public int Total => ComputeTotal(_cards);

    /// <summary>
    /// True if the total used at least one Ace counted as 11 (spec Section 3).
    /// </summary>
    public bool IsSoft => ComputeSoft(_cards);

    /// <summary>
    /// True if total > 21.
    /// </summary>
    public bool IsBust => Total > 21;

    /// <summary>
    /// True if exactly two cards, one is an Ace, one is a 10-value card (spec Section 4).
    /// This represents a natural blackjack. Returns false for split hands — that logic is
    /// handled at the state layer.
    /// </summary>
    public bool IsBlackjack
    {
        get
        {
            if (_cards.Count != 2) return false;
            return (_cards[0].IsAce && _cards[1].IsTenValue) ||
                   (_cards[1].IsAce && _cards[0].IsTenValue);
        }
    }

    /// <summary>
    /// True if total is exactly 17 and hand is soft (spec Section 5.1).
    /// </summary>
    public bool IsSoft17 => Total == 17 && IsSoft;

    /// <summary>
    /// Static computation of best total for a card list.
    /// </summary>
    public static int ComputeTotal(IEnumerable<Card> cards)
    {
        int sum = 0;
        int aceCount = 0;
        foreach (var card in cards)
        {
            sum += card.BaseValue;
            if (card.IsAce) aceCount++;
        }
        // Promote aces from 1 to 11 while we won't bust.
        // Special case per spec section 3: when two or more aces remain unresolved and
        // promoting one would bring the total to exactly 21, do not promote — both aces
        // must stay at 1 (e.g. Ace+Ace+9 = hard 11, not soft 21).
        while (aceCount > 0 && sum + 10 <= 21 && !(sum + 10 == 21 && aceCount > 1))
        {
            sum += 10;
            aceCount--;
        }
        return sum;
    }

    /// <summary>
    /// True if computing total used at least one Ace as 11.
    /// </summary>
    public static bool ComputeSoft(IEnumerable<Card> cards)
    {
        var cardList = cards as IList<Card> ?? cards.ToList();
        int sum = 0;
        int aceCount = 0;
        foreach (var card in cardList)
        {
            sum += card.BaseValue;
            if (card.IsAce) aceCount++;
        }
        int bonusesApplied = 0;
        while (aceCount > 0 && sum + 10 <= 21 && !(sum + 10 == 21 && aceCount > 1))
        {
            sum += 10;
            aceCount--;
            bonusesApplied++;
        }
        return bonusesApplied > 0;
    }
}
