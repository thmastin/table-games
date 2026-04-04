using Godot;

/// <summary>
/// Base class for all Phase 11 static fixture scenes.
/// Each fixture instantiates components with hardcoded data so every screen
/// state is viewable without running any game logic.
///
/// No BlackjackStateMachine calls. No GlobalState reads. Pure static composition.
/// </summary>
public abstract partial class FixtureBase : Node2D
{
	// -------------------------------------------------------------------------
	// Shared layout helpers used by all fixtures
	// -------------------------------------------------------------------------

	/// <summary>Creates and positions the static table background (felt + rail + markings).</summary>
	protected BlackjackTable AddTable()
	{
		var table = new BlackjackTable();
		table.Name = "BlackjackTable";
		table.ZIndex = 0;
		AddChild(table);
		return table;
	}

	/// <summary>Creates and positions the BankrollDisplay at its fixed position.</summary>
	protected BankrollDisplay AddBankrollDisplay(int amount)
	{
		var display = new BankrollDisplay();
		display.Name = "BankrollDisplay";
		display.Amount = amount;
		display.Position = VisualLanguage.PosBankrollDisplay;
		display.ZIndex = 2;
		AddChild(display);
		return display;
	}

	/// <summary>Creates the standard bet zone with optional chips.</summary>
	protected BlackjackBetZone AddBetZone(int[] mainChips, bool isActive = false,
		bool showDouble = false, int[] doubleChips = null!)
	{
		var zone = new BlackjackBetZone();
		zone.Name = "BlackjackBetZone";
		zone.MainBetChips = mainChips;
		zone.IsMainBetActive = isActive;
		zone.ShowDoubleDownZone = showDouble;
		zone.DoubleDownChips = doubleChips ?? System.Array.Empty<int>();
		zone.ZIndex = 1;
		AddChild(zone);
		return zone;
	}

	/// <summary>Creates the side bet zone.</summary>
	protected SideBetZone AddSideBetZone(
		int[] triLuxChips = null!, int[] luckyLuckyChips = null!,
		bool triLuxActive = false, bool luckyLuckyActive = false)
	{
		var zone = new SideBetZone();
		zone.Name = "SideBetZone";
		zone.TriLuxChips = triLuxChips ?? System.Array.Empty<int>();
		zone.LuckyLuckyChips = luckyLuckyChips ?? System.Array.Empty<int>();
		zone.IsTriLuxActive = triLuxActive;
		zone.IsLuckyLuckyActive = luckyLuckyActive;
		zone.ZIndex = 1;
		AddChild(zone);
		return zone;
	}

	/// <summary>Creates a player hand zone with the given cards.</summary>
	protected PlayerHandZone AddPlayerHand(
		int[] ranks, string[] suits, bool[] faceUp,
		int total, bool isSoft, bool isBust, bool isActive,
		Vector2 center)
	{
		var zone = new PlayerHandZone();
		zone.Name = "PlayerHandZone";
		zone.CardRanks   = ranks;
		zone.CardSuits   = suits;
		zone.CardsFaceUp = faceUp;
		zone.HandTotal   = total;
		zone.IsSoft      = isSoft;
		zone.IsBust      = isBust;
		zone.IsActiveHand = isActive;
		zone.ZoneCenter  = center;
		zone.ZIndex = 1;
		AddChild(zone);
		return zone;
	}

	/// <summary>Creates a dealer hand zone with the given cards.</summary>
	protected DealerHandZone AddDealerHand(
		int[] ranks, string[] suits, bool[] faceUp,
		bool showTotal, int total, bool isSoft, bool isBust)
	{
		var zone = new DealerHandZone();
		zone.Name = "DealerHandZone";
		zone.CardRanks   = ranks;
		zone.CardSuits   = suits;
		zone.CardsFaceUp = faceUp;
		zone.ShowTotal   = showTotal;
		zone.HandTotal   = total;
		zone.IsSoft      = isSoft;
		zone.IsBust      = isBust;
		zone.ZIndex = 1;
		AddChild(zone);
		return zone;
	}

	/// <summary>Creates the action bar in its idle/betting configuration.</summary>
	protected BlackjackActionBar AddBettingActionBar(bool canDeal = false)
	{
		var bar = new BlackjackActionBar();
		bar.Name = "ActionBar";
		bar.ShowBettingActions = true;
		bar.ShowGameActions = false;
		bar.CanDeal = canDeal;
		bar.ZIndex = 2;
		AddChild(bar);
		return bar;
	}

	/// <summary>Creates the action bar in its player-turn configuration.</summary>
	protected BlackjackActionBar AddPlayerTurnActionBar(
		bool canHit, bool canStand, bool canDouble,
		bool canSplit, bool canSurrender)
	{
		var bar = new BlackjackActionBar();
		bar.Name = "ActionBar";
		bar.ShowBettingActions = false;
		bar.ShowGameActions = true;
		bar.CanHit       = canHit;
		bar.CanStand     = canStand;
		bar.CanDouble    = canDouble;
		bar.CanSplit     = canSplit;
		bar.CanSurrender = canSurrender;
		bar.ZIndex = 2;
		AddChild(bar);
		return bar;
	}

	/// <summary>Creates a viewport background (black base).</summary>
	protected void AddBackground()
	{
		var bg = new ColorRect();
		bg.Name = "ViewportBackground";
		bg.Color = VisualLanguage.ColorBackground;
		bg.Position = Vector2.Zero;
		bg.Size = new Vector2(VisualLanguage.ViewportWidth, VisualLanguage.ViewportHeight);
		bg.ZIndex = -10;
		AddChild(bg);
	}

	/// <summary>
	/// Creates the ChipTray at its fixed position in the left chrome panel.
	/// Must be called in every fixture — the chip tray is a fixed element present in all states.
	/// </summary>
	protected ChipTray AddChipTray(int selectedDenomination = 5)
	{
		var tray = new ChipTray();
		tray.Name = "ChipTray";
		tray.SelectedDenomination = selectedDenomination;
		tray.ZIndex = 2;
		AddChild(tray);
		return tray;
	}
}
