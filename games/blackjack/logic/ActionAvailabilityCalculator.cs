namespace TableGames.Blackjack.Logic;

/// <summary>
/// Computes ActionAvailability given a BlackjackGameState snapshot.
/// Spec: game-spec.md Section 8.
/// </summary>
public static class ActionAvailabilityCalculator
{
    public static ActionAvailability Compute(BlackjackGameState state)
    {
        return new ActionAvailability(
            CanHit: CanHit(state),
            CanStand: CanStand(state),
            CanDouble: CanDouble(state),
            CanSplit: CanSplit(state),
            CanSurrender: CanSurrender(state),
            CanInsurance: CanInsurance(state),
            CanDeal: CanDeal(state)
        );
    }

    // ---- 8.2 Hit ----
    private static bool CanHit(BlackjackGameState s)
    {
        if (s.CurrentPhase != GamePhase.PlayerTurn) return false;
        var hand = ActiveHand(s);
        if (hand == null) return false;
        if (hand.IsSplitAcesHand) return false;
        if (hand.IsBust) return false;
        if (hand.Total >= 21) return false;
        return true;
    }

    // ---- 8.1 Stand ----
    private static bool CanStand(BlackjackGameState s)
    {
        if (s.CurrentPhase != GamePhase.PlayerTurn) return false;
        var hand = ActiveHand(s);
        if (hand == null) return false;
        if (hand.IsBust) return false;
        return true;
    }

    // ---- 8.3 Double ----
    private static bool CanDouble(BlackjackGameState s)
    {
        if (s.CurrentPhase != GamePhase.PlayerTurn) return false;
        var hand = ActiveHand(s);
        if (hand == null) return false;
        if (hand.CardCount != 2) return false;
        if (hand.IsSplitAcesHand) return false;
        if (hand.IsBust) return false;
        if (s.Bankroll < hand.MainBet) return false;
        return true;
    }

    // ---- 8.4 Split ----
    private static bool CanSplit(BlackjackGameState s)
    {
        if (s.CurrentPhase != GamePhase.PlayerTurn) return false;
        var hand = ActiveHand(s);
        if (hand == null) return false;
        if (hand.IsSplitAcesHand) return false; // re-split aces not allowed
        if (hand.CardCount != 2) return false;
        if (s.SplitCount >= 3) return false; // max 4 hands = 3 splits
        if (s.Bankroll < hand.MainBet) return false;
        if (!AreSplitEligible(hand.Cards[0], hand.Cards[1])) return false;
        return true;
    }

    // ---- 8.5 Surrender ----
    private static bool CanSurrender(BlackjackGameState s)
    {
        if (s.CurrentPhase != GamePhase.PlayerTurn) return false;
        var hand = ActiveHand(s);
        if (hand == null) return false;
        if (hand.CardCount != 2) return false;
        if (hand.IsFromSplit) return false; // surrender not on split hands
        // Late surrender: dealer already peeked and does not have blackjack
        if (!s.DealerPeekedNoBlackjack) return false;
        return true;
    }

    // ---- 8.6 Insurance ----
    private static bool CanInsurance(BlackjackGameState s)
    {
        if (s.CurrentPhase != GamePhase.InsurancePrompt) return false;
        int insuranceAmount = s.MainBet / 2; // floor
        return s.Bankroll >= insuranceAmount;
    }

    // ---- CanDeal ----
    private static bool CanDeal(BlackjackGameState s)
    {
        if (s.CurrentPhase != GamePhase.Betting) return false;
        return s.MainBet >= s.MinBet;
    }

    // ---- Helpers ----

    private static PlayerHandState? ActiveHand(BlackjackGameState s)
    {
        if (s.PlayerHands == null || s.PlayerHands.Length == 0) return null;
        if (s.ActiveHandIndex < 0 || s.ActiveHandIndex >= s.PlayerHands.Length) return null;
        return s.PlayerHands[s.ActiveHandIndex];
    }

    /// <summary>
    /// Two cards are split-eligible if they share the same split rank.
    /// Split rank rules: all 10-value cards are equal; Aces only match Aces;
    /// numeric ranks 2-9 only match identical rank. (spec 6.4)
    /// </summary>
    private static bool AreSplitEligible(Card a, Card b)
    {
        // Both 10-value: eligible
        if (a.IsTenValue && b.IsTenValue) return true;
        // Both Aces
        if (a.IsAce && b.IsAce) return true;
        // Numeric non-10 ranks: must match exactly
        if (!a.IsTenValue && !a.IsAce && !b.IsTenValue && !b.IsAce)
            return a.Rank == b.Rank;
        return false;
    }
}
