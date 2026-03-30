# Blackjack Game Specification

**Version:** 1.1
**Date:** 2026-03-30
**Status:** Phase 6 deliverable — pending developer approval
**Phase:** 6

**Changelog:**
- v1.1: Added Section 16 (TriLux and Lucky Lucky side bets). Added `SideBetResolution` phase to state machine. Renamed `SideBet` field on `BlackjackGameState` to `DoubleDownBet` to avoid naming conflict with new side bet fields. Added `TriLuxBet` and `LuckyLuckyBet` fields.

This document is the authoritative rules reference for the Blackjack implementation. Every rule, edge case, and condition is written out explicitly. No field reads "standard rules apply." Two developers reading this document must produce identical behavior.

---

## 1. Rule Set Baseline

These rules match Vegas Strip Blackjack as played at premium properties. Any deviation is explicitly noted.

| Rule | Value |
|---|---|
| Decks | 6 |
| Blackjack pays | 3:2 |
| Dealer soft 17 | Stands |
| Double down | Any two cards |
| Double after split | Allowed |
| Split | Up to 3 times (4 hands maximum) |
| Split Aces | One card each, no further hits |
| Re-split Aces | Not allowed |
| Surrender | Late only |
| Insurance | Offered when dealer shows Ace |
| Insurance pays | 2:1 |

---

## 2. Deck and Shoe Configuration

### 2.1 Deck Count

Six standard 52-card decks. 312 cards total. No jokers.

### 2.2 Shoe State

The shoe is represented as an ordered array of 312 `Card` values. The shoe is shuffled at game start and reshuffled when the penetration threshold is reached (see 2.4).

```
ShoeState {
    Card[] Cards          // remaining cards in draw order, index 0 = next card to deal
    int TotalDealt         // count of cards dealt since last shuffle
    bool ShufflePending    // true when TotalDealt >= ShuffleThreshold
}
```

### 2.3 Card Representation

Each card has a rank (1–13, where 1 = Ace, 11 = Jack, 12 = Queen, 13 = King) and a suit (clubs, diamonds, hearts, spades). All 312 cards are fully enumerated in the shoe — no shortcuts, no virtual decks.

### 2.4 Shuffle Trigger

Shuffle occurs between hands — never mid-hand.

**Threshold:** After any hand completes, if `TotalDealt >= 156` (50% penetration of 312 cards), `ShufflePending` is set to `true`. The shuffle executes before the next hand's `DealInitiated` transition. The player sees a brief shuffle indicator in the UI before the next deal.

**Why between hands:** Shuffling mid-hand is not permitted. If the shoe reaches empty mid-hand (extremely unlikely at 6 decks with 50% penetration), this is a fatal error state. Log it and reinitialize the shoe before continuing. This edge case is not expected in normal play.

### 2.5 Shuffle Behavior

Shuffle is a Fisher-Yates in-place shuffle of all 312 cards (not a partial reshuffle). After shuffle, `TotalDealt` resets to 0 and `ShufflePending` resets to `false`.

### 2.6 Shoe Reset Trigger

The shoe is fully reset and reshuffled only on:
1. The shuffle threshold being reached (see 2.4)
2. A new game session being started (application launch, new session after tapped-out reset)

The shoe is NOT reset between hands unless the shuffle threshold is met.

---

## 3. Card Values

| Card | Value |
|---|---|
| Ace | 11, or 1 if hand would bust at 11 |
| 2–9 | Face value |
| 10, Jack, Queen, King | 10 |

**Ace softness rule:** A hand containing an Ace counted as 11 is a "soft" hand. When adding a card would cause the total to exceed 21, the Ace is reclassified to 1. If a hand contains two Aces, only one may be counted as 11 at a time; when the second Ace arrives, the previously-soft Ace becomes 1 so the second Ace is valued at 1 as well (giving a total of 1 + 1 + [other cards]).

**Hand total algorithm:**

1. Sum all cards treating Aces as 1.
2. Count the number of Aces in the hand.
3. While the number of "bonus Aces" remaining is > 0 and `sum + 10 <= 21`: add 10 to sum, decrement bonus count by 1.
4. Return sum. If sum > 21, the hand is bust.

**Soft vs. hard classification:** A hand is "soft" if its total used at least one +10 bonus from the algorithm above. A hand is "hard" otherwise (all Aces count as 1, or no Aces in hand).

**Examples:**
- Ace + 6 = soft 17 (Ace valued at 11)
- Ace + 6 + 8 = hard 15 (Ace reclassified to 1, total 15)
- Ace + Ace = soft 12 (one Ace at 11, one at 1)
- Ace + Ace + 9 = hard 11 (both Aces at 1)
- 10 + 5 = hard 15

---

## 4. Blackjack Definition

A blackjack is an Ace plus any 10-value card (10, Jack, Queen, King) dealt as the initial two cards of the original hand.

**A blackjack is NOT:**
- A 21 achieved with three or more cards
- A 21 achieved on a split hand (a split hand that draws Ace + 10-value counts as 21, not blackjack)

---

## 5. Dealer Rules

### 5.1 Dealer Stands on Soft 17

The dealer stands on all 17s, including soft 17 (e.g., Ace + 6). This applies regardless of player hand outcomes.

### 5.2 Hole Card

The dealer receives two cards on the initial deal:
- Card 1 (first dealer card): dealt face-up
- Card 2 (hole card): dealt face-down

**Dealing order:** Player card 1 → Dealer card 1 (face-up) → Player card 2 → Dealer card 2 (face-down, hole card).

### 5.3 Peek Rule

When the dealer's face-up card is a 10-value card or an Ace, the dealer peeks at the hole card before player action begins.

**If the dealer has blackjack (peek reveals a 10-value card when up-card is Ace, or an Ace when up-card is 10):**
- If insurance was offered and taken: resolve insurance immediately (see Section 11), then reveal dealer blackjack
- The hand resolves immediately without player action (exception: a player blackjack results in a push, not a loss)
- No double down, no split, no hit, no surrender options are presented

**If the dealer does not have blackjack:**
- The hole card remains face-down
- Player action proceeds normally

### 5.4 Dealer Hole Card Reveal Timing

The hole card is revealed (flipped face-up) when the `DealerTurnStarted` transition fires. This occurs after all player hands have been resolved (stood, busted, or surrendered). The flip animation plays before the dealer draws any additional cards.

**Exception:** If the dealer peeked and found blackjack, the hole card reveals immediately after the peek check resolves, before player action.

### 5.5 Dealer Action Sequence

After the hole card reveals, the dealer draws cards one at a time until the hand reaches a stand condition or busts. The sequence is:

1. Flip hole card face-up. Evaluate hand total.
2. If total >= 17 (hard or soft): stand. Do not draw.
3. If total <= 16 (hard or soft): draw one card. Re-evaluate. Repeat from step 2.
4. If total > 21: dealer busts. All non-busted player hands win.
5. After reaching 17+ or bust: `HandResolved` fires.

**Soft 17 clarification:** Soft 17 (e.g., Ace + 6) is a stand. The dealer does not hit soft 17 in this rule set.

---

## 6. Player Options

### 6.1 Hit

**What it does:** Deals one card from the shoe to the active player hand. Re-evaluates hand total.

**Enabled when:**
- Phase is `PlayerTurn`
- Active hand total is <= 21 (hand is not bust)
- Active hand is not a split-Aces hand (split Aces receive exactly one card each and cannot hit)

**Disabled when:**
- Any other phase
- Active hand is bust (> 21)
- Active hand is a split-Aces hand

**After hitting:**
- If new total > 21: active hand busts. If there are additional split hands to act on, advance to the next hand. If no more hands, proceed to `DealerTurn`. No further player action on a busted hand.
- If new total == 21: stand is automatically applied. No prompt. The player cannot hit a 21.
- If new total <= 20: player may continue to act (hit, stand, or double if conditions still met — see 6.3).

---

### 6.2 Stand

**What it does:** Ends action on the active hand. No card is drawn.

**Enabled when:**
- Phase is `PlayerTurn`
- Active hand is not bust

**Disabled when:**
- Any other phase
- Active hand is bust (standing on bust is meaningless — bust is terminal)

**After standing:**
- Advance to next split hand, if any. If no more hands, proceed to `DealerTurn`.

---

### 6.3 Double Down

**What it does:** Doubles the bet on the active hand, deals exactly one card, then automatically stands. No further action on that hand.

**Enabled when:**
- Phase is `PlayerTurn`
- Active hand has exactly two cards
- Active hand is not bust
- Active hand is not a split-Aces hand
- `GlobalState.Bankroll >= MainBet` (player has enough chips to cover the additional bet)

