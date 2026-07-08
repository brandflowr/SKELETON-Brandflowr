# SKEL - Story Keyframe Extensible Layout

> A flat, relational YAML format for encoding visual narratives into machine-readable, validatable story data.

---

## What Is SKEL?

SKEL is SPORE's native story format. A project stores its authoring document as `story.skel`, a UTF-8 YAML file. Instead of deeply nested trees, SKEL stores Acts, Scenes, and Shots as top-level arrays linked by ID references - like a relational database for stories. `.skel.json` is the explicit export/interchange form of the same data model.

It was designed for:
- AI-driven image/video generation pipelines (Runway, Kling, Sora, etc.)
- Storyboard authoring tools (Spore)
- Cross-tool interchange between screenplay editors and production software

---

## Why It Matters

| Problem | SKEL Solution |
|---|---|
| Screenplay formats (Fountain, FDX) have no visual metadata | SKEL encodes camera, lighting, lens, and movement per shot |
| Nested story trees are fragile and hard to query | Flat relational structure — query any shot by ID |
| No standard for AI prompt pipelines | `action` + `prompt` + `v_setup` fields map directly to generation APIs |
| Formats break when tools add custom data | `extensions` object with `x-` namespacing keeps the core spec clean |
| No validation for story structure | JSON Schema + referential integrity checks catch errors before they hit production |

---

## Terminology: SKEL vs Spore

SKEL uses the term **Acts** for the top-level story grouping. Spore Studio surfaces this as **Chapters** in its UI. These are the same entity — `act_id` in SKEL maps to the chapter container in Spore. When the spec says "act", Spore shows "chapter".

---

## File Inventory

### Specification (`/spec`)

| File | Purpose |
|---|---|
| [`skel-spec.md`](./skel-spec.md) | SKEL formal specification. Structure, constraints, key file, extensibility, interchange, versioning. |
| [`bone-spec.md`](./bone-spec.md) | BONE formal specification. Plugin system for AI generation and attachable config. |
| [`muscle-spec.md`](./muscle-spec.md) | MUSCLE formal specification. Behavior plugin system: lifecycle hooks, patch-based mutation, capabilities, execution routes. |
| [`muscle.schema.json`](./muscle.schema.json) | MUSCLE JSON Schema. Validates `.muscle.json` manifest files. |
| [`hook-payload.schema.json`](./hook-payload.schema.json) | Hook invocation contract. Envelope (host → MUSCLE) and result (MUSCLE → host) shapes, per-hook subjects. |
| [`MUSCLE_AUTHORING.md`](./MUSCLE_AUTHORING.md) | Practical guide: how to write, test, and ship a MUSCLE plugin. |
| [`muscles/`](./muscles/) | Example MUSCLE manifests: `studio-style-guard` (prompt transform), `fountain-adapter` (round-trip format adapter per ADR-016). |
| [`skel.schema.json`](./skel.schema.json) | SKEL JSON Schema (Draft 7). Validates the parsed `.skel` data model and `.skel.json` exports. Includes `bone_registry` and `bones` on all entities. |
| [`bone.schema.json`](./bone.schema.json) | BONE JSON Schema. Validates `.bone.json` definition files. |
| [`skel-keyfile.json`](./skel-keyfile.json) | Default token dictionary. Maps shorthand tokens to full production definitions. |
| [`example.skel.json`](./example.skel.json) | Complete export/interchange example. "The Last Signal" - 2 acts, 3 scenes, 9 shots with BONE data. |
| [`bones/`](./bones/) | Starter BONE definitions: `flux-dev`, `runway-gen3`, `kling-v1`. |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | System architecture map. Data flow, module responsibilities, integration points. |
| [`LLM_INTEGRATION.md`](./LLM_INTEGRATION.md) | How LLMs read, write, and act on SKEL/BONE. The full generation loop: prompt → generator → storage → write-back. MCP tool map. |
| [`DECISIONS.md`](./DECISIONS.md) | Architecture Decision Records. Why we made the choices we made. |
| [`CHANGELOG.md`](./CHANGELOG.md) | Version history. |

