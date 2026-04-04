using Godot;

/// <summary>
/// Single source of truth for all visual values used in scenes and components.
/// Every value derives from visual-language.md. No bare hex codes or bare pixel
/// integers are permitted in any other scene or script — reference these constants instead.
/// </summary>
public static class VisualLanguage
{
    // -------------------------------------------------------------------------
    // 1. Colors — Backgrounds and Surfaces
    // -------------------------------------------------------------------------

    public static readonly Color ColorBackground   = new Color("#121412");
    public static readonly Color ColorSurfaceLow   = new Color("#1a1c1a");
    public static readonly Color ColorSurface      = new Color("#1e201e");
    public static readonly Color ColorSurfaceHigh  = new Color("#292a28");

    // Modal surface is always rendered at 60% opacity with backdrop blur.
    public static readonly Color ColorSurfaceModal = new Color("#333533", 0.60f);

    // -------------------------------------------------------------------------
    // 1. Colors — Primary and Accent
    // -------------------------------------------------------------------------

    public static readonly Color ColorFelt       = new Color("#004b3d");
    public static readonly Color ColorGold       = new Color("#C5A059");
    public static readonly Color ColorGoldLight  = new Color("#E5C185");

    // -------------------------------------------------------------------------
    // 1. Colors — Text
    // -------------------------------------------------------------------------

    public static readonly Color ColorTextPrimary   = new Color("#e2e3df");
    public static readonly Color ColorTextSecondary = new Color("#bfc9c4");

    // -------------------------------------------------------------------------
    // 1. Colors — Rail
    // -------------------------------------------------------------------------

    public static readonly Color ColorRail = new Color("#3d2210");

    // -------------------------------------------------------------------------
    // 1. Colors — Felt Markings
    // Step 1: lightened base = #007a62
    // Step 2: apply at 35% opacity over felt surface.
    // -------------------------------------------------------------------------

    public static readonly Color ColorFeltMarkingBase    = new Color("#007a62");
    public static readonly float ColorFeltMarkingOpacity = 0.35f;

    /// <summary>
    /// Felt marking color composed at correct opacity.
    /// Use this value when setting a Label's modulate or custom color.
    /// </summary>
    public static Color ColorFeltMarking => new Color(
        ColorFeltMarkingBase.R,
        ColorFeltMarkingBase.G,
        ColorFeltMarkingBase.B,
        ColorFeltMarkingOpacity
    );

    // -------------------------------------------------------------------------
    // 1. Colors — Semantic States
    // -------------------------------------------------------------------------

    public static readonly Color ColorWin      = new Color("#C5A059");
    public static readonly Color ColorWinBloom = new Color("#C5A059", 0.12f);
    public static readonly Color ColorLoss     = new Color("#1e201e");
    public static readonly Color ColorPush     = new Color("#bfc9c4");
    public static readonly Color ColorError    = new Color("#ffb4ab");
    public static readonly Color ColorGhostBorder = new Color("#89938f", 0.15f);
    public static readonly Color ColorSuitRed  = new Color("#cc2222");

    // -------------------------------------------------------------------------
    // 1. Colors — Chip Denominations
    // -------------------------------------------------------------------------

    public static readonly Color ColorChip1   = new Color("#d4cfc7");
    public static readonly Color ColorChip5   = new Color("#cc2222");
    public static readonly Color ColorChip25  = new Color("#228822");
    public static readonly Color ColorChip100 = new Color("#1a1a1a");
    public static readonly Color ColorChip500 = new Color("#5b3d8a");

    /// <summary>
    /// Returns the base chip color for a given denomination.
    /// </summary>
    public static Color ChipColor(int denomination) => denomination switch
    {
        1   => ColorChip1,
        5   => ColorChip5,
        25  => ColorChip25,
        100 => ColorChip100,
        500 => ColorChip500,
        _   => ColorChip1
    };

    // -------------------------------------------------------------------------
    // 2. Typography — Font Sizes (px at 1080p baseline)
    // -------------------------------------------------------------------------

    public const int TextXs         = 11;
    public const int TextSm         = 13;
    public const int TextBase       = 16;
    public const int TextLg         = 18;
    public const int TextXl         = 22;
    public const int Text2Xl        = 28;
    public const int TextDisplaySm  = 36;
    public const int TextDisplayLg  = 52;
    public const int TextBetDisplay = 42;

    // -------------------------------------------------------------------------
    // 2. Typography — Font Weights
    // -------------------------------------------------------------------------

    public const int WeightRegular  = 400;
    public const int WeightMedium   = 500;
    public const int WeightSemiBold = 600;
    public const int WeightBold     = 700;

    // -------------------------------------------------------------------------
    // 2. Typography — Letter Spacing
    // -------------------------------------------------------------------------