**Double after split:** Allowed. If a player splits and receives two cards on a resulting hand, that hand may be doubled down.

**Disabled when:**
- Active hand has three or more cards
- Active hand is a split-Aces hand
- Player cannot afford the additional bet
- Any phase other than `PlayerTurn`

**Bet mechanics:**
- The additional bet equals exactly the original `MainBet` for that hand. It cannot be a different amount.
- `DoubleDownBet` on `BlackjackGameState` is set to the doubled amount.
- `GlobalState.ApplyBankrollDelta(-MainBet)` is called immediately when double down is confirmed.

**After doubling:**
- Deal one card to the hand. Evaluate total.
- If total > 21: hand busts. Bet is lost (both MainBet and DoubleDownBet).
- If total <= 21: hand stands. Advance to next split hand or `DealerTurn`.
- Auto-stand is applied regardless of total (including 21 and under-21 totals).

**Bust on a doubled hand:** Both the main bet and the doubled bet are lost. No partial recovery.

---

### 6.4 Split

**What it does:** Splits a pair into two separate hands. The original pair is separated. One additional card is dealt to each new hand from the shoe.

**Enabled when:**
- Phase is `PlayerTurn`
- Active hand has exactly two cards
- Both cards are of equal rank value (see Split Rank Rules below)
- Split count for this deal is < 3 (maximum 4 hands from splits)
- `GlobalState.Bankroll >= MainBet` (player has enough chips to cover the additional bet for the new hand)

**Split rank rules:** Two cards may be split if they have equal 10-value. This means:
- Pair of 10s: yes
- 10 + Jack: yes (both are 10-value)
- Jack + Queen: yes (both are 10-value)
- Any two 10-value cards: yes
- Ace + Ace: yes
- 2 + 2 through 9 + 9: yes, matching rank only
- Ace + any non-Ace: no
- Different non-10 ranks (e.g., 7 + 8): no

**Split count limit:** Starting from the original two-card hand, the player may split a maximum of 3 times, producing a maximum of 4 simultaneous hands. Each split costs one additional MainBet from the bankroll.

**Re-split Aces:** Not allowed. The player splits Aces. Each resulting hand receives exactly one card. That card could be any card. The resulting hand cannot split again regardless of what that card is. If the card received is another Ace, the hand is Ace + Ace = soft 12. The hand automatically stands at soft 12 and is not eligible to split again.

**Bet mechanics on split:**
- The new split hand is created with a MainBet equal to the original MainBet.
- `GlobalState.ApplyBankrollDelta(-MainBet)` is called once for each split performed.
- Each resulting hand's MainBet is tracked independently.

**Disabled when:**
- Active hand has three or more cards
- Active hand cards do not share equal 10-value rank
- Split count is already 3
- Player cannot afford the split bet
- Any phase other than `PlayerTurn`

**Split hand sequence:**
After splitting, cards are dealt to fill each new hand to two cards in left-to-right order:
1. Split hand 1 receives one card.
2. Split hand 2 receives one card.
3. Player acts on split hand 1 first (leftmost).
4. When split hand 1 is resolved (stood, busted, doubled), advance to split hand 2.
5. Continue until all split hands are resolved.
6. Proceed to `DealerTurn`.

**Split Aces special rules:**
- Each split-Ace hand receives exactly one card. No exceptions.
- After receiving that one card, the hand automatically stands. Hit and Double are both disabled.
- If the card received is a 10-value card, the hand totals 21. This is NOT blackjack (see Section 4). It counts as 21.
- If the card received is another Ace: the hand is Ace + Ace = soft 12. Hand automatically stands at 12.
- Surrender is not available on split-Ace hands (the hand is already forced to stand).

---

### 6.5 Surrender (Late Only)

**What it does:** Player forfeits the hand, recovering half the MainBet. The other half is lost.

**Late surrender only.** No early surrender. This means surrender is offered only after the dealer has checked for blackjack (peeked). If the dealer has blackjack, surrender is not available — the hand resolves as a loss (or push if player also has blackjack).

**Enabled when:**
- Phase is `PlayerTurn`
- Active hand has exactly two cards (original deal — first action only)
- No split has been performed on this hand
- Dealer has already peeked and does not have blackjack
- Active hand is not bust

**Disabled when:**
- Active hand has three or more cards (any card has been drawn)
- This hand is a split hand (surrender not available after splitting)
- Dealer has blackjack (hand resolves immediately — no surrender offered)
- Phase is not `PlayerTurn`

**Bet mechanics:**
- Player recovers `floor(MainBet / 2)`. The other `ceil(MainBet / 2)` is lost.
- Odd-cent situations do not arise since minimum bet is $5 (always even) and chips are integer denominations, but the floor/ceil rule is explicitly defined for robustness.
- `GlobalState.ApplyBankrollDelta(floor(MainBet / 2))` is called. The original deduction at bet-lock already removed the full MainBet; this call adds back the recovered half.
- `DoubleDownBet`, `InsuranceBet` are unaffected by surrender (both are 0 at this point since you cannot have doubled before this first action, and insurance was already resolved).

**After surrendering:**
- Hand is marked as `Surrendered`. It does not participate in dealer turn evaluation.
- If there are additional split hands: advance to next hand. (Surrender is not available on split hands, so this only applies in theory if somehow split produced a surrender opportunity — it does not in this rule set.)
- If no more hands to act on: proceed to `DealerTurn`.

---

### 6.6 Insurance

**What it is:** A side bet that the dealer has blackjack, offered only when the dealer's face-up card is an Ace.

**When offered:**
- Immediately after the initial deal, before player action
- Only when dealer's face-up card (card 1, the up-card) is an Ace
- Phase transitions to `InsurancePrompt` before `PlayerTurn`
- Insurance prompt is shown regardless of whether the player has blackjack

**Insurance bet amount:**
- Fixed at exactly half the player's current MainBet: `floor(MainBet / 2)`.
- The player cannot choose a different insurance amount.
- Player must be able to afford the insurance bet: `GlobalState.Bankroll >= floor(MainBet / 2)`.
- If the player cannot afford insurance, the insurance offer is still displayed but the Accept button is disabled. The player proceeds with the Decline path.

**Enabled when:**
- Phase is `InsurancePrompt`
- Dealer up-card is Ace
- Player has sufficient bankroll to cover `floor(MainBet / 2)`

**Player choices at InsurancePrompt:**
1. **Take Insurance** — deduct `floor(MainBet / 2)` from bankroll, set `InsuranceBet`, advance to dealer peek resolution.
2. **Decline Insurance** — set `InsuranceBet = 0`, advance to dealer peek resolution.
3. **Even Money** — this is a variant of insurance offered when player has blackjack and dealer shows Ace. This rule set does not offer "even money" as a named option. The player may take insurance under the standard rules; the resulting payout math produces the same outcome as even money but it is not labeled or presented differently.

**Dealer peek and resolution:**

After the insurance decision is locked:

**Case A — Dealer has blackjack (hole card is a 10-value card):**
- Insurance bet wins: pays 2:1. Player receives `InsuranceBet * 2` in winnings plus the original `InsuranceBet` returned. Net gain on insurance bet: `InsuranceBet * 2`.
- Call `GlobalState.ApplyBankrollDelta(InsuranceBet * 3)` (original bet back + 2x winnings).
- The main hand then resolves:
  - If player also has blackjack: push. MainBet is returned. `GlobalState.ApplyBankrollDelta(MainBet)`.
  - If player does not have blackjack: loss. MainBet is not returned.
- No further player action occurs. Proceed to Resolution phase.

**Case B — Dealer does not have blackjack:**
- Insurance bet loses: `InsuranceBet` is forfeited. No bankroll change needed (it was already deducted at the moment the player confirmed the insurance bet). `InsuranceBet` is recorded as 0 for resolution purposes.
- When the dealer's hole card is revealed and confirms no blackjack, the losing insurance bet has already been deducted from the bankroll display at the moment the player confirmed the insurance bet. No additional deduction occurs at resolution. The bankroll display does not change at hole card reveal for a losing insurance bet.
- Reveal hole card state transitions to player action. `InsurancePrompt` → `PlayerTurn` (or → `Resolution` if player has blackjack — see 9.1).
- Dealer's hole card remains face-down until `DealerTurnStarted`.

**Even money note (for developer):** If player has blackjack and takes insurance, and dealer has blackjack, the result is: insurance wins 2:1 (net +InsuranceBet * 2) + main hand is push (+MainBet back). If player has blackjack and takes insurance, and dealer does NOT have blackjack: insurance loses (-InsuranceBet), main hand pays 3:2 (net +MainBet * 1.5). The system handles this through the standard resolution path — no special case needed.

