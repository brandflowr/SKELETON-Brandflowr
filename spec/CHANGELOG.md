# VRAD Changelog

All notable changes to the VRAD specification and implementation.

---

## [2.0.0] — 2025-07-15

### Specification
- **BREAKING**: Renamed from VSON to VRAD (Visual Relational Action Data)
- **BREAKING**: Moved from nested hierarchy (v1.0) to flat relational structure
- Acts, scenes, and shots are now top-level arrays linked by ID references
- Added `extensions` object with `x-` namespacing on all entities
- Added `key_file` field (inline or external URI)
- Added `narrative` field on scenes
- Added `dialogue`, `character_refs`, `duration` fields on shots
- Added `move` (camera movement) and `dof` (depth of field) to `v_setup`
- Defined file convention: `.vrad` / `.vrad.json`, MIME type `application/vrad+json`
- Defined interchange mappings for Fountain, Final Draft, OpenTimelineIO, CSV
- Defined versioning policy (MAJOR.MINOR semver)

### Schema
- JSON Schema Draft 7 (`vrad.schema.json`)
- Full validation: required fields, enums, maxLength, maxItems, patterns
- 4-shot limit enforced via `maxItems: 4` on `shot_refs`
- Character limits: `action` (200), `prompt` (300), `logline` (280)

### Key File
- Default key file with 7 categories, 47 tokens
- Categories: size (9), angle (6), lens (5), move (8), light (8), tod (5), dof (3), custom (extensible)
- Extra metadata on tokens (e.g., `noir` includes `contrast: "high"`, `shadow_density: "heavy"`)

### Implementation
- `types.ts` — TypeScript interfaces matching schema
- `validator.ts` — AJV schema validation + referential integrity + duplicate ID detection
- `keyfile.ts` — `VradKeyResolver` with spec-compliant fallback defaults (§4.2)
- `converter.ts` — Bidirectional conversion:
  - `masterStoryToVrad()` — MasterStory → VradDocument
  - `storyToVrad()` — Story (UI tree) → VradDocument
  - `vradToStory()` — VradDocument → Story (UI tree)
- Token mapping tables for shot sizes, angles, movements, lighting
- Removed `ajv-formats` dependency (not needed)

### Documentation
- `OVERVIEW.md` — Entry point, file inventory, quick start, status tracker
- `ARCHITECTURE.md` — System diagram, module responsibilities, data flows, integration points
- `DECISIONS.md` — 9 Architecture Decision Records
- `CHANGELOG.md` — This file

### Example
- `example.vrad.json` — "The Last Signal" (2 acts, 3 scenes, 9 shots)
- Validates against schema ✅
- Passes referential integrity checks ✅

---

## [1.0.0] — 2025-07-15 (Superseded)

### Specification (as VSON)
- Initial nested hierarchy: Story → Acts → Scenes → Shots
- Basic `v_setup` with `size`, `angle`, `light`
- Key file concept with shorthand tokens
- 4-shot limit per scene
- Front-loading rule for `action` and `prompt` fields

> v1.0 was never implemented. Superseded by v2.0 flat relational structure.
