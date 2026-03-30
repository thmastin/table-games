# Table Games — Claude Code Context

## Project Overview

Browser-based casino table games suite built to feel premium and intentional.

- **Goal:** Get the feel and UI right before expanding. One game at a time, done completely.
- **Visual reference:** Encore Casino Games Collection (Steam) — dark ambient palette, correct table geometry, no gamification noise. Modernize it, don't copy it.
- **Tech stack:** Godot 4, C#, 2D pipeline, NUnit testing, FileAccess persistence.

## Games Planned

| Order | Game | Status |
|-------|------|--------|
| 1 | Blackjack | Part 1 — template game |
| 2 | Ultimate Texas Hold'Em | Part 2 — extraction data point |
| — | Extraction Gate | After both games complete |
| 3 | Free Bet Blackjack | Part 3+ |
| 4 | Mississippi Stud | Part 3+ |
| 5 | Baccarat | Part 3+ |
| 6 | Pai Gow | Part 3+ |
| 7 | Three-Card Poker | Part 3+ |
| 8 | Let It Ride | Part 3+ |
| TBD | Craps, Roulette | Separate scoping when reached |

## How We Work

- All implementation work goes through specialized agents — never direct implementation
- Always use `isolation: "worktree"` on agents that write code
- Run independent agents in parallel
- Developer approves every gate before the next phase begins
- Gate approval requires explicit written "APPROVED" — silence is not approval
- Use Plan Mode before execution on any complex task
- After any correction during a phase, update CLAUDE.md before the gate opens

## Development Philosophy

- **Intentionally slow** — more phases, smaller deliverables, approval gates throughout
- **TDD** — in every logic phase, tests are written first against the game spec, then implementation is written to pass them. No implementation code before tests exist.
- **No phase skipping** — phase ordering is fixed
- **One game at a time** — no game 2 starts until game 1 passes all gates

## Workflow

Full phase-by-phase workflow: `docs/workflow.md`
Current phase and gate history: `docs/progress.md`

**Current status:** Phase 6 APPROVED — Blackjack game spec locked. Phase 7 not yet started.

## Slash Commands

All slash commands live in `.claude/commands/` and are checked into git.
Commands are added as repeated workflows are discovered.

| Command | Purpose |
|---------|---------|
| (none yet) | Added as built |

## Anti-Patterns — Do Not Do

- Do not implement anything without an approved plan
- Do not skip or merge phases to move faster
- Do not extract shared components before the Extraction Gate (after both Blackjack and UTH complete)
- Do not add gamification elements (XP bars, achievements, level-ups, badges)
- Do not hardcode visual values — all values sourced from `visual-language.md`
- Do not start a new game until the previous game has passed all gates
- Do not rubber-stamp gates — if a deliverable is incomplete, list what is missing
- Do not write implementation code before tests exist (TDD)

## Self-Improvement Loop

When a mistake is made or a correction is given:
1. Fix the issue
2. Add a rule to the Anti-Patterns section above (or update an existing rule)
3. The gate does not open until the CLAUDE.md update is confirmed by the developer

## Key Reference Files

| File | Purpose | Status |
|------|---------|--------|
| `docs/workflow.md` | Full phase-by-phase development workflow | Ready |
| `docs/progress.md` | Current phase, status, gate history | Ready |
| `tech-stack-decision.md` | Phase 0 output: locked tech stack | Ready |
| `risk-register.md` | Phase 0 output: identified risks and mitigations | Ready |
| `product-decisions.md` | Phase 1 output: locked product-level decisions | Ready |
| `ux-research.md` | Phase 2 output: do/don't design decisions | Ready |
| `visual-language.md` | Phase 3 output: single source of truth for all visual values | Ready |
| `component-boundaries.md` | Phase 4 output: shared vs. game-specific component rules | Ready |
| `technical-architecture.md` | Phase 5 output: state, data flow, persistence model | Ready |
| `blackjack/game-spec.md` | Phase 6 output: Blackjack rules, edge cases, side bets | Ready |
