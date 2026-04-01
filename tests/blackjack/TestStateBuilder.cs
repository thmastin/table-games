using TableGames.Blackjack.Logic;

namespace TableGames.Tests.Blackjack;

/// <summary>
/// Helpers to construct BlackjackGameState snapshots for isolated unit tests.
/// These bypass the state machine and build state directly for ActionAvailability testing.
/// </summary>
internal static class TestStateBuilder
{
    private static Card C(int rank, Suit suit = Suit.Spades) => new Card(rank, suit);

    public static BlackjackGameState WithPhase(GamePhase phase)
    {
        var hand = new PlayerHandState(
            Cards: Array.Empty<Card>(),
            MainBet: 0,
            DoubleDownBet: 0,
            IsFromSplit: false,
            IsSplitAcesHand: false,
            IsStood: false,
            IsBust: false,
            IsSurrendered: false,
            IsDoubled: false
        );

        return new BlackjackGameState(
            CurrentPhase: phase,
            ActiveHandIndex: 0,
            MainBet: 0,
            DoubleDownBet: 0,
            InsuranceBet: 0,
            TriLuxBet: 0,
            LuckyLuckyBet: 0,
            BetDenominations: Array.Empty<int>(),
            PlayerHands: new[] { hand },
            DealerHand: new DealerHandState(
                Cards: new[] { C(7), C(5) },
                HoleCardFaceUp: false
            ),
            Shoe: new ShoeState(TotalDealt: 0, ShufflePending: false),
            Bankroll: 1000,
            MinBet: 25,
            SplitCount: 0,
            DealerPeekedNoBlackjack: false,
            Actions: ActionAvailability.None
        );
    }

    public static BlackjackGameState PlayerTurnWith(
        Card[] playerCards,
        Card dealerUp,
        int bankroll = 1000,
        int mainBet = 25,
        bool splitAces = false,
        bool isFromSplit = false,
        bool isBust = false,
        int splitCount = 0,
        bool dealerPeekedNoBlackjack = true)
    {
        var hand = new PlayerHandState(
            Cards: playerCards,
            MainBet: mainBet,
            DoubleDownBet: 0,
            IsFromSplit: isFromSplit,
            IsSplitAcesHand: splitAces,
            IsStood: false,
            IsBust: isBust,
            IsSurrendered: false,
            IsDoubled: false
        );

        return new BlackjackGameState(
            CurrentPhase: GamePhase.PlayerTurn,
            ActiveHandIndex: 0,
            MainBet: mainBet,
            DoubleDownBet: 0,
            InsuranceBet: 0,
            TriLuxBet: 0,
            LuckyLuckyBet: 0,
            BetDenominations: Array.Empty<int>(),
            PlayerHands: new[] { hand },
            DealerHand: new DealerHandState(
                Cards: new[] { dealerUp, C(5) },
                HoleCardFaceUp: false
            ),
            Shoe: new ShoeState(TotalDealt: 4, ShufflePending: false),
            Bankroll: bankroll,
            MinBet: 25,
            SplitCount: splitCount,
            DealerPeekedNoBlackjack: dealerPeekedNoBlackjack,
            Actions: ActionAvailability.None
        );
    }

    public static BlackjackGameState InsurancePromptWith(int mainBet, int bankroll)
    {
        var hand = new PlayerHandState(
            Cards: new[] { C(8), C(7) },
            MainBet: mainBet,
            DoubleDownBet: 0,
            IsFromSplit: false,
            IsSplitAcesHand: false,
            IsStood: false,
            IsBust: false,
            IsSurrendered: false,
            IsDoubled: false
        );

        return new BlackjackGameState(
            CurrentPhase: GamePhase.InsurancePrompt,
            ActiveHandIndex: 0,
            MainBet: mainBet,
            DoubleDownBet: 0,
            InsuranceBet: 0,
            TriLuxBet: 0,
            LuckyLuckyBet: 0,
            BetDenominations: Array.Empty<int>(),
            PlayerHands: new[] { hand },
            DealerHand: new DealerHandState(
                Cards: new[] { C(1), C(5) },
                HoleCardFaceUp: false
            ),
            Shoe: new ShoeState(TotalDealt: 4, ShufflePending: false),
            Bankroll: bankroll,
            MinBet: 25,
            SplitCount: 0,
            DealerPeekedNoBlackjack: false,
            Actions: ActionAvailability.None
        );
    }

    public static BlackjackGameState BettingWith(int mainBet, int minBet)
    {
        var hand = new PlayerHandState(
            Cards: Array.Empty<Card>(),
            MainBet: mainBet,
            DoubleDownBet: 0,
            IsFromSplit: false,
            IsSplitAcesHand: false,
            IsStood: false,
            IsBust: false,
            IsSurrendered: false,
            IsDoubled: false
        );

        return new BlackjackGameState(
            CurrentPhase: GamePhase.Betting,
            ActiveHandIndex: 0,
            MainBet: mainBet,
            DoubleDownBet: 0,
            InsuranceBet: 0,
            TriLuxBet: 0,
            LuckyLuckyBet: 0,
            BetDenominations: Array.Empty<int>(),
            PlayerHands: new[] { hand },
            DealerHand: new DealerHandState(
                Cards: Array.Empty<Card>(),
                HoleCardFaceUp: false
            ),
            Shoe: new ShoeState(TotalDealt: 0, ShufflePending: false),
            Bankroll: 1000,
            MinBet: minBet,
            SplitCount: 0,
            DealerPeekedNoBlackjack: false,
            Actions: ActionAvailability.None
        );
    }
}
