# Risk Register — Casino Table Games Suite

Last updated: 2026-03-29

Scope: Technical risks associated with the chosen stack. Business and schedule risks are out of scope here.

---

## Godot 4 Engine

### Godot 4 API instability between minor versions
**Severity:** Medium
**Probability:** Medium — Godot 4 broke APIs repeatedly between 4.0 and 4.3.
**Specific risk:** A Godot minor version update silently changes Tween behavior, AudioBus structure, or import settings, breaking animations or audio on an existing game while building game 3 or 4.
**Mitigation:** Pin to a specific Godot minor version per game and document the version in CLAUDE.md. Upgrade deliberately, not automatically. Read the full changelog before upgrading. Keep the previous Godot binary alongside the new one during transition periods.

### Godot .NET runtime binding breaks on engine update
**Severity:** High
**Probability:** Low — the C# integration has stabilized significantly in 4.2+, but binding regeneration issues have burned developers on minor updates.
**Specific risk:** After a Godot update, C# scripts fail to compile or produce incorrect behavior due to a regenerated binding mismatch. This is most likely during the first 2-4 weeks after a minor release.
**Mitigation:** Never update Godot on the day of release. Wait a minimum of two weeks and check the Godot GitHub issues for binding-related regressions before updating. Keep the previous working Godot binary. Maintain a `godot-version.txt` in the repo root.

### Godot project abandoned or development velocity drops sharply
**Severity:** Low
**Probability:** Low — Godot 4 has a large active contributor base and W4 Games providing commercial backing as of 2025.
**Specific risk:** The project stagnates, leaving a multi-year investment on a slowly bitrotting engine.
**Mitigation:** This risk is low enough to accept. If it materializes 3+ years from now, the C# codebase and JSON assets are portable. The hardest-to-migrate pieces are scene files and shader code — document their structure clearly so migration tooling could be written if needed.

---

## C# (.NET 8)

### .NET runtime version drift
**Severity:** Medium
**Probability:** Medium — .NET releases new LTS versions every two years. Godot's .NET integration lags the latest .NET release.
**Specific risk:** .NET 8 reaches end of support in November 2026. Godot's integration may not support .NET 10 (next LTS) at the time .NET 8 becomes unsupported, creating a gap where the target runtime is EOL.
**Mitigation:** Track Godot's .NET support announcements. Plan a .NET upgrade alongside the next Godot major version bump. The game logic test suite running on standard .NET will flag incompatibilities before the Godot runtime does.

### C# binary size and startup time on Windows
**Severity:** Low
**Probability:** High — the .NET runtime adds 50-100MB to the export and adds ~200-500ms to cold startup.
**Specific risk:** Players notice a slower startup compared to a GDScript-only build.
**Mitigation:** This is a known and accepted trade-off. Document it in release notes if necessary. The startup time is a one-time cost per session for a game that will be played in multi-hour sessions. If it becomes a user complaint, profile whether AOT compilation via .NET NativeAOT + Godot's toolchain would help — but this is not a current action item.

### Test project / Godot project assembly reference friction
**Severity:** Medium
**Probability:** Medium — the NUnit test project must reference game logic assemblies without pulling in the full Godot runtime.
**Specific risk:** State machine and game logic code gets tangled with Godot node types, making it impossible to run tests outside the engine. This is an architectural risk, not a tooling risk.
**Mitigation:** From the start, enforce a strict layer separation: game logic lives in plain C# classes with no Godot dependencies (no Node, no Resource, no Vector2). Godot node scripts are thin wrappers that delegate to these classes. The NUnit test project references only the logic layer. This must be a code review rule enforced from game 1.

---

## 2D Rendering Pipeline

### Card flip animation looks cheap compared to 3D reference
**Severity:** Medium
**Probability:** Medium — a naive ScaleX flip reads immediately as "fake 3D" and is a known criticism of 2D card games.
**Specific risk:** The visual quality target (Encore Casino Games Collection modernized) implies a polished card flip. A simplistic 2D flip may fall short and require a mid-project pivot toward a SubViewport 3D approach.
**Mitigation:** Implement the card flip in game 1 as a prototype deliverable, not an afterthought. Use a ScaleX tween with a custom curve (ease-in/ease-out that mimics physical rotation inertia) plus a slight vertical arc offset to sell the illusion. If the result is unacceptable, the cost of adding a SubViewport 3D card is isolated to the card scene — it does not affect the 2D pipeline decision globally.

### Shader-based depth effects are fragile across hardware
**Severity:** Low
**Probability:** Low — standard 2D normal map shaders run on all Vulkan/OpenGL hardware Godot 4 supports.
**Specific risk:** A felt texture normal map or ambient occlusion effect renders incorrectly on certain GPU/driver combinations, particularly older Intel integrated graphics on Linux.
**Mitigation:** Test exports on a secondary machine with integrated graphics before shipping each game. Keep shaders simple — normal map felt texture and a basic ambient shadow on chips. Avoid custom GLSL that deviates from Godot's shader language abstractions.

---

## Testing (NUnit + GdUnit4)

### Test suite coverage creates false confidence
**Severity:** Medium
**Probability:** Medium — the TDD scope is game logic only. Animation, UI state, and audio behavior are untested by design.
**Specific risk:** A refactor of the state machine passes all unit tests but breaks the visual flow of the game because the test suite has no knowledge of animation sequencing. The state machine transitions correctly; the cards never visually resolve because an event wasn't wired.
**Mitigation:** Accept this risk explicitly. The scope boundary (logic only) is correct — testing animations is not feasible or valuable in unit tests. Mitigate with a per-game integration checklist: a manual playthrough script covering every visible state transition before shipping. This is not a test automation gap to fill; it is the right division of labor.

