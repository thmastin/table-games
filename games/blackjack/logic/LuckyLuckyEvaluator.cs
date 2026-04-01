namespace TableGames.Blackjack.Logic;

/// <summary>
/// Lucky Lucky side bet outcome enum.
/// </summary>
public enum LuckyLuckyOutcome
{
    Suited777,
    Suited678,
    Unsuited777,
    Unsuited678,
    Any21,
    Twenty,
    Nineteen,
    Lose
}

/// <summary>
/// Lucky Lucky evaluation result.
/// </summary>
public record LuckyLuckyResult(LuckyLuckyOutcome Outcome, int BankrollDelta);

/// <summary>
/// Evaluates a three-card Lucky Lucky hand and computes payout.
/// Spec: game-spec.md Section 16.4.
/// </summary>
public static class LuckyLuckyEvaluator
{
    public static LuckyLuckyResult Evaluate(Card[] cards, int bet)
    {
        if (cards.Length != 3)
            throw new ArgumentException("Lucky Lucky requires exactly 3 cards", nameof(cards));

        var outcome = DetermineOutcome(cards);
        int delta = ComputeDelta(outcome, bet);
        return new LuckyLuckyResult(outcome, delta);
    }

    private static LuckyLuckyOutcome DetermineOutcome(Card[] cards)
    {
        bool allSame = AllSameSuit(cards);

        // Algorithm per spec 16.4 — check in exact order
        // 1. suited 7-7-7
        if (AllRanksAre(cards, 7))
        {
            return allSame ? LuckyLuckyOutcome.Suited777 : LuckyLuckyOutcome.Unsuited777;
        }

        // 2. 6-7-8 combination (any order)
        if (Is678(cards))
        {
            return allSame ? LuckyLuckyOutcome.Suited678 : LuckyLuckyOutcome.Unsuited678;
        }

        // 3-5. Compute total
        int total = Hand.ComputeTotal(cards);

        return total switch
        {
            21 => LuckyLuckyOutcome.Any21,
            20 => LuckyLuckyOutcome.Twenty,
            19 => LuckyLuckyOutcome.Nineteen,
            _ => LuckyLuckyOutcome.Lose
        };
    }

    private static bool AllSameSuit(Card[] cards) =>
        cards[0].Suit == cards[1].Suit && cards[1].Suit == cards[2].Suit;

    private static bool AllRanksAre(Card[] cards, int rank) =>
        cards[0].Rank == rank && cards[1].Rank == rank && cards[2].Rank == rank;

    private static bool Is678(Card[] cards)
    {
        // Exactly one 6, one 7, one 8 (any order) — literal rank check, no Ace substitution
        var ranks = new[] { cards[0].Rank, cards[1].Rank, cards[2].Rank };
        Array.Sort(ranks);
        return ranks[0] == 6 && ranks[1] == 7 && ranks[2] == 8;
    }

    private static int ComputeDelta(LuckyLuckyOutcome outcome, int bet) => outcome switch
    {
        LuckyLuckyOutcome.Suited777 => bet + bet * 200,
        LuckyLuckyOutcome.Suited678 => bet + bet * 100,
        LuckyLuckyOutcome.Unsuited777 => bet + bet * 30,
        LuckyLuckyOutcome.Unsuited678 => bet + bet * 10,
        LuckyLuckyOutcome.Any21 => bet + bet * 3,
        LuckyLuckyOutcome.Twenty => bet + bet * 2,
        LuckyLuckyOutcome.Nineteen => bet + bet * 1,
        LuckyLuckyOutcome.Lose => 0,
        _ => 0
    };
}