---

## 7. Payout Ratios

| Outcome | Payout |
|---|---|
| Player blackjack (dealer does not have blackjack) | 3:2 on MainBet |
| Player wins standard (higher total, or dealer bust) | 1:1 on MainBet |
| Player wins double down | 1:1 on MainBet + 1:1 on DoubleDownBet (doubled amount) |
| Push (equal totals, or both player and dealer blackjack) | MainBet returned (no win, no loss) |
| Player loses | MainBet forfeited |
| Insurance win (dealer has blackjack) | 2:1 on InsuranceBet |
| Insurance loss (dealer does not have blackjack) | InsuranceBet forfeited |
| Surrender | `floor(MainBet / 2)` returned, remainder forfeited |

**3:2 payout calculation:**
- If `MainBet` is odd (not evenly divisible by 2), payout = `floor(MainBet * 1.5)`. Example: $5 bet → $7 payout (not $7.50). The half-dollar is rounded down.
- In practice, minimum bet is $5. $5 * 1.5 = $7.50. Rounds down to $7. Player receives $7 plus their original $5 back, for a total of $12 on a $5 blackjack.
- `GlobalState.ApplyBankrollDelta(MainBet + floor(MainBet * 1.5))` — original bet returned plus winnings.

**Note on split hand blackjack payout:** A 21 on a split hand pays 1:1, not 3:2 (see Section 4 and edge cases in Section 9).

---

## 8. Action Availability Rules

The `ActionAvailability` record on `BlackjackGameState` must be recomputed on every state transition. The scene reads this record to enable or disable buttons. Buttons are never enabled/disabled by the scene directly based on game logic — all logic is in the state machine.

### 8.0 BlackjackGameState Field Shape

The following struct defines the complete shape of `BlackjackGameState`. This is the authoritative field list. Cross-reference `technical-architecture.md` for the persistence model and serialization rules.

```csharp
public record BlackjackGameState(
    int MainBet,                        // current main bet for the active hand
    int DoubleDownBet,                  // doubled-down bet amount (0 until double down confirmed; cleared to 0 at start of each hand)
    int InsuranceBet,                   // insurance bet amount (0 until insurance taken; 0 again after resolution)
    int TriLuxBet,                      // TriLux side bet amount (0 = not placed; set during Betting phase; cleared at start of each hand)
    int LuckyLuckyBet,                  // Lucky Lucky side bet amount (0 = not placed; set during Betting phase; cleared at start of each hand)
    int[] BetDenominations,             // ordered array of chip denominations placed during Betting phase
    int ActiveHandIndex,                // index into PlayerHands; 0-based; which hand the player is currently acting on
    PlayerHand[] PlayerHands,           // all player hands (1 before any split; up to 4 after splits)
    DealerHand DealerHand,              // dealer's current hand (both cards; hole card face-down state tracked separately)
    ActionAvailability ActionAvailability,  // recomputed on every state transition (see below)
    GamePhase CurrentPhase              // current phase of the state machine
);
```

**Field notes:**
- `MainBet` reflects the bet for the hand at `ActiveHandIndex`. After splits, each hand has its own MainBet tracked within `PlayerHand`. This top-level `MainBet` always mirrors `PlayerHands[ActiveHandIndex].MainBet` for convenience.
- `DoubleDownBet` is set when a double down is confirmed and cleared to 0 at the start of each new hand.
- `InsuranceBet` is set when the player accepts insurance and cleared to 0 after insurance resolves.
- `TriLuxBet` is set during the `Betting` phase if the player places a TriLux bet, and cleared to 0 at the start of each new hand. A value of 0 means no TriLux bet was placed.
- `LuckyLuckyBet` is set during the `Betting` phase if the player places a Lucky Lucky bet, and cleared to 0 at the start of each new hand. A value of 0 means no Lucky Lucky bet was placed.
- `BetDenominations` is the raw chip stack placed during `Betting`. It drives the visual BetSpot display. Cleared at the start of each new hand.
- `ActiveHandIndex` advances as split hands are resolved. It is 0 for non-split hands.
- `PlayerHands` has exactly 1 entry for a non-split hand. Split creates additional entries up to a maximum of 4.
- `CurrentPhase` matches the state machine's authoritative phase. This field is read-only from the scene's perspective — it is written only by the state machine.

```csharp
public record ActionAvailability(
    bool CanHit,
    bool CanStand,
    bool CanDouble,
    bool CanSplit,
    bool CanSurrender,
    bool CanInsurance,      // true only during InsurancePrompt phase
    bool CanDeal            // true only during Betting phase with valid bet placed
);
```

### 8.1 Availability by Phase

| Action | Idle | Betting | Dealing | SideBetResolution | InsurancePrompt | PlayerTurn | DealerTurn | Resolution | PlayerBroke |
|---|---|---|---|---|---|---|---|---|---|
| Deal | No | Yes (if bet >= MinBet) | No | No | No | No | No | No | No |
| Hit | No | No | No | No | No | See 8.2 | No | No | No |
| Stand | No | No | No | No | No | Yes (if hand not bust) | No | No | No |
| Double | No | No | No | No | No | See 8.3 | No | No | No |
| Split | No | No | No | No | No | See 8.4 | No | No | No |
| Surrender | No | No | No | No | No | See 8.5 | No | No | No |
| Insurance | No | No | No | No | See 8.6 | No | No | No | No |

### 8.2 Hit Availability (PlayerTurn only)

`CanHit = true` when ALL of the following are true:
- Phase is `PlayerTurn`
- Active hand card count allows hitting (not a split-Aces hand)
- Active hand total <= 21 (not bust — bust is terminal)
- Active hand total != 21 (auto-stand at 21; no prompt needed)

`CanHit = false` otherwise.

### 8.3 Double Availability (PlayerTurn only)

`CanDouble = true` when ALL of the following are true:
- Phase is `PlayerTurn`
- Active hand has exactly 2 cards
- Active hand is not a split-Aces hand
- Active hand total <= 21
- `GlobalState.Bankroll >= MainBet` (enough for additional wager)

`CanDouble = false` otherwise.

### 8.4 Split Availability (PlayerTurn only)

`CanSplit = true` when ALL of the following are true:
- Phase is `PlayerTurn`
- Active hand has exactly 2 cards
- Both cards share equal split-eligible rank (see 6.4 split rank rules)
- Total split count for this deal < 3 (fewer than 4 total hands exist)
- `GlobalState.Bankroll >= MainBet` (enough for additional wager)

`CanSplit = false` otherwise.

### 8.5 Surrender Availability (PlayerTurn only)

`CanSurrender = true` when ALL of the following are true:
- Phase is `PlayerTurn`
- Active hand has exactly 2 cards
- Active hand is not a split hand
- Dealer peeked and did not find blackjack

`CanSurrender = false` otherwise.

### 8.6 Insurance Availability (InsurancePrompt only)

`CanInsurance = true` when ALL of the following are true:
- Phase is `InsurancePrompt`
- `GlobalState.Bankroll >= floor(MainBet / 2)`

`CanInsurance = false` otherwise. (The prompt is still shown, but the accept button is disabled.)

---

## 9. Edge Cases

Every edge case is listed here. No "standard rules apply" shortcuts.

### 9.1 Player Blackjack, Dealer Does Not Have Blackjack

- Dealer's up-card is NOT an Ace or 10-value: player blackjack wins immediately at 3:2. No dealer draw occurs.
- Dealer's up-card IS a 10-value card: dealer peeks. Hole card is not a blackjack-completing card. Player blackjack wins at 3:2. No dealer draw occurs.
- Dealer's up-card IS an Ace: insurance is offered (InsurancePrompt phase). After insurance resolution (dealer peeks, does not have blackjack), player blackjack wins at 3:2. No dealer draw occurs.

**Important — InsurancePrompt with player blackjack and no dealer blackjack:** When the dealer's up-card is an Ace, insurance is offered regardless of the player's hand. If after the insurance decision the dealer does not have blackjack AND the player has blackjack, the state transitions from `InsurancePrompt` directly to `Resolution`. `PlayerTurn` is skipped entirely — there is no player action to take on a blackjack hand. The player blackjack pays 3:2 at resolution. Any insurance bet taken is forfeited as a losing insurance bet (dealer had no blackjack).

### 9.2 Player Blackjack, Dealer Also Has Blackjack

- Result: push. MainBet is returned. Neither player wins.
- If insurance was taken: insurance wins 2:1 (dealer has blackjack). Main hand is push. Net result for player: up by `InsuranceBet * 2` (insurance profit), neutral on main bet.
- If insurance was not taken: main hand push only.
- Payout: `GlobalState.ApplyBankrollDelta(MainBet)` for the push (return original bet). Insurance handled separately (see 6.6 Case A).

