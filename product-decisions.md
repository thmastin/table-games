# Product Decisions

**Last Updated:** 2026-03-29
**Status:** PENDING APPROVAL

---

## Q1 — Player Goes Broke

**Decision:** Player goes bust and cannot continue at the current table. They are navigated to the cashier screen to reload.

**Loan Mechanic:**
- Loans are available at the cashier screen
- Flat fee charged on repayment (not upfront)
- Multiple loans allowed simultaneously
- Hard debt ceiling: total outstanding debt cannot exceed a defined cap

**Tapped Out State:**
- If player is at the debt ceiling with no chips remaining, an explicit "tapped out" state is shown
- Player can initiate a new session from this state
- New session wipes all debt and resets bankroll to the default starting amount

**Notes:** Post-MVP pass on bankroll management for "fun" factor tuning.

---

## Q2 — Bankroll

**Decision:** Single shared bankroll across all games.

---

## Q3 — Starting Bankroll

**Decision:** $1,000 default, player-adjustable.

**Notes:** Player can adjust the starting amount on first launch only, or after initiating a new session reset. Not adjustable mid-session.

---

## Q4 — Table Tiers

**Decision:** Table limits are defined per game. Realistic limits are researched and confirmed when each game is built.

**Reference Tiers (to be confirmed per game):**
| Tier | Min Bet | Max Bet |
|------|---------|---------|
| Low Limit | $5 | $100 |
| Standard | $25 | $500 |
| High Limit | $100 | $1,000 |

---

## Q5 — Settings Panel

**Decision:** Settings panel is in scope.

**Confirmed settings:**
- Sound toggle
- Reduced-motion / animation toggle

**Notes:** Resolution setting is a likely future addition (post-MVP). Standing rule: any future product decision that is user-configurable gets flagged for settings panel consideration at decision time.

---

## Q6 — Sound

**Decision:** Sound is in scope.

**Universal triggers (all games):**
- Chip placement
- Win
- Loss
- Loan taken
- Loan repaid

**Per-game triggers:** Defined when each game is built (e.g., card deal, card flip, wheel spin).

**Notes:** Post-MVP additions: ambient casino loop, dealer voice lines.

---

## Q7 — Onboarding

**Decision:** Rules and payout reference panel is in scope.
- Accessible from every table
- Static content
- Dismissible overlay

**Notes:** Interactive tutorials are post-MVP.

---

## Q8 — Platform

**Decision:** Windows and Linux desktop.

**Display Modes:**
- Windowed (default)
- Borderless windowed (fullscreen without OS chrome — designed for multi-monitor use)
- True fullscreen
- App remembers last display state between sessions

**Minimum Hardware Spec (binding constraint — developer's Linux machine):**
| Component | Spec |
|-----------|------|
| CPU | Intel Core i7-6700 (2015, 4-core/8-thread @ 3.4GHz) |
| RAM | 16GB |
| GPU | Intel HD Graphics 530 (integrated, 2015) |
| OS | Linux (Arch, kernel 6.18) |

**Notes:** The integrated GPU is the binding constraint. Keep shader complexity in check. Do not rely on GPU features unavailable on Intel HD 530.

---

## Post-MVP Backlog

The following items are explicitly out of scope for the initial build. Noted here for future reference.

- Bankroll management "fun" pass — tuning the loan/bust flow for engagement
- Ambient casino loop — background audio
- Dealer voice lines
- Interactive tutorials — guided in-game onboarding
- Resolution setting in settings panel
