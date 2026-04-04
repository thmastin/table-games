using System;
using System.Collections.Generic;
using System.Linq;

namespace TableGames.Blackjack.Logic;

/// <summary>
/// Side bet type identifier.
/// </summary>
public enum SideBetType { TriLux, LuckyLucky }

/// <summary>
/// Blackjack state machine. Enforces all valid transitions from architecture.md Section 2.
/// Returns immutable state snapshots. Throws InvalidTransitionException on invalid transitions.
///
/// For testability, the constructor accepts optional deterministic card sequences so tests
/// can control dealt cards without mocking a random shoe.
/// </summary>
public class BlackjackStateMachine
{
    private readonly int _minBet;
    private readonly int _maxBet;
    private Deck _deck;

    // Current mutable tracking state
    private GamePhase _phase = GamePhase.Idle;
    private int _bankroll;
    private int _mainBet;
    private int _triLuxBet;
    private int _luckyLuckyBet;
    private int[] _betDenominations = Array.Empty<int>();
    private int _insuranceBet;
    private int _doubleDownBet;
    private int _splitCount;
    private int _activeHandIndex;
    private bool _dealerPeekedNoBlackjack;

    private List<PlayerHandState> _playerHands = new();
    private DealerHandState _dealerHand = new(Array.Empty<Card>(), false);

    // Deterministic card queue for testing
    private Queue<Card>? _deterministicCards;

    public GamePhase CurrentPhase => _phase;
    public int Bankroll => _bankroll;

    public BlackjackStateMachine(
        int bankroll,
        int minBet,
        int maxBet,
        Card? deterministicDealerUp = null,
        Card? deterministicDealerHole = null,
        Card[]? deterministicPlayerCards = null)
    {
        _bankroll = bankroll;
        _minBet = minBet;
        _maxBet = maxBet;
        _deck = new Deck();

        // If deterministic cards provided, queue them up in deal order:
        // Player card 1, Dealer up, Player card 2, Dealer hole (spec 5.2)
        if (deterministicPlayerCards != null || deterministicDealerUp.HasValue)
        {
            var q = new Queue<Card>();
            var playerCards = deterministicPlayerCards ?? new[] { new Card(10, Suit.Spades), new Card(7, Suit.Hearts) };
            var dealerUp = deterministicDealerUp ?? new Card(7, Suit.Clubs);
            var dealerHole = deterministicDealerHole ?? new Card(5, Suit.Diamonds);

            // Deal order: P1, D1(up), P2, D2(hole)
            q.Enqueue(playerCards.Length > 0 ? playerCards[0] : new Card(10, Suit.Spades));
            q.Enqueue(dealerUp);
            q.Enqueue(playerCards.Length > 1 ? playerCards[1] : new Card(7, Suit.Hearts));
            q.Enqueue(dealerHole);

            // Queue remaining player cards for split hands
            for (int i = 2; i < playerCards.Length; i++)
                q.Enqueue(playerCards[i]);

            _deterministicCards = q;
        }
    }

    // --- Test-only methods ---

    /// <summary>Test hook: force shuffle pending state.</summary>
    public void ForceShufflePending()
    {
        // Deal 156 fake cards to trigger threshold — use internal deck directly
        for (int i = 0; i < 156; i++) _deck.Deal();
    }

    /// <summary>Test hook: override bankroll for resolution testing.</summary>
    public void OverrideBankroll(int bankroll) => _bankroll = bankroll;

    // --- State access ---

    public BlackjackGameState GetState()
    {
        var actions = ActionAvailabilityCalculator.Compute(BuildStateSnapshot());
        return BuildStateSnapshot() with { Actions = actions };
    }

    // --- Transitions ---

    // Transition 1: Idle -> Betting
    public void BeginBetting()
    {
        if (_phase != GamePhase.Idle)
            throw new InvalidTransitionException(_phase, nameof(BeginBetting));
        _mainBet = 0;
        _triLuxBet = 0;
        _luckyLuckyBet = 0;
        _betDenominations = Array.Empty<int>();
        _phase = GamePhase.Betting;
    }

    // Bet placement (within Betting phase)
    public void PlaceBet(int denomination)
    {
        if (_phase != GamePhase.Betting)
            throw new InvalidTransitionException(_phase, nameof(PlaceBet));
        if (_mainBet + denomination > _maxBet) return; // silently reject per spec 10.2
        _mainBet += denomination;
        _betDenominations = _betDenominations.Append(denomination).ToArray();
    }

    // Side bet placement (within Betting phase)
    public void PlaceSideBet(SideBetType type, int denomination)
    {
        if (_phase != GamePhase.Betting)
            throw new InvalidTransitionException(_phase, nameof(PlaceSideBet));
        if (type == SideBetType.TriLux) _triLuxBet = denomination;
        else _luckyLuckyBet = denomination;
    }

