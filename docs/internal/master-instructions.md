# SKELETON-Spec — Master Session Instructions

> Read this first, every session.

---

## What This Repo Is

The canonical specification for the **SKEL format** — Story Keyframe Extensible Layout. This is the open storyboard data standard that Genlock Studio reads and writes natively.

This repo contains only spec files — no app code. Changes here define the format contract that `SPORE-Desktop` (the Genlock Studio app repo) and any third-party tools must comply with.

---

## Format Identity

| Property | Value |
|---|---|
| Name | Story Keyframe Extensible Layout |
| Acronym | SKEL |
| Extension | `.skel` |
| Native format | YAML (UTF-8) |
| Export format | `.skel.json` (JSON, same structure — portability artifact) |
| Media type | `application/vnd.skel+yaml` (interim; IANA registration intended — MIGRATIONS.md §8) |
| Schema | JSON Schema Draft 7 (AJV 8 compatible, strict-clean); `$id`s pinned to release tags |
| License | MIT |

**The metaphor:** `.skel` is the layout of the body — acts, scenes, shots, visual frame setup. `.bone` files (see BONE-Spec) are the AI pipelines that attach to it. Define the skeleton before the bones.

---

## Repo Structure

```
spec/
├── skel-spec.md          ← The specification (canonical)
├── skel.schema.json      ← JSON Schema for validation
├── skel-keyfile.json     ← Default token key file (13 categories, 131 tokens)
├── example.skel          ← Annotated native-YAML reference example
├── example.skel.json     ← Reference example (JSON export format)
├── examples/             ← kitchen-sink + episodic pair with studio.json
├── bone-spec.md          ← BONE format spec (v1.1: act chain, neutral targets, provenance)
├── bone.schema.json      ← BONE JSON Schema
├── bones/                ← Example .bone.json definitions
├── muscle-spec.md        ← MUSCLE behavior plugin spec (v1.1 + §10 security model)
├── muscle.schema.json    ← MUSCLE manifest schema
├── hook-payload.schema.json ← Hook envelope/result contract (payload 1.1)
├── muscles/              ← Example manifests (style-guard, fountain-adapter, continuity-guard)
├── studio-spec.md        ← Studio registry spec (studio.json — the story bible)
├── studio.schema.json    ← Studio registry schema ($refs skel defs)
├── errors.md             ← Normative error catalog (stable codes, RFC 6901 paths)
├── GENLOCK_HOST_PROFILE.md ← Genlock's mapping of the neutral spec
├── MIGRATIONS.md         ← Renames, aliases, sunsets
├── TOKEN_REFERENCE.md    ← All token values
├── ARCHITECTURE.md       ← System architecture overview
├── DECISIONS.md          ← Architecture Decision Records (ADRs)
├── LLM_INTEGRATION.md    ← LLM agent read/edit/validate guidance
├── x-genlock.schema.json ← Genlock extension data schema
├── audio-map.schema.json ← audio-map.json sidecar schema
├── video-map.schema.json ← video-map.json sidecar schema
├── canvas-layout.schema.json ← canvas-layout.json sidecar schema
├── CHANGELOG.md          ← Version history
└── OVERVIEW.md           ← Quick orientation

Also: reference/ (muscle-host, cli, fountain-adapter, continuity-guard),
tests/conformance/, registry/, types/, scripts/, .github/workflows/ci.yml.
Run `npm install && npm run check` after any spec change — it is the CI suite.
```

---

## Key Decisions Already Made (Do Not Reopen)

All in `spec/DECISIONS.md`. The critical ones:

- **ADR-001:** Flat relational structure (acts/scenes/shots as top-level arrays, linked by ID)
- **ADR-002:** JSON Schema Draft 7 — AJV 8 native support
- **ADR-003:** Scene shot counts are unrestricted; structure is governed by referential integrity
- **ADR-004:** Shorthand token system + key file
- **ADR-005:** `x-` namespaced vendor extensions
- **ADR-009:** MIT License
- **ADR-010:** YAML as native format, JSON as export. `skel_version` lowercase throughout.

---

## Open Spec Work

**SKEL-S1 — DONE (2.9.0):** `spec/example.skel` ships as the annotated YAML reference; `example.skel.json` remains the JSON export reference.

**SKEL-S2 — DONE (2.9.0):** YAML authoring profile is skel-spec.md §11 (block scalars, comments, quoting incl. timestamps, canonical key order, git guidance).

**SKEL-S3 — remaining (editorial, PATCH):** some code blocks in `skel-spec.md` §2/§6 still show JSON; normalize to YAML with JSON labeled as "export format". Low priority — mixed examples are accurate today.

---

## Conventions

- `skel_version` is always lowercase
- YAML is the spec language for examples — JSON is the export format
- Every architectural decision gets an ADR in `spec/DECISIONS.md`
- The schema must stay in sync with the spec prose
- Token values in `v_setup` are always lowercase shorthand (`cu`, `noir`, `dolly`)

---

*Start every session by reading this file.*
