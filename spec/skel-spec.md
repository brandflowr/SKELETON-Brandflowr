# SKEL Specification v2.0

**Story Keyframe Extensible Layout**

> A flat, relational YAML format for representing visual narratives as machine-readable, human-authored story data.

---

## 1. Introduction

SKEL (Story Keyframe Extensible Layout) is a YAML-based native authoring format for encoding screenplays, storyboards, and visual narratives into a flat relational structure. It is designed for:

- AI-driven image/video generation pipelines
- Storyboard authoring tools (primary host: Genlock Studio)
- Cross-tool interchange between screenplay editors, production software, and rendering engines

`.skel` is Genlock's native story file. It is the layout of the body - acts, scenes, shots, visual setup - before the BONEs (AI pipelines defined in `.bone.json` files) are attached to it. `.skel.json` is the export and interchange form of the same data model.

### 1.1 Design Principles

- **Flat over nested**: Acts, scenes, and shots are top-level arrays linked by ID references, not deep nesting.
- **Relational**: Any entity can be queried directly by ID without tree traversal.
- **Human-authored**: YAML block structure keeps files readable and writable by creators, not just tools.
- **Compact**: Shorthand tokens keep file sizes small; a key file expands them to full definitions.
- **Validatable**: A companion JSON Schema enables programmatic validation by any standard tool.
- **Extensible**: Reserved `extensions` objects with `x-` namespacing allow vendor-specific data without breaking the core spec.

### 1.2 File Convention

| Property       | Value                                                   |
| -------------- | ------------------------------------------------------- |
| File extension | `.skel`                                                 |
| Format         | YAML (UTF-8)                                            |
| MIME type      | `application/skel+yaml`                                 |
| JSON export    | `.skel.json` - portability format, same structure       |
| Schema URI     | `https://raw.githubusercontent.com/brandflowr/SKELETON-Brandflowr/main/spec/skel.schema.json` |

---

## 2. Document Structure

A SKEL document is a YAML mapping with the following top-level keys. The `.skel.json` export uses the same keys as a JSON object:

```
{
  "$schema": "...",
  "skel_version": "2.0",
  "metadata": { ... },
  "bone_registry": { ... },
  "acts": [ ... ],
  "scenes": [ ... ],
  "shots": [ ... ],
  "characters": [ ... ],
  "environments": [ ... ],
  "audio_assets": [ ... ],
  "story_analysis": { ... },
  "production": { ... },
  "key_file": "..." | { ... }
}
```

`characters`, `environments`, `audio_assets`, `story_analysis`, and `production` are optional (see §2.7).

### 2.1 `skel_version` (required)

A semver string identifying the spec version. Parsers MUST reject documents with an unsupported major version.

### 2.2 `metadata` (required)

| Field        | Type   | Required | Description                                      |
| ------------ | ------ | -------- | ------------------------------------------------ |
| `story_id`   | string | yes      | UUID v4 identifier for the story.                |
| `title`      | string | yes      | Human-readable title.                            |
| `lifecycle`  | string | no       | Validation mode: `draft`, `production`, or `export`. Defaults to `draft`. |
| `logline`    | string | no       | One-sentence summary (max 280 chars).            |
| `subtitle`   | string | no       | Secondary title.                                 |
| `author`     | string | no       | Author or team name.                             |
| `director`   | string | no       | Director name.                                   |
| `writer`     | string | no       | Writer name.                                     |
| `genre`      | string | no       | Genre label.                                     |
| `classification` | string | no   | Content rating or classification label.          |
| `target_audience` | string | no  | Intended audience description.                   |
| `target_duration_seconds` | number | no | Target runtime in seconds.                |
| `target_duration_minutes` | number | no | Target runtime in minutes.                |
| `budget_range` | string | no     | Budget descriptor.                               |
| `status`     | string | no       | Free-form production status label. Distinct from per-shot `status.image`/`status.video`. |
| `content_warnings` | string[] | no | Content warning labels.                        |
| `tags`       | string[] | no     | Free-form tags.                                  |
| `production_notes` | string | no | Project-level production notes.                  |
| `created_at` | string | no       | ISO 8601 datetime.                               |
| `modified_at`| string | no       | ISO 8601 datetime.                               |
| `skin_key`   | string | no       | Reference to a visual style/skin preset.         |
| `constraints`| object | no       | Extensible project config.                       |
| `bones`      | object | no       | Project-wide BONE defaults (see BONE Spec).      |
| `extensions` | object | no       | Vendor-specific metadata (see §6).               |