    /// <summary>All-caps UI labels (Manrope). 1.6px at 1080p.</summary>
    public const float LetterSpacingAllCaps     = 1.6f;
    /// <summary>Felt markings (Noto Serif, xl and below).</summary>
    public const float LetterSpacingFeltMarking = 0.8f;

    // -------------------------------------------------------------------------
    // 3. Motion — UI Transition Durations (seconds)
    // -------------------------------------------------------------------------

    public const float TransitionPanelEnter  = 0.400f;
    public const float TransitionPanelExit   = 0.300f;
    public const float TransitionModalEnter  = 0.450f;
    public const float TransitionModalExit   = 0.350f;
    public const float TransitionLobbyTable  = 0.500f;
    public const float TransitionTableLobby  = 0.500f;
    public const float TransitionFadeIn      = 0.350f;
    public const float TransitionFadeOut     = 0.300f;

    // -------------------------------------------------------------------------
    // 3. Motion — Game Animation Durations (seconds)
    // -------------------------------------------------------------------------

    public const float AnimCardDeal         = 0.250f;
    public const float AnimCardSettle       = 0.050f;
    public const float AnimCardFlipPhase1   = 0.100f;
    public const float AnimCardFlipPhase2   = 0.100f;
    public const float AnimChipPlacement    = 0.210f;
    public const float AnimChipWinCollect   = 0.350f;
    public const float AnimChipLossCollect  = 0.350f;
    public const float AnimWinBloomTotal    = 0.500f;
    public const float AnimWinNumeralFloat  = 0.450f;
    public const float AnimHandBadgeUpdate  = 0.080f;
    public const float AnimBankrollUpdate   = 0.150f;
    /// <summary>Win numeral alpha fade duration in final phase of float animation (seconds).</summary>
    public const float AnimWinNumeralFadeDuration = 0.100f;
    /// <summary>Push indicator hold duration before fade-out (seconds).</summary>
    public const float AnimPushHoldDuration       = 0.400f;

    /// <summary>Stagger between card deal arcs (seconds).</summary>
    public const float CardDealStagger      = 0.090f;

    // -------------------------------------------------------------------------
    // 3. Motion — Card Arc Geometry
    // -------------------------------------------------------------------------

    /// <summary>Arc peak height above table surface at mid-travel (px).</summary>
    public const float CardArcPeakHeight = 18f;
    /// <summary>Chip placement arc peak height above table surface (px).</summary>
    public const float ChipArcPeakHeight = 20f;
    /// <summary>Card settle overshoot rotation (degrees).</summary>
    public const float CardSettleOvershoot = 2.5f;
    /// <summary>Maximum random resting rotation on dealt card (degrees).</summary>
    public const float CardRestingRotationMax = 2f;

    // -------------------------------------------------------------------------
    // 5. Spacing
    // -------------------------------------------------------------------------

    public const int Space1  = 4;
    public const int Space2  = 8;
    public const int Space3  = 12;
    public const int Space4  = 16;
    public const int Space6  = 24;
    public const int Space8  = 32;
    public const int Space12 = 48;
    public const int Space16 = 64;
    public const int Space20 = 80;

    /// <summary>Single corner radius applied to all interactive elements (px).</summary>
    public const int CornerRadius = 6;

    // -------------------------------------------------------------------------
    // 5. Opacity Tokens
    // -------------------------------------------------------------------------

    public const float OpacityDisabledPrimary    = 0.60f;
    public const float OpacityDisabledSecondary  = 0.40f;
    public const float OpacityDisabledContent    = 0.40f;
    public const float OpacityChipHoverGlow      = 0.20f;
    public const float OpacitySideBetBannerFill  = 0.80f;
    public const float OpacitySideBetBannerBorder = 0.40f;
    public const float OpacitySplitActiveUnderlay = 0.15f;
    public const float OpacityTipPromptFill      = 0.90f;
    /// <summary>CashierScreen full-screen backdrop opacity.</summary>
    public const float OpacityCashierBackdrop    = 0.80f;
    /// <summary>ActionButton pressed state fill opacity.</summary>
    public const float OpacityButtonPressed      = 0.80f;
    /// <summary>
    /// Card back stripe overlay opacity.
    /// Per spec, the stripe overlay is fully opaque — the color value itself provides the tonal variation.
    /// </summary>
    public const float OpacityCardBackStripe     = 1.0f;
    /// <summary>Card back center seal (compass rose) gold opacity.</summary>
    public const float OpacityCardBackSeal       = 0.25f;

    // -------------------------------------------------------------------------
    // 5. Card Dimensions (px at 1080p)
    // -------------------------------------------------------------------------

    public const int CardWidth      = 80;
    public const int CardHeight     = 112;
    public const int CardOverlap    = 28;
    public const float CardShadowBlur   = 4f;
    public const float CardShadowOpacity = 0.25f;

