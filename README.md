# SKEL — Story Keyframe Extensible Layout

**v2.0** | An open storyboard data format

> A flat, relational YAML format for encoding visual narratives into machine-readable, validatable story data.

---

## What Is SKEL?

SKEL (Story Keyframe Extensible Layout) is an open format that represents screenplays, storyboards, and visual narratives as flat, relational data. The native authoring format is YAML (`.skel`); `.skel.json` is the JSON export/interchange form of the same data model. Instead of deeply nested trees, SKEL stores acts, scenes, and shots as top-level arrays linked by ID references — like a relational database for stories.

SKEL is the native story format of **SPORE**, the desktop storyboard studio, and is designed to be read and written by any tool.

Designed for:
- AI-driven image/video generation pipelines (Flux, Kling, Runway, WAN, etc.)
- Storyboard authoring tools
- Cross-tool interchange between screenplay editors and production software

---

## Spec

| File | Contents |
|---|---|
| [`spec/skel-spec.md`](./spec/skel-spec.md) | Formal specification |
| [`spec/bone-spec.md`](./spec/bone-spec.md) | BONE plugin system specification |
| [`spec/skel.schema.json`](./spec/skel.schema.json) | JSON Schema (Draft 7) for validating `.skel.json` files |
| [`spec/bone.schema.json`](./spec/bone.schema.json) | JSON Schema for validating `.bone.json` files |
| [`spec/skel-keyfile.json`](./spec/skel-keyfile.json) | Default token dictionary (9 categories, 48 tokens) |
| [`spec/example.skel.json`](./spec/example.skel.json) | Complete working example (JSON export form) — "The Last Signal" |
| [`spec/bones/`](./spec/bones/) | Starter BONE definitions: flux-dev, runway-gen3, kling-v1, seedance-2, character-reference-sheet, storyboard-grid-9 |
| [`spec/x-spore.schema.json`](./spec/x-spore.schema.json) | Schema for SPORE-owned `x-spore` extension data (proposals, frame images) |
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

## BONE Plugin System

BONE (Base Object Narrative Export) is the plugin layer that attaches AI generation config and pipeline data to SKEL entities. For the full BONE spec, starter definitions, and schema — see [BONE-Brandflowr](https://github.com/brandflowr/BONE-Brandflowr).

---

## License

MIT
