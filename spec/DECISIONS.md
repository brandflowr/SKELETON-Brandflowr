# SKEL Architecture Decision Records

> Documenting the "why" behind every major design choice so future-you (or anyone else) doesn't have to reverse-engineer intent.

---

## ADR-001: Flat Relational Structure Over Nested Trees

**Date:** 2025-07-15
**Status:** Accepted

**Context:** The original VSON format used deeply nested JSON (Story → Acts → Scenes → Shots). This made it difficult to query individual shots without traversing the full tree, and state management in Vue/Pinia was error-prone with deep reactivity.

**Decision:** SKEL uses a flat structure with top-level arrays for `acts`, `scenes`, and `shots`, linked by ID references (`scene_refs`, `shot_refs`, `act_id`, `scene_id`).

**Consequences:**
- Any shot can be queried by ID in O(1) with a Map
- Pinia stores can manage flat arrays instead of nested trees
- Referential integrity must be explicitly validated (handled by `validator.ts`)
- Slightly more verbose than nested, but dramatically easier to work with

---

## ADR-002: JSON Schema Draft 7 (Not 2020-12)

**Date:** 2025-07-15
**Status:** Accepted

**Context:** The schema was initially written for Draft 2020-12, but AJV 8 (the industry-standard JS validator) only supports 2020-12 via a separate import path (`ajv/dist/2020`) with additional configuration complexity.

**Decision:** Downgraded to Draft 7, which AJV 8 supports natively. Changed all `$defs` to `definitions`.

**Consequences:**
- Zero extra configuration needed — `new Ajv()` just works
- No need for `ajv-formats` package (removed as dependency)
- Draft 7 is the most widely supported schema version across all tooling
- Minor: loses some 2020-12 features like `prefixItems`, but SKEL doesn't need them

---

## ADR-003: Unrestricted Shot Counts Per Scene

**Date:** 2025-07-15
**Status:** Superseded

**Context:** Early drafts tried to constrain scenes to a small fixed number of shots for layout and cost estimation. That conflicted with normal story structure: some scenes need one shot, some need many, and importers must preserve the author's scene boundaries.

**Decision:** SKEL does not impose a per-scene shot-count cap. `shot_refs` may contain as many shots as the story requires. Validators enforce referential integrity, not an arbitrary maximum scene length.

**Consequences:**
- Fountain and script imports preserve long scenes without synthesizing continuation scenes.
- Story Editor controls must not disable adding or importing shots based on scene shot count.
- Cost, layout, and production planning tools can warn about unusually long scenes, but they must not reject valid structure solely because a scene has many shots.

---

## ADR-004: Shorthand Token System + Key File

**Date:** 2025-07-15
**Status:** Accepted

**Context:** Full descriptive values ("Extreme Close-Up", "Film Noir lighting with high contrast") bloat file sizes and are inconsistent across tools. But pure codes (`ecu`, `noir`) are opaque without documentation.

**Decision:** SKEL uses shorthand tokens in the document (`cu`, `noir`, `dolly`) with a separate Key File that maps them to full definitions. The key file can be inline or external.

**Consequences:**
- `.skel` files stay compact
- Key file provides rich metadata for rendering engines (descriptions, extra params like `contrast: "high"`)
- Custom tokens via `x-` prefix allow vendor extensions
- Parsers must implement fallback defaults (spec §4.2) for missing tokens

---

## ADR-005: Extensions With x- Namespacing

**Date:** 2025-07-15
**Status:** Accepted

**Context:** Different tools (Spore, Runway, Kling) need to attach tool-specific data to shots and scenes without breaking the core format.

**Decision:** Every SKEL entity has an optional `extensions` object. Keys must be namespaced with `x-` prefix (e.g., `x-spore`, `x-runway`). The core schema does not validate extension contents.

**Consequences:**
- Core spec stays clean and stable
- Any vendor can extend without coordination
- Parsers must ignore unknown namespaces without error
- Vendors can publish supplementary schemas for their extensions

---

## ADR-006: Bidirectional Converter With Token Mapping Tables

**Date:** 2025-07-15
**Status:** Accepted

