namespace TableGames.Blackjack.Logic;

/// <summary>
/// Outcome enum for a resolved player hand.
/// Spec: architecture.md Section 1.6.
/// </summary>
public enum HandOutcome
{
    BlackjackWin,
    Win,
    Push,
    Loss,
    Surrender
}

/// <summary>
/// Resolved hand result record.
/// Spec: architecture.md Section 1.6.
/// </summary>
public record HandResult(
    HandOutcome Outcome,
    int NetDelta,
    bool IsBlackjack
);