### GdUnit4 version lags Godot version
**Severity:** Low
**Probability:** Medium — GdUnit4 is an actively maintained plugin, but it has lagged new Godot versions by 2-6 weeks on past releases.
**Specific risk:** After a Godot update, GdUnit4 is incompatible and scene-level integration tests cannot run until the plugin updates.
**Mitigation:** Pure logic tests via NUnit are unaffected by this. GdUnit4 is used only for scene-level integration tests, which are a smaller portion of the suite. Accept the 2-6 week lag as acceptable for that test tier. Pin GdUnit4 version alongside the Godot version pin.

---

## Persistence (JSON via FileAccess)

### Save file corruption on interrupted write
**Severity:** High
**Probability:** Low — a crash or power loss mid-write can produce a partial JSON file that fails to parse on next launch.
**Specific risk:** A player's bankroll and game history are unrecoverable after a crash. For a game involving simulated money, this breaks trust in the application even though no real money is involved.
**Mitigation:** Never write directly to the live save file. Write to a temp file (`.tmp` suffix), verify it parses successfully, then rename/replace the live file atomically. Godot's `FileAccess` supports this pattern. Implement this from the first save operation — retrofitting it across eight games is more expensive than doing it once correctly.

### Schema migration bugs corrupt saves on upgrade
**Severity:** Medium
**Probability:** Medium — schema migrations are boring code that is easy to get wrong, and this project will need them.
**Specific risk:** A migration function for version 2 → 3 has an off-by-one or type coercion bug that silently corrupts bankroll history. The player sees a wrong balance.
**Mitigation:** Write tests for every migration function as part of the NUnit suite. Migration functions are pure functions (old schema object → new schema object) with no side effects, making them ideal unit test targets. Keep old migration functions in the codebase permanently — do not delete them once applied. Treat them as append-only history.

### Save location varies unexpectedly on Linux
**Severity:** Low
**Probability:** Low — Godot's `user://` resolves to `~/.local/share/[game-name]/` on Linux by default.
**Specific risk:** If the application name changes between game versions, `user://` resolves to a different directory and the existing save file is not found.
**Mitigation:** Set the application name once in Project Settings and treat it as immutable. Document the expected `user://` path for both platforms in CLAUDE.md. Do not rename the project.

---

## Audio

### Audio latency on Linux (ALSA/PulseAudio/PipeWire variation)
**Severity:** Medium
**Probability:** Medium — Linux audio stack fragmentation is a documented Godot pain point. Chip clink sounds triggered on interaction must feel responsive.
**Specific risk:** On some Linux configurations (particularly systems still running PulseAudio rather than PipeWire), interactive SFX have perceptible latency that breaks the feel of chip tosses and card deals.
**Mitigation:** Test audio on a Linux target system early — not at the end of game 1. Godot 4 uses PulseAudio, ALSA, and PipeWire backends depending on configuration. If latency is unacceptable, pre-buffer short SFX samples with AudioStreamPlayer's `stream_paused` trick. Document the tested audio backend in release notes.

### Audio file licensing for ambient casino sounds
**Severity:** Medium
**Probability:** High — if ambient casino sounds are sourced externally, licensing must be verified.
**Specific risk:** A sound asset sourced from a free library has a license that prohibits distribution or commercial use — even in a non-commercial personal project distributed publicly.
**Mitigation:** Source all audio from licenses with explicit distribution permission (CC0, CC-BY with attribution, or self-recorded). Keep a `AUDIO_CREDITS.txt` file from day one. Do not add a sound asset without logging its source and license.

---

## Asset Pipeline

### Card face SVG sourcing
**Severity:** Medium
**Status:** RESOLVED
**Decision:** Adrian Kennard's SVG card deck (www.me.uk/cards/) — CC0 license, public domain, no attribution required. Classic upscale casino aesthetic, vector SVG scales to any resolution.
**Card back:** Custom card back deferred to polish phase. Not load-bearing for any game logic or component decision — single swappable asset.
**Action:** Download and commit the deck to `assets/cards/` before game 1 scaffold phase.

### Texture atlas regeneration on asset update
**Severity:** Low
**Probability:** Low — if a card face is updated after atlases are packed, the atlas must be regenerated and the new import committed.
**Specific risk:** An outdated atlas with the old card face ships because the regeneration step was skipped.
**Mitigation:** Document atlas regeneration as a required step in a `BUILD.md` checklist. Since this is a solo project with no CI pipeline, the checklist is a manual safeguard. Consider a simple shell script that regenerates atlases and reports if the output differs from committed files.

---

## Distribution

### Windows SmartScreen blocks unsigned binary
**Severity:** Medium
**Probability:** High — SmartScreen will flag unsigned executables from unknown publishers. This is not a "risk"; it is a certainty.
**Specific risk:** Players (if any) see a red SmartScreen warning that the executable "might harm your computer" and cannot easily bypass it without right-clicking and selecting "Run anyway." This damages first impressions.
**Mitigation:** Document the bypass procedure clearly in the README. Accept this risk for personal/private distribution. If the project reaches public distribution at meaningful scale, budget for a code signing certificate (~$100-300/year for an OV certificate from a CA that SmartScreen trusts within a reasonable reputation-building period).

### Export PCK path assumptions break on some Linux distributions
**Severity:** Low
**Probability:** Low — Godot exports with the PCK alongside the binary, and the binary locates it by relative path. Some restrictive Linux setups with noexec flags on certain paths can interfere.
**Mitigation:** Test the export on a clean Linux install before considering a game shippable. Document the expected directory structure in the README.