**Context:** Spore uses free-text strings for shot types ("WS", "Wide Shot", "wide_shot"), camera angles ("Eye Level", "eye_level"), etc. SKEL uses strict enum tokens (`ws`, `eye`).

**Decision:** `converter.ts` contains explicit mapping tables (`SIZE_TO_TOKEN`, `ANGLE_TO_TOKEN`, etc.) that normalize any known variant to the SKEL token. Unknown values fall back to spec defaults.

**Consequences:**
- Handles the messy reality of existing Spore data
- New string variants need to be added to the mapping tables manually
- Fallback defaults prevent conversion failures on unknown values
- Round-trip fidelity: export → import preserves all SKEL-compatible data

---

## ADR-007: Integrated Into Spore First, Extract Later

**Date:** 2025-07-15
**Status:** Accepted

**Context:** Two options were considered: (A) standalone npm package from day one, or (B) build inside Spore and extract when the spec stabilizes.

**Decision:** Option B. The SKEL engine lives in `app/utils/SKEL/` and imports Spore types directly.

**Consequences:**
- Can iterate on the spec and implementation together without maintaining two repos
- Direct access to Spore types for the converter
- When ready to extract: move `types.ts`, `validator.ts`, `keyfile.ts` to a standalone package; converter stays in Spore as the "glue"
- Spec files in `/spec` are already standalone and can be published independently

---

## ADR-008: Markdown + XML Tags as Input Guardrails

**Date:** 2025-07-15
**Status:** Accepted

**Context:** The original parser relied on heuristics ("first 200 characters of a paragraph") to extract shot data from plain Markdown. This was fragile and AI-generated treatments frequently broke the parser.

**Decision:** The input format uses XML-style `<shot>` tags within Markdown as explicit boundaries. Attributes on tags (`cam="cu"`, `light="noir"`) inject `v_setup` data directly.

**Consequences:**
- Parser precision: no guessing where shots begin/end
- AI models can be prompted to output tagged Markdown
- Tags can be validated with regex before full parsing
- Slightly more complex input format, but dramatically more reliable output

---

## ADR-009: MIT License

**Date:** 2025-07-15
**Status:** Accepted

**Context:** For industry adoption, the spec and reference implementation need a permissive license.

**Decision:** MIT License for both the specification and the implementation.

**Consequences:**
- Maximum adoption potential — no license friction
- Anyone can use, modify, and redistribute
- No copyleft obligations for commercial tools that implement SKEL

---

## ADR-010: SKEL Acronym Expansion + YAML Format Adoption

**Date:** May 2026  
**Status:** Accepted

**Context:** The original acronym expansion for SKEL was informal ("Visual Relational Action Data" — which was actually the VRAD format name, not the SKEL acronym). As the format matures and moves toward public release, a precise, meaningful acronym and a format choice that reflects the design philosophy were needed.

**Decision:** `.SKEL` is formally defined as **Story Keyframe Extensible Layout**. The format shifts from JSON to **YAML**.

Rationale for the name:
- **Story** — the file encodes a visual narrative, not generic data
- **Keyframe** — each shot is a keyframe: a defined moment in the story with a precise visual setup
- **Extensible** — YAML is natively extensible; the format is designed for plugin architecture (BONEs) and vendor extensions
- **Layout** — describes the flat-but-hierarchical structure of the file: acts, scenes, shots as top-level arrays, linked by ID — a layout of the body before the BONEs (AI pipelines) are attached

Rationale for YAML:
- YAML's block structure makes `.skel` files human-readable and author-friendly
- YAML natively supports comments, allowing inline documentation of shots and scenes
- The flat relational structure (ADR-001) maps cleanly to YAML's block sequences
- Extensibility (`x-` namespaced extensions) reads more naturally in YAML than JSON
- The Skeleton Metaphor is preserved and strengthened: `.skel` is the layout of the body (story structure), `.bone` files are the AI pipelines that attach to it — YAML makes this separation visually legible

