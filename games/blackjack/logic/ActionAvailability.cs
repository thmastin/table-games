namespace TableGames.Blackjack.Logic;

/// <summary>
/// Immutable snapshot of which player actions are available.
/// Computed by ActionAvailabilityCalculator on every state transition.
/// Spec: architecture.md Section 1.5.
/// </summary>
public record ActionAvailability(
    bool CanHit,
    bool CanStand,
    bool CanDouble,
    bool CanSplit,
    bool CanSurrender,
    bool CanInsurance,
    bool CanDeal
)
{
    public static ActionAvailability None => new(
        CanHit: false,
        CanStand: false,
        CanDouble: false,
        CanSplit: false,
        CanSurrender: false,
        CanInsurance: false,
        CanDeal: false
    );
}
