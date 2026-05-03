# SKEL Changelog

All notable changes to the SKEL specification and implementation.

---

## [2.0.0] — 2025-07-15

### Specification
- **BREAKING**: Redesigned as SKEL (Skeleton) — flat relational format replaces nested hierarchy
- Acts, scenes, and shots are now top-level arrays linked by ID references
- Added `extensions` object with `x-` namespacing on all entities
- Added `key_file` field (inline or external URI)
- Added `narrative` field on scenes
- Added `dialogue`, `character_refs`, `duration` fields on shots
- Added `move` (camera movement) and `dof` (depth of field) to `v_setup`
- Defined file convention: `.skeleton` (native) / `.skel.json` (interchange), MIME type `application/skel+json`
- Defined interchange mappings for Fountain, Final Draft, OpenTimelineIO, CSV
- Defined versioning policy (MAJOR.MINOR semver)

### BONE Plugin System
- Introduced BONE (Base Object Narrative Export) as the plugin layer
- Added `bone_registry` to SKEL documents for embedding BONE definitions on export
- Added `bones` open object to all entity types (metadata, act, scene, shot)
- BONE data inherits from project → scene → shot (shallow merge)

### Schema
- `skel.schema.json` — JSON Schema Draft 7
- Full validation: required fields, enums, maxLength, maxItems, patterns
- 4-shot limit enforced via `maxItems: 4` on `shot_refs`
- Character limits: `action` (200), `logline` (280)
- `bone_registry` and `bones` included in schema

### Key File
- Default key file with 7 categories, 47 tokens
- Categories: size (9), angle (6), lens (5), move (8), light (8), tod (5), dof (3), custom (extensible)
- Extra metadata on tokens (e.g., `noir` includes `contrast: "high"`, `shadow_density: "heavy"`)

### Starter BONEs
- `flux-dev.bone.json` — Black Forest Labs Flux Dev (image)
- `runway-gen3.bone.json` — Runway Gen-3 Alpha Turbo (video)
- `kling-v1.bone.json` — Kuaishou Kling v1.6 (video)

### Documentation
- `OVERVIEW.md` — Entry point, file inventory, quick start, status tracker
- `ARCHITECTURE.md` — System diagram, module responsibilities, data flows, integration points
- `DECISIONS.md` — Architecture Decision Records
- `CHANGELOG.md` — This file
- `TOKEN_REFERENCE.md` — Quick reference for all tokens

### Example
- `example.skel.json` — "The Last Signal" (2 acts, 3 scenes, 9 shots with BONE data)
- Validates against schema ✅
- Passes referential integrity checks ✅

---

## [1.0.0] — 2025-07-15 (Superseded)

### Specification (initial nested hierarchy)
- Initial nested hierarchy: Story → Acts → Scenes → Shots
- Basic `v_setup` with `size`, `angle`, `light`
- Key file concept with shorthand tokens
- 4-shot limit per scene
- Front-loading rule for `action` field

> v1.0 was never widely distributed. Superseded by v2.0 flat relational structure.
