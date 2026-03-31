# Table Games

Browser-based casino table games suite built in Godot 4 / C#. Blackjack ships first.

## Prerequisites

- [Godot 4.x with .NET support](https://godotengine.org/download/) — the `.NET` variant of the engine (not the standard build)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

## Setup

1. Clone this repository.
2. Open Godot 4. From the Project Manager, click **Import** and navigate to the repo root. Select `project.godot`.
3. Godot will import the project and generate the `.godot/` directory. This is gitignored.
4. Press **Build** (or F5) to compile the C# assembly before running.

## Running Tests

Tests are in a standalone NUnit project under `tests/`. They test pure game logic only — no Godot runtime is required.

```
dotnet test tests/TableGames.Tests.csproj
```

Or from the solution root:

```
dotnet test TableGames.sln --filter "Project=TableGames.Tests"
```

## Folder Structure

| Folder | Contents |
|--------|----------|
| `shared/` | Autoloads, shared components, logic, services, config, theme — usable by any game |
| `games/blackjack/` | All Blackjack scenes, scripts, and pure-logic code |
| `games/uth/` | Ultimate Texas Hold'Em (not yet started) |
| `lobby/` | Game selection scene |
| `assets/` | Fonts, textures, card graphics, audio — no code |
| `tests/` | NUnit test project — references `shared/logic/` and `games/*/logic/` only |
| `export/` | Godot export output — gitignored |
| `docs/` | Design documents and workflow |

## Development Process

See [docs/workflow.md](docs/workflow.md) for the full phase-by-phase development workflow.