    // Transition 2: Betting -> Idle (ClearBet)
    public void ClearBet()
    {
        if (_phase != GamePhase.Betting)
            throw new InvalidTransitionException(_phase, nameof(ClearBet));
        _mainBet = 0;
        _triLuxBet = 0;
        _luckyLuckyBet = 0;
        _betDenominations = Array.Empty<int>();
        _phase = GamePhase.Idle;
    }

    // Transition 3: Betting -> Dealing (DealInitiated)
    // Also deals the 4 initial cards atomically so shoe state is accurate
    // immediately after this call (before the animation-complete callback).
    public BlackjackGameState DealInitiated()
    {
        if (_phase != GamePhase.Betting)
            throw new InvalidTransitionException(_phase, nameof(DealInitiated));
        if (_mainBet < _minBet)
            throw new InvalidTransitionException($"Cannot deal with MainBet={_mainBet} < MinBet={_minBet}");

        // Shuffle if pending (spec 2.4, architecture Section 2 constraint)
        if (_deck.ShufflePending) _deck.Shuffle();

        // Deduct all bets atomically (spec architecture Section 2 transition 3)
        _bankroll -= _mainBet + _triLuxBet + _luckyLuckyBet;

        _phase = GamePhase.Dealing;
        _splitCount = 0;
        _activeHandIndex = 0;
        _insuranceBet = 0;
        _doubleDownBet = 0;
        _dealerPeekedNoBlackjack = false;

        // Deal 4 cards immediately: P1, D1(up), P2, D2(hole) (spec 5.2)
        var p1 = DealCard();
        var dUp = DealCard();
        var p2 = DealCard();
        var dHole = DealCard();

        _playerHands = new List<PlayerHandState>
        {
            new PlayerHandState(
                Cards: new[] { p1, p2 },
                MainBet: _mainBet,
                DoubleDownBet: 0,
                IsFromSplit: false,
                IsSplitAcesHand: false,
                IsStood: false,
                IsBust: false,
                IsSurrendered: false,
                IsDoubled: false
            )
        };

        _dealerHand = new DealerHandState(
            Cards: new[] { dUp, dHole },
            HoleCardFaceUp: false
        );

        return GetState();
    }

    // Called after deal animation completes — routes to correct next phase
    // Transitions 4-8
    public BlackjackGameState CompleteDealing()
    {
        if (_phase != GamePhase.Dealing)
            throw new InvalidTransitionException(_phase, nameof(CompleteDealing));

        // Cards were dealt in DealInitiated; here we just route to the correct phase.
        _phase = DeterminePostDealPhase();

        return GetState();
    }

    // Transitions 9-11: SideBetResolution -> next
    public BlackjackGameState CompleteSideBetResolution()
    {
        if (_phase != GamePhase.SideBetResolution)
            throw new InvalidTransitionException(_phase, nameof(CompleteSideBetResolution));

        _phase = DeterminePostSideBetPhase();
        return GetState();
    }

    // Transitions 12-14: InsurancePrompt -> PlayerTurn or Resolution
    public BlackjackGameState ResolveInsurance(bool takesInsurance)
    {
        if (_phase != GamePhase.InsurancePrompt)
            throw new InvalidTransitionException(_phase, nameof(ResolveInsurance));

        if (takesInsurance)
        {
            _insuranceBet = _mainBet / 2;
            _bankroll -= _insuranceBet;
        }

        bool dealerHasBlackjack = _dealerHand.IsBlackjack;
        bool playerHasBlackjack = _playerHands.Count > 0 && _playerHands[0].IsBlackjack;

        if (dealerHasBlackjack)
        {
            // Insurance resolution (if taken) applied, then Resolution
            if (takesInsurance)
            {
                _bankroll += _insuranceBet * 3; // 2:1 win
            }
            _phase = GamePhase.Resolution;
        }
        else if (playerHasBlackjack)
        {
            // No dealer blackjack, player has blackjack -> skip PlayerTurn (spec 9.1)
            _dealerPeekedNoBlackjack = true;
            _phase = GamePhase.Resolution;
        }
        else
        {
            _dealerPeekedNoBlackjack = true;
            _phase = GamePhase.PlayerTurn;
        }

        return GetState();
    }

    // Transitions 15-26: PlayerTurn actions
    public BlackjackGameState Hit()
    {
        if (_phase != GamePhase.PlayerTurn)
            throw new InvalidTransitionException(_phase, nameof(Hit));

        var state = GetState();
        var avail = state.Actions;
        if (!avail.CanHit)
            throw new InvalidTransitionException(_phase, $"{nameof(Hit)}: CanHit=false");

        return HitWithCard(DealCard());
    }