### Implementation (`/app/utils/SKEL`)

| File | Purpose |
|---|---|
| [`types.ts`](../app/utils/SKEL/types.ts) | TypeScript interfaces matching the JSON Schema. `SKELDocument`, `SKELScene`, `SKELShot`, `SKELVSetup`, etc. |
| [`validator.ts`](../app/utils/SKEL/validator.ts) | Schema validation (AJV) + referential integrity checks + duplicate ID detection. |
| [`keyfile.ts`](../app/utils/SKEL/keyfile.ts) | `SKELKeyResolver` class. Expands shorthand tokens to full definitions with spec-compliant fallback defaults. |
| [`converter.ts`](../app/utils/SKEL/converter.ts) | Bidirectional conversion: `masterStoryToSKEL()`, `storyToSKEL()`, `SKELToStory()`. |
| [`bone.ts`](../app/utils/SKEL/bone.ts) | `BoneResolver` class. Loads definitions, resolves inheritance chain, validates BONE data. |

### Spore-Specific Extension Data (stored in `x-spore` namespace)

These files live in each Spore project folder and carry data that extends SKEL but is not part of the core spec. They are stored alongside `story.skel` (the native SKEL document). `story.json` is legacy/migration input only.

| File | Purpose |
|---|---|
| `audio-map.json` | Maps shot IDs → assigned audio tracks (dialogue, SFX, music). One entry per shot. |
| `video-map.json` | Maps shot IDs → numbered video takes (V1–V4) with an active take flag. Supports multi-take per shot. |

Additional SPORE extension contracts:

| Extension | Purpose |
|---|---|
| `extensions.x-spore.proposals` | Optional proposal history on SKEL entities. Stores pending/accepted/rejected AI or user suggestions without changing core SKEL fields. |
| `x-spore.schema.json` | Supplementary schema for SPORE-owned extension data, including proposal objects. The core SKEL schema remains vendor-neutral. |

### Dependencies

| Package | Version | Purpose |
|---|---|---|
| `ajv` | `^8.18.0` | JSON Schema validation engine |

---

## Quick Start

### Validate a SKEL document
```ts
import { validateSKEL } from '~/utils/SKEL/validator'

const result = validateSKEL(myDocument)
if (!result.valid) {
  console.error(result.errors)
}
```

### Resolve BONE data for a shot (with inheritance)
```ts
import { BoneResolver } from '~/utils/SKEL/bone'

const resolver = new BoneResolver(SKELDoc.bone_registry)
const result = resolver.resolveForShot('flux-dev', SKELDoc, shot)
// result.data → { text: "...", negative: "blurry...", guidance: 9, seed: 42 }
// result.source → ['defaults', 'metadata', 'scene', 'shot']
```

### Resolve tokens from a shot
```ts
import { SKELKeyResolver } from '~/utils/SKEL/keyfile'

const resolver = new SKELKeyResolver()
const resolved = resolver.resolveSetup(shot.v_setup)
// resolved.size → { token: "cu", label: "Close-Up", description: "Subject's face fills the frame." }
```

### Export a Spore project to SKEL JSON
```ts
import { masterStoryToSKEL } from '~/utils/SKEL/converter'

const SKELDoc = masterStoryToSKEL(masterStory)
```

### Import a SKEL file into Spore
```ts
import { SKELToStory } from '~/utils/SKEL/converter'

const story = SKELToStory(SKELDoc, projectId)
```

### Parse a Fountain screenplay to SKEL
```ts
import { fountainToSkel } from '~/utils/fountainToSkel'

const SKELDoc = fountainToSkel(fountainSource)
// Produces: acts[], scenes[], shots[] with action, dialogue, and character_refs
```

---

## Core Concepts

### Flat Relational Structure
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   Acts   │────▶│  Scenes  │────▶│  Shots   │
│(Chapters)│     │          │     │          │
│ scene_   │     │ act_id   │     │ scene_id │
│ refs[]   │     │ shot_    │     │ v_setup  │
│          │     │ refs[]   │     │ action   │
└──────────┘     └──────────┘     └──────────┘
     IDs link everything. No nesting.
     Spore shows Acts as "Chapters" in the UI.