### 9.3 Player and Dealer Both Have 21 (Non-Blackjack)

- Equal totals of 21 with three or more cards each: push. MainBet returned.
- Player has 21 with two cards (blackjack), dealer has 21 with three or more cards: player wins at 3:2. This is not a push. Player blackjack beats dealer 21.

### 9.4 Dealer Busts, Player Also Busted

- Player busted before dealer turn. Player loses MainBet regardless of what the dealer does. Dealer bust does not rescue a busted player hand.

### 9.5 Blackjack on a Split Hand

- Player splits a pair. One of the resulting hands receives an Ace + 10-value card as its two cards.
- This is NOT blackjack. It is a hand totaling 21. Pays 1:1, not 3:2.
- This applies even if the original unsplit hand would have been blackjack (which is impossible to retroactively determine and irrelevant).

### 9.6 Split to One Card, Then Dealer Has Blackjack

- This scenario cannot occur by construction. The peek (Section 5.3) always completes before `PlayerTurn` begins. Splits are only available during `PlayerTurn`.
- When the dealer has a 10-value up-card and peek confirms blackjack, the hand resolves immediately at the `Dealing` → `DealerBlackjack` transition. The player never reaches a split decision. There is no split-then-dealer-blackjack path in this flow.

### 9.7 Bust on a Doubled Hand

- Player doubles. The one card drawn busts the hand (total > 21).
- Both MainBet and DoubleDownBet (the doubled bet amount) are lost.
- No partial recovery. Full combined bet is forfeited.

### 9.8 Player Cannot Afford to Double

- `GlobalState.Bankroll < MainBet`: `CanDouble = false`. Button disabled. Player may not attempt the double.
- Player can still hit, stand, or surrender on the two-card hand.

### 9.9 Player Cannot Afford to Split

- `GlobalState.Bankroll < MainBet`: `CanSplit = false`. Button disabled.
- Player may still hit the hand, stand, double (if still eligible), or surrender.

### 9.10 Player Cannot Afford Insurance

- `GlobalState.Bankroll < floor(MainBet / 2)`: `CanInsurance = false`.
- The insurance prompt is still shown (dealer has Ace, prompt is mandatory). The Accept button is disabled. Only the Decline button is available. Player auto-proceeds with no insurance.

### 9.11 Three-Card Hand Eligibility After Insurance

- Insurance is offered before player action. After insurance resolves (dealer no blackjack), player enters `PlayerTurn` with their original two-card hand.
- Insurance does not affect hit/stand/double/split/surrender eligibility. The two-card hand is still eligible for all options per their normal conditions.

### 9.12 Split Aces Receive a 10-Value Card

- Hand total: Ace + 10-value = 21. Pays 1:1 (not blackjack). Hand automatically stands.

### 9.13 Split Aces Receive Another Ace

- Hand: Ace + Ace = soft 12. Re-splitting Aces is not allowed. Hand automatically stands at soft 12.
- Dealer will likely win this hand (soft 12 is weak), but the rule is enforced with no exceptions.

### 9.14 Re-Split Non-Ace Pairs

- Player splits 8+8. Receives 8 on one of the resulting hands (now 8+8 again). This hand is eligible for re-splitting if split count < 3 and player can afford it.
- Maximum four total hands. Once 4 hands exist, no further splitting.

### 9.15 Dealer Has Exactly 17 After Drawing

- Dealer stands. Does not draw again. Regardless of whether it is soft 17 (this rule set: dealer stands on soft 17) or hard 17.

### 9.16 Dealer Has Exactly 21 With Three or More Cards

- All player hands with total < 21: lose.
- All player hands with total == 21 (non-blackjack, three+ cards): push.
- All player hands with blackjack (two-card 21): win at 3:2. Player blackjack beats dealer 21.

### 9.17 All Player Hands Busted Before Dealer Turn

- Dealer turn still executes. The hole card is still revealed. Dealer draws to completion per normal rules.
- No optimization where the dealer skips drawing when all players busted. The full sequence runs for consistency with the data model and animation system.
- Resolution: all busted player hands lose regardless of dealer outcome.

### 9.18 Player Goes Broke Mid-Hand

- If `GlobalState.Bankroll` reaches 0 after a bet is locked and a hand is in progress, the hand plays to completion. The player cannot place additional bets (double, split) if the bankroll is 0.
- After the hand resolves, if bankroll is still 0, phase transitions to `PlayerBroke`.
- If the player wins the hand and bankroll returns above 0, `PlayerBroke` does not trigger.

### 9.19 Player Goes Broke After Hand Resolution

- After resolution, `GlobalState.Bankroll == 0`: phase transitions to `PlayerBroke`. Scene navigates to CashierScreen.

### 9.20 Bankroll Drops Below Min Bet After a Hand

- Player has a bankroll > 0 but < minimum bet. The Betting phase is entered but the Deal button cannot be enabled (no valid bet can be placed). The ChipTray shows all denominations as unaffordable.
- The player is effectively stuck. This state should route to CashierScreen. Implementation decision: after hand resolution, if `GlobalState.Bankroll < MinBet`, treat as `PlayerBroke` and navigate to CashierScreen.

### 9.21 Surrender After Insurance Decision

- Player took insurance. Dealer does not have blackjack. Player enters `PlayerTurn` with original two-card hand.
- `CanSurrender = true` (all conditions met: two cards, not split hand, dealer no blackjack).
- If player surrenders: `floor(MainBet / 2)` is recovered. `InsuranceBet` was already forfeited in the insurance resolution step. No interaction between surrender and insurance recovery.

### 9.22 Double Down on Soft Hand

- Player has Ace + 6 (soft 17). Doubles. Receives a 4. New total: Ace + 6 + 4 = soft 21 (Ace at 11). Hand stands at 21.
- Player has Ace + 6 (soft 17). Doubles. Receives a King. New total: Ace + 6 + King = 17 (Ace reclassified to 1: 1+6+10=17). Hand stands at 17.
- Player has Ace + 6 (soft 17). Doubles. Receives an 8. New total: Ace + 6 + 8 = 15 (Ace reclassified to 1: 1+6+8=15). Hand stands at 15.
- All of these are correct. Double forces a stand after one card regardless of outcome.

### 9.23 Five-Card Charlie

- Not offered in this rule set. A hand with five cards totaling 21 or less is not an automatic win. It is simply a hand with a total. Normal rules apply.

### 9.24 Dealing Phase Interruption

- The `Dealing` phase is non-interruptible. Player input is ignored while cards are being dealt (animation in progress). The action buttons are all disabled during `Dealing`.

### 9.25 Quitting or Disconnecting Mid-Hand

- Mid-hand state is not persisted for MVP (no crash recovery in Phase 12 scope, per `technical-architecture.md`).
- If the player quits (closes the application) mid-hand: on next launch, the table loads in the `Idle` phase. The in-progress hand is abandoned.
- The bankroll at the point of last write is restored (bankroll is written on every change). The bet that was deducted at `DealInitiated` is lost — the player loses that bet on application close.
- This is the correct and intentional behavior for MVP. No attempt is made to reconstruct the hand.

### 9.26 Tie on Surrender Bet Split (Odd MainBet)

- Minimum bet is $5. With odd minimum bets, `floor(MainBet / 2)` = 2 and `ceil(MainBet / 2)` = 3. Player recovers $2 on a $5 surrender, loses $3.
- In practice, $5 is the smallest unit and the chip denominations are $1, $5, $25, $100, $500. A MainBet can be an odd dollar if $1 chips are used. The floor rule is consistently applied.

### 9.27 Insurance on a Player Blackjack (Even Money Scenario)

- Player has blackjack. Dealer shows Ace. InsurancePrompt phase is entered.
- Player takes insurance at `floor(MainBet / 2)`.
- **If dealer has blackjack:** Insurance wins 2:1. Main hand pushes. Net: player keeps MainBet (push) + gains `InsuranceBet * 2`. Total bankroll delta: `+InsuranceBet * 2`. This is functionally identical to "even money" (player guaranteed profit of `floor(MainBet / 2) * 2` = MainBet approximately). Presented through standard resolution, not as a named even-money shortcut.
- **If dealer does not have blackjack:** Insurance loses (`InsuranceBet` forfeited). Main hand is blackjack, wins 3:2. Total bankroll delta: `+floor(MainBet * 1.5)` on the main bet, `-InsuranceBet` on insurance.

---

## 10. Bet Placement Flow

### 10.1 Phases Involved