    public BlackjackGameState HitWithCard(Card card)
    {
        if (_phase != GamePhase.PlayerTurn)
            throw new InvalidTransitionException(_phase, nameof(HitWithCard));

        var current = _playerHands[_activeHandIndex];
        var newCards = current.Cards.Append(card).ToArray();
        int newTotal = Hand.ComputeTotal(newCards);
        bool bust = newTotal > 21;
        bool autoStand = newTotal == 21;

        _playerHands[_activeHandIndex] = current with
        {
            Cards = newCards,
            IsBust = bust,
            IsStood = autoStand || bust
        };

        AdvanceOrComplete();
        return GetState();
    }

    public BlackjackGameState Stand()
    {
        if (_phase != GamePhase.PlayerTurn)
            throw new InvalidTransitionException(_phase, nameof(Stand));

        var current = _playerHands[_activeHandIndex];
        _playerHands[_activeHandIndex] = current with { IsStood = true };
        AdvanceOrComplete();
        return GetState();
    }

    public BlackjackGameState DoubleDown()
    {
        if (_phase != GamePhase.PlayerTurn)
            throw new InvalidTransitionException(_phase, nameof(DoubleDown));

        var current = _playerHands[_activeHandIndex];
        int ddBet = current.MainBet;
        _bankroll -= ddBet;
        _doubleDownBet = ddBet;

        var card = DealCard();
        var newCards = current.Cards.Append(card).ToArray();
        int newTotal = Hand.ComputeTotal(newCards);
        bool bust = newTotal > 21;

        _playerHands[_activeHandIndex] = current with
        {
            Cards = newCards,
            DoubleDownBet = ddBet,
            IsDoubled = true,
            IsBust = bust,
            IsStood = true
        };

        AdvanceOrComplete();
        return GetState();
    }

    public BlackjackGameState Split()
    {
        if (_phase != GamePhase.PlayerTurn)
            throw new InvalidTransitionException(_phase, nameof(Split));

        var current = _playerHands[_activeHandIndex];
        bool isSplitAces = current.Cards[0].IsAce && current.Cards[1].IsAce;

        _bankroll -= current.MainBet;
        _splitCount++;

        // Each new hand gets one of the original cards + one new card
        var card1 = DealCard();
        var card2 = DealCard();

        var hand1 = new PlayerHandState(
            Cards: new[] { current.Cards[0], card1 },
            MainBet: current.MainBet,
            DoubleDownBet: 0,
            IsFromSplit: true,
            IsSplitAcesHand: isSplitAces,
            IsStood: isSplitAces, // split aces auto-stand
            IsBust: false,
            IsSurrendered: false,
            IsDoubled: false
        );

        var hand2 = new PlayerHandState(
            Cards: new[] { current.Cards[1], card2 },
            MainBet: current.MainBet,
            DoubleDownBet: 0,
            IsFromSplit: true,
            IsSplitAcesHand: isSplitAces,
            IsStood: isSplitAces, // split aces auto-stand
            IsBust: false,
            IsSurrendered: false,
            IsDoubled: false
        );

        // Replace current hand with the two new hands
        _playerHands.RemoveAt(_activeHandIndex);
        _playerHands.Insert(_activeHandIndex, hand2);
        _playerHands.Insert(_activeHandIndex, hand1);

        // Stay on first split hand (or advance if it auto-stood)
        if (isSplitAces)
        {
            // Both auto-stand; check if there are more hands
            AdvanceOrComplete();
        }
        // else: player acts on hand1 next

        return GetState();
    }

    public BlackjackGameState Surrender()
    {
        if (_phase != GamePhase.PlayerTurn)
            throw new InvalidTransitionException(_phase, nameof(Surrender));

        var current = _playerHands[_activeHandIndex];
        int recovery = current.MainBet / 2;
        _bankroll += recovery;

        _playerHands[_activeHandIndex] = current with { IsSurrendered = true, IsStood = true };
        AdvanceOrComplete();
        return GetState();
    }

    // Transitions 27-28: DealerTurn -> Resolution
    public BlackjackGameState CompleteDealerTurn()
    {
        if (_phase != GamePhase.DealerTurn)
            throw new InvalidTransitionException(_phase, nameof(CompleteDealerTurn));

        // Run dealer draw loop (spec 5.5)
        var dealerCards = _dealerHand.Cards.ToList();
        while (true)
        {
            var tmpHand = new DealerHandState(dealerCards.ToArray(), true);
            int total = tmpHand.Total;
            if (total >= 17) break; // stand (includes soft 17 per spec 5.1)
            dealerCards.Add(DealCard());
        }

        _dealerHand = new DealerHandState(dealerCards.ToArray(), HoleCardFaceUp: true);
        _phase = GamePhase.Resolution;
        return GetState();
    }

