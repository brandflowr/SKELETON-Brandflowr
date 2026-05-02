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

---

## Core Concepts

### Flat Relational Structure
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   Acts   │────▶│  Scenes  │────▶│  Shots   │
│          │     │          │     │          │
│ scene_   │     │ act_id   │     │ scene_id │
│ refs[]   │     │ shot_    │     │ v_setup  │
│          │     │ refs[]   │     │ action   │
└──────────┘     └──────────┘     └──────────┘
     IDs link everything. No nesting.
```

### Token System
Shots use shorthand tokens (`cu`, `noir`, `dolly`) that the Key File expands to full definitions. This keeps `.skel` files small while preserving rich metadata for rendering engines.

### 4-Shot Limit
Every scene is capped at 4 shots. This constraint keeps visual narratives concise and prevents AI pipelines from producing unbounded output.

### Extensions
Any entity can carry vendor-specific data via `extensions` with `x-` namespaced keys:
```json
{ "extensions": { "x-Spore": { "production_status": "approved" } } }
```

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
| Fountain import | 🔲 Planned |
| Final Draft import | 🔲 Planned |
| OpenTimelineIO export | 🔲 Planned |
| Standalone CLI | 🔲 Planned |
| Schema hosting | 🔲 Needs Spore.dev |

---

## License

MIT
