namespace TableGames.Blackjack.Logic;

/// <summary>
/// Authoritative phase enum for the Blackjack state machine.
/// Spec: architecture.md Section 1.7.
/// </summary>
public enum GamePhase
{
    Idle,
    Betting,
    Dealing,
    SideBetResolution,
    InsurancePrompt,
    PlayerTurn,
    DealerTurn,
    Resolution,
    PlayerBroke
}
