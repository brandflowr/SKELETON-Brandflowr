# SKEL — Visual Relational Action Data

> A flat, relational JSON format for encoding visual narratives into machine-readable, validatable story data.

---

## What Is SKEL?

SKEL is an open interchange format that represents screenplays, storyboards, and visual narratives as flat JSON. Instead of deeply nested trees, SKEL stores Acts, Scenes, and Shots as top-level arrays linked by ID references — like a relational database for stories.

It was designed for:
- AI-driven image/video generation pipelines (Flux, Kling, Runway, WAN, etc.)
- Storyboard authoring tools
- Cross-tool interchange between screenplay editors and production software

---

## Why It Matters

| Problem | SKEL Solution |
|---|---|
| Screenplay formats (Fountain, FDX) have no visual metadata | SKEL encodes camera, lighting, lens, and movement per shot |
| Nested story trees are fragile and hard to query | Flat relational structure — query any shot by ID |
| No standard for AI prompt pipelines | `action` + `v_setup` fields map directly to generation APIs |
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
| [`TOKEN_REFERENCE.md`](./TOKEN_REFERENCE.md) | All valid tokens at a glance — quick lookup for prompt writing. |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | System architecture map. Data flow, module responsibilities, integration points. |
| [`DECISIONS.md`](./DECISIONS.md) | Architecture Decision Records. Why we made the choices we made. |
| [`CHANGELOG.md`](./CHANGELOG.md) | Version history. |

---

## Quick Start

### Validate a SKEL document (JavaScript/TypeScript)

```ts
import Ajv from 'ajv'
import schema from './skel.schema.json'

const ajv = new Ajv()
const validate = ajv.compile(schema)
const valid = validate(myDocument)
if (!valid) console.error(validate.errors)
```

### Write a shot with BONE data

```json
{
  "id": "sh_1",
  "scene_id": "sc_1",
  "action": "Harlan writes in the logbook.",
  "v_setup": { "size": "cu", "angle": "high", "light": "noir" },
  "bones": {
    "flux-dev": {
      "text": "Close-up of weathered hands writing in a leather logbook, candlelight, noir lighting.",
      "guidance": 9,
      "seed": 42
    }
  }
}
```

### Resolve tokens from a shot

```ts
// Token "cu" expands to: { label: "Close-Up", description: "Subject's face fills the frame." }
// Token "noir" expands to: { label: "Noir", contrast: "high", shadow_density: "heavy" }
// Tokens live in skel-keyfile.json — load and expand at render time.
const keyFile = await fetch('skel-keyfile.json').then(r => r.json())
const sizeToken = keyFile.size.find(t => t.token === shot.v_setup.size)
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
{ "extensions": { "x-myapp": { "production_status": "approved" } } }
```

---

## Spec Status

| Aspect | Status |
|---|---|
| Specification | ✅ v2.0 complete |
| JSON Schema | ✅ Draft 7, validated |
| Key File | ✅ 7 categories, 47 tokens |
| BONE spec | ✅ v1.0 complete |
| BONE schema | ✅ Validates `.bone.json` files |
| Starter BONEs | ✅ flux-dev, runway-gen3, kling-v1 |
| Fountain import | 🔲 Planned |
| Final Draft import | 🔲 Planned |
| OpenTimelineIO export | 🔲 Planned |
| Standalone CLI | 🔲 Planned |

---

## License

MIT