### 2.3 `acts` (required)

An ordered array of Act objects.

| Field         | Type     | Required | Description                              |
| ------------- | -------- | -------- | ---------------------------------------- |
| `id`          | string   | yes      | Unique act identifier (e.g., `act_1`).   |
| `order`       | number   | no       | Sequential ordering index.               |
| `title`       | string   | yes      | Act title.                               |
| `scene_refs`  | string[] | yes      | Ordered array of scene IDs in this act.  |
| `extensions`  | object   | no       | Vendor-specific data.                    |

### 2.4 `scenes` (required)

An ordered array of Scene objects.

| Field             | Type     | Required | Description                                          |
| ----------------- | -------- | -------- | ---------------------------------------------------- |
| `id`              | string   | yes      | Unique scene identifier (e.g., `sc_1`).              |
| `act_id`          | string   | yes      | Canonical back-reference to parent act.              |
| `order`           | number   | no       | Sequential ordering index.                           |
| `header`          | string   | yes      | Screenplay-format slug line (e.g., `INT. OFFICE - DAY`). |
| `loc`             | object   | yes      | Parsed location object (see §2.4.1).                |
| `location_ref`    | string   | no       | Reference ID for a studio location asset.            |
| `environment_ref` | string   | no       | Reference ID for a studio environment asset.         |
| `shot_refs`       | string[] | yes      | Ordered array of shot IDs in this scene.             |
| `narrative`       | string   | no       | Scene-level narrative summary.                       |
| `notes`           | string   | no       | Essential production or directorial notes.           |
| `duration_seconds`| number   | no       | Estimated scene duration in seconds.                 |
| `mood`            | string   | no       | Scene-level emotional mood description.              |
| `key_story_elements` | string[] | no    | Story elements this scene must convey.               |
| `bones`           | object   | no       | BONE data keyed by bone_id (see BONE Spec).          |
| `intent`          | object   | no       | Creative purpose and structural role of the scene. See §2.6.1. |
| `creative_status` | string   | no       | Story-development status. See §2.6.2.                |
| `extensions`      | object   | no       | Vendor-specific data.                                |

#### 2.4.1 `loc` Object

| Field  | Type   | Required | Description                                      |
| ------ | ------ | -------- | ------------------------------------------------ |
| `type` | string | yes      | One of: `INT`, `EXT`, `INT/EXT`.                 |
| `name` | string | yes      | Location name (e.g., `LIGHTHOUSE`).              |
| `tod`  | string | yes      | Time of day token (see §4 Key File).             |

### 2.5 `shots` (required)

An ordered array of Shot objects. This is the primary unit of SKEL.

| Field            | Type     | Required | Description                                        |
| ---------------- | -------- | -------- | -------------------------------------------------- |
| `id`             | string   | yes      | Unique shot identifier (e.g., `sh_1`).             |
| `scene_id`       | string   | yes      | Back-reference to parent scene.                    |
| `order`          | number   | no       | Sequential ordering index.                         |
| `title`          | string   | no       | Short shot title for display.                      |
| `action`         | string   | yes      | Action description (max 200 chars).                |
| `visual_focus`   | string   | no       | What the eye should land on in the frame.          |
| `bones`          | object   | no       | BONE data keyed by bone_id (see BONE Spec).        |
| `dialogue`       | string \| object | no | Spoken dialogue: a plain string, or a structured `Dialogue` object (`text`, `character_ref`, timing, `emotion`, `delivery_notes`, `voice_settings`). |
| `character_refs` | string[] | no       | IDs of characters present.                         |
| `duration`       | number   | no       | Estimated duration in seconds.                     |
| `notes`           | string   | no       | Context, setup details, or production notes.         |
| `status`          | object   | no       | Production status object (`image`, `video`).         |
| `v_setup`         | object   | yes      | Visual setup object (see §2.5.1).                    |
| `cinematography`  | object   | no       | Verbose camera/lighting detail (`focal_length`, `lens_type`, `focus_subject`, `framing_notes`, `depth_of_field`, `lighting`). `v_setup` remains the canonical shorthand. |
| `sound_effects`   | array    | no       | Sound cues for this shot.                            |
| `intent`          | object   | no       | Creative purpose and beat for this shot. See §2.6.1. |
| `creative_status` | string   | no       | Story-development status. See §2.6.2.                |
| `extensions`      | object   | no       | Vendor-specific data.                                |

