# SKEL — Visual Relational Action Data

> A flat, relational JSON format for encoding visual narratives into machine-readable, validatable story data.

---

## What Is SKEL?

SKEL is an open interchange format that represents screenplays, storyboards, and visual narratives as flat JSON. Instead of deeply nested trees, SKEL stores Acts, Scenes, and Shots as top-level arrays linked by ID references — like a relational database for stories.

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
| [`skel.schema.json`](./skel.schema.json) | SKEL JSON Schema (Draft 7). Includes `bone_registry` and `bones` on all entities. |
| [`bone.schema.json`](./bone.schema.json) | BONE JSON Schema. Validates `.bone.json` definition files. |
| [`skel-keyfile.json`](./skel-keyfile.json) | Default token dictionary. Maps shorthand tokens to full production definitions. |
| [`example.skel.json`](./example.skel.json) | Complete working example. "The Last Signal" — 2 acts, 3 scenes, 9 shots with BONE data. |
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

### Spore-Specific Extension Data (stored in `x-Spore` namespace)

These files live in each Spore project folder and carry data that extends SKEL but is not part of the core spec. They are stored alongside `story.json` (the SKEL document).

| File | Purpose |
|---|---|
| `audio-map.json` | Maps shot IDs → assigned audio tracks (dialogue, SFX, music). One entry per shot. |
| `video-map.json` | Maps shot IDs → numbered video takes (V1–V4) with an active take flag. Supports multi-take per shot. |

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

### Export a Spore project to SKEL
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

### 4-Shot Limit
Every scene is capped at 4 shots by default. This constraint keeps visual narratives concise and prevents AI pipelines from producing unbounded output. Configurable via `metadata.constraints.max_shots_per_scene`.

### Extensions
Any entity can carry vendor-specific data via `extensions` with `x-` namespaced keys:
```json
{ "extensions": { "x-Spore": { "production_status": "approved", "startFrameImage": "..." } } }
```

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
| Audio map (x-Spore extension) | ✅ Implemented in Spore |
| Video takes / multi-take map (x-Spore) | ✅ Implemented in Spore |
| Real-time SKEL validation in UI | ✅ Implemented in Spore |
| Final Draft import | 🔲 Planned |
| OpenTimelineIO export | 🔲 Planned |
| CSV export | 🔲 Planned |
| Standalone CLI | 🔲 Planned |
| Schema hosting | 🔲 Needs Spore.dev |
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