    // Transitions 29-30: Resolution -> Idle or PlayerBroke
    public BlackjackGameState CompleteResolution()
    {
        if (_phase != GamePhase.Resolution)
            throw new InvalidTransitionException(_phase, nameof(CompleteResolution));

        // Apply win/push payouts (loss was already deducted at deal/double time)
        ResolveAllHands();

        if (_bankroll <= 0 || _bankroll < _minBet)
            _phase = GamePhase.PlayerBroke;
        else
            _phase = GamePhase.Idle;

        return GetState();
    }

    // Transition 31: PlayerBroke -> Idle
    public void ReloadBankroll(int amount)
    {
        if (_phase != GamePhase.PlayerBroke)
            throw new InvalidTransitionException(_phase, nameof(ReloadBankroll));
        _bankroll += amount;
        if (_bankroll >= _minBet)
            _phase = GamePhase.Idle;
    }

    // --- Private helpers ---

    private Card DealCard()
    {
        if (_deterministicCards != null && _deterministicCards.Count > 0)
            return _deterministicCards.Dequeue();
        return _deck.Deal();
    }

    private GamePhase DeterminePostDealPhase()
    {
        bool hasSideBets = _triLuxBet > 0 || _luckyLuckyBet > 0;
        if (hasSideBets) return GamePhase.SideBetResolution;
        return DeterminePostSideBetPhase();
    }

    private GamePhase DeterminePostSideBetPhase()
    {
        var upCard = _dealerHand.UpCard;
        if (upCard == null) return GamePhase.PlayerTurn;

        if (upCard.Value.IsAce)
        {
            return GamePhase.InsurancePrompt;
        }

        if (upCard.Value.IsTenValue)
        {
            // Peek inline
            if (_dealerHand.IsBlackjack)
                return GamePhase.Resolution;
            else
            {
                _dealerPeekedNoBlackjack = true;
                return GamePhase.PlayerTurn;
            }
        }

        // No peek needed
        _dealerPeekedNoBlackjack = true;
        return GamePhase.PlayerTurn;
    }

    private void AdvanceOrComplete()
    {
        // Move to next unresolved hand
        while (_activeHandIndex < _playerHands.Count)
        {
            var h = _playerHands[_activeHandIndex];
            if (!h.IsStood && !h.IsBust && !h.IsSurrendered)
                return; // still acts on this hand
            _activeHandIndex++;
        }
        // All hands resolved — clamp index so emitted state always has a valid hand reference
        _activeHandIndex = Math.Max(0, _playerHands.Count - 1);
        _phase = GamePhase.DealerTurn;
    }

    private void ResolveAllHands()
    {
        bool dealerBlackjack = _dealerHand.IsBlackjack;
        int dealerTotal = _dealerHand.Total;
        bool dealerBust = _dealerHand.IsBust;

        foreach (var hand in _playerHands)
        {
            if (hand.IsSurrendered) continue; // already resolved at surrender time
            if (hand.IsBust) continue;        // already lost at bust time

            HandOutcome outcome;
            if (hand.IsBlackjack && !hand.IsFromSplit)
            {
                outcome = dealerBlackjack ? HandOutcome.Push : HandOutcome.BlackjackWin;
            }
            else if (dealerBlackjack)
            {
                outcome = HandOutcome.Loss;
            }
            else if (dealerBust)
            {
                outcome = HandOutcome.Win;
            }
            else
            {
                int playerTotal = hand.Total;
                if (playerTotal > dealerTotal) outcome = HandOutcome.Win;
                else if (playerTotal == dealerTotal) outcome = HandOutcome.Push;
                else outcome = HandOutcome.Loss;
            }

            var result = BetResolver.Resolve(outcome, hand.MainBet, hand.DoubleDownBet, 0);
            _bankroll += result.BankrollDelta;
        }
    }

    private BlackjackGameState BuildStateSnapshot()
    {
        return new BlackjackGameState(
            CurrentPhase: _phase,
            ActiveHandIndex: _activeHandIndex,
            MainBet: _mainBet,
            DoubleDownBet: _doubleDownBet,
            InsuranceBet: _insuranceBet,
            TriLuxBet: _triLuxBet,
            LuckyLuckyBet: _luckyLuckyBet,
            BetDenominations: _betDenominations,
            PlayerHands: _playerHands.ToArray(),
            DealerHand: _dealerHand,
            Shoe: new ShoeState(_deck.TotalDealt, _deck.ShufflePending),
            Bankroll: _bankroll,
            MinBet: _minBet,
            SplitCount: _splitCount,
            DealerPeekedNoBlackjack: _dealerPeekedNoBlackjack,
            Actions: ActionAvailability.None // will be recomputed by GetState()
        );
    }
}