#### 2.5.1 `v_setup` Object

| Field   | Type   | Required | Description                                     |
| ------- | ------ | -------- | ----------------------------------------------- |
| `size`  | string | yes      | Shot size token (see §4).                       |
| `angle` | string | yes      | Camera angle token (see §4).                    |
| `lens`   | string | no       | Lens type token (see §4).                       |
| `move`   | string | no       | Camera movement token (see §4).                 |
| `light`  | string | no       | Lighting style token (see §4).                  |
| `dof`    | string | no       | Depth of field token (see §4).                  |
| `aspect` | string | no       | Aspect ratio (e.g. `16:9`, `2.39:1`).           |
| `color`  | string | no       | Color temperature or grading token (see §4).    |
| `mood`   | string | no       | Emotional lighting/mood token (see §4).         |

### 2.6 Creative Collaboration Fields

These optional fields capture the *why* behind story choices. They are separate from production status (`status.image`, `status.video`) and do not affect generation pipelines — they exist so LLMs and directors can reason about story intent and development state.

#### 2.6.1 `intent` Object

Available on both scenes and shots. All fields are optional.

**Scene intent:**

| Field            | Type   | Description                                                                          |
| ---------------- | ------ | ------------------------------------------------------------------------------------ |
| `purpose`        | string | What this scene reveals, establishes, or accomplishes for the story.                 |
| `conflict`       | string | The dramatic tension or opposition driving this scene.                               |
| `emotional_turn` | string | How the emotional state or audience feeling changes across the scene.                 |
| `story_function` | string | Structural role in the narrative: `setup`, `escalation`, `reveal`, `reaction`, `decision`, `transition`, `payoff`, or `button`. |

```yaml
intent:
  purpose: "Reveal that the machine predicts speech."
  conflict: "Mara wants certainty; Eli wants explanation."
  emotional_turn: "Curiosity becomes dread."
  story_function: reveal
```

**Shot intent:**

| Field      | Type   | Description                                                                                    |
| ---------- | ------ | ---------------------------------------------------------------------------------------------- |
| `beat`     | string | The specific story beat or moment this shot captures.                                          |
| `function` | string | Structural role within the scene: same values as scene `story_function`.                       |
| `emphasis` | string | What the shot should make the audience feel or notice. LLMs must preserve this when rewriting. |

```yaml
intent:
  beat: "The VU needle moves before Eli speaks."
  function: reveal
  emphasis: "End on the machine, not the people."
```

**Rules for LLMs:**
- When rewriting `action` or prompt text, read `intent` first and ensure the rewrite serves the same beat, function, and emphasis.
- Do not rewrite `intent` itself unless explicitly asked.

#### 2.6.2 `creative_status`

Available on both scenes and shots. A single string from a fixed vocabulary.

| Value          | Meaning                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| `idea`         | Rough concept. Structure and content may change freely.                         |
| `drafted`      | Written out but not yet reviewed.                                               |
| `needs_review` | Ready for feedback. Content should not change until reviewed.                   |
| `approved`     | Reviewed and accepted. Changes require explicit intent.                         |
| `locked`       | Frozen. LLMs and automated tools MUST NOT modify this entity's content.         |

