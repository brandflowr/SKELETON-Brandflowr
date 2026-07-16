# SKEL - Story Keyframe Extensible Layout

> A flat, relational YAML format for encoding visual narratives into machine-readable, validatable story data.

---

## What Is SKEL?

SKEL is Genlock's native story format. A project stores its authoring document as `story.skel`, a UTF-8 YAML file. Instead of deeply nested trees, SKEL stores Acts, Scenes, and Shots as top-level arrays linked by ID references - like a relational database for stories. `.skel.json` is the explicit export/interchange form of the same data model.

It was designed for:
- AI-driven image/video generation pipelines (Runway, Kling, Sora, etc.)
- Storyboard authoring tools (Genlock)
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

## Terminology: SKEL vs Genlock

SKEL uses the term **Acts** for the top-level story grouping. Genlock Studio surfaces this as **Chapters** in its UI. These are the same entity — `act_id` in SKEL maps to the chapter container in Genlock. When the spec says "act", Genlock shows "chapter".

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
| [`skel.schema.json`](./skel.schema.json) | SKEL JSON Schema (Draft 7). Validates the parsed `.skel` data model and `.skel.json` exports. Includes `bone_registry`, `bones` on all entities, and the full asset layer (characters, environments, locations, props, music cues). |
| [`bone.schema.json`](./bone.schema.json) | BONE JSON Schema. Validates `.bone.json` definition files. |
| [`studio-spec.md`](./studio-spec.md) | Studio registry spec: `studio.json`, the cross-project story bible (characters, environments, props, voices, skins, palettes, series). |
| [`studio.schema.json`](./studio.schema.json) | Studio registry JSON Schema. Asset definitions `$ref` `skel.schema.json` so snapshots and registry records cannot drift. |
| [`errors.md`](./errors.md) | Normative error catalog: stable codes, severities, RFC 6901 path convention. |
| [`GENLOCK_HOST_PROFILE.md`](./GENLOCK_HOST_PROFILE.md) | Genlock's mapping of the neutral spec onto its storage; the template for third-party host profiles. |
| [`MIGRATIONS.md`](./MIGRATIONS.md) | Rename/structure migrations and alias sunsets (`x-spore`, output targets, status mirror, legacy `story.json`). |
| [`skel-keyfile.json`](./skel-keyfile.json) | Default token dictionary. Maps shorthand tokens to full production definitions. |
| [`example.skel.json`](./example.skel.json) | Complete export/interchange example. "The Last Signal" - 2 acts, 3 scenes, 9 shots with BONE data. |
| [`example.skel`](./example.skel) | The same example in native YAML with comments — the annotated read-first file. |
| [`examples/`](./examples/) | `kitchen-sink.skel.json` (every 2.9 feature) + `episodic/` (two episodes sharing one `studio.json`). |
| [`bones/`](./bones/) | Starter BONE definitions: `flux-dev`, `runway-gen3`, `kling-v1`, `seedance-2`, `character-reference-sheet`, `storyboard-grid-9`. |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | System architecture map. Data flow, module responsibilities, integration points. |
| [`LLM_INTEGRATION.md`](./LLM_INTEGRATION.md) | How LLMs read, write, and act on SKEL/BONE. The full generation loop: prompt → generator → storage → write-back. MCP tool map. |
| [`DECISIONS.md`](./DECISIONS.md) | Architecture Decision Records. Why we made the choices we made. |
| [`CHANGELOG.md`](./CHANGELOG.md) | Version history. |

### Implementation

Reference implementations in this repo: [`reference/cli/`](../reference/cli/) (validator/converter/inspector, published as `@skel/cli`), [`reference/muscle-host/`](../reference/muscle-host/), [`reference/fountain-adapter/`](../reference/fountain-adapter/), [`reference/continuity-guard/`](../reference/continuity-guard/), plus TypeScript types in [`types/skel.d.ts`](../types/skel.d.ts) (published as `@skel/spec`).

The Genlock Studio host implementation lives in the app repo (`app/utils/skel/`):

| File | Purpose |
|---|---|
| `types.ts` | TypeScript interfaces matching the JSON Schema. `SKELDocument`, `SKELScene`, `SKELShot`, `SKELVSetup`, etc. |
| `validator.ts` | Schema validation (AJV) + referential integrity checks + duplicate ID detection. |
| `keyfile.ts` | `SKELKeyResolver` class. Expands shorthand tokens to full definitions with spec-compliant fallback defaults. |
| `converter.ts` | Bidirectional conversion: `masterStoryToSKEL()`, `storyToSKEL()`, `SKELToStory()`. |
| `bone.ts` | `BoneResolver` class. Loads definitions, resolves inheritance chain, validates BONE data. |

### Genlock-Specific Extension Data (stored in `x-genlock` namespace)

These files live in each Genlock project folder and carry data that extends SKEL but is not part of the core spec. They are stored alongside `story.skel` (the native SKEL document). `story.json` is legacy/migration input only.

| File | Purpose |
|---|---|
| `audio-map.json` | Maps shot IDs → assigned audio tracks (dialogue, SFX, music). One entry per shot. |
| `video-map.json` | Maps shot IDs → numbered video takes (V1–V4) with an active take flag. Supports multi-take per shot. |

Additional Genlock extension contracts:

