using System;
using System.Linq;

namespace TableGames.Blackjack.Logic;

/// <summary>
/// TriLux side bet outcome enum.
/// </summary>
public enum TriLuxOutcome
{
    StraightFlush,
    ThreeOfAKind,
    Straight,
    Flush,
    Lose
}

/// <summary>
/// TriLux evaluation result.
/// </summary>
public record TriLuxResult(TriLuxOutcome Outcome, int BankrollDelta);

/// <summary>
/// Evaluates a three-card TriLux hand and computes payout.
/// Spec: game-spec.md Section 16.3.
/// </summary>
public static class TriLuxEvaluator
{
    public static TriLuxResult Evaluate(Card[] cards, int bet)
    {
        if (cards.Length != 3)
            throw new ArgumentException("TriLux requires exactly 3 cards", nameof(cards));

        var outcome = DetermineOutcome(cards);
        int delta = ComputeDelta(outcome, bet);
        return new TriLuxResult(outcome, delta);
    }

    private static TriLuxOutcome DetermineOutcome(Card[] cards)
    {
        bool isFlush = AllSameSuit(cards);
        bool isStraight = IsStraight(cards);

        // Algorithm per spec 16.3: check in strict priority order
        if (isStraight && isFlush) return TriLuxOutcome.StraightFlush;
        if (IsThreeOfAKind(cards)) return TriLuxOutcome.ThreeOfAKind;
        if (isStraight) return TriLuxOutcome.Straight;
        if (isFlush) return TriLuxOutcome.Flush;
        return TriLuxOutcome.Lose;
    }

    private static bool AllSameSuit(Card[] cards) =>
        cards[0].Suit == cards[1].Suit && cards[1].Suit == cards[2].Suit;

    private static bool IsThreeOfAKind(Card[] cards) =>
        cards[0].Rank == cards[1].Rank && cards[1].Rank == cards[2].Rank;

    private static bool IsStraight(Card[] cards)
    {
        // Get ranks, treating Ace as either 1 or 14
        var ranks = cards.Select(c => c.Rank).ToArray();
        Array.Sort(ranks);

        // Check consecutive with Ace as rank 1
        if (IsConsecutive(ranks)) return true;

        // Check with Ace as rank 14 (replace any rank-1 with 14)
        var ranksHigh = ranks.Select(r => r == 1 ? 14 : r).ToArray();
        Array.Sort(ranksHigh);
        return IsConsecutive(ranksHigh);
    }

    private static bool IsConsecutive(int[] sortedRanks) =>
        sortedRanks[1] == sortedRanks[0] + 1 &&
        sortedRanks[2] == sortedRanks[1] + 1;

    private static int ComputeDelta(TriLuxOutcome outcome, int bet) => outcome switch
    {
        TriLuxOutcome.StraightFlush => bet + bet * 40,
        TriLuxOutcome.ThreeOfAKind => bet + bet * 25,
        TriLuxOutcome.Straight => bet + bet * 10,
        TriLuxOutcome.Flush => bet + bet * 5,
        TriLuxOutcome.Lose => 0,
        _ => 0
    };
}