| Phase | Bet State |
|---|---|
| Idle | No bet. ChipTray is NOT available. Player is watching the table. No chip placement is possible. |
| Betting | Player is placing chips. ChipTray active. Bet amount accumulating. Clear Bet button available when MainBet > 0. |
| DealInitiated (transition) | Bet locks. Bankroll deducted. Phase advances to Dealing. |
| Dealing | Bet locked and displayed. No changes permitted. |
| PlayerTurn | Bet locked. Split/double may add to it. |
| DealerTurn | Bet locked. |
| Resolution | Bet resolves. Chips animate to bankroll or away. |
| Idle (next hand) | Bet cleared. BetSpot empty. |

### 10.2 Placing Chips

The ChipTray is not available during `Idle`. The player must first take an explicit action — clicking a chip denomination or a "Place Bet" affordance — which fires the `Idle` → `Betting` transition. Only after that transition does the ChipTray become active and chip placement become possible.

1. Phase must be `Betting`.
2. Player selects a denomination from ChipTray (emits `DenominationSelected`).
3. Scene checks `GlobalState.Bankroll >= BetTotal + denomination`. If not, the placement is rejected silently (denomination was already dimmed; this is a belt-and-suspenders check).
4. If valid: `GameStateMachine.PlaceBet(denomination)` is called. State machine adds chip to `BetDenominations`, returns new `BlackjackGameState` with updated MainBet.
5. Scene calls `BetSpot.AddChip(denomination)`. Animation plays.
6. Bankroll display does NOT update during betting — the bankroll is not deducted until deal is confirmed (see 10.3).

**Minimum bet enforcement:** The Deal button (gold accent ActionButton) has `IsEnabled = false` until `MainBet >= MinBet`. Deal is not callable until minimum is met.

**Maximum bet enforcement:** A chip placement that would cause `MainBet > MaxBet` is rejected. The denomination button that would exceed the max is not dimmed for this reason specifically (it may be dimmed for affordability), but the placement call is rejected if it would push over the max. No error message is shown; the chip simply does not place.

### 10.3 Bet Lock

Bet locks when the player confirms by pressing Deal. The lock sequence:

1. Player presses Deal. `DealInitiated` transition fires.
2. `GlobalState.ApplyBankrollDelta(-MainBet)` is called. Bankroll display updates.
3. Phase advances to `Dealing`.
4. BetSpot chips remain visible but `BetSpot.IsActive = false`. No further chip placement is possible.

### 10.4 Chip Removal Before Deal

Players may remove their bet before pressing Deal. Implementation: a "Clear Bet" button is shown during `Betting` phase when `MainBet > 0`. Pressing it:
1. Calls `GameStateMachine.ClearBet()`. State machine returns `BlackjackGameState` with empty `BetDenominations` and `MainBet = 0`.
2. Scene calls `BetSpot.ClearStack()`. Chips animate off.
3. Deal button disables (MainBet is now below MinBet).
4. Bankroll is NOT adjusted (bankroll was not deducted during betting — only at deal confirmation).

### 10.5 Chip Clearing After Resolution

After `HandResolved` and the resolution animation completes:
1. `BetSpot.ClearStack()` is called (instant, no animation — chips were already animated to win/loss destination).
2. Phase transitions to `Idle`.
3. ChipTray becomes active again.

### 10.6 Mid-Hand Quit / Application Close

Covered in edge case 9.25. The bet deducted at deal confirmation is lost on application close. No recovery mechanism for MVP.

---

## 11. Win/Loss/Push Resolution

### 11.1 Resolution Trigger

Resolution begins when the `HandResolved` transition fires. This fires when:
- Dealer turn completes (dealer reached 17+ or busted)
- OR dealer blackjack was confirmed (all player hands resolve immediately)

### 11.2 Resolution Sequence

The full sequence from dealer reveals hole card to chips moving:

1. **Dealer hole card flips.** `CardFace.FlipCompleted` emits for the hole card node. Dealer total is now visible to player.
2. **Dealer draws.** Dealer draws cards per Section 5.5 until standing or busted. Each card deal animation completes before the next card draws.
3. **`HandResolved` fires.** All outcomes are computed simultaneously by the state machine. A `HandResult` is returned for every active player hand.
4. **Results displayed.** For each hand, `ResultBanner` is called with the appropriate `ResultType` and `Amount`.
5. **Chips animate per outcome.** For each hand, in left-to-right order:
   - **Win:** Win animation plays. `GlobalState.ApplyBankrollDelta(MainBet + WinAmount)` is called. (MainBet returns plus net winnings.)
   - **Push:** Push animation plays. `GlobalState.ApplyBankrollDelta(MainBet)` is called. (MainBet only returns.)
   - **Loss:** Loss animation plays. No bankroll delta (MainBet was already deducted at deal confirmation).
   - **Surrender:** Surrender was already resolved at time of surrender. No additional bankroll change. Recovery was applied then.
6. **Insurance resolution (if applicable).** Insurance resolves in Step 3 if dealer has blackjack (see 6.6). If dealer does not have blackjack, insurance was already forfeited in the `InsurancePrompt` phase — no further action. When the dealer's hole card is revealed and confirms no blackjack, the losing insurance bet has already been deducted from the bankroll display at the moment the player confirmed the insurance bet. No additional deduction occurs at resolution. The bankroll display does not change at hole card reveal for a losing insurance bet.
7. **BetSpot cleared.** All bet chips clear after resolution animation completes.
8. **Phase → Idle.** New hand may be started.

### 11.3 Outcome Determination Per Hand

For each player hand (including split hands), the outcome is one of:

| Outcome | Condition |
|---|---|
| **Player Blackjack Win** | Player has blackjack (two-card 21, original hand, no split), dealer does not have blackjack |
| **Player Win** | Player total > dealer total AND player not bust; OR dealer bust AND player not bust |
| **Push** | Player total == dealer total AND neither is bust; OR both have blackjack |
| **Player Loss** | Player bust; OR dealer total > player total AND dealer not bust; OR dealer blackjack and player does not have blackjack |
| **Surrender** | Player surrendered (resolved at surrender time, excluded from dealer comparison) |

### 11.4 Bust Resolution

A player hand that busted during `PlayerTurn` has its outcome determined as Loss at the time of the bust. The bankroll is deducted at deal confirmation for MainBet — it is not deducted again at bust. The bust means the MainBet that was already locked is forfeited. For a doubled hand that busts, the DoubleDownBet was deducted when the double was confirmed. Both are already out of the bankroll. At resolution, no further bankroll delta is needed for busted hands. The bust outcome is recorded in `HandResult` for history logging.

### 11.5 Win Amount Calculation

| Hand Outcome | `GlobalState.ApplyBankrollDelta(X)` where X = |
|---|---|
| Blackjack win | `MainBet + floor(MainBet * 1.5)` |
| Standard win | `MainBet * 2` (original bet returned + equal winnings) |
| Double down win | `(MainBet + DoubleDownBet) * 2` (full combined bet returned + equal winnings) |
| Push | `MainBet` (original bet returned only) |
| Double down push | `MainBet + DoubleDownBet` (full combined bet returned, no winnings) |
| Loss | `0` (nothing returned — bet already removed from bankroll) |
| Double loss | `0` (MainBet and DoubleDownBet both forfeited) |
| Surrender | Was applied at surrender time: `floor(MainBet / 2)` returned then. `0` additional here. |

### 11.6 Multiple Split Hands Resolution

Each split hand resolves independently using the same outcome rules above. The dealer's final total is compared to each hand individually. A dealer bust means all non-bust player hands win. A dealer 20 beats a player 19 and pushes a player 20 simultaneously across different split hands.

Bankroll delta calls are made sequentially, one per resolved hand, in left-to-right order.

### 11.7 History Recording

After resolution, a `HandRecord` is appended to `history.json` via `PersistenceService`. The record captures:
- Hand timestamp
- Dealer final hand
- Each player hand (cards, outcome, bet, net change)
- Phase at end (should always be `Resolution` → `Idle`)

---

## 12. Table Limits

Per `product-decisions.md`, limits are defined per game. Blackjack uses Standard tier as default.

| Tier | Min Bet | Max Bet |
|---|---|---|
| Low Limit | $5 | $100 |
| Standard | $25 | $500 |
| High Limit | $100 | $1,000 |

**Default tier for Blackjack:** Standard ($25 min / $500 max).

**Min bet enforcement:** Deal button disabled when `MainBet < 25`.

**Max bet enforcement:** Chip placement rejected (silently) when `MainBet + newChip > 500`.

**Note:** Tier selection UI is post-MVP. The table launches at Standard tier. Table tier is not player-configurable at MVP.

---

## 13. Sound Triggers (Blackjack-Specific)

Per `product-decisions.md`, per-game sound triggers are defined at game build time.

