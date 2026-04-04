using Godot;
using System.Collections.Generic;

/// <summary>
/// Manages the card display area for a single player hand in Blackjack.
/// Handles the horizontal card overlap layout (28px offset per card),
/// the hand-total badge rendering, and split-hand visual separation.
/// Instantiates CardFace nodes.
///
/// Props: Cards (rank+suit+faceUp per card), HandTotal, IsSoft, IsBust,
///        IsActiveHand (split), ZoneCenter.
/// Spec: component-boundaries.md Section 2 — PlayerHandZone.tscn.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class PlayerHandZone : Control
{
    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    [Export] public int[]  CardRanks   { get; set; } = System.Array.Empty<int>();
    [Export] public string[] CardSuits { get; set; } = System.Array.Empty<string>();
    // bool[] is not supported as an [Export] type in Godot 4; set directly in code.
    public bool[] CardsFaceUp { get; set; } = System.Array.Empty<bool>();

    [Export] public int  HandTotal    { get; set; } = 0;
    [Export] public bool IsSoft       { get; set; } = false;
    [Export] public bool IsBust       { get; set; } = false;
    [Export] public bool IsActiveHand { get; set; } = true;

    /// <summary>Center position of this hand zone on the table canvas.</summary>
    [Export] public Vector2 ZoneCenter { get; set; } = VisualLanguage.PosPlayerHandZoneCenter;

    // -------------------------------------------------------------------------
    // Child references
    // -------------------------------------------------------------------------

    private readonly List<CardFace> _cardNodes = new();
    private HandTotalBadge? _totalBadge;

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

    /// <summary>Rebuild the hand display from current props.</summary>
    public void Refresh()
    {
        _BuildZone();
    }

    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    private void _BuildZone()
    {
        // Clear existing card nodes
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

        // Fan width: card width + (count-1)*overlap
        int fanWidth = VisualLanguage.CardWidth + (count - 1) * VisualLanguage.CardOverlap;
        float fanLeft = ZoneCenter.X - fanWidth / 2f;
        float cardTop  = ZoneCenter.Y - VisualLanguage.CardHeight / 2f;

        for (int i = 0; i < count; i++)
        {
            var cardNode = new CardFace();
            cardNode.Name = $"Card{i}";

            int rank = i < CardRanks.Length ? CardRanks[i] : 1;
            string suit = i < CardSuits.Length ? CardSuits[i] : "spades";
            bool faceUp = i < CardsFaceUp.Length ? CardsFaceUp[i] : true;

            cardNode.Rank   = rank;
            cardNode.Suit   = suit;
            cardNode.FaceUp = faceUp;

            // Apply slight resting rotation (simulated; actual randomization would use GD.Randf)
            float rotation = (i % 2 == 0 ? 1f : -1f) * (i * 0.5f);
            rotation = Mathf.Clamp(rotation,
                -VisualLanguage.CardRestingRotationMax,
                 VisualLanguage.CardRestingRotationMax);
            cardNode.RotationDegrees2D = rotation;

            float xPos = fanLeft + i * VisualLanguage.CardOverlap;
            cardNode.Position = new Vector2(xPos, cardTop);
            cardNode.ZIndex = i; // later cards render on top
            AddChild(cardNode);
            _cardNodes.Add(cardNode);
        }

        // Hand total badge — centered above the fan.
        // Spec position: PosPlayerHandTotalBadge (960, 752).
        // Formula: badgeCenterY = cardTop - Space6 (gap between card top and badge bottom edge).
        // badgeCenterX = ZoneCenter.X (centered on zone, not offset).
        // Use spec constant directly to match screen-states.md.
        _totalBadge = new HandTotalBadge();
        _totalBadge.Name = "HandTotalBadge";
        _totalBadge.Total        = HandTotal;
        _totalBadge.IsSoft       = IsSoft;
        _totalBadge.IsBust       = IsBust;
        _totalBadge.IsActiveHand = IsActiveHand;

        float badgeCenterX = VisualLanguage.PosPlayerHandTotalBadge.X;
        float badgeCenterY = VisualLanguage.PosPlayerHandTotalBadge.Y;
        _totalBadge.Position = new Vector2(badgeCenterX, badgeCenterY);
        AddChild(_totalBadge);
    }
}
