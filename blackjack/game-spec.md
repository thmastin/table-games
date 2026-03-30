# Blackjack Game Specification

**Version:** 1.0
**Date:** 2026-03-30
**Status:** Phase 6 deliverable — pending developer approval
**Phase:** 6

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
- `SideBet` on `BlackjackGameState` is set to the doubled amount.
- `GlobalState.ApplyBankrollDelta(-MainBet)` is called immediately when double down is confirmed.

**After doubling:**
- Deal one card to the hand. Evaluate total.
- If total > 21: hand busts. Bet is lost (both MainBet and SideBet).
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
- `SideBet`, `InsuranceBet` are unaffected by surrender (both are 0 at this point since you cannot have placed a side bet before acting, and insurance was already resolved).

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
| Player wins double down | 1:1 on MainBet + 1:1 on SideBet (doubled amount) |
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
    int SideBet,                        // doubled-down bet amount (0 until double down confirmed)
    int InsuranceBet,                   // insurance bet amount (0 until insurance taken; 0 again after resolution)
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
- `SideBet` is set when a double down is confirmed and cleared to 0 at the start of each new hand.
- `InsuranceBet` is set when the player accepts insurance and cleared to 0 after insurance resolves.
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

| Action | Idle | Betting | Dealing | InsurancePrompt | PlayerTurn | DealerTurn | Resolution | PlayerBroke |
|---|---|---|---|---|---|---|---|---|
| Deal | No | Yes (if bet >= MinBet) | No | No | No | No | No | No |
| Hit | No | No | No | No | See 8.2 | No | No | No |
| Stand | No | No | No | No | Yes (if hand not bust) | No | No | No |
| Double | No | No | No | No | See 8.3 | No | No | No |
| Split | No | No | No | No | See 8.4 | No | No | No |
| Surrender | No | No | No | No | See 8.5 | No | No | No |
| Insurance | No | No | No | See 8.6 | No | No | No | No |

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

- Player splits. Each split hand receives one card. Before player acts (or as player acts), dealer checks for blackjack. Wait — the peek rule fires before player action even begins (see 5.3).
- Correct sequence: the peek check always happens before `PlayerTurn`. If dealer has blackjack, the hand resolves immediately. Splits never occur before the peek. Splits occur during `PlayerTurn`, which only begins after a confirmed non-blackjack peek. Therefore: if dealer has blackjack, the player never reaches the split decision. Split-then-dealer-blackjack cannot occur in this flow.

### 9.7 Bust on a Doubled Hand

- Player doubles. The one card drawn busts the hand (total > 21).
- Both MainBet and SideBet (the doubled bet amount) are lost.
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

A player hand that busted during `PlayerTurn` has its outcome determined as Loss at the time of the bust. The bankroll is deducted at deal confirmation for MainBet — it is not deducted again at bust. The bust means the MainBet that was already locked is forfeited. For a doubled hand that busts, the SideBet was deducted when the double was confirmed. Both are already out of the bankroll. At resolution, no further bankroll delta is needed for busted hands. The bust outcome is recorded in `HandResult` for history logging.

### 11.5 Win Amount Calculation

| Hand Outcome | `GlobalState.ApplyBankrollDelta(X)` where X = |
|---|---|
| Blackjack win | `MainBet + floor(MainBet * 1.5)` |
| Standard win | `MainBet * 2` (original bet returned + equal winnings) |
| Double down win | `(MainBet + SideBet) * 2` (full combined bet returned + equal winnings) |
| Push | `MainBet` (original bet returned only) |
| Double down push | `MainBet + SideBet` (full combined bet returned, no winnings) |
| Loss | `0` (nothing returned — bet already removed from bankroll) |
| Double loss | `0` (MainBet and SideBet both forfeited) |
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
| `Dealing` | `InsurancePrompt` | Initial deal complete, dealer up-card is Ace |
| `Dealing` | `PlayerTurn` | Initial deal complete, dealer up-card is not Ace and not 10-value, no peek required |
| `Dealing` | `PlayerTurn` | Initial deal complete, dealer up-card is 10-value card, peek confirmed no blackjack |
| `Dealing` | `Resolution` | Initial deal complete, dealer has blackjack (10-value up-card, peek confirmed blackjack) |
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