| Event | Sound |
|---|---|
| Card dealt (each card) | Card deal sfx |
| Card flip (hole card reveal) | Card flip sfx |
| Chip placed on bet spot | Chip clink sfx (universal, from product-decisions.md) |
| Player busts | Bust sfx |
| Player blackjack | Blackjack fanfare sfx |
| Dealer busts | Dealer bust sfx |
| Win | Win chime sfx (universal) |
| Loss | Loss sfx (universal) |
| Push | Push sfx |
| Shuffle indicator shown | Shuffle sfx |

All sounds are conditional on `GlobalState.SoundEnabled == true`. Sounds are not played when `SoundEnabled == false`.

---

## 14. Rules Panel Content

The `RulesPanel` is populated with the following sections. This is the static content passed to `RulesPanel.Sections`.

**Section 1 — Blackjack Pays 3 to 2**
- Blackjack is an Ace plus any 10-value card on the first two cards.
- Blackjack pays 3:2. All other wins pay 1:1.
- Dealer blackjack beats everything except player blackjack (push).

**Section 2 — Dealer Rules**
- Dealer stands on all 17s, including soft 17.
- Dealer draws to 16 or less.

**Section 3 — Player Options**
- Hit: draw another card.
- Stand: end your turn.
- Double Down: double your bet, receive one card, then stand. Available on first two cards.
- Split: split two cards of equal value into separate hands. Up to 4 hands.
- Split Aces receive one card each and stand automatically.
- Late Surrender: forfeit your hand and recover half your bet. Available on first two cards before drawing.
- Insurance: side bet when dealer shows Ace. Pays 2:1 if dealer has blackjack.

**Section 4 — Payouts**
- Blackjack: 3:2
- Win: 1:1
- Insurance: 2:1
- Push: bet returned
- Surrender: half bet returned

---

## 15. State Transitions Relevant to This Spec

This section maps game rules to the `GamePhase` state machine defined in `technical-architecture.md`. Every valid transition is listed.

| From | To | Trigger |
|---|---|---|
| `Idle` | `Betting` | Player performs an explicit action to begin betting (clicks a chip denomination or a "Place Bet" affordance); ChipTray becomes active |
| `Betting` | `Idle` | Player clears bet (ClearBet) |
| `Betting` | `Dealing` | Player presses Deal (MainBet >= MinBet, bankroll deducted) |
| `Dealing` | `SideBetResolution` | Initial deal complete, at least one side bet (TriLuxBet > 0 or LuckyLuckyBet > 0) was placed |
| `Dealing` | `InsurancePrompt` | Initial deal complete, no side bets placed (TriLuxBet == 0 and LuckyLuckyBet == 0), dealer up-card is Ace |
| `Dealing` | `PlayerTurn` | Initial deal complete, no side bets placed, dealer up-card is not Ace and not 10-value, no peek required |
| `Dealing` | `PlayerTurn` | Initial deal complete, no side bets placed, dealer up-card is 10-value card, peek confirmed no blackjack |
| `Dealing` | `Resolution` | Initial deal complete, no side bets placed, dealer has blackjack (10-value up-card, peek confirmed blackjack) |
| `SideBetResolution` | `InsurancePrompt` | Side bets resolved, dealer up-card is Ace |
| `SideBetResolution` | `PlayerTurn` | Side bets resolved, dealer up-card is not Ace (or 10-value peek confirmed no blackjack) [^peek-inline] |
| `SideBetResolution` | `Resolution` | Side bets resolved, dealer has blackjack confirmed (10-value up-card, peek confirmed blackjack) |
| `InsurancePrompt` | `PlayerTurn` | Insurance decision made, dealer does not have blackjack, player does not have blackjack |
| `InsurancePrompt` | `Resolution` | Insurance decision made, dealer does not have blackjack, player has blackjack (no player action possible — skip PlayerTurn) |
| `InsurancePrompt` | `Resolution` | Insurance decision made, dealer has blackjack |
| `PlayerTurn` | `PlayerTurn` | Player hits (card dealt, hand not bust, not 21) — active hand unchanged, card added |
| `PlayerTurn` | `PlayerTurn` | Player splits or doubles (active hand advanced or new hands created) |
| `PlayerTurn` | `DealerTurn` | All player hands resolved (stood, busted, surrendered, or doubled) |
| `DealerTurn` | `Resolution` | Dealer reaches 17+ or busts |
| `Resolution` | `Idle` | Resolution animation complete, new hand ready |
| `Resolution` | `PlayerBroke` | Resolution complete, bankroll == 0 or < MinBet |
| `PlayerBroke` | `Idle` | Player reloads at cashier (BankrollChanged signal received, bankroll >= MinBet) |

**Invalid transitions:** Any transition not in the table above is invalid. The state machine must reject invalid transitions with an error log and no state change.

**Side bet + dealer Ace ordering note:** When the dealer shows an Ace AND at least one side bet was placed, the sequence is `Dealing` → `SideBetResolution` → `InsurancePrompt`. Side bets pay or lose in `SideBetResolution` before insurance is offered. The dealer does not peek for blackjack during `SideBetResolution` — the peek occurs as part of the `InsurancePrompt` resolution, as it always does. This means side bets resolve before the dealer's hole card is known.

[^peek-inline]: When the dealer up-card is a 10-value card, the peek executes inline as part of `SideBetResolution` exit logic (not a separate phase or transition). The peek result routes to `PlayerTurn` (no blackjack) or `Resolution` (blackjack confirmed). No intermediate state exists between `SideBetResolution` and either destination.

---

## 16. Side Bets

### 16.0 Overview

Two optional side bets are available: TriLux and Lucky Lucky. Both use the player's first two cards plus the dealer's face-up card (upcard). Both resolve in the `SideBetResolution` phase, immediately after all four initial cards are dealt and before any player action or insurance prompt.

Side bets are independent of the main hand outcome. A player blackjack, dealer blackjack, or any other main-hand outcome does not affect side bet evaluation. Side bets are evaluated strictly on the three-card combination.

Progressive jackpots are not in scope for v1.

---

### 16.1 Side Bet Placement

Side bets are placed during the `Betting` phase alongside the main bet. The following rules govern placement:

**Eligibility:**
- A main bet (MainBet > 0) must be placed before any side bet can be added. Side bets cannot be placed without a main bet.
- Neither side bet is required. Both are optional.
- Both side bets may be placed on the same hand.

**Bet limits:**
- Minimum side bet: same as the table's minimum main bet (see Section 12 for tier values).
- Maximum side bet: same as the table's maximum main bet (see Section 12 for tier values).
- Each side bet is a single flat amount, not a chip stack. The player selects the amount from the same chip denominations available for the main bet.
- `TriLuxBet` and `LuckyLuckyBet` are each set to exactly the chosen denomination. They are not accumulating chip stacks — one placement sets the value.
- If the player clicks a chip denomination when a side bet is already placed, the existing value is replaced with the new denomination. The previous amount is returned to the bankroll and the new amount is deducted. This matches the single-placement model — there is no chip stack accumulation on side bets.

**Locking:**
- Side bets lock when the main bet locks (Deal button pressed, `DealInitiated` transition fires).
- Once locked, side bets cannot be changed.

**Clearing:**
- If the player presses Clear Bet during the `Betting` phase: `MainBet`, `TriLuxBet`, and `LuckyLuckyBet` are all cleared to 0 simultaneously. Side bets cannot remain if the main bet is cleared.
- Side bets are cleared to 0 at the start of each new hand (before the `Betting` phase begins).
- `GlobalState.ApplyBankrollDelta(-(TriLuxBet + LuckyLuckyBet))` is called at `DealInitiated` alongside the main bet deduction. Side bet amounts are deducted from the bankroll at the same moment the main bet is deducted, not earlier.

---

### 16.2 SideBetResolution Phase

**Entry condition:** `Dealing` phase completes AND (`TriLuxBet > 0` OR `LuckyLuckyBet > 0`).

**Card set used for evaluation:**
- Card A: player's first dealt card (PlayerHands[0].Cards[0])
- Card B: player's second dealt card (PlayerHands[0].Cards[1])
- Card C: dealer's face-up card (DealerHand.Cards[0], the upcard — not the hole card)

The hole card is not visible and is not used for side bet evaluation.

**Evaluation order:**
1. If `TriLuxBet > 0`: evaluate TriLux hand (see 16.3). Determine pay result. Apply bankroll delta.
2. If `LuckyLuckyBet > 0`: evaluate Lucky Lucky hand (see 16.4). Determine pay result. Apply bankroll delta.
3. Display result banners for each placed side bet (win or lose).
4. Phase transitions out of `SideBetResolution` per state transition rules.

