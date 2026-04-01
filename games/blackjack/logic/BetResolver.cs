namespace TableGames.Blackjack.Logic;

/// <summary>
/// Result of a bet resolution computation.
/// </summary>
public record BetResolutionResult(int BankrollDelta);

/// <summary>
/// Resolves all bet types given hand outcomes. Returns net bankroll delta.
/// Does not call GlobalState — returns the value for the caller to apply.
/// Spec: game-spec.md Sections 7, 11.5.
/// </summary>
public static class BetResolver
{
    /// <summary>
    /// Computes the bankroll delta for a resolved player hand.
    /// mainBet and doubleDownBet are already deducted from bankroll at deal/double time.
    /// This returns what gets ADDED back (0 for loss, bet+winnings for win, etc.).
    /// </summary>
    public static BetResolutionResult Resolve(
        HandOutcome outcome,
        int mainBet,
        int doubleDownBet,
        int insuranceBet)
    {
        int delta = outcome switch
        {
            // Blackjack 3:2 — original bet + floor(bet * 1.5) winnings
            HandOutcome.BlackjackWin => mainBet + (int)(mainBet * 1.5),

            // Standard win 1:1 — original bet returned + equal winnings
            // If doubled: combined bet returned + equal combined winnings
            HandOutcome.Win => (mainBet + doubleDownBet) * 2,

            // Push — original bet (+ double if applicable) returned, no winnings
            HandOutcome.Push => mainBet + doubleDownBet,

            // Loss — nothing returned (bet already deducted)
            HandOutcome.Loss => 0,

            // Surrender — floor(mainBet / 2) returned
            HandOutcome.Surrender => mainBet / 2,

            _ => throw new ArgumentOutOfRangeException(nameof(outcome), outcome, null)
        };
        return new BetResolutionResult(delta);
    }

    /// <summary>
    /// Resolves an insurance bet.
    /// Insurance bet was already deducted from bankroll when placed.
    /// Returns what gets added back (0 if loss/not placed, InsuranceBet*3 if win).
    /// Spec: game-spec.md Section 6.6.
    /// </summary>
    public static BetResolutionResult ResolveInsurance(int insuranceBet, bool dealerHasBlackjack)
    {
        if (insuranceBet <= 0) return new BetResolutionResult(0);
        if (!dealerHasBlackjack) return new BetResolutionResult(0);
        // Win: original bet returned + 2x winnings = insuranceBet * 3
        return new BetResolutionResult(insuranceBet * 3);
    }
}