    // -------------------------------------------------------------------------
    // 5. Chip Dimensions (px at 1080p)
    // -------------------------------------------------------------------------

    public const int ChipDiameterStandard = 52;
    public const int ChipDiameterTray     = 44;
    public const int ChipStackOffset      = 4;
    public const float ChipSelectionGlowRadius  = 8f;
    public const float ChipSelectionGlowOpacity = 0.40f;
    public const int ChipEdgeSegmentCount = 8;

    // -------------------------------------------------------------------------
    // 5. Table Layout (px at 1080p)
    // -------------------------------------------------------------------------

    public const int TableSurfaceWidth    = 900;
    public const int TableSurfaceHeight   = 560;
    public const int TableSurfaceLeft     = 510;
    public const int TableSurfaceTop      = 200;
    public const int TableHorizontalCenter = 960;
    public const int TableVerticalCenter  = 480;
    public const int RailWidth            = 28;
    public const int UiChromePanelWidth   = 220;
    public const int ViewportWidth        = 1920;
    public const int ViewportHeight       = 1080;

    // -------------------------------------------------------------------------
    // 6. Icon Sizes (px)
    // -------------------------------------------------------------------------

    public const int IconSm   = 16;
    public const int IconBase = 20;
    public const int IconLg   = 24;
    public const int IconXl   = 32;

    // -------------------------------------------------------------------------
    // Component Positions (px at 1920x1080; origin top-left)
    // Sourced from screen-states.md Fixed Elements and per-state specs.
    // -------------------------------------------------------------------------

    // BankrollDisplay
    public static readonly Vector2 PosBankrollDisplay = new Vector2(20, 24);

    // ChipTray
    public static readonly Vector2 PosChipTray = new Vector2(10, 900);

    // MainBetSpot (BettingArcMarking) center
    public static readonly Vector2 PosMainBetSpotCenter = new Vector2(960, 700);
    public static readonly Vector2 PosMainBetSpotTopLeft = new Vector2(916, 660);

    // DoubleDownBetSpot (124px right of MainBetSpot center = 960+124-44 = 1040 left edge)
    public static readonly Vector2 PosDoubleDownBetSpotTopLeft = new Vector2(1040, 660);
    public static readonly Vector2 PosDoubleDownBetSpotCenter  = new Vector2(1084, 700);

    // TriLux BetSpot
    public static readonly Vector2 PosTriLuxBetSpotTopLeft = new Vector2(780, 592);
    public static readonly Vector2 PosTriLuxLabelCenter    = new Vector2(820, 620);

    // LuckyLucky BetSpot
    public static readonly Vector2 PosLuckyLuckyBetSpotTopLeft = new Vector2(1050, 592);
    public static readonly Vector2 PosLuckyLuckyLabelCenter    = new Vector2(1100, 620);

    // Action buttons (right chrome panel)
    public static readonly Vector2 PosSurrenderButton = new Vector2(1710, 652);
    public static readonly Vector2 PosSplitButton     = new Vector2(1710, 716);
    public static readonly Vector2 PosHitButton       = new Vector2(1710, 780);
    public static readonly Vector2 PosStandButton     = new Vector2(1710, 844);
    public static readonly Vector2 PosDoubleButton    = new Vector2(1710, 908);
    public static readonly Vector2 PosDealButton      = new Vector2(1710, 900);
    public static readonly Vector2 PosClearBetButton  = new Vector2(1710, 964);

    // Settings / Rules icon buttons
    public static readonly Vector2 PosSettingsButton  = new Vector2(1876, 24);
    public static readonly Vector2 PosRulesButton     = new Vector2(1820, 24);

    // Player hand zone (single hand) center
    public static readonly Vector2 PosPlayerHandZoneCenter = new Vector2(960, 820);

    // Dealer hand zone center
    public static readonly Vector2 PosDealerHandZoneCenter = new Vector2(960, 260);

    // DealerTotalBadge center
    public static readonly Vector2 PosDealerTotalBadge = new Vector2(960, 215);

    // Player HandTotalBadge (single hand) center y = card fan top - Space6
    public static readonly Vector2 PosPlayerHandTotalBadge = new Vector2(960, 752);

    // Deck/shoe source position for deal arcs
    public static readonly Vector2 PosShoeSource = new Vector2(1200, 190);

    // InsuranceBetPrompt modal
    public static readonly Vector2 PosInsuranceModal = new Vector2(720, 440);
    public static readonly Vector2 SizeInsuranceModal = new Vector2(480, 200);

    // InsuranceBetPrompt buttons
    public static readonly Vector2 PosInsuranceTakeButton    = new Vector2(752, 578);
    public static readonly Vector2 PosInsuranceDeclineButton = new Vector2(968, 578);

