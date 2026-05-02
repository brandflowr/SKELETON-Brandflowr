# SKEL Specification v2.0

**Visual Relational Action Data**

> A flat, relational JSON format for representing visual narratives as machine-readable, validatable story data.

---

## 1. Introduction

SKEL (Visual Relational Action Data) is a JSON-based interchange format for encoding screenplays, storyboards, and visual narratives into a flat relational structure. It is designed for:

- AI-driven image/video generation pipelines
- Storyboard authoring tools
- Cross-tool interchange between screenplay editors, production software, and rendering engines

### 1.1 Design Principles

- **Flat over nested**: Acts, scenes, and shots are top-level arrays linked by ID references, not deep nesting.
- **Relational**: Any entity can be queried directly by ID without tree traversal.
- **Compact**: Shorthand tokens keep file sizes small; a key file expands them to full definitions.
- **Validatable**: A companion JSON Schema enables programmatic validation by any standard tool.
- **Extensible**: Reserved `extensions` objects allow vendor-specific data without breaking the core spec.

### 1.2 File Convention

| Property       | Value                    |
| -------------- | ------------------------ |
| File extension | `.skel` or `.skel.json`  |
| MIME type      | `application/SKEL+json`  |
| Encoding       | UTF-8                    |
| Schema URI     | `https://Spore.dev/schemas/SKEL/v2.0/skel.schema.json` |

---

## 2. Document Structure

A SKEL document is a single JSON object with the following top-level keys:

```
{
  "$schema": "...",
  "skel_version": "2.0",
  "metadata": { ... },
  "bone_registry": { ... },
  "acts": [ ... ],
  "scenes": [ ... ],
  "shots": [ ... ],
  "key_file": "..." | { ... }
}
```

### 2.1 `skel_version` (required)

A semver string identifying the spec version. Parsers MUST reject documents with an unsupported major version.

### 2.2 `metadata` (required)

| Field        | Type   | Required | Description                                      |
| ------------ | ------ | -------- | ------------------------------------------------ |
| `story_id`   | string | yes      | UUID v4 identifier for the story.                |
| `title`      | string | yes      | Human-readable title.                            |
| `logline`    | string | no       | One-sentence summary (max 280 chars).            |
| `author`     | string | no       | Author or team name.                             |
| `created_at` | string | no       | ISO 8601 datetime.                               |
| `modified_at`| string | no       | ISO 8601 datetime.                               |
| `skin_key`   | string | no       | Reference to a visual style/skin preset.         |
| `constraints`| object | no       | Extensible config, e.g., `max_shots_per_scene`.  |
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
| `action`         | string   | yes      | Action description (max 200 chars).                |
| `bones`          | object   | no       | BONE data keyed by bone_id (see BONE Spec).        |
| `dialogue`       | string   | no       | Spoken dialogue for this shot.                     |
| `character_refs` | string[] | no       | IDs of characters present.                         |
| `duration`       | number   | no       | Estimated duration in seconds.                     |
| `notes`          | string   | no       | Context, setup details, or production notes.       |
| `status`         | object   | no       | Production status object (`image`, `video`).       |
| `v_setup`        | object   | yes      | Visual setup object (see §2.5.1).                  |
| `extensions`     | object   | no       | Vendor-specific data.                              |

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

### 2.6 `key_file` (optional)

Either an inline key file object or a URI string pointing to an external key file. If omitted, parsers MUST use the SKEL Default Key File (see §4).

---

## 3. Constraints

### 3.1 Shot Limit

A scene SHOULD adhere to the shot limit defined in `metadata.constraints.max_shots_per_scene`. If omitted, the default constraint is **4 shots**. 

> **Rationale**: Enforcing a shot limit keeps visual narratives concise and prevents AI generation pipelines from producing unbounded output, but it must be configurable for longer narrative scenes.

### 3.2 Front-Loading

The `action` field MUST be derived from the **beginning** of the source paragraph. This ensures human readability remains tight, while the decoupled `prompts` object can contain expansive text directly fed to generative AI pipelines.

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

### 4.3 Custom Tokens

Vendors MAY register custom tokens by prefixing them with `x-` (e.g., `x-Spore-dreamy`). Custom tokens MUST be defined in the key file's `custom` section.

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
- No more than 4 `<shot>` tags per scene heading

---

## 6. Extensibility

### 6.1 Extensions Object

Every SKEL entity (metadata, act, scene, shot) includes an optional `extensions` object. Vendors MUST namespace their keys:

```json
{
  "extensions": {
    "x-Spore": {
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
| Spore MasterStory| Direct mapping: scenes → MasterScene, shots → MasterShot.      |
| OpenTimelineIO        | Shots → clips on a timeline track.                              |
| CSV                   | Flat shot table for spreadsheet workflows.                      |

---

## 8. Versioning

SKEL uses semantic versioning (`MAJOR.MINOR`).

- **MAJOR** increments indicate breaking changes. Parsers MUST reject documents with unsupported major versions.
- **MINOR** increments indicate additive, backward-compatible changes. Parsers SHOULD accept documents with higher minor versions gracefully.

---

## 9. Reference Implementation

A conforming SKEL implementation MUST:

1. Parse a `.skel.json` file and validate it against the JSON Schema (Draft 7).
2. Enforce the 4-shot limit per scene.
3. Validate referential integrity across acts, scenes, and shots.
4. Resolve shorthand tokens via the key file (inline or external).
5. Apply default fallbacks for missing tokens.

---

## License

This specification is released under the [MIT License](https://opensource.org/licenses/MIT).