```

### Token System
Shots use shorthand tokens (`cu`, `noir`, `dolly`) that the Key File expands to full definitions. This keeps `.skel` files small while preserving rich metadata for rendering engines.

### Extensions
Any entity can carry vendor-specific data via `extensions` with `x-` namespaced keys:
```json
{ "extensions": { "x-spore": { "production_status": "approved", "startFrameImage": "..." } } }
```

SPORE proposal history lives under `extensions.x-spore.proposals`. Proposal objects have stable IDs, a `type`, a `status` (`pending`, `accepted`, `rejected`, or `superseded`), and a short `summary`. See `SKEL/spec/x-spore.schema.json` for the supplementary schema.

### Production Status (split image / video)
Shots carry a `status` object with separate image and video production states:
- **Image**: `pending` | `generating` | `review` | `approved` | `rejected`
- **Video**: `not_started` | `pending` | `generating` | `review` | `approved` | `rejected`

### Audio Map (Spore extension)
`audio-map.json` maps each shot ID to up to three track types — `dialogue`, `sfx`, `music`. Persisted outside the SKEL document to keep media references decoupled from story structure.

### Video Takes (Spore extension)
`video-map.json` maps each shot ID to numbered video takes (V1–V4). One take is flagged as active; the timeline dynamically creates track lanes for each take level used in the project.

---

## Spec Status

| Aspect | Status |
|---|---|
| Specification | ✅ v2.0 complete |
| JSON Schema | ✅ Draft 7, validated |
| Key File | ✅ 7 categories, 47 tokens |
| TypeScript types | ✅ Matches schema |
| Validator | ✅ Schema + referential integrity |
| Key resolver | ✅ With spec-compliant fallbacks |
| Converter (export) | ✅ MasterStory → SKEL, Story → SKEL |
| Converter (import) | ✅ SKEL → Story |
| BONE spec | ✅ v1.0 complete |
| BONE schema | ✅ Validates .bone.json files |
| BONE resolver | ✅ Inheritance chain + validation |
| Starter BONEs | ✅ flux-dev, runway-gen3, kling-v1 |
| Fountain import (`fountainToSkel`) | ✅ Implemented in Spore |
| Split image/video production status | ✅ Implemented in Spore |
| Audio map (x-spore extension) | ✅ Implemented in Spore |
| Video takes / multi-take map (x-spore) | ✅ Implemented in Spore |
| Real-time SKEL validation in UI | ✅ Implemented in Spore |
| Final Draft import | 🔲 Planned |
| OpenTimelineIO export | 🔲 Planned |
| CSV export | 🔲 Planned |
| Standalone CLI | 🔲 Planned |
| Schema hosting | ✅ GitHub raw URL (this repo) |
| MUSCLE spec (behavior plugins) | ✅ v1.0 spec complete |
| MUSCLE schema + hook payload schema | ✅ Validates manifests and hook envelopes/results |
| MUSCLE authoring guide + example manifests | ✅ `MUSCLE_AUTHORING.md`, `muscles/` |
| MUSCLE reference host | ✅ `reference/muscle-host/` — runnable demo of the full contract |
| MUSCLE host implementation (Spore / CLI) | 🔲 Planned |
| Round-trip provenance (`metadata.source`, stable IDs, x-format preservation) | ✅ Spec complete (ADR-016) |
| BONE field validation (P6-2) | 🔲 Planned |
| Referential integrity auto-repair (P6-3) | 🔲 Planned |
| Scene-level BONE defaults panel (P2-3) | 🔲 Planned |
| BONE manager / editor UI (P4) | 🔲 Planned |
| `output` field on BONE (storage routing) | ✅ Spec complete |
| LLM integration guide | ✅ Spec complete — see `LLM_INTEGRATION.md` |
| MCP tool map for generation loop | 🔲 Implementation planned |

---

## License

MIT