**No player input occurs during `SideBetResolution`.** The phase is automatic. Results are shown briefly (duration: same as deal animation cadence), then the phase transitions. No button is enabled during this phase. Exception: if TriLux wins and `DealerTipEnabled == true`, the Lucky George tip prompt is shown and awaits player input (or auto-timeout). This is the only player input permitted during `SideBetResolution`. All other game controls (hit, stand, chip tray, etc.) remain locked for the duration of the phase.

**Dealer blackjack during SideBetResolution:** The dealer's hole card has not been checked during `SideBetResolution`. If the dealer up-card is a 10-value card, the peek for blackjack has not yet occurred. Side bets resolve using only the three visible cards. Dealer blackjack check occurs after `SideBetResolution` exits, exactly as it does when no side bets are placed.

**Peek timing by up-card type:**
- Up-card is a 10-value card and side bets were placed: `Dealing` → `SideBetResolution`. After side bet resolution, the state machine peeks. If blackjack: → `Resolution` (DealerBlackjack path). If no blackjack: → `PlayerTurn`.
- Up-card is an Ace and side bets were placed: `Dealing` → `SideBetResolution` → `InsurancePrompt`. Peek occurs as part of InsurancePrompt resolution.
- Up-card is neither Ace nor 10-value and side bets were placed: `Dealing` → `SideBetResolution` → `PlayerTurn`. No peek needed.

---

### 16.3 TriLux

**Purpose:** A three-card poker hand bet. The three cards (player card 1, player card 2, dealer upcard) are evaluated as a three-card poker hand. Winning hands pay according to the pay table below.

**Three-card hand ranking (highest to lowest):**

| Rank | Name | Definition |
|---|---|---|
| 1 (highest) | Straight flush (suited) | All three cards share the same suit AND form a consecutive sequence |
| 2 | Three of a kind (trips) | All three cards share the same rank |
| 3 | Straight | Three consecutive ranks, mixed suits (not all the same suit) |
| 4 (lowest) | Flush | All three cards share the same suit, not in consecutive sequence |

All other three-card combinations do not win. They lose.

**Rank precedence is strict:** Straight flush outranks three of a kind. Three of a kind outranks straight. Straight outranks flush. There is no tie within the winning categories.

**Pay table (Canterbury Park):**

| Hand | Payout |
|---|---|
| Straight flush (suited) | 40:1 |
| Three of a kind (trips) | 25:1 |
| Straight | 10:1 |
| Flush | 5:1 |
| All other | Lose (bet forfeited) |

**Payout mechanics:** When TriLux wins, `GlobalState.ApplyBankrollDelta(TriLuxBet + (TriLuxBet * multiplier))` is called, where `multiplier` is the pay table multiplier (40, 25, 10, or 5). Example: $25 bet on a straight flush → `ApplyBankrollDelta(25 + 25 * 40)` = `ApplyBankrollDelta(1025)`. When TriLux loses, no bankroll delta is called (bet was already deducted at DealInitiated).

**Hand evaluation rules:**

**Straights:** Three consecutive ranks. Ace may be high (A-2-3... no — see below) or low. Ace counts as 1 for low straights (A-2-3) and as the high card for high straights (Q-K-A). Ace may not wrap around (K-A-2 is not a straight). Valid straight sequences: A-2-3, 2-3-4, 3-4-5, 4-5-6, 5-6-7, 6-7-8, 7-8-9, 8-9-10, 9-10-J, 10-J-Q, J-Q-K, Q-K-A.

For straight evaluation, Ace (rank value 1 per Section 2.3) also serves as rank 14 to complete a Q-K-A sequence. Ace does not wrap — K-A-2 is not a valid straight. The only valid straight sequences involving Ace are A-2-3 (Ace as rank 1) and Q-K-A (Ace as rank 14).

**Flush:** All three cards share the same suit (clubs, diamonds, hearts, or spades). Rank is irrelevant for flush determination.

**Straight flush:** Satisfies both the straight condition and the flush condition simultaneously. Always evaluated as straight flush (rank 1), not as a separate straight or flush.

**Three of a kind:** All three cards have the same rank. Example: three Jacks, three 7s. Suits are irrelevant.

**Evaluation algorithm:**
1. Determine if the three cards form a straight flush (meet both straight and flush conditions). If yes: result = straight flush.
2. Else, determine if all three ranks are equal. If yes: result = three of a kind.
3. Else, determine if the three cards form a straight (consecutive sequence, any suits). If yes: result = straight.
4. Else, determine if all three cards share the same suit. If yes: result = flush.
5. Else: result = no win (lose).

**Bet limits:** Same as table tier min/max (see Section 12). Default tier: $25 min, $500 max.

**Independence from main hand:** TriLux evaluates independently. If the player has blackjack, TriLux still pays if the three-card combination qualifies. If the dealer has blackjack, TriLux still pays — the side bet resolved before dealer blackjack was confirmed (see 16.2).

**Edge case — three of a kind with suited cards:** Three cards of the same rank cannot also form a straight or flush (three identical ranks cannot be consecutive). Three of a kind with three same-suited cards (e.g., three 7-of-clubs — impossible with one deck but in a 6-deck shoe it is possible) is evaluated as three of a kind (rank 2), not as a flush (rank 4), because three of a kind outranks flush.

---

### 16.3.1 TriLux Dealer Tip (Lucky George)

When TriLux wins (any winning outcome), a "Tip Dealer" button is shown in the UI after the win result banner is displayed, before the phase transitions out of `SideBetResolution`.

**Tip amount:** 1 unit = the table's minimum chip denomination ($1 at Standard tier).

**Tip flow:**
1. TriLux win result displays.
2. "Tip Dealer" button appears alongside a dismiss affordance ("No Thanks" or equivalent close action).
3. Player has two options:
   - Press "Tip Dealer": the tip amount is recorded in `history.json` as a `DealerTip` event. `GlobalState.ApplyBankrollDelta(-1)` is called (tip deducted from bankroll). The button disappears. Phase transition proceeds.
   - Press dismiss or take no action: no tip recorded, no bankroll change. Phase transition proceeds.
4. The tip prompt auto-dismisses after 5 seconds if the player does not interact. The dismiss path is taken automatically and the hand continues. The 5-second timeout is a constant (`TipPromptTimeoutSeconds = 5`) defined in `GameConfig.cs`.

**v1 behavior:** The tip is display-only in the sense that it does not affect main-hand bankroll math. It is a real bankroll deduction of $1. The tip is optional. It is off by default — the feature is shown (button is present) but the player must actively press it to tip.

**Settings toggle:** A setting `DealerTipEnabled` (bool, default `true`) controls whether the tip button is shown at all. When `DealerTipEnabled == false`, the "Tip Dealer" button is not shown on TriLux wins. The phase transitions immediately after the win banner. This setting is accessible in the game settings panel.

**History record:** When a tip is given, `HandRecord.DealerTip` is set to the tip amount (1). When no tip is given or the feature is disabled, `HandRecord.DealerTip` is 0.

**Tip does not affect TriLux payout:** The TriLux win bankroll delta is applied before the tip prompt is shown. The tip is a separate subsequent deduction.

---

### 16.4 Lucky Lucky

**Purpose:** A combined-value bet. The three cards (player card 1, player card 2, dealer upcard) are summed. Specific totals and combinations pay according to the pay table below.

**Ace value for Lucky Lucky:** Ace counts as 11 for total calculation, consistent with blackjack hand value rules (see Section 3). If the total would exceed 21 with an Ace at 11, the Ace counts as 1. Apply the same hand-total algorithm from Section 3 to the three-card set.

**Pay table (Canterbury Park / standard):**

| Hand | Condition | Payout |
|---|---|---|
| Suited 7-7-7 | All three cards are 7s AND all share the same suit | 200:1 |
| Suited 6-7-8 | Cards are ranks 6, 7, and 8 (any order) AND all share the same suit | 100:1 |
| Unsuited 7-7-7 | All three cards are 7s AND not all the same suit | 30:1 |
| Unsuited 6-7-8 | Cards are ranks 6, 7, and 8 (any order) AND not all the same suit | 10:1 |
| Any 21 | Three-card total equals 21 AND is not a 6-7-8 or 7-7-7 combination | 3:1 |
| 20 | Three-card total equals 20 | 2:1 |
| 19 | Three-card total equals 19 | 1:1 |
| All other | Three-card total is 18 or less, or any combination not listed above | Lose |