**Consequences:**
- `skel-spec.md` updated to reflect YAML as the canonical format
- File extension remains `.skel`; MIME type updates to `application/skel+yaml`
- JSON export (`.skel.json`) remains supported as a portability format
- All spec examples rewritten in YAML
- BONE format (`.bone`) remains JSON — BONEs are tool definitions, not authored documents; JSON is appropriate there
- Existing JSON `.skel` files are valid for migration with a one-pass YAML conversion

---

## ADR-011: Document Lifecycle Modes

**Date:** 2026-05-22
**Status:** Accepted

**Context:** SPORE needs to create a new project before the author has written acts, scenes, or shots. The original schema required non-empty `acts`, `scenes`, `shots`, `scene_refs`, and `shot_refs`, which made an empty but valid new project impossible. At the same time, production and export workflows still need stricter validation so broken structure does not reach rendering or handoff.

**Decision:** SKEL adds optional `metadata.lifecycle` with three values: `draft`, `production`, and `export`. If omitted, parsers treat the document as `draft`.

Validation behavior:
- `draft` allows empty arrays and incomplete story structure.
- `production` requires at least one act, scene, and shot, plus non-empty scene and shot reference arrays.
- `export` inherits production-level structural requirements and is the mode where portable handoff requirements, such as embedded BONE definitions, should be enforced.

**Consequences:**
- New SPORE projects can be created and saved immediately as valid `draft` documents.
- Production/export validation can remain strict without blocking early ideation.
- Validators must select behavior based on `metadata.lifecycle`, not only the base schema.
- Future lifecycle-specific requirements can be added without changing the core data model.

---

## ADR-012: Scene and Shot Creative Intent Fields

**Date:** 2026-05-22
**Status:** Accepted

**Context:** SKEL captures what happens in a scene or shot, but not why it exists narratively. LLMs rewriting action descriptions or prompt text have no structured signal about a scene's dramatic purpose, its conflict, or the specific beat a shot is meant to capture. This leads to technically correct rewrites that miss the intent of the material.

**Decision:** Add an optional `intent` object to both scenes and shots.

Scene intent captures: `purpose` (what the scene accomplishes), `conflict` (the dramatic tension), `emotional_turn` (how feeling shifts across the scene), and `story_function` (structural role from a fixed vocabulary: `setup`, `escalation`, `reveal`, `reaction`, `decision`, `transition`, `payoff`, `button`).

Shot intent captures: `beat` (the specific story moment), `function` (structural role, same vocabulary as scene), and `emphasis` (what the audience should feel or notice).

LLM integration docs specify that agents must read `intent` before rewriting `action` or prompt text, and must not rewrite `intent` itself unless explicitly asked.

**Consequences:**
- Authors and directors can embed story-structure reasoning directly in the SKEL document.
- LLMs have a structured signal to preserve intent across rewrites and expansions.
- `intent` is fully optional — existing scenes and shots without it remain valid under all lifecycle modes.
- The `story_function` vocabulary is the same for both scenes and shots, keeping the concept model consistent.
- `intent` does not affect generation pipelines or validation strictness; it is purely informational.

---

## ADR-013: `creative_status` Field

**Date:** 2026-05-22
**Status:** Accepted

**Context:** Story content moves through a development lifecycle that is entirely separate from the media production lifecycle already captured by `status.image` and `status.video`. A scene can be narratively locked (the words should not change) while the image is still pending generation. Without a dedicated field, LLMs and authors have no standard way to signal that a scene or shot's written content is frozen.

**Decision:** Add an optional `creative_status` field to both scenes and shots with a fixed five-value vocabulary: `idea`, `drafted`, `needs_review`, `approved`, `locked`.

`locked` is the machine-enforceable value: LLM integration docs specify that agents MUST NOT modify the content of any entity where `creative_status` is `locked`.

**Consequences:**
- Provides a clear contract between authors and LLMs about what is open to change and what is not.
- `creative_status` and `status.image`/`status.video` are clearly distinct: creative status tracks story development; production status tracks media generation.
- The five-value vocabulary covers the most common review/approval workflows without over-specifying a particular process.
- Validators do not enforce `locked` semantics — that is an LLM/tooling contract, not a schema constraint.
- All values are optional; scenes and shots without `creative_status` are treated as implicitly open by tools.