    // FeltMarkings positions
    public static readonly Vector2 PosFeltMarkingLine1 = new Vector2(960, 270); // "BLACKJACK PAYS 3 TO 2"
    public static readonly Vector2 PosFeltMarkingLine2 = new Vector2(960, 300); // "DEALER MUST DRAW TO 16"
    public static readonly Vector2 PosFeltMarkingLine3 = new Vector2(960, 330); // "INSURANCE PAYS 2 TO 1"

    // FeltSurface
    public static readonly Vector2 PosFeltSurface  = new Vector2(510, 200);
    public static readonly Vector2 SizeFeltSurface = new Vector2(900, 560);

    // Rail
    public static readonly Vector2 PosRail  = new Vector2(482, 172);
    public static readonly Vector2 SizeRail = new Vector2(956, 616);

    // Bet total display (above chip stack during Betting)
    public static readonly Vector2 PosBetTotalDisplay = new Vector2(960, 648);

    // CashierScreen panel
    public static readonly Vector2 PosCashierPanel = new Vector2(560, 240);
    public static readonly Vector2 SizeCashierPanel = new Vector2(800, 600);

    // Split hand zone centers (2-hand)
    public static readonly Vector2 PosSplitHand0Center2 = new Vector2(810, 820);
    public static readonly Vector2 PosSplitHand1Center2 = new Vector2(1110, 820);

    // Split hand MainBetSpot centers (2-hand)
    public static readonly Vector2 PosSplitBet0Center2 = new Vector2(810, 870);
    public static readonly Vector2 PosSplitBet1Center2 = new Vector2(1110, 870);

    // Split hand zone centers (3-hand)
    public static readonly Vector2 PosSplitHand0Center3 = new Vector2(710, 820);
    public static readonly Vector2 PosSplitHand1Center3 = new Vector2(960, 820);
    public static readonly Vector2 PosSplitHand2Center3 = new Vector2(1210, 820);

    // Split hand zone centers (4-hand)
    public static readonly Vector2 PosSplitHand0Center4 = new Vector2(640, 820);
    public static readonly Vector2 PosSplitHand1Center4 = new Vector2(853, 820);
    public static readonly Vector2 PosSplitHand2Center4 = new Vector2(1067, 820);
    public static readonly Vector2 PosSplitHand3Center4 = new Vector2(1280, 820);

    // SideBetResultBanner positions
    public static readonly Vector2 PosSideBetBannerTriLux     = new Vector2(820, 560);
    public static readonly Vector2 PosSideBetBannerLuckyLucky = new Vector2(1100, 560);
    public static readonly Vector2 SizeSideBetBanner          = new Vector2(200, 80);

    // TipPrompt
    public static readonly Vector2 PosTipPrompt  = new Vector2(800, 960);
    public static readonly Vector2 SizeTipPrompt = new Vector2(320, 60);

    // Push indicator center
    public static readonly Vector2 PosPushIndicator = new Vector2(960, 480);

    // -------------------------------------------------------------------------
    // Component Sizes
    // -------------------------------------------------------------------------

    public static readonly Vector2 SizeBankrollDisplay    = new Vector2(200, 48);
    public static readonly Vector2 SizeChipTray           = new Vector2(200, 64);
    public static readonly Vector2 SizeMainBetSpot        = new Vector2(88, 80);
    public static readonly Vector2 SizeTriLuxBetSpot      = new Vector2(80, 56);
    public static readonly Vector2 SizeLuckyLuckyBetSpot  = new Vector2(100, 56);
    public static readonly Vector2 SizeActionButton       = new Vector2(180, 52);
    public static readonly Vector2 SizeClearBetButton     = new Vector2(180, 36);
    public static readonly Vector2 SizeSettingsButton     = new Vector2(44, 44);
    public static readonly Vector2 SizeCard               = new Vector2(CardWidth, CardHeight);
    /// <summary>Insurance prompt button size (200x52 per annotations.md Section 16).</summary>
    public static readonly Vector2 SizeInsuranceButton    = new Vector2(200, 52);
    /// <summary>CashierScreen panel loan/return button size.</summary>
    public static readonly Vector2 SizeCashierButton      = new Vector2(240, 52);
    // CashierScreen panel internal layout y-positions (local to the 800x600 panel)
    public const int CashierHeadingLocalY      = 60;
    public const int CashierBankrollLocalY     = 120;
    public const int CashierLoanButtonLocalY   = 200;
    public const int CashierLoanButtonLocalX   = 280;
    public const int CashierNewSessionLocalY   = 480;
    public const int CashierReturnLocalY       = 540;
    // Loan increment constant (matches GameConfig.LoanIncrement)
    public const int LoanIncrement = 500;
    /// <summary>Felt label approximate width for centering calculation.</summary>
    public const int FeltLabelApproxWidth = 400;
}