```yaml
creative_status: needs_review
```

`creative_status` is distinct from `status.image` and `status.video`. Those track media generation progress; `creative_status` tracks story-development progress. A shot can be `creative_status: approved` with `status.image: pending` (the words are locked, but the image has not been generated yet).

### 2.7 Optional Top-Level Collections

A SKEL document MAY embed snapshots of studio-level assets so exported documents are self-contained. The primary reference for these assets remains by ID (host applications typically keep the canonical records in project-level files such as `studio.json`); embedding is RECOMMENDED when `metadata.lifecycle` is `export`.

| Key | Type | Description |
| --- | ---- | ----------- |
| `characters` | array | Embedded character snapshots referenced by shots' `character_refs`. |
| `environments` | array | Embedded environment snapshots referenced by scenes' `environment_ref`. |
| `audio_assets` | array | Embedded audio asset snapshots referenced by shots' `sound_effects`. |
| `story_analysis` | object | Informational story-level analysis (themes, arcs). Not used by generation pipelines. |
| `production` | object | Informational production planning data. Not used by generation pipelines. |

### 2.8 `key_file` (optional)

Either an inline key file object or a URI string pointing to an external key file. If omitted, parsers MUST use the SKEL Default Key File (see §4).

### 2.9 `bone_registry` (conditional)

`bone_registry` embeds BONE definitions keyed by `bone_id`. It is conditional because empty drafts do not need active generation tools, while BONE-bearing and exported documents must be self-describing enough for UI rendering, validation, and prompt assembly.

Rules:

- A new or empty `draft` document MAY omit `bone_registry`, or MAY include it as `{}`.
- If `metadata.bones`, `act.bones`, `scene.bones`, or `shot.bones` appears anywhere in the document, `bone_registry` MUST be present.
- Every key referenced inside an entity `bones` object MUST resolve to a matching key in `bone_registry`.
- If `metadata.lifecycle` is `export`, `bone_registry` MUST be present. It MAY be `{}` only when the exported document contains no BONE data.
- In `export` lifecycle, every referenced BONE definition embedded in `bone_registry` MUST satisfy the BONE definition schema.

The JSON Schema can require `bone_registry` when BONE data is present, but exact key matching between entity `bones` objects and `bone_registry` is a referential integrity check performed by validators.

---

## 3. Constraints

### 3.1 Document Lifecycle

SKEL documents MAY declare a lifecycle mode in `metadata.lifecycle`. If omitted, parsers MUST treat the document as `draft`.

Allowed values:

| Value        | Meaning |
| ------------ | ------- |
| `draft`      | Work-in-progress authoring document. Empty arrays and incomplete story structure are allowed so a new Genlock project can be created before acts, scenes, or shots exist. |
| `production` | Active production document. Requires at least one act, scene, and shot, and requires non-empty `scene_refs` and `shot_refs` where those entities exist. Referential integrity MUST pass. |
| `export`     | Portable handoff document. Includes all `production` requirements and SHOULD include all data needed by external tools, including embedded BONE definitions when BONE data exists. |

Lifecycle controls validation strictness only. It does not change the SKEL data model.

### 3.2 Front-Loading

The `action` field MUST be derived from the **beginning** of the source paragraph. This keeps `action` tight and human-readable; expansive generation text belongs in BONE prompt fields (see BONE Spec §2.4 Prompt Assembly), which are fed directly to generative AI pipelines.

### 3.3 ID Uniqueness

All `id` fields across acts, scenes, and shots MUST be unique within a single SKEL document. Recommended format: `nanoid(12)` or UUID v4.

### 3.4 Referential Integrity

- Every `scene_refs` entry in an act MUST correspond to a scene `id`.
- Every `shot_refs` entry in a scene MUST correspond to a shot `id`.
- Every `act_id` on a scene MUST correspond to an act `id`. The `act_id` is the canonical source of truth; `scene_refs` is a navigational index.
- Every `scene_id` on a shot MUST correspond to a scene `id`.

