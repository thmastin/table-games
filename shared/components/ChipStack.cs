using Godot;
using System.Collections.Generic;

/// <summary>
/// Renders an ordered collection of Chip nodes as a physical stack.
/// Handles the 4px-per-chip vertical offset.
/// Does not know what the stack represents (bet, bankroll, pot).
///
/// Uses Chip node instances (not ColorRect) per component-boundaries.md Section 1.
/// Spec: component-boundaries.md Section 1 — ChipStack.tscn.
/// All visual values sourced from VisualLanguage.cs.
/// </summary>
public partial class ChipStack : Control
{
    // -------------------------------------------------------------------------
    // Signal
    // -------------------------------------------------------------------------

    [Signal] public delegate void StackChangedEventHandler(int[] newDenominations);

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------

    /// <summary>Ordered chip denomination array; index 0 = bottom chip.</summary>
    [Export] public int[] ChipDenominations { get; set; } = System.Array.Empty<int>();

    // -------------------------------------------------------------------------
    // Internal state
    // -------------------------------------------------------------------------

    private readonly List<Chip> _chips = new();

    // -------------------------------------------------------------------------
    // Godot lifecycle
    // -------------------------------------------------------------------------

    public override void _Ready()
    {
        _RebuildStack();
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /// <summary>Appends a chip to the top of the stack. Triggers placement arc on new chip.</summary>
    public void AddChip(int denomination)
    {
        var denoms = new List<int>(ChipDenominations) { denomination };
        ChipDenominations = denoms.ToArray();
        _RebuildStack();
        EmitSignal(SignalName.StackChanged, ChipDenominations);
    }

    /// <summary>Removes the topmost chip.</summary>
    public void RemoveTopChip()
    {
        if (ChipDenominations.Length == 0) return;
        var denoms = new List<int>(ChipDenominations);
        denoms.RemoveAt(denoms.Count - 1);
        ChipDenominations = denoms.ToArray();
        _RebuildStack();
        EmitSignal(SignalName.StackChanged, ChipDenominations);
    }

    /// <summary>Removes all chips instantly (used on hand resolution).</summary>
    public void ClearStack()
    {
        ChipDenominations = System.Array.Empty<int>();
        _RebuildStack();
        EmitSignal(SignalName.StackChanged, ChipDenominations);
    }

    /// <summary>Returns sum of all chip denominations in stack.</summary>
    public int GetTotalValue()
    {
        int total = 0;
        foreach (var d in ChipDenominations) total += d;
        return total;
    }

    // -------------------------------------------------------------------------
    // Stack rendering
    // -------------------------------------------------------------------------

    private void _RebuildStack()
    {
        // Clear existing chip nodes
        foreach (var chip in _chips)
            chip.QueueFree();
        _chips.Clear();

        for (int i = 0; i < ChipDenominations.Length; i++)
        {
            var chip = _CreateChipNode(ChipDenominations[i]);
            // Stack offset: each chip is 4px above the previous (upward = negative y)
            int yOffset = -i * VisualLanguage.ChipStackOffset;
            chip.Position = new Vector2(0, yOffset);
            AddChild(chip);
            _chips.Add(chip);
        }

        // Size the container to the topmost chip bounds
        int height = VisualLanguage.ChipDiameterStandard + (_chips.Count > 0 ? (_chips.Count - 1) * VisualLanguage.ChipStackOffset : 0);
        CustomMinimumSize = new Vector2(VisualLanguage.ChipDiameterStandard, height);
    }

    private static Chip _CreateChipNode(int denomination)
    {
        // Chip node — uses Chip.cs component (not ColorRect) per component-boundaries.md Section 1
        var chip = new Chip();
        chip.Name = $"ChipNode_{denomination}";
        chip.Denomination = denomination;
        chip.IsSelected = false;
        chip.IsTraySize = false;
        return chip;
    }
}