**Pay table precedence rules:**
- 6-7-8 and 7-7-7 combinations always pay their specific rate. They never pay the generic "Any 21" rate even though their total is 21. The specific combination check runs before the generic 21 check.
- Suited rates take precedence over unsuited rates. If a 7-7-7 combination is suited, it pays 200:1, not 30:1.
- The evaluation algorithm checks in this exact order: suited 7-7-7 → suited 6-7-8 → unsuited 7-7-7 → unsuited 6-7-8 → any 21 → 20 → 19 → lose.

**Payout mechanics:** When Lucky Lucky wins, `GlobalState.ApplyBankrollDelta(LuckyLuckyBet + (LuckyLuckyBet * multiplier))` is called, where `multiplier` is the pay table multiplier. When Lucky Lucky loses, no bankroll delta is called (bet was already deducted at DealInitiated).

**Hand evaluation rules:**

**Suited:** All three cards share the same suit. Standard four suits: hearts, diamonds, clubs, spades. No wild suits. A "suited" result requires all three cards to be the same suit — two matching is not sufficient.

**7-7-7:** All three cards have rank 7 (numeric value 7). In a 6-deck shoe, three 7s are possible. Suit determines suited vs. unsuited.

**6-7-8:** The three cards, taken in any order, have ranks 6, 7, and 8 exactly. No substitutions. No Ace-substitution. The combination must be exactly one 6, one 7, and one 8.

**Total of 21:** Sum the three cards using the Section 3 hand total algorithm. If the result is 21 AND the three cards are not a 6-7-8 combination and are not a 7-7-7 combination, this pays 3:1.

**Total of 20 or 19:** Same algorithm. If total is exactly 20 or 19, pay 2:1 or 1:1 respectively.

**Evaluation algorithm:**
1. Determine rank set: extract ranks of the three cards.
2. Check if all three ranks are 7 (7-7-7 check): if yes, check if all three suits match. If suited: suited 7-7-7 (200:1). If not all same suit: unsuited 7-7-7 (30:1).
3. Check if the rank set is {6, 7, 8} (exactly one of each, any order): if yes, check if all three suits match. If suited: suited 6-7-8 (100:1). If not all same suit: unsuited 6-7-8 (10:1).
4. Compute three-card total using Section 3 algorithm. If total == 21: any 21 (3:1).
5. If total == 20: 20 (2:1).
6. If total == 19: 19 (1:1).
7. Else: lose.

**Bet limits:** Same as table tier min/max (see Section 12). Default tier: $25 min, $500 max.

**Independence from main hand:** Lucky Lucky evaluates independently of main hand outcome. Player blackjack, dealer blackjack, and all other main-hand results do not affect Lucky Lucky evaluation.

**Edge case — Ace in a 6-7-8:** An Ace cannot substitute for 6, 7, or 8 in the 6-7-8 combination check. The rank check looks at literal ranks. A hand with Ace-7-8 does not qualify as 6-7-8 regardless of the Ace's numeric value. However, an Ace-7-8 has a total of Ace(11)+7+8 = 26 → Ace reclassified to 1 → total = 16. This hand does not hit any pay line and loses.

**Edge case — Ace contributing to a 21 total:** Ace-10 (two cards) + any card = possible 21. Example: player Ace + player 6 + dealer 4 = 21 (Ace at 11). This qualifies for "Any 21" at 3:1. Example: player Ace + player King + dealer 5 = 26 → Ace reclassifies to 1 → total = 16. This loses.

---

### 16.5 Side Bet Resolution Sequence (Full)

The complete sequence for `SideBetResolution` phase:

1. **Phase enters.** All player action buttons are disabled. No player input is accepted.
2. **TriLux evaluation (if TriLuxBet > 0):**
   a. Identify the three cards: PlayerHands[0].Cards[0], PlayerHands[0].Cards[1], DealerHand.Cards[0].
   b. Run TriLux evaluation algorithm (16.3).
   c. If win: call `GlobalState.ApplyBankrollDelta(TriLuxBet + TriLuxBet * multiplier)`. Display TriLux win banner with pay amount.
   d. If lose: display TriLux lose banner. No bankroll delta.
   e. If win and `DealerTipEnabled == true`: show "Tip Dealer" button. Wait for player action or auto-timeout (see 16.3.1). Resolve tip. Lucky Lucky evaluation (step 3) does not begin until the tip prompt has resolved — either by player action or auto-timeout. Steps 2 and 3 are strictly sequential.
3. **Lucky Lucky evaluation (if LuckyLuckyBet > 0):**
   a. Same three cards as above.
   b. Run Lucky Lucky evaluation algorithm (16.4).
   c. If win: call `GlobalState.ApplyBankrollDelta(LuckyLuckyBet + LuckyLuckyBet * multiplier)`. Display Lucky Lucky win banner with pay amount.
   d. If lose: display Lucky Lucky lose banner. No bankroll delta.
4. **History record updated** with side bet outcomes (see 16.6).
5. **Phase transitions** per state transition rules (16.2 and Section 15).

**Order when both bets placed:** TriLux resolves first, then Lucky Lucky. Both win/lose outcomes are displayed before the phase transitions.

---

### 16.6 History Recording for Side Bets

`HandRecord` in `history.json` is extended with the following fields for side bet tracking:

- `TriLuxBet` (int): amount wagered. 0 if not placed.
- `TriLuxResult` (string): "StraightFlush", "ThreeOfAKind", "Straight", "Flush", "Lose", or "NotPlaced".
- `TriLuxPayout` (int): net payout received. 0 if lose or not placed.
- `LuckyLuckyBet` (int): amount wagered. 0 if not placed.
- `LuckyLuckyResult` (string): "Suited777", "Suited678", "Unsuited777", "Unsuited678", "Any21", "Twenty", "Nineteen", "Lose", or "NotPlaced".
- `LuckyLuckyPayout` (int): net payout received. 0 if lose or not placed.
- `DealerTip` (int): tip amount paid. 0 if no tip given or feature disabled.

---

### 16.7 Win/Loss Resolution — Side Bet Integration

Side bets resolve in `SideBetResolution`, before main hand resolution. The main hand resolution sequence in Section 11.2 is unchanged. Side bet bankroll deltas (step 2 and 3 of 16.5) are applied during `SideBetResolution`. At the `Resolution` phase (Section 11.2), no additional side bet bankroll changes occur — side bets are already settled.

**Full bankroll delta order for a hand with side bets:**

1. `DealInitiated`: `ApplyBankrollDelta(-(MainBet + TriLuxBet + LuckyLuckyBet))` — all bets deducted at once.
2. `SideBetResolution`: `ApplyBankrollDelta(TriLux win amount)` if TriLux wins.
3. `SideBetResolution`: `ApplyBankrollDelta(LuckyLucky win amount)` if Lucky Lucky wins.
4. Optional: `ApplyBankrollDelta(-1)` for dealer tip.
5. `InsurancePrompt` (if applicable): `ApplyBankrollDelta(-InsuranceBet)` when player accepts insurance (deducted at acceptance, unconditionally — see Section 6.6).
6. `PlayerTurn` (if applicable): `ApplyBankrollDelta(-MainBet)` if double down confirmed.
7. `PlayerTurn` (if applicable): `ApplyBankrollDelta(-MainBet)` per split performed.
8. `Resolution`: `ApplyBankrollDelta(main hand outcome)` per hand outcome (see 11.5).
9. `Resolution` (if applicable): insurance win applied if dealer has blackjack (see 6.6).

---

### 16.8 Rules Panel Additions

Add the following section to `RulesPanel` content (appended after Section 4 — Payouts from Section 14):

**Section 5 — TriLux Side Bet**
- Optional bet on the three-card poker value of your two cards plus the dealer's upcard.
- Pays: Straight flush 40:1 | Trips 25:1 | Straight 10:1 | Flush 5:1.
- Resolves immediately after the deal, before player action.
- Evaluated as a three-card poker hand. Ace plays high or low in straights.

**Section 6 — Lucky Lucky Side Bet**
- Optional bet on the combined total of your two cards plus the dealer's upcard.
- Pays: Suited 7-7-7 200:1 | Suited 6-7-8 100:1 | Unsuited 7-7-7 30:1 | Unsuited 6-7-8 10:1 | Any 21 (other) 3:1 | 20 pays 2:1 | 19 pays 1:1.
- Resolves immediately after the deal, before player action.

---

### 16.9 Sound Triggers (Side Bet Additions)

| Event | Sound |
|---|---|
| TriLux win | Side bet win sfx (distinct from main hand win chime) |
| TriLux lose | Side bet lose sfx |
| Lucky Lucky win | Side bet win sfx |
| Lucky Lucky lose | Side bet lose sfx |
| Dealer tip given | Chip clink sfx (universal) |

All sounds conditional on `GlobalState.SoundEnabled == true`.
