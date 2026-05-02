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

## ADR-003: 4-Shot Limit Per Scene

**Date:** 2025-07-15
**Status:** Accepted

**Context:** AI generation pipelines can produce unbounded output if not constrained. Storyboard tools need predictable scene sizes for layout and cost estimation.

**Decision:** `shot_refs` in scenes has `maxItems: 4` in the schema. The converter enforces this with `.slice(0, 4)` during export.

**Consequences:**
- Keeps visual narratives concise and production-focused
- Forces authors to prioritize the most important shots
- May need to be configurable in future versions (via extensions or spec revision)

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

**Decision:** Every SKEL entity has an optional `extensions` object. Keys must be namespaced with `x-` prefix (e.g., `x-Spore`, `x-runway`). The core schema does not validate extension contents.

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
