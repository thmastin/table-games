using Godot;
using System.Collections.Generic;

/// <summary>
/// Manages the dealer's card area. Handles the hole card (face-down initial deal,
/// flip on dealer turn), and the dealer hand-total display during dealer turn only.
///
/// Props: CardRanks, CardSuits, CardsFaceUp (index 0 = upcard, index 1 = hole card),
///        ShowTotal, HandTotal, IsSoft, IsBust.
/// Spec: component-boundaries.md Section 2 — DealerHandZone.tscn.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class DealerHandZone : Control
{
    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    [Export] public int[]    CardRanks   { get; set; } = System.Array.Empty<int>();
    [Export] public string[] CardSuits   { get; set; } = System.Array.Empty<string>();
    // bool[] is not supported as an [Export] type in Godot 4; set directly in code.
    public bool[]   CardsFaceUp { get; set; } = System.Array.Empty<bool>();

    /// <summary>True = show dealer total badge. Only shown during DealerTurn and Resolution.</summary>
    [Export] public bool ShowTotal  { get; set; } = false;
    [Export] public int  HandTotal  { get; set; } = 0;
    [Export] public bool IsSoft     { get; set; } = false;
    [Export] public bool IsBust     { get; set; } = false;

    /// <summary>Center position for this zone on the table canvas.</summary>
    [Export] public Vector2 ZoneCenter { get; set; } = VisualLanguage.PosDealerHandZoneCenter;

    // -------------------------------------------------------------------------
    // Child references
    // -------------------------------------------------------------------------

    private readonly List<CardFace> _cardNodes = new();
    private HandTotalBadge? _totalBadge;

    // -------------------------------------------------------------------------
    // Signal — emitted when hole card flip animation completes
    // -------------------------------------------------------------------------

    [Signal] public delegate void HoleCardFlipCompletedEventHandler();

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        _BuildZone();
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /// <summary>Rebuild the dealer hand display from current props.</summary>
    public void Refresh()
    {
        _BuildZone();
    }

    /// <summary>
    /// Flip the hole card (index 1) face-up with animation.
    /// Emits HoleCardFlipCompleted when done.
    /// </summary>
    public void FlipHoleCard()
    {
        if (_cardNodes.Count < 2) return;
        var holeCard = _cardNodes[1];
        holeCard.SetFaceUp(true, animate: true);
        holeCard.FlipCompleted += _OnHoleCardFlipped;
    }

    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    private void _BuildZone()
    {
        foreach (var card in _cardNodes)
            card.QueueFree();
        _cardNodes.Clear();
        if (_totalBadge != null)
        {
            _totalBadge.QueueFree();
            _totalBadge = null;
        }

        int count = CardRanks.Length;
        if (count == 0) return;

        int fanWidth = VisualLanguage.CardWidth + (count - 1) * VisualLanguage.CardOverlap;
        float fanLeft = ZoneCenter.X - fanWidth / 2f;
        float cardTop  = ZoneCenter.Y - VisualLanguage.CardHeight / 2f;

        for (int i = 0; i < count; i++)
        {
            var cardNode = new CardFace();
            cardNode.Name = $"DealerCard{i}";

            int rank = i < CardRanks.Length ? CardRanks[i] : 1;
            string suit = i < CardSuits.Length ? CardSuits[i] : "spades";
            bool faceUp = i < CardsFaceUp.Length ? CardsFaceUp[i] : true;

            cardNode.Rank   = rank;
            cardNode.Suit   = suit;
            cardNode.FaceUp = faceUp;
            cardNode.ZIndex = i;

            float xPos = fanLeft + i * VisualLanguage.CardOverlap;
            cardNode.Position = new Vector2(xPos, cardTop);
            AddChild(cardNode);
            _cardNodes.Add(cardNode);
        }

        // Dealer total badge — centered above the card fan.
        // Spec position: PosDealerTotalBadge (960, 215) from screen-states.md.
        // Use spec constant directly to match design spec.
        if (ShowTotal)
        {
            _totalBadge = new HandTotalBadge();
            _totalBadge.Name = "DealerTotalBadge";
            _totalBadge.Total        = HandTotal;
            _totalBadge.IsSoft       = IsSoft;
            _totalBadge.IsBust       = IsBust;
            _totalBadge.IsActiveHand = true;

            float badgeCenterX = VisualLanguage.PosDealerTotalBadge.X;
            float badgeCenterY = VisualLanguage.PosDealerTotalBadge.Y;
            _totalBadge.Position = new Vector2(badgeCenterX, badgeCenterY);
            AddChild(_totalBadge);
        }
    }

    // -------------------------------------------------------------------------
    // Hole card flip callback
    // -------------------------------------------------------------------------

    private void _OnHoleCardFlipped()
    {
        EmitSignal(SignalName.HoleCardFlipCompleted);
    }
}
