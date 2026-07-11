# SKEL — Story Keyframe Extensible Layout

**v2.0** | An open storyboard data format

> A flat, relational YAML format for encoding visual narratives into machine-readable, validatable story data.

---
3.	
## What Is SKEL?

SKEL (Story Keyframe Extensible Layout) is an open format that represents screenplays, storyboards, and visual narratives as flat, relational data. The native authoring format is YAML (`.skel`); `.skel.json` is the JSON export/interchange form of the same data model. Instead of deeply nested trees, SKEL stores acts, scenes, and shots as top-level arrays linked by ID references — like a relational database for stories.

SKEL is the native story format of **Genlock Studio**, the desktop storyboard studio, and is designed to be read and written by any tool.

Designed for:
- AI-driven image/video generation pipelines (Flux, Kling, Runway, WAN, etc.)
- Storyboard authoring tools
- Cross-tool interchange between screenplay editors and production software

---

## Spec

| File | Contents |
|---|---|
| [`spec/skel-spec.md`](./spec/skel-spec.md) | Formal specification |
| [`spec/bone-spec.md`](./spec/bone-spec.md) | BONE data plugin system specification |
| [`spec/muscle-spec.md`](./spec/muscle-spec.md) | MUSCLE behavior plugin system specification |
| [`spec/skel.schema.json`](./spec/skel.schema.json) | JSON Schema (Draft 7) for validating `.skel.json` files |
| [`spec/bone.schema.json`](./spec/bone.schema.json) | JSON Schema for validating `.bone.json` files |
| [`spec/muscle.schema.json`](./spec/muscle.schema.json) | JSON Schema for validating `.muscle.json` manifests |
| [`spec/hook-payload.schema.json`](./spec/hook-payload.schema.json) | Hook invocation contract (envelope/result shapes for MUSCLE hooks) |
| [`spec/MUSCLE_AUTHORING.md`](./spec/MUSCLE_AUTHORING.md) | How to write a MUSCLE plugin, step by step |
| [`spec/muscles/`](./spec/muscles/) | Example MUSCLE manifests: studio-style-guard, fountain-adapter |
| [`reference/muscle-host/`](./reference/muscle-host/) | Runnable reference host — discovery, hook invocation, capability-checked patch application |
| [`spec/skel-keyfile.json`](./spec/skel-keyfile.json) | Default token dictionary (9 categories, 48 tokens) |
| [`spec/example.skel.json`](./spec/example.skel.json) | Complete working example (JSON export form) — "The Last Signal" |
| [`spec/bones/`](./spec/bones/) | Starter BONE definitions: flux-dev, runway-gen3, kling-v1, seedance-2, character-reference-sheet, storyboard-grid-9 |
| [`spec/x-genlock.schema.json`](./spec/x-genlock.schema.json) | Schema for Genlock-owned `x-genlock` extension data (proposals, frame images) |
| [`spec/audio-map.schema.json`](./spec/audio-map.schema.json) | Schema for the `audio-map.json` sidecar (shot → audio track assignments) |
| [`spec/video-map.schema.json`](./spec/video-map.schema.json) | Schema for the `video-map.json` sidecar (shot → video takes) |
| [`spec/canvas-layout.schema.json`](./spec/canvas-layout.schema.json) | Schema for the `canvas-layout.json` sidecar (canvas node positions) |
| [`spec/TOKEN_REFERENCE.md`](./spec/TOKEN_REFERENCE.md) | All valid tokens, defaults, and constraints at a glance |
| [`spec/LLM_INTEGRATION.md`](./spec/LLM_INTEGRATION.md) | How LLM agents read, edit, and validate SKEL projects |
| [`spec/ARCHITECTURE.md`](./spec/ARCHITECTURE.md) | System architecture and data flows |
| [`spec/DECISIONS.md`](./spec/DECISIONS.md) | Architecture Decision Records |
| [`spec/CHANGELOG.md`](./spec/CHANGELOG.md) | Version history |
| [`spec/OVERVIEW.md`](./spec/OVERVIEW.md) | Quick orientation |

---

## Plugin System

SKEL has a two-layer plugin system, following the skeleton metaphor:

- **BONE** (Base Object Narrative Export) — *data* plugins. A `.bone.json` file attaches AI generation config, prompt contracts, and pipeline data to SKEL entities. See [`spec/bone-spec.md`](./spec/bone-spec.md) and the starter definitions in [`spec/bones/`](./spec/bones/).
- **MUSCLE** (Modular User-Scripted Companion Logic Extension) — *behavior* plugins. A `.muscle.json` manifest subscribes to named lifecycle hooks (import, validation, prompt assembly, generation, render write-back, export) and returns JSON patches that the host validates and applies atomically. MUSCLEs never touch documents directly. See [`spec/muscle-spec.md`](./spec/muscle-spec.md).

`.skel` is the body layout, `.bone` files are what attaches to it, `.muscle` files are what makes it move.

Want to build a plugin? Start with [`spec/MUSCLE_AUTHORING.md`](./spec/MUSCLE_AUTHORING.md), copy an example from [`spec/muscles/`](./spec/muscles/), and test against the [reference host](./reference/muscle-host/):

```bash
cd reference/muscle-host/demo && node run-demo.mjs
```

---

## License

MIT — see [LICENSE](./LICENSE).

Copyright © 2025–2026 Brandflowr AI LLC.

SKEL™, BONE™, MUSCLE™, and SPORE™ are trademarks of Brandflowr AI LLC — see [TRADEMARKS.md](./TRADEMARKS.md).