Parsers MUST validate referential integrity and SHOULD report broken references as errors.

### 3.5 Character Limits

| Field    | Max Length |
| -------- | ---------- |
| `action` | 200 chars  |
| `logline`| 280 chars  |

---

## 4. Key File

The key file maps shorthand tokens to full production definitions. It enables compact `.skel` files while preserving rich metadata for rendering engines.

### 4.1 Token Categories

| Category | Tokens                                                        |
| -------- | ------------------------------------------------------------- |
| `size`   | `ws`, `mws`, `ms`, `mcu`, `cu`, `ecu`, `pov`, `ots`, `2s`   |
| `angle`  | `eye`, `low`, `high`, `dutch`, `bird`, `worm`                 |
| `lens`   | `wide`, `std`, `tele`, `macro`, `anamorphic`                  |
| `move`   | `static`, `pan`, `tilt`, `dolly`, `crane`, `handheld`, `steadicam`, `drone` |
| `light`  | `natural`, `noir`, `high_key`, `low_key`, `golden`, `blue`, `practical`, `neon` |
| `tod`    | `DAY`, `NIGHT`, `DAWN`, `DUSK`, `CONT`                       |
| `dof`    | `deep`, `shallow`, `rack`                                     |
| `color`  | `warm`, `cool`                                                |
| `mood`   | `tense`, `romantic`                                           |

`tod` tokens are uppercase as a deliberate exception to the lowercase-token convention: they mirror screenplay slug-line time-of-day notation (`INT. LIGHTHOUSE - NIGHT`) and appear in `loc.tod`, not `v_setup`.

### 4.2 Default Fallbacks

If a token is not found in the active key file, parsers MUST apply these defaults:

| Category | Default   |
| -------- | --------- |
| `size`   | `ms`      |
| `angle`  | `eye`     |
| `lens`   | `std`     |
| `move`   | `static`  |
| `light`  | `natural` |
| `tod`    | `DAY`     |
| `dof`    | `deep`    |

`color` and `mood` have no defaults: if omitted, no grading or mood token is applied.

### 4.3 Custom Tokens

Vendors MAY register custom tokens by prefixing them with `x-` (e.g., `x-genlock-dreamy`). Custom tokens MUST be defined in the key file's `custom` section.

---

## 5. Input Format (Markdown + XML Tags)

SKEL documents are typically generated by parsing a Markdown treatment. To ensure parser precision, the input SHOULD use XML-style tags as guardrails.

### 5.1 Tag Syntax

```markdown
## INT. LIGHTHOUSE - NIGHT

<shot cam="cu" angle="high" light="noir">
Harlan Morse hunches over the logbook, scrawling coordinates by candlelight.
</shot>

<shot cam="ws" angle="eye" light="golden">
The lighthouse beam sweeps across the fog-choked coastline.
</shot>
```

### 5.2 Attribute Injection

Tags MAY include `v_setup` attributes directly. The parser extracts these before processing the inner text as the `action` field.

### 5.3 Validation

Parsers SHOULD validate the raw Markdown input for:
- Properly closed tags
- Valid token values in tag attributes

Scene shot counts are unrestricted (see ADR-003 in `DECISIONS.md`); importers MUST NOT drop or split shots to satisfy an arbitrary per-scene maximum.

---

## 6. Extensibility

### 6.1 Extensions Object

Every SKEL entity (metadata, act, scene, shot) includes an optional `extensions` object. Vendors MUST namespace their keys:

```json
{
  "extensions": {
    "x-genlock": {
      "production_status": "approved",
      "cost_estimate": 12.50
    },
    "x-runway": {
      "model": "gen3-alpha",
      "motion_score": 0.8
    }
  }
}
```

### 6.2 Rules

- Extensions MUST NOT override core SKEL fields.
- Parsers MUST ignore unrecognized extension namespaces without error.
- Extensions are NOT validated by the core JSON Schema; vendors MAY provide supplementary schemas.

### 6.3 Genlock Proposals (`extensions.x-genlock.proposals`)

