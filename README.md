# SKEL — Skeleton

**v2.0** | Visual Relational Action Data

> A flat, relational JSON format for encoding visual narratives into machine-readable, validatable story data.

---

## What Is SKEL?

SKEL is an open interchange format that represents screenplays, storyboards, and visual narratives as flat JSON. Instead of deeply nested trees, SKEL stores acts, scenes, and shots as top-level arrays linked by ID references — like a relational database for stories.

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
| [`spec/skel-keyfile.json`](./spec/skel-keyfile.json) | Default token dictionary (7 categories, 47 tokens) |
| [`spec/example.skel.json`](./spec/example.skel.json) | Complete working example — "The Last Signal" |
| [`spec/bones/`](./spec/bones/) | Starter BONE definitions: flux-dev, runway-gen3, kling-v1 |
| [`spec/TOKEN_REFERENCE.md`](./spec/TOKEN_REFERENCE.md) | All valid tokens, defaults, and constraints at a glance |
| [`spec/ARCHITECTURE.md`](./spec/ARCHITECTURE.md) | System architecture and data flows |
| [`spec/DECISIONS.md`](./spec/DECISIONS.md) | Architecture Decision Records |
| [`spec/CHANGELOG.md`](./spec/CHANGELOG.md) | Version history |

---

## BONE Plugin System

BONE (Base Object Narrative Export) is the plugin layer that attaches AI generation config and pipeline data to SKEL entities. For the full BONE spec, starter definitions, and schema — see [BONE-Brandflowr](https://github.com/brandflowr/BONE-Brandflowr).

---

## License

MIT
