# Tech Stack Decisions — Casino Table Games Suite

## Summary

| Category | Decision | Confidence |
|---|---|---|
| Engine | Godot 4.x | High |
| Language | C# (.NET 8) | High |
| Rendering | 2D with layered depth illusion | High |
| Testing | GdUnit4 (C# variant) | Medium |
| Persistence | JSON via FileAccess with versioned schema | High |
| Audio | Godot AudioStreamPlayer + AudioBus mixing | High |
| Asset Pipeline | SVG source → PNG atlases, custom importers | Medium |
| Distribution | Godot export templates, unsigned binaries | High |

---

## 1. Engine: Godot 4

**Decision:** Godot 4.x, tracking latest stable release.

**Rationale:** Godot 4 ships a production-quality 2D renderer capable of the animation fidelity this project requires — arc tweens, physics-influenced motion, particle effects — without the overhead of a full physics simulation engine. The node/scene composition model maps naturally onto the component library extraction planned after game 2: a card scene, a chip scene, a table layout scene become reusable nodes. The GDExtension API and the mature export pipeline cover Windows and Linux without additional tooling. For a solo developer on a long-term project, Godot's zero-cost licensing and active open-source community reduce long-term ecosystem risk compared to commercially licensed engines.

**Rejected alternatives:**

- **Unity (personal tier):** License instability post-2023 runtime fee crisis introduces existential risk for a long-term solo project. The pricing model is not stable enough to commit to.
- **Unreal Engine 5:** Designed for 3D AAA production. Blueprint/C++ toolchain overhead and binary asset formats are disproportionate for 2D card games. Compile times alone would destroy iteration speed.
- **Custom framework (SDL2/SFML + own engine):** Eliminates the animation tooling, scene editor, and audio bus system that save hundreds of hours. No justification for building what Godot already provides.
- **GameMaker:** Proprietary scripting language, inferior C# support, and animation primitives that cannot match Godot's Tween system for complex multi-property card arcs.
- **Pygame / web canvas:** Not desktop-native, no production animation or audio infrastructure, wrong tool category entirely.

---

## 2. Language: C#

**Decision:** C# (.NET 8) via Godot's official Mono/.NET integration.

**Rationale:** The two primary competing concerns are TDD support and long-term maintainability. C# wins both. State machines for eight games with shared transition logic benefit from strong static typing — the compiler catches invalid state transitions and malformed event types at build time rather than at runtime mid-animation. GDScript's optional typing is not enforced at compile time and produces runtime errors that are harder to isolate in logic-heavy code. For unit testing game logic (the TDD scope), C# integrates with NUnit and standard .NET test runners, enabling tests to run outside Godot's editor entirely — no editor launch required for the test suite. Long-term, C# refactoring tooling (Rider, VS Code with OmniSharp) is substantially more capable than anything available for GDScript, which matters on a multi-year project.

The trade-off acknowledged: C# adds a .NET runtime dependency, increases binary size, and creates occasional friction when Godot updates break the .NET binding. This is manageable. The alternative trade-off — untyped state machines and no standalone test runner — is not.

**Rejected alternatives:**

- **GDScript:** No compile-time type enforcement on optional types, weaker refactoring support, no standalone test runner outside the editor. Acceptable for prototypes, insufficient for eight games with shared logic and TDD.
- **GDScript + GdUnit4:** GdUnit4 does support GDScript with in-editor test execution, but tests cannot run headlessly without the full Godot editor process. CI becomes more complex without meaningful benefit over C# + NUnit.
- **C++ via GDExtension:** Maximally performant, but C++ build toolchain complexity and manual memory management are unjustifiable for a solo developer building card games. Zero performance requirement exists that GDScript or C# cannot satisfy.

---

## 3. Rendering: 2D Pipeline

**Decision:** Godot 4's 2D renderer with layered depth achieved through CanvasLayer, z-index, and perspective-simulating shaders where needed.

**Rationale:** Casino table games are viewed from a fixed camera angle — overhead or slight oblique. A 3D pipeline does not add interaction fidelity; it adds a coordinate system, lighting rig, camera rig, and 3D asset pipeline that all require maintenance without benefiting gameplay. The premium animation targets (card dealing arcs, chip tosses, card flips) are all achievable in 2D: arc trajectories are Tween path interpolations, chip stacks are composited sprites with z-index ordering, card flips are ScaleX tweens with mid-flip texture swaps. Where a 3D table felt effect is desired — cloth wrinkle normal maps, ambient occlusion on chip edges — a 2D shader achieves the visual without the pipeline complexity. The reference target (Encore Casino Games Collection modernized) is itself a 2D render aesthetic.

**Rejected alternatives:**

- **Godot 4 3D with orthographic camera:** All the cost of a 3D pipeline with an orthographic camera that flattens it — worst of both worlds for this visual style.
- **Godot 4 3D with perspective camera:** Requires 3D card meshes, a proper lighting setup, and camera angle tuning per game. Legitimate option if the visual target were photorealistic felt, but that is not the stated reference.
- **2D + 3D hybrid (SubViewport):** Adds engine complexity for negligible visual gain. Reject until a specific case demands it.

---

## 4. Testing: C# NUnit + GdUnit4 for Integration

**Decision:** Game logic tested with NUnit in standard .NET test projects (no Godot runtime). GdUnit4 used selectively for scene-level integration tests where node behavior must be validated.

**Rationale:** The TDD scope is explicitly game logic only — not UI or animation. C# NUnit test projects can import the game logic assemblies and test state machines, hand evaluation, payout calculation, and bankroll math without launching Godot at all. This keeps the test cycle fast (seconds, not editor-boot minutes) and makes CI straightforward. GdUnit4 fills the gap for anything that genuinely requires a running scene — for example, testing that a dealt card node lands in the correct position or that the bankroll UI reflects a state change. Separating these two concerns keeps pure logic tests isolated from the engine and prevents the test suite from becoming dependent on Godot's node lifecycle.

**Rejected alternatives:**

- **GdUnit4 only (GDScript):** Tests must run inside the Godot editor process. No standalone runner. Slower iteration on logic-heavy tests.
- **GdUnit4 only (C# variant):** GdUnit4 supports C#, but even with it, pure logic tests should not require a Godot context. Mixing them conflates unit and integration testing.
- **No testing framework, manual validation:** Inconsistent with the stated TDD scope. Game logic bugs in payout calculations or state transitions compound across eight games.

---

## 5. Persistence: JSON via FileAccess with Versioned Schema

**Decision:** Hand-written JSON serialization/deserialization using Godot's `FileAccess` API, stored in `user://` directory, with an explicit schema version field in every file.

**Rationale:** The persistence surface is narrow: bankroll balance, game history records, settings (volume, resolution, preferred stakes). This does not require a database or a plugin. `FileAccess` with JSON is readable, debuggable in any text editor, and portable across Windows and Linux without path abstraction beyond what Godot's `user://` already provides. The schema version field is non-optional — across an eight-game multi-year project, save file migration will be needed. A versioned schema with a migration function per version increment costs thirty lines of code and prevents the alternative: corrupted save states on update.

**Rejected alternatives:**

- **Godot ConfigFile (.ini format):** Good for flat key-value settings, inadequate for structured game history records with nested data. Two separate persistence systems would be needed.
- **SQLite via GDExtension plugin:** Correct choice if game history queries required aggregation or search. Overkill for records that will be read sequentially and displayed in a recent-history list.
- **Binary serialization:** Not human-readable, harder to debug, schema migration requires more infrastructure. No performance case for binary at this data volume.
- **Cloud sync / external service:** Out of scope for a desktop-only solo project.

---

## 6. Audio: Godot AudioBus Mixing

**Decision:** Godot's built-in audio system with a defined bus layout: Master > Music, Master > SFX > Chips, Master > SFX > Cards, Master > SFX > UI. AudioStreamPlayer nodes on relevant scenes; ambient table audio on a dedicated looping player.

**Rationale:** Godot 4's audio bus system supports per-bus volume control, effects (reverb, EQ), and independent muting — exactly what a settings screen needs to expose Music Volume, SFX Volume, and Master Volume as separate controls. The bus hierarchy above allows chip clink sounds and card slide sounds to be balanced independently without code, using the Godot editor's audio bus panel. Positional audio (AudioStreamPlayer2D) handles chip toss sounds that should track the moving chip sprite. Ambient casino background noise runs as a looping stream on the Music bus. This requires zero external plugins and is fully functional on both target platforms.

**Rejected alternatives:**

- **FMOD:** Industry-standard adaptive audio, but requires a plugin, a separate license management step, and C# integration overhead. The audio complexity of casino table games does not approach what FMOD is designed for.
- **External audio middleware:** Same objection as FMOD. Adds a dependency that outlasts its justification.
- **Flat single-bus approach:** Acceptable for a prototype, unacceptable for a suite where music and SFX need independent user control.

---

## 7. Asset Pipeline: SVG Source to PNG Atlases

**Decision:** Card faces and UI elements authored or sourced as SVG, rasterized to PNG sprite sheets at target resolution (2x for standard, 4x for HiDPI). Felt textures and chip graphics as PNG. All assets imported through Godot's built-in importer with explicit `.import` files committed to version control.

**Rationale:** SVG source files for cards and UI elements preserve editability — card suits and values can be recolored or restyled without re-sourcing assets. Rasterizing to PNG atlases at build time gives Godot a single texture draw call per atlas rather than per card, which matters when 52+ card sprites are on screen during a full deal. Felt textures are photographic-reference PNGs with normal map variants for the 2D shader depth effect. Committing `.import` files to version control prevents Godot from re-importing with different settings on a clean checkout — a common source of subtle rendering differences in solo projects where no one else will notice the regression until it compounds.

**Rejected alternatives:**

- **Direct SVG import in Godot:** Godot 4 supports SVG import, but rasterizes at import time without atlas packing. Loses the draw-call batching benefit.
- **Pre-packed texture atlases (external tooling like TexturePacker):** Adds an external tool dependency. Godot's built-in atlas support is sufficient for this asset volume.
- **3D card mesh assets:** Rejected alongside the 3D pipeline decision. Card flips in 2D require no mesh.

---

## 8. Distribution: Godot Export Templates, Unsigned Binaries

**Decision:** Godot 4 export templates for Windows (x86_64) and Linux (x86_64). No code signing for initial releases. Single-folder distribution (binary + PCK in one directory), packaged as a zip archive. No installer.

**Rationale:** For a solo developer distributing a personal project, code signing certificates introduce cost and renewal overhead without a clear payoff until distribution reaches a public-facing scale that requires it. Windows SmartScreen warnings are the known consequence — documented for users. Linux has no equivalent barrier. Godot's export system handles the Windows and Linux targets from a single project with no additional tooling. Single-folder distribution with no installer is the simplest possible delivery format: unzip, run. PCK embedding (single executable) is deferred — it reduces portability of the PCK for debugging and offers no user-facing benefit at this scale.

**Rejected alternatives:**

- **Steam distribution:** Premature for a project building game 1 of 8. Add this decision when the suite is feature-complete.
- **Installer (Inno Setup / NSIS):** Adds toolchain complexity with no user benefit over a zip archive for a desktop game without system-level dependencies.
- **Web export (HTML5):** Desktop-only is a stated constraint. Web export would require rethinking the persistence layer and is out of scope.
- **macOS target:** Not a stated platform. Apple notarization requirements make unsigned distribution impossible on macOS. Defer until there is explicit demand.
