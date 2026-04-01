namespace TableGames.Blackjack.Logic;

/// <summary>
/// Player hand state — pure data, no behavior.
/// Spec: architecture.md Section 1.2.
/// </summary>
public record PlayerHandState(
    Card[] Cards,
    int MainBet,
    int DoubleDownBet,
    bool IsFromSplit,
    bool IsSplitAcesHand,
    bool IsStood,
    bool IsBust,
    bool IsSurrendered,
    bool IsDoubled
)
{
    public int CardCount => Cards.Length;
    public int Total => Hand.ComputeTotal(Cards);
    public bool IsSoft => Hand.ComputeSoft(Cards);
    public bool IsBlackjack
    {
        get
        {
            if (Cards.Length != 2) return false;
            return (Cards[0].IsAce && Cards[1].IsTenValue) ||
                   (Cards[1].IsAce && Cards[0].IsTenValue);
        }
    }
}

/// <summary>
/// Dealer hand state — pure data.
/// Spec: architecture.md Section 1.3.
/// </summary>
public record DealerHandState(
    Card[] Cards,
    bool HoleCardFaceUp
)
{
    public int Total => Hand.ComputeTotal(Cards);
    public bool IsSoft => Hand.ComputeSoft(Cards);
    public bool IsBlackjack
    {
        get
        {
            if (Cards.Length < 2) return false;
            return (Cards[0].IsAce && Cards[1].IsTenValue) ||
                   (Cards[1].IsAce && Cards[0].IsTenValue);
        }
    }
    public bool IsBust => Total > 21;
    public bool IsSoft17 => Total == 17 && IsSoft;
    public Card? UpCard => Cards.Length > 0 ? Cards[0] : null;
    public Card? HoleCard => Cards.Length > 1 ? Cards[1] : null;
}

/// <summary>
/// Shoe state snapshot.
/// Spec: architecture.md Section 1.4.
/// </summary>
public record ShoeState(
    int TotalDealt,
    bool ShufflePending
);

/// <summary>
/// Complete immutable game state snapshot.
/// Spec: architecture.md Section 1.1 + game-spec.md Section 8.0.
/// </summary>
public record BlackjackGameState(
    GamePhase CurrentPhase,
    int ActiveHandIndex,
    int MainBet,
    int DoubleDownBet,
    int InsuranceBet,
    int TriLuxBet,
    int LuckyLuckyBet,
    int[] BetDenominations,
    PlayerHandState[] PlayerHands,
    DealerHandState DealerHand,
    ShoeState Shoe,
    int Bankroll,
    int MinBet,
    int SplitCount,
    bool DealerPeekedNoBlackjack,
    ActionAvailability Actions
);
