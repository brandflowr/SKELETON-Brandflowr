# SKELETON-Spec — Master Session Instructions

> Read this first, every session. Update `local-update.md` when done.

---

## What This Repo Is

The canonical specification for the **SKEL format** — Story Keyframe Extensible Layout. This is the open storyboard data standard that Spore Studio reads and writes natively.

This repo contains only spec files — no app code. Changes here define the format contract that `SPORE-Desktop` and any third-party tools must comply with.

---

## Format Identity

| Property | Value |
|---|---|
| Name | Story Keyframe Extensible Layout |
| Acronym | SKEL |
| Extension | `.skel` |
| Native format | YAML (UTF-8) |
| Export format | `.skel.json` (JSON, same structure — portability artifact) |
| MIME type | `application/skel+yaml` |
| Schema | JSON Schema Draft 7 (AJV 8 compatible) |
| License | MIT |

**The metaphor:** `.skel` is the layout of the body — acts, scenes, shots, visual frame setup. `.bone` files (see BONE-Spec) are the AI pipelines that attach to it. Define the skeleton before the bones.

---

## Repo Structure

```
spec/
├── skel-spec.md          ← The specification (canonical)
├── skel.schema.json      ← JSON Schema for validation
├── skel-keyfile.json     ← Default token key file
├── example.skel.json     ← Reference example (JSON export format)
├── bone-spec.md          ← BONE format spec (cross-reference)
├── bone.schema.json      ← BONE JSON Schema
├── bones/                ← Example .bone.json definitions
├── TOKEN_REFERENCE.md    ← All v_setup token values
├── ARCHITECTURE.md       ← System architecture overview
├── DECISIONS.md          ← Architecture Decision Records (ADRs)
├── PUNCHLIST.md          ← Open spec work
├── CHANGELOG.md          ← Version history
└── OVERVIEW.md           ← Quick orientation
```

---

## Key Decisions Already Made (Do Not Reopen)

All in `spec/DECISIONS.md`. The critical ones:

- **ADR-001:** Flat relational structure (acts/scenes/shots as top-level arrays, linked by ID)
- **ADR-002:** JSON Schema Draft 7 — AJV 8 native support
- **ADR-003:** 4-shot max per scene (configurable via `metadata.constraints`)
- **ADR-004:** Shorthand token system + key file
- **ADR-005:** `x-` namespaced vendor extensions
- **ADR-009:** MIT License
- **ADR-010:** YAML as native format, JSON as export. `skel_version` lowercase throughout.

---

## Open Spec Work

Check `spec/PUNCHLIST.md` for current status. Key open items:

**SKEL-S1: Update example.skel.json → example.skel (YAML)**
- Create `example.skel` in YAML as the primary reference example
- Keep `example.skel.json` as the JSON export reference

**SKEL-S2: Add YAML authoring guidance to skel-spec.md**
- Multiline strings (`>` block scalar for action and prompt text)
- Comments (`#` inline docs)
- The YAML → JSON export process

**SKEL-S3: Normalize all spec examples to YAML**
- Code blocks in `skel-spec.md` currently show JSON
- Replace with YAML throughout; keep JSON examples labeled as "export format"

**SKEL-S4: `skel_version` casing audit**
- Grep all spec files for `SKEL_version` or `skelVersion`
- Normalize to `skel_version` everywhere

---

## Conventions

- `skel_version` is always lowercase
- YAML is the spec language for examples — JSON is the export format
- Every architectural decision gets an ADR in `spec/DECISIONS.md`
- The schema must stay in sync with the spec prose
- Token values in `v_setup` are always lowercase shorthand (`cu`, `noir`, `dolly`)

---

*Start every session by reading this file and `spec/PUNCHLIST.md`. End by updating `local-update.md`.*
