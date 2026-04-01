namespace TableGames.Blackjack.Logic;

/// <summary>
/// Suit enumeration for a standard card.
/// </summary>
public enum Suit
{
    Clubs,
    Diamonds,
    Hearts,
    Spades
}

/// <summary>
/// Immutable card value. Rank 1=Ace, 2-10=face value, 11=Jack, 12=Queen, 13=King.
/// Point value computation is done by Hand, not Card.
/// </summary>
public readonly struct Card : IEquatable<Card>
{
    /// <summary>Rank: 1 (Ace) through 13 (King).</summary>
    public int Rank { get; }

    /// <summary>Suit of the card.</summary>
    public Suit Suit { get; }

    public Card(int rank, Suit suit)
    {
        if (rank < 1 || rank > 13)
            throw new ArgumentOutOfRangeException(nameof(rank), $"Rank must be 1-13, got {rank}");
        Rank = rank;
        Suit = suit;
    }

    /// <summary>
    /// Base point value (Ace = 1, 2-9 = face, 10/J/Q/K = 10).
    /// Ace-as-11 bonus is applied by Hand.Total, not here.
    /// </summary>
    public int BaseValue => Rank switch
    {
        1 => 1,
        >= 2 and <= 9 => Rank,
        _ => 10 // 10, Jack, Queen, King
    };

    public bool IsAce => Rank == 1;

    public bool IsTenValue => BaseValue == 10;

    public bool Equals(Card other) => Rank == other.Rank && Suit == other.Suit;
    public override bool Equals(object? obj) => obj is Card c && Equals(c);
    public override int GetHashCode() => HashCode.Combine(Rank, Suit);
    public static bool operator ==(Card a, Card b) => a.Equals(b);
    public static bool operator !=(Card a, Card b) => !a.Equals(b);
    public override string ToString() => $"{Rank}{Suit}";
}