Genlock MAY store AI-assisted proposed changes under the `x-genlock` extension namespace. Proposals are intentionally extension data, not core SKEL fields, so the base schema stays vendor-neutral.

Proposals MAY be stored on the entity they affect (`metadata`, `act`, `scene`, or `shot`). If stored at a broader scope, include `target` to identify the affected entity.

```yaml
extensions:
  x-genlock:
    proposals:
      - id: prop_123
        by: codex
        type: rewrite_scene
        status: pending
        summary: "Tighten the reveal around the tape deck."
        target:
          entity: scene
          id: sc_1
        rationale: "The current reveal happens before the audience understands the risk."
```

Required proposal fields:

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable proposal ID. SHOULD use `prop_` prefix, e.g. `prop_123`. |
| `by` | string | Author or agent identifier, e.g. `codex`, `claude`, `user`. |
| `type` | string | Proposal type. See allowed values below. |
| `status` | string | Proposal status. See allowed values below. |
| `summary` | string | Short human-readable description of the proposed change. |

Optional proposal fields:

| Field | Type | Description |
|---|---|---|
| `target` | object | Explicit target when the proposal is stored above or outside the affected entity. |
| `rationale` | string | Why the change is suggested. |
| `patch` | object | Optional machine-readable change payload. Shape depends on proposal type. |
| `created_at` | string | ISO 8601 creation timestamp. |
| `updated_at` | string | ISO 8601 update timestamp. |
| `resolved_at` | string | ISO 8601 timestamp for accepted/rejected/superseded proposals. |

Allowed statuses:
- `pending`
- `accepted`
- `rejected`
- `superseded`

Allowed types:
- `add_scene`
- `rewrite_scene`
- `add_shots`
- `rewrite_shot`
- `add_bone_prompts`
- `structure_note`
- `continuity_fix`

Agents MUST NOT silently apply a proposal by changing the proposal object alone. Accepted proposals should either be applied to the affected SKEL entity and marked `accepted`, or left as `pending` until the user confirms. Rejected and superseded proposals SHOULD remain in place as history unless the user explicitly asks to remove them.

The supplementary schema for Genlock extension data is `SKEL/spec/x-genlock.schema.json`.

---

## 7. Interchange

### 7.1 Import Sources

| Format                | Mapping Strategy                                                |
| --------------------- | --------------------------------------------------------------- |
| Fountain (`.fountain`)| Scene headings → scenes, action blocks → shots.                |
| Final Draft (`.fdx`)  | XML scene elements → scenes, action/dialogue → shots.          |
| Plain Markdown        | `## Heading` → scenes, paragraphs → shots.                     |

### 7.2 Export Targets

| Format                | Mapping Strategy                                                |
| --------------------- | --------------------------------------------------------------- |
| Genlock MasterStory| Direct mapping: scenes → MasterScene, shots → MasterShot.      |
| OpenTimelineIO        | Shots → clips on a timeline track.                              |
| CSV                   | Flat shot table for spreadsheet workflows.                      |

---

## 8. Versioning

SKEL uses semantic versioning (`MAJOR.MINOR.PATCH`).

- **MAJOR** increments indicate breaking changes. Parsers MUST reject documents with unsupported major versions.
- **MINOR** increments indicate additive, backward-compatible changes. Parsers SHOULD accept documents with higher minor versions gracefully.
- **PATCH** increments indicate clarifications, example fixes, and documentation updates with no data-model change.

The `skel_version` field in documents MAY omit the patch component (e.g., `"2.0"`).

---

## 9. Reference Implementation

A conforming SKEL implementation MUST:

1. Parse a `.skel` YAML file as the native authoring format.
2. Validate the parsed SKEL data model against the JSON Schema (Draft 7).
3. Export `.skel.json` only as an explicit portability/interchange action.
4. Validate referential integrity across acts, scenes, and shots.
5. Resolve shorthand tokens via the key file (inline or external).
6. Apply default fallbacks for missing tokens.

---

## License

This specification is released under the [MIT License](https://opensource.org/licenses/MIT).