| Extension | Purpose |
|---|---|
| `extensions.x-genlock.proposals` | Optional proposal history on SKEL entities. Stores pending/accepted/rejected AI or user suggestions without changing core SKEL fields. |
| `x-genlock.schema.json` | Supplementary schema for Genlock-owned extension data, including proposal objects. The core SKEL schema remains vendor-neutral. |

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
// result.source → ['defaults', 'metadata', 'act', 'scene', 'shot']
```

### Resolve tokens from a shot
```ts
import { SKELKeyResolver } from '~/utils/SKEL/keyfile'

const resolver = new SKELKeyResolver()
const resolved = resolver.resolveSetup(shot.v_setup)
// resolved.size → { token: "cu", label: "Close-Up", description: "Subject's face fills the frame." }
```

### Export a Genlock project to SKEL JSON
```ts
import { masterStoryToSKEL } from '~/utils/SKEL/converter'

const SKELDoc = masterStoryToSKEL(masterStory)
```

### Import a SKEL file into Genlock
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
     Genlock shows Acts as "Chapters" in the UI.
```

### Token System
Shots use shorthand tokens (`cu`, `noir`, `dolly`) that the Key File expands to full definitions. This keeps `.skel` files small while preserving rich metadata for rendering engines.

### Extensions
Any entity can carry vendor-specific data via `extensions` with `x-` namespaced keys:
```json
{ "extensions": { "x-genlock": { "production_status": "approved", "startFrameImage": "..." } } }
```

Genlock proposal history lives under `extensions.x-genlock.proposals`. Proposal objects have stable IDs, a `type`, a `status` (`pending`, `accepted`, `rejected`, or `superseded`), and a short `summary`. See `SKEL/spec/x-genlock.schema.json` for the supplementary schema.

### Production Status (split image / video)
Shots carry a `status` object with separate image and video production states. Both take:
`not_started` | `pending` | `generating` | `review` | `approved` | `rejected` | `failed`

The core `status` field is the canonical home of production status (since 2.9); `extensions.x-genlock.production_status` is a deprecated mirror (see MIGRATIONS.md §4).

### Audio Map (Genlock extension)
`audio-map.json` maps each shot ID to up to three track types — `dialogue`, `sfx`, `music`. Persisted outside the SKEL document to keep media references decoupled from story structure.

### Video Takes (Genlock extension)
`video-map.json` maps each shot ID to numbered video takes (V1–V4). One take is flagged as active; the timeline dynamically creates track lanes for each take level used in the project.

---

## Spec Status

| Aspect | Status |
|---|---|
| Specification | ✅ v2.9 complete |
| JSON Schema | ✅ Draft 7, validated (AJV strict-clean) |
| Key File | ✅ 13 categories, 131 tokens |
| Asset layer (characters/environments/locations/props) | ✅ v2.9 (`identity_lock`, `style_lock`, continuity state) |
| Studio registry (`studio.json`) | ✅ `studio-spec.md` + `studio.schema.json` |
| Series & episodes | ✅ `metadata.series` + registry series documents |
| Music cues / transitions / temporal model / delivery facts | ✅ v2.9 |
| Normative error catalog | ✅ `errors.md` |
| Conformance classes + corpus | ✅ spec §9 + `tests/conformance/` |
| Versioned schema URLs | ✅ tagged `$id`s (`v2.9.0`), `main` = latest |
| TypeScript types | ✅ Matches schema |
| Validator | ✅ Schema + referential integrity |
| Key resolver | ✅ With spec-compliant fallbacks |
| Converter (export) | ✅ MasterStory → SKEL, Story → SKEL |
| Converter (import) | ✅ SKEL → Story |
| BONE spec | ✅ v1.0 complete |
| BONE schema | ✅ Validates .bone.json files |
| BONE resolver | ✅ Inheritance chain + validation |
| Starter BONEs | ✅ flux-dev, runway-gen3, kling-v1 |
| Fountain import (`fountainToSkel`) | ✅ Implemented in Genlock |
| Split image/video production status | ✅ Implemented in Genlock |
| Audio map (x-genlock extension) | ✅ Implemented in Genlock |
| Video takes / multi-take map (x-genlock) | ✅ Implemented in Genlock |
| Real-time SKEL validation in UI | ✅ Implemented in Genlock |
| Final Draft import | 🔲 Planned |
| OpenTimelineIO export | 🔲 Planned |
| CSV export | 🔲 Planned |
| Standalone CLI | ✅ `reference/cli/` — validate / convert / inspect |
| Fountain round-trip adapter (reference) | ✅ `reference/fountain-adapter/` — byte-identical round-trip test |
| CI (validate artifacts, corpus, demo, round-trip) | ✅ `.github/workflows/ci.yml` |
| Schema hosting | ✅ GitHub raw URLs, tagged per release |
| MUSCLE spec (behavior plugins) | ✅ v1.0 spec complete |
| MUSCLE schema + hook payload schema | ✅ Validates manifests and hook envelopes/results |
| MUSCLE authoring guide + example manifests | ✅ `MUSCLE_AUTHORING.md`, `muscles/` |
| MUSCLE reference host | ✅ `reference/muscle-host/` — runnable demo of the full contract |
| MUSCLE host implementation (Genlock / CLI) | 🔲 Planned |
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
