using System;

namespace TableGames.Blackjack.Logic;

/// <summary>
/// Thrown when an invalid state machine transition is attempted.
/// Spec: architecture.md Section 2 — "reject any transition not in this table".
/// </summary>
public class InvalidTransitionException : Exception
{
    public GamePhase FromPhase { get; }
    public string Trigger { get; }

    public InvalidTransitionException(GamePhase fromPhase, string trigger)
        : base($"Invalid transition '{trigger}' from phase {fromPhase}")
    {
        FromPhase = fromPhase;
        Trigger = trigger;
    }

    public InvalidTransitionException(string message) : base(message) { }
}
