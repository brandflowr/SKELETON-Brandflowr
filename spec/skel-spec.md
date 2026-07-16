# SKEL Specification v2.9

**Story Keyframe Extensible Layout**

> A flat, relational YAML format for representing visual narratives as machine-readable, human-authored story data.

---

## 1. Introduction

SKEL (Story Keyframe Extensible Layout) is a YAML-based native authoring format for encoding screenplays, storyboards, and visual narratives into a flat relational structure. It is designed for:

- AI-driven image/video generation pipelines
- Storyboard authoring tools
- Cross-tool interchange between screenplay editors, production software, and rendering engines

`.skel` is the layout of the body - acts, scenes, shots, visual setup - before the BONEs (AI pipelines defined in `.bone.json` files) are attached to it. `.skel.json` is the export and interchange form of the same data model. Host-application specifics (including those of Genlock Studio, the primary host) live in host profile documents, not in this core specification — see `GENLOCK_HOST_PROFILE.md`.

### 1.1 Conformance Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC 2119] [RFC 8174] when, and only when, they appear in all capitals, as shown here.

Terms used throughout the SKEL, BONE, and MUSCLE specifications:

| Term | Meaning |
| ---- | ------- |
| **parser** | Software that reads `.skel` YAML (or `.skel.json`) into the SKEL data model. |
| **validator** | Software that checks a parsed document against the JSON Schema, the referential integrity rules (§3.4), and the lifecycle rules (§3.1). |
| **importer** | Software that converts another format (Fountain, FDX, OTIO, CSV, ...) into a SKEL document. |
| **exporter** | Software that converts a SKEL document into another format. |
| **host** | An application that opens SKEL projects and executes BONE/MUSCLE plugins (e.g. Genlock Studio, the `skel` CLI, an LLM agent runtime). |

Conformance classes for implementations are defined in §9.

### 1.2 Design Principles

- **Flat over nested**: Acts, scenes, and shots are top-level arrays linked by ID references, not deep nesting.
- **Relational**: Any entity can be queried directly by ID without tree traversal.
- **Human-authored**: YAML block structure keeps files readable and writable by creators, not just tools.
- **Compact**: Shorthand tokens keep file sizes small; a key file expands them to full definitions.
- **Validatable**: A companion JSON Schema enables programmatic validation by any standard tool.
- **Extensible**: Reserved `extensions` objects with `x-` namespacing allow vendor-specific data without breaking the core spec.

### 1.3 File Convention

| Property       | Value                                                   |
| -------------- | ------------------------------------------------------- |
| File extension | `.skel`                                                 |
| Format         | YAML (UTF-8)                                            |
| Media type     | `application/vnd.skel+yaml` (interim vendor-tree type; IANA registration of `application/skel+yaml` under RFC 9512 is the intended end state) |
| JSON export    | `.skel.json` - portability format, same structure       |
| Schema URI     | `https://raw.githubusercontent.com/brandflowr/SKELETON-Brandflowr/v2.9.0/spec/skel.schema.json` (versioned, immutable; `main` carries the latest — see §8.1) |

**Editor modeline (RECOMMENDED):** placing this comment as the first line of a `.skel` file gives every VS Code / yaml-language-server user validation and token autocomplete for free:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/brandflowr/SKELETON-Brandflowr/v2.9.0/spec/skel.schema.json
skel_version: "2.0"
```

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
  "locations": [ ... ],
  "props": [ ... ],
  "audio_assets": [ ... ],
  "music_cues": [ ... ],
  "story_analysis": { ... },
  "production": { ... },
  "key_file": "..." | { ... }
}
```

`characters`, `environments`, `locations`, `props`, `audio_assets`, `music_cues`, `story_analysis`, and `production` are optional (see §2.7).

### 2.1 `skel_version` (required)

A semver string identifying the spec version. `MAJOR.MINOR` is required and the `PATCH` component MAY be included (`"2.0"` and `"2.0.1"` are both valid). Parsers MUST reject documents with an unsupported major version and SHOULD accept documents with a higher minor version gracefully (§8). Documents SHOULD declare the lowest version whose features they use.

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
| `target_duration_seconds` | number | no | Target runtime in seconds. **Canonical** duration field. |
| `target_duration_minutes` | number | no | Target runtime in minutes. Derived display value only; when both fields are present and disagree by more than one second, validators SHOULD warn (`DURATION_CONFLICT`) and consumers MUST prefer `target_duration_seconds`. |
| `budget_range` | string | no     | Budget descriptor.                               |
| `status`     | string | no       | Free-form production status label. Distinct from per-shot `status.image`/`status.video`. |
| `language`   | string | no       | Project default language as a BCP 47 tag (e.g. `en`, `en-US`, `pt-BR`). Per-line overrides live on `Dialogue.lang`. |
| `content_warnings` | string[] | no | Content warning labels.                        |
| `tags`       | string[] | no     | Free-form tags.                                  |
| `production_notes` | string | no | Project-level production notes.                  |
| `created_at` | string | no       | ISO 8601 datetime.                               |
| `modified_at`| string | no       | ISO 8601 datetime.                               |
| `skin_key`   | string | no       | Reference to a visual style/skin preset. Resolves to a skin `id` in the studio registry (see `studio-spec.md`). |
| `series`     | object | no       | Episode marker linking this document into a series (see §2.2.1). |
| `delivery`   | object | no       | Delivery facts: frame rate, resolution, color (see §2.2.2). |
| `source`     | object | no       | Import provenance: `format` (required), `file`, `tool`, `imported_at`. Enables lossless round-trips per ADR-016. |
| `plugins`    | array  | no       | Host-owned record of MUSCLE plugins whose patches were applied: `{id, version, last_ran}`. Reproducibility metadata only; documents with unknown plugin records MUST still load. MUSCLEs cannot patch this field. |
| `constraints`| object | no       | Extensible project config.                       |
| `bones`      | object | no       | Project-wide BONE defaults (see BONE Spec).      |
| `extensions` | object | no       | Vendor-specific metadata (see §6).               |

#### 2.2.1 `metadata.series` Object

Marks the document as one episode of a series. The series document itself (seasons, episode index, arcs, shared cast) lives in the studio registry (`studio-spec.md` §5).

| Field | Type | Required | Description |
|---|---|---|---|
| `series_id` | string | yes | Series ID in the studio registry. |
| `series_title` | string | no | Display convenience; the registry title is canonical. |
| `season` | integer | no | Season number. |
| `episode` | integer | no | Episode number within the season. |
| `episode_code` | string | no | Display code such as `S01E03`. SHOULD match the registry's episode entry. |
| `arc_refs` | string[] | no | Arc IDs from the series document this episode advances. |
| `previously` | string[] | no | `story_id`s of episodes whose events this episode assumes. |

```yaml
metadata:
  series:
    series_id: srs_lastsignal
    series_title: The Last Signal
    season: 1
    episode: 3
    episode_code: S01E03
    arc_refs: [arc_signal_origin]
    previously: [str_ep2_storyid]
```

#### 2.2.2 `metadata.delivery` Object

The production facts that timecode math, OTIO/NLE export, and render pipelines require. All fields optional; when omitted, hosts MAY assume their own defaults but exporters SHOULD warn.

| Field | Type | Description |
|---|---|---|
| `frame_rate` | number | Frames per second; the timecode base (24, 23.976, 25, 30, ...). |
| `resolution` | object | `{ width, height }` in pixels. |
| `aspect` | string | Project default aspect ratio (e.g. `"2.39:1"`). `v_setup.aspect` overrides per shot. |
| `color_space` | string | `rec709`, `srgb`, `p3-d65`, `rec2020`, `aces-cct`, or an `x-` custom. |
| `audio` | object | `{ sample_rate, channels, loudness_target_lufs }`. |

```yaml
metadata:
  delivery:
    frame_rate: 24
    resolution: { width: 3840, height: 2160 }
    aspect: "2.39:1"
    color_space: rec709
    audio: { sample_rate: 48000, channels: 2, loudness_target_lufs: -14 }
```

### 2.3 `acts` (required)

An ordered array of Act objects.

| Field         | Type     | Required | Description                              |
| ------------- | -------- | -------- | ---------------------------------------- |
| `id`          | string   | yes      | Unique act identifier (e.g., `act_1`).   |
| `order`       | number   | no       | Derived display index (see §3.6).        |
| `title`       | string   | yes      | Act title.                               |
| `scene_refs`  | string[] | yes      | Ordered array of scene IDs in this act. Canonical ordering. |
| `bones`       | object   | no       | Act-level BONE data (see BONE Spec §5 — acts participate in the inheritance chain). |
| `extensions`  | object   | no       | Vendor-specific data.                    |

### 2.4 `scenes` (required)

An ordered array of Scene objects.

| Field             | Type     | Required | Description                                          |
| ----------------- | -------- | -------- | ---------------------------------------------------- |
| `id`              | string   | yes      | Unique scene identifier (e.g., `sc_1`).              |
| `act_id`          | string   | yes      | Canonical back-reference to parent act.              |
| `order`           | number   | no       | Derived display index (see §3.6).                    |
| `header`          | string   | yes      | Screenplay-format slug line (e.g., `INT. OFFICE - DAY`). Derived display text; `loc` is canonical (§2.4.1). |
| `loc`             | object   | yes      | Parsed location object (see §2.4.1).                |
| `location_ref`    | string   | no       | Reference to the **physical place** (a Location asset). |
| `environment_ref` | string   | no       | Reference to the **dressed/lit variant** of the place this scene plays in (an Environment asset). Environments point at their parent location via their own `location_ref`. |
| `shot_refs`       | string[] | yes      | Ordered array of shot IDs in this scene. Canonical ordering. |
| `narrative`       | string   | no       | Scene-level narrative summary.                       |
| `notes`           | string   | no       | Essential production or directorial notes.           |
| `duration_seconds`| number   | no       | Estimated scene duration in seconds.                 |
| `mood`            | string   | no       | Scene-level emotional mood description.              |
| `key_story_elements` | string[] | no    | Story elements this scene must convey.               |
| `story_time`      | string \| number | no | Sortable in-world chronological position: ISO timestamp, day number, or ordinal (see §2.4.2). |
| `time_elapsed_since_previous` | string | no | Display string for the in-world gap since the previous scene ("three days later"). |
| `narrative_mode`  | string   | no       | `present`, `flashback`, `flashforward`, `dream`, `montage`, `imagined`, or `x-` custom. Default: `present`. |
| `transition_out`  | string   | no       | Editorial transition out of the scene (see §4 `transition` category). Omitted implies a straight cut. |
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

`loc` is the canonical location record; `header` is derived display text. Validators SHOULD warn (`HEADER_LOC_MISMATCH`) when the two disagree.

**`CONT` semantics.** `tod: CONT` means continuous with the *previous scene*, where "previous" is defined by act order, then `scene_refs` order. Validators SHOULD warn (`TOD_CONT_FIRST_SCENE`) when the first scene of a document uses `CONT`. `SAME` means the same time as the previous scene, resuming after a cutaway; `LATER` means an unspecified jump forward.

#### 2.4.2 Temporal Model (nonlinear stories)

Presentation order (acts → `scene_refs`) and story chronology are different axes. `story_time` gives scenes a sortable in-world position so tools and LLMs can reason about chronology ("is the scar already there in this scene?") in flashback-structured stories. `narrative_mode` declares how a scene relates to the story's present. All three temporal fields are optional; documents without them are ordinary linear stories.

```yaml
scenes:
  - id: sc_7
    story_time: "1998-10-02T21:00:00"   # or: 12  (day number), or: 3 (ordinal)
    narrative_mode: flashback
    time_elapsed_since_previous: "twenty years earlier"
```

### 2.5 `shots` (required)

An ordered array of Shot objects. This is the primary unit of SKEL.

| Field            | Type     | Required | Description                                        |
| ---------------- | -------- | -------- | -------------------------------------------------- |
| `id`             | string   | yes      | Unique shot identifier (e.g., `sh_1`).             |
| `scene_id`       | string   | yes      | Back-reference to parent scene.                    |
| `order`          | number   | no       | Derived display index (see §3.6).                  |
| `title`          | string   | no       | Short shot title for display.                      |
| `action`         | string   | yes      | Action description (max 200 chars; see §3.2, §3.5). |
| `visual_focus`   | string   | no       | What the eye should land on in the frame.          |
| `bones`          | object   | no       | BONE data keyed by bone_id (see BONE Spec).        |
| `dialogue`       | string \| object \| array | no | Spoken dialogue: a plain string, a structured `Dialogue` object, or an ordered array of `Dialogue` objects for multi-line exchanges (see §2.5.2). |
| `character_refs` | string[] | no       | IDs of characters present.                         |
| `prop_refs`      | string[] | no       | IDs of props visible or used in this shot (continuity tracking, §2.7.3). |
| `duration`       | number   | no       | Estimated duration in seconds.                     |
| `notes`           | string   | no       | Context, setup details, or production notes.         |
| `status`          | object   | no       | Production status object (`image`, `video`). **Canonical** home of production status (see §2.5.3). |
| `v_setup`         | object   | yes      | Visual setup object (see §2.5.1).                    |
| `cinematography`  | object   | no       | Verbose camera/lighting detail (`focal_length`, `lens_type`, `focus_subject`, `framing_notes`, `depth_of_field`, `lighting`). `v_setup` remains the canonical shorthand. |
| `sound_effects`   | array    | no       | Per-shot sound cues. Score/music spanning shots belongs in `music_cues` (§2.7.4). |
| `transition_out`  | string   | no       | Editorial transition out of the shot (see §4 `transition` category). Omitted implies a straight cut. |
| `audio_description` | string | no       | Described-video text for accessibility: what a non-sighted audience needs narrated. |
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
| `aspect` | string | no       | Aspect ratio token (see §4).                    |
| `color`  | string | no       | Color grading token (see §4).                   |
| `mood`   | string | no       | Emotional mood token (see §4).                  |
| `weather`| string | no       | Weather token (see §4).                         |
| `texture`| string | no       | Film-stock / capture texture token (see §4).    |

Every token field accepts either a core enum value or an `x-` prefixed custom token declared in the key file (§4.3).

#### 2.5.2 `dialogue`

Three accepted shapes, in increasing structure:

```yaml
# 1. Plain line — speaker inferred from character_refs
dialogue: "It was me. It was always me."

# 2. Structured line
dialogue:
  text: "It was me. It was always me."
  character_ref: char_harlan
  mode: spoken            # spoken | vo | os | thought | song | radio
  lang: en                 # BCP 47; defaults to metadata.language
  emotion: "grim recognition"

# 3. Multi-line exchange inside one shot
dialogue:
  - { character_ref: char_eli,    text: "You knew.",             mode: spoken }
  - { character_ref: char_harlan, text: "I suspected.",          mode: spoken }
  - { character_ref: char_harlan, text: "I always suspected...", mode: vo }
```

`mode` gives Fountain's `(V.O.)` / `(O.S.)` a structured landing place on import (ADR-016). `subtitle` MAY carry display text that differs from the spoken text (translations, stylization). Validators SHOULD warn (`DIALOGUE_AMBIGUOUS_SPEAKER`) when a shot has more than one `character_refs` entry and a dialogue line has no `character_ref`.

#### 2.5.3 `status` (production status)

`status.image` and `status.video` each take: `not_started`, `pending`, `generating`, `review`, `approved`, `rejected`, `failed`.

- `failed` is set when a render job fails; hosts SHOULD write diagnostics to the failure log path (BONE Spec §2.6).
- **The core `status` field is canonical.** Render pipelines and the BONE write-back protocol update `shot.status`. The `extensions.x-genlock.production_status` field is a deprecated mirror kept for pre-2.9 readers; on conflict the core field wins (see `MIGRATIONS.md`).

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

Available on scenes, shots, and characters. A single string from a fixed vocabulary.

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

### 2.7 Optional Top-Level Collections — the Asset Layer

A SKEL document MAY embed snapshots of studio-level assets so exported documents are self-contained. The canonical records live in the studio registry (`studio.json`, specified in `studio-spec.md` with schema `studio.schema.json`); the primary reference is always by ID. Embedding is RECOMMENDED when `metadata.lifecycle` is `export`. Snapshot/registry precedence rules are in `studio-spec.md` §4.

| Key | Type | Description |
| --- | ---- | ----------- |
| `characters` | array | Character snapshots referenced by shots' `character_refs` (§2.7.1). |
| `environments` | array | Environment snapshots referenced by scenes' `environment_ref` (§2.7.2). |
| `locations` | array | Location snapshots referenced by scenes' and environments' `location_ref` (§2.7.2). |
| `props` | array | Prop snapshots referenced by shots' `prop_refs` and characters' `props_carried` (§2.7.3). |
| `audio_assets` | array | Audio asset snapshots referenced by `sound_effects`, `music_cues`, and environments' `soundscape_refs`. |
| `music_cues` | array | Score cues spanning shots (§2.7.4). |
| `story_analysis` | object | Informational story-level analysis (§2.7.5). Not used by generation pipelines. |
| `production` | object | Informational production planning data (§2.7.5). Not used by generation pipelines. |

#### 2.7.1 Characters

The character is the richest object in the format — character-locked generation is SKEL's flagship use case. All fields except `id` and `name` are optional.

| Group | Fields |
|---|---|
| Identity | `id`, `name`, `aliases[]`, `pronouns`, `age` / `age_range`, `species`, `role` (`protagonist`, `antagonist`, `deuteragonist`, `supporting`, `minor`, `background`, `narrator`, or `x-` custom), `archetype` |
| Appearance | `identity_lock` (see below), `height`, `build`, `hair`, `eyes`, `skin`, `distinguishing_marks[]` |
| Wardrobe | `default_wardrobe`, `wardrobe_variants[]` (`{id, label, description, scene_refs[]}`) — costume continuity per scene |
| Voice | `voice` (`{description, accent, casting, voice_settings}`) — `voice_settings` feeds TTS BONEs; per-line overrides live on `Dialogue.voice_settings` |
| Assets | `reference_sheet` (path), `reference_images[]`, `identity_refs` (`{lora, embedding, soul_id, face_ref}`), `thumbnail` |
| Narrative | `bio`, `want`, `need`, `flaw`, `arc`, `secrets[]`, `relationships[]` (`{character_ref, type, description}`) |
| Continuity | `first_appearance` (shot ref), `props_carried[]` (prop refs), `state_overrides[]` (`{scene_ref, wardrobe_ref, injuries, notes}`) |
| Workflow | `creative_status`, `notes`, `tags[]`, `bones`, `extensions` |

**`identity_lock` is the contract, not decoration.** It is the canonical 30–60-word appearance description. The `character-reference-sheet` BONE consumes it, and every downstream prompt (storyboard, video) MUST reuse it verbatim. `CharacterInjection` with `format: consistency_modifier` emits exactly this field.

```yaml
characters:
  - id: char_harlan
    name: Harlan Morse
    role: protagonist
    pronouns: he/him
    age_range: "55-65"
    identity_lock: >
      Weathered white man in his early sixties, heavy build, salt-and-pepper
      beard, deep-set gray eyes, wind-burned skin, navy wool keeper's coat
      over a cable-knit sweater, brass pocket watch on a chain.
    distinguishing_marks: ["scar through left eyebrow", "missing tip of right ring finger"]
    wardrobe_variants:
      - id: ward_storm
        label: Storm gear
        description: Yellow oilskin over the keeper's coat, sou'wester hat
        scene_refs: [sc_2]
    voice:
      description: Low, gravelled, deliberate; long pauses
      accent: Maine coastal
      voice_settings: { provider: elevenlabs, voice_id: "...", stability: 0.7 }
    identity_refs: { lora: "loras/harlan_v3.safetensors", soul_id: "hf_abc123" }
    want: To keep the light running and be left alone.
    need: To admit the signal is his own guilt, encoded.
    relationships:
      - { character_ref: char_eli, type: estranged_son, description: "Blames Harlan for the wreck." }
    first_appearance: sh_1
    creative_status: approved
```

#### 2.7.2 Environments and Locations

A **location** is the physical place (one lighthouse). An **environment** is a dressed/lit variant of it (lighthouse-interior-storm-night). Scenes point at environments via `environment_ref`; environments point at their parent location via `location_ref`; scenes MAY also point directly at the location via `location_ref`.

Environment fields: `id`, `name` (required); `loc_type` (`INT`/`EXT`/`INT/EXT`), `location_ref`, `description`, **`style_lock`** (canonical prompt text, mirroring `identity_lock`), `era_period`, `geography` (spatial layout notes — what's left of the door, where the window faces; the thing AI shot continuity always breaks), `tod_variants[]` (`{tod, lighting, description}` — the lighthouse at NIGHT is a different prompt than at DAWN), `weather_default`, `soundscape_refs[]`, `reference_images[]`, `props_present[]`, `bones`, `extensions`.

Location fields: `id`, `name` (required); `description`, `reference_images[]`, `notes`, `extensions`.

#### 2.7.3 Props

First-class continuity objects: "the brass pocket watch from `sh_1` must be on the desk in `sh_7`."

```yaml
props:
  - id: prop_watch
    name: Brass pocket watch
    description: Tarnished brass pocket watch, cracked crystal, engraved "E.M."
    significance: plot_critical   # set_dressing | recurring | plot_critical
    first_appearance: sh_1
    carried_by: char_harlan
    reference_image: assets/props/watch.png
```

Shots list visible props in `prop_refs`. `significance: plot_critical` is machine-checkable: validators SHOULD warn (`PROP_CONTINUITY`) when a plot-critical prop appears in exactly one shot — a storytelling lint no other format has.

#### 2.7.4 Music Cues

`sound_effects` is strictly per-shot. A score cue crossing eight shots lives once in the document-level `music_cues` array, anchored to shots by in/out points:

```yaml
music_cues:
  - id: cue_main_theme
    audio_ref: aud_theme
    in:  { shot_ref: sh_1, offset_seconds: 0 }
    out: { shot_ref: sh_8, offset_seconds: 2.5 }
    volume: 0.8
    notes: Swells under the reveal, ducks for dialogue.
```

`in` is required; omitted `out` means the cue runs to the end of its audio or the timeline. The audio-map sidecar remains the per-shot assignment layer; `music_cues` is the score lane.

#### 2.7.5 `story_analysis` and `production` — Recommended Shapes

Both objects remain open (`additionalProperties: true`), but the following shapes are RECOMMENDED so tools converge:

```yaml
story_analysis:
  themes: [guilt, isolation]
  motifs: [signals, repetition]
  character_arcs:
    - { character_ref: char_harlan, arc: "Denial to confession", notes: "..." }
  emotional_curve:
    - { scene_ref: sc_1, emotion: dread, intensity: 0.4 }
  pacing_notes: "Act 2 compresses; hold the basement reveal."

production:
  schedule: { boards_due: 2026-08-01 }
  budget: { currency: USD, per_bone_estimates: { seedance-2: 0.85 } }
  crew: [ { role: Director, name: "..." } ]
  generation_stats: { renders_total: 214, approved: 122 }
```

### 2.8 `key_file` (optional)

Either an inline key file object or a URI string pointing to an external key file. If omitted, parsers MUST use the SKEL Default Key File (see §4). Security constraints on external key file URIs are in §10.

### 2.9 `bone_registry` (conditional)

`bone_registry` embeds BONE definitions keyed by `bone_id`. It is conditional because empty drafts do not need active generation tools, while BONE-bearing and exported documents must be self-describing enough for UI rendering, validation, and prompt assembly.

Rules:

- A new or empty `draft` document MAY omit `bone_registry`, or MAY include it as `{}`.
- If `metadata.bones`, `act.bones`, `scene.bones`, `shot.bones`, `character.bones`, or `environment.bones` appears anywhere in the document, `bone_registry` MUST be present.
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
| `draft`      | Work-in-progress authoring document. Empty arrays and incomplete story structure are allowed so a new project can be created before acts, scenes, or shots exist. |
| `production` | Active production document. Requires at least one act, scene, and shot, and requires non-empty `scene_refs` and `shot_refs` where those entities exist. Referential integrity MUST pass. |
| `export`     | Portable handoff document. Includes all `production` requirements and SHOULD include all data needed by external tools, including embedded BONE definitions when BONE data exists and embedded asset snapshots for every referenced asset. |

Lifecycle controls validation strictness only. It does not change the SKEL data model.

### 3.2 Front-Loading

The `action` field MUST be derived from the **beginning** of the source paragraph. This keeps `action` tight and human-readable; expansive generation text belongs in BONE prompt fields (see BONE Spec §2.4 Prompt Assembly), which are fed directly to generative AI pipelines. Overflow handling on import is defined in §3.5.

### 3.3 ID Uniqueness

All `id` fields across acts, scenes, shots, and embedded asset collections (characters, environments, locations, props, audio_assets, music_cues) MUST be unique within a single SKEL document. Recommended format: `nanoid(12)` or UUID v4.

IDs and names SHOULD be compared after Unicode NFC normalization (§10.4).

### 3.4 Referential Integrity

Structural references (errors when broken):

- Every `scene_refs` entry in an act MUST correspond to a scene `id` (`ACT_SCENE_REF_MISSING`).
- Every `shot_refs` entry in a scene MUST correspond to a shot `id` (`SCENE_SHOT_REF_MISSING`).
- Every `act_id` on a scene MUST correspond to an act `id` (`SCENE_ACT_MISSING`). The `act_id` is the canonical source of truth; `scene_refs` is a navigational index.
- Every `scene_id` on a shot MUST correspond to a scene `id` (`SHOT_SCENE_MISSING`).
- Every `music_cues[].in.shot_ref` / `out.shot_ref` MUST correspond to a shot `id` (`MUSIC_CUE_SHOT_MISSING`).

Asset references. These resolve either against the embedded collection in the document or against the studio registry:

- When the corresponding embedded collection **is present**, every `character_refs` entry, `dialogue.character_ref`, `environment_ref`, `location_ref`, `prop_refs` entry, `carried_by`, and `sound_effects[].audio_ref` / `music_cues[].audio_ref` MUST resolve to it (`CHARACTER_REF_MISSING`, `ENVIRONMENT_REF_MISSING`, `LOCATION_REF_MISSING`, `PROP_REF_MISSING`, `AUDIO_REF_MISSING` — errors).
- When the embedded collection is **absent**, validators SHOULD emit the same codes as **warnings** ("resolvable only against an external studio registry") unless a registry is supplied and resolves them.

Parsers MUST validate referential integrity and SHOULD report broken references with the codes above. The complete normative error catalog is `spec/errors.md`.

### 3.5 Character Limits and Import Truncation

| Field    | Max Length |
| -------- | ---------- |
| `action` | 200 chars  |
| `logline`| 280 chars  |

**Truncation never destroys data** (ADR-016). When an importer derives `action` from a longer source paragraph, it MUST park the untruncated source under the importing format's extension namespace on the same shot — e.g. `extensions.x-fountain.full_action` — and exporters back to that format MUST restore from it.

### 3.6 Ordering Precedence

Three orderings exist: `order` fields, array order, and the `scene_refs`/`shot_refs` arrays. **The refs arrays are canonical.** `order` is derived display metadata and the top-level arrays are storage order. Validators SHOULD warn (`ORDER_MISMATCH`) when `order` values disagree with the canonical refs-array order. Writers SHOULD keep all three consistent.

---

## 4. Key File

The key file maps shorthand tokens to full production definitions. It enables compact `.skel` files while preserving rich metadata for rendering engines.

### 4.1 Token Categories

| Category | Tokens                                                        |
| -------- | ------------------------------------------------------------- |
| `size`   | `ws`, `mws`, `ms`, `mcu`, `cu`, `ecu`, `pov`, `ots`, `2s`, `est`, `fs`, `cowboy`, `ins`, `3s`, `group` |
| `angle`  | `eye`, `low`, `high`, `dutch`, `bird`, `worm`, `profile`, `three_quarter` |
| `lens`   | `wide`, `std`, `tele`, `macro`, `anamorphic`                  |
| `move`   | `static`, `pan`, `tilt`, `dolly`, `crane`, `handheld`, `steadicam`, `drone`, `zoom_in`, `zoom_out`, `dolly_zoom`, `arc`, `truck`, `pedestal`, `whip_pan`, `roll`, `push_in`, `pull_out` |
| `light`  | `natural`, `noir`, `high_key`, `low_key`, `golden`, `blue`, `practical`, `neon`, `silhouette`, `backlit`, `rembrandt`, `moonlight`, `firelight`, `overcast`, `harsh_sun`, `strobe`, `volumetric` |
| `tod`    | `DAY`, `NIGHT`, `DAWN`, `DUSK`, `MORNING`, `AFTERNOON`, `EVENING`, `LATER`, `SAME`, `CONT` |
| `dof`    | `deep`, `shallow`, `rack`, `split`, `tilt_shift`              |
| `aspect` | `16:9`, `9:16`, `1:1`, `4:3`, `2.39:1`, `21:9`, `4:5`, `1.85:1`, `3:2` |
| `color`  | `warm`, `cool`, `teal_orange`, `monochrome`, `sepia`, `desaturated`, `vibrant`, `pastel`, `bleach_bypass` |
| `mood`   | `tense`, `romantic`, `eerie`, `melancholic`, `hopeful`, `foreboding`, `serene`, `chaotic`, `nostalgic`, `oppressive`, `whimsical`, `triumphant` |
| `weather`| `clear`, `rain`, `heavy_rain`, `snow`, `fog`, `storm`, `wind`, `overcast`, `heat_haze` |
| `texture`| `film_35mm`, `film_16mm`, `digital_clean`, `vhs`, `grainy`    |
| `transition` | `cut`, `dissolve`, `fade_in`, `fade_out`, `smash_cut`, `match_cut`, `wipe`, `iris`, `whip` — used by `transition_out` on shots and scenes, not by `v_setup` |

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

`aspect`, `color`, `mood`, `weather`, and `texture` have no defaults: if omitted, no token is applied. An omitted `transition_out` implies a straight `cut`.

### 4.3 Custom Tokens

Vendors MAY register custom tokens by prefixing them with `x-` (e.g., `x-genlock-dreamy`). Custom tokens MUST be defined in the key file's `custom` section, and each entry MUST declare the `category` it belongs to so parsers know which token field accepts it:

```json
{
  "custom": [
    {
      "token": "x-genlock-dreamy",
      "label": "Dreamy",
      "category": "light",
      "description": "Soft-focus haze with blooming highlights."
    }
  ]
}
```

The schema accepts any `x-` prefixed value in every token field; validators SHOULD warn when an `x-` token in a document is not declared in the active key file's `custom` section (`CUSTOM_TOKEN_UNDECLARED`), and MUST error when a declared custom token is used in a field that does not match its `category` (`CUSTOM_TOKEN_CATEGORY_MISMATCH`).

---

## 5. Input Format (Markdown + XML Tags)

SKEL documents are typically generated by parsing a Markdown treatment. To ensure parser precision, the input SHOULD use XML-style tags as guardrails.

### 5.1 Tag Syntax

The canonical attribute vocabulary is exactly the `v_setup` field names (`size`, `angle`, `lens`, `move`, `light`, `dof`, `aspect`, `color`, `mood`, `weather`, `texture`):

```markdown
## INT. LIGHTHOUSE - NIGHT

<shot size="cu" angle="high" light="noir">
Harlan Morse hunches over the logbook, scrawling coordinates by candlelight.
</shot>

<shot size="ws" angle="eye" light="golden">
The lighthouse beam sweeps across the fog-choked coastline.
</shot>
```

Parsers MAY additionally accept `cam` as a deprecated alias for `size`; writers MUST NOT emit it.

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

Every SKEL entity (metadata, act, scene, shot, character, environment, location, prop, music cue) includes an optional `extensions` object. Vendors MUST namespace their keys with the `x-` prefix; since v2.9 the schema enforces this via `propertyNames`.

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
- Parsers MUST ignore unrecognized extension namespaces without error, and per ADR-016 MUST preserve them on write.
- Extensions are NOT validated by the core JSON Schema; vendors MAY provide supplementary schemas.

### 6.3 Host Proposals (`extensions.x-genlock.proposals`)

Hosts MAY store AI-assisted proposed changes under their own extension namespace. Genlock Studio stores them under `x-genlock`. Proposals are intentionally extension data, not core SKEL fields, so the base schema stays vendor-neutral.

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
- `add_character`
- `rewrite_character`
- `structure_note`
- `continuity_fix`
- `continuity_note`

Agents MUST NOT silently apply a proposal by changing the proposal object alone. Accepted proposals should either be applied to the affected SKEL entity and marked `accepted`, or left as `pending` until the user confirms. Rejected and superseded proposals SHOULD remain in place as history unless the user explicitly asks to remove them.

The supplementary schema for Genlock extension data is `spec/x-genlock.schema.json`.

---

## 7. Interchange

### 7.1 Import Sources

| Format                | Mapping Strategy                                                |
| --------------------- | --------------------------------------------------------------- |
| Fountain (`.fountain`)| Scene headings → scenes, action blocks → shots, `(V.O.)`/`(O.S.)` → `dialogue.mode`. |
| Final Draft (`.fdx`)  | XML scene elements → scenes, action/dialogue → shots.          |
| Plain Markdown        | `## Heading` → scenes, paragraphs → shots.                     |

Importers are bound by ADR-016: park unmappable source data under `x-<format>` namespaces, record `metadata.source`, and never regenerate incoming IDs.

#### 7.1.1 Normative Time-of-Day Import Mapping

Screenplay formats carry more time-of-day variants than the token set. Importers MUST map as follows and MUST NOT fail or drop data on an unlisted value:

| Source text | `loc.tod` |
|---|---|
| `DAY`, `NIGHT`, `DAWN`, `DUSK`, `MORNING`, `AFTERNOON`, `EVENING` | same token |
| `CONTINUOUS`, `CONT`, `CONT.` | `CONT` |
| `SAME`, `SAME TIME` | `SAME` |
| `LATER`, `MOMENTS LATER`, `MOMENTS` | `LATER` |
| `SUNSET`, `MAGIC HOUR`, `TWILIGHT` | `DUSK` |
| `SUNRISE`, `FIRST LIGHT` | `DAWN` |
| anything else | `DAY` + park the original under `x-<format>` (e.g. `x-fountain.tod_raw`) |

### 7.2 Export Targets

| Format                | Mapping Strategy                                                |
| --------------------- | --------------------------------------------------------------- |
| Host-native story models | Direct mapping (e.g. Genlock MasterStory: scenes → MasterScene, shots → MasterShot). |
| OpenTimelineIO        | Shots → clips on a timeline track; `transition_out` → OTIO transitions; `metadata.delivery.frame_rate` → the timeline rate. |
| CSV                   | Flat shot table for spreadsheet workflows.                      |

---

## 8. Versioning

SKEL uses semantic versioning (`MAJOR.MINOR.PATCH`).

- **MAJOR** increments indicate breaking changes. Parsers MUST reject documents with unsupported major versions.
- **MINOR** increments indicate additive, backward-compatible changes. Parsers SHOULD accept documents with higher minor versions gracefully.
- **PATCH** increments indicate clarifications, example fixes, and documentation updates with no data-model change.

The `skel_version` field in documents MAY omit the patch component (e.g., `"2.0"`); the schema accepts both forms.

### 8.1 Versioned Schema URLs

Every release is tagged (`v2.9.0`) and each schema's `$id` points at its **tagged, immutable** URL:

```
https://raw.githubusercontent.com/brandflowr/SKELETON-Brandflowr/v2.9.0/spec/skel.schema.json   ← immutable
https://raw.githubusercontent.com/brandflowr/SKELETON-Brandflowr/main/spec/skel.schema.json      ← latest
```

Documents SHOULD pin the tagged URL of the release they were authored against so validation results never change under them; `main` is a convenience alias for "latest". The release process (tagging, changelog cut, `$id` bump) is defined in `GOVERNANCE.md`.

---

## 9. Conformance

### 9.1 Conformance Classes

An implementation claims one or more classes. The trademark policy (TRADEMARKS.md) conditions use of the SKEL/BONE/MUSCLE marks on conformance to the class(es) claimed, verified against the conformance corpus (§9.2).

**Reader** — MUST:
1. Parse `.skel` YAML (native) and `.skel.json` (export) into the SKEL data model.
2. Treat documents without `metadata.lifecycle` as `draft`.
3. Ignore unrecognized extension namespaces without error.
4. Apply key-file token resolution with the §4.2 default fallbacks.
5. Reject documents with an unsupported `skel_version` major.

**Writer** — MUST (in addition to Reader):
1. Emit schema-valid documents for the declared lifecycle.
2. Preserve all extension namespaces, `metadata.source`, and entity IDs on rewrite (ADR-016).
3. Use `x-` namespaced keys for any vendor data it adds.
4. Keep `order` fields, array order, and refs arrays consistent (§3.6).

**Validator** — MUST:
1. Validate against `skel.schema.json` for the selected lifecycle.
2. Enforce every MUST-level referential integrity rule in §3.4 with the normative codes in `spec/errors.md`.
3. Report errors/warnings in the `SKELValidationResult` shape with RFC 6901 paths.
4. Pass the conformance corpus: every `tests/conformance/valid/` fixture validates; every `tests/conformance/invalid/` fixture fails with the expected code.

**Full Host** — MUST (in addition to Reader, Writer, Validator):
1. Resolve BONE inheritance per BONE Spec §5 (defaults → metadata → act → scene → shot).
2. Enforce the MUSCLE contract: capability-scoped, atomic, mode-enforced patch application (MUSCLE Spec §3–4).
3. Implement the render write-back protocol for the BONE output targets it supports, updating core `shot.status`.
4. Enforce `creative_status: locked` against automated edits.

### 9.2 Conformance Corpus

`tests/conformance/` contains valid and invalid fixtures with expected error codes (`tests/conformance/manifest.json` maps fixture → expectation). Implementers self-certify by running their validator across the corpus; this repository's CI runs the reference CLI against it on every push.

---

## 10. Security Considerations

### 10.1 YAML Loading

`.skel` is YAML, and YAML loaders are a known attack surface:

- Parsers MUST use safe loading — no arbitrary tag/type construction (`yaml.safe_load`, js-yaml default `load` in v4+, or equivalent).
- Parsers MUST bound alias/anchor expansion (billion-laughs protection) and SHOULD cap document size with a configurable limit.
- Anchors and aliases are discouraged for interchange (§11); parsers MAY refuse documents whose expansion exceeds limits.

### 10.2 External Key Files

A `key_file` URI is remote content influencing prompt assembly:

- Hosts SHOULD fetch external key files once and cache them, not per-validation.
- Hosts SHOULD support an integrity-checked reference form — `key_file: { uri, sha256 }` — and MUST fail closed on hash mismatch when one is supplied.
- Hosts MUST NOT execute any content from a key file; it is data only.

### 10.3 Path Safety

Wherever the spec family resolves paths from document or plugin data (`path_template`, `{slug}`/`{shot_id}` substitutions, render write-back, `write:renders`):

- Resolved paths MUST stay inside the workspace root.
- Hosts MUST reject `..` segments, absolute paths, and symlink escapes in substituted values.

### 10.4 Unicode

Documents are UTF-8 (§1.3). IDs and names SHOULD be normalized to NFC before comparison so visually identical references resolve identically across platforms.

### 10.5 Plugin Trust

The MUSCLE plugin system executes external tools from manifests. Its trust model — no auto-enable, capability consent, argv-style invocation, resource limits, and hook-payload privacy — is normative in MUSCLE Spec §10.

---

## 11. YAML Authoring Profile

`.skel` is YAML for humans; these conventions keep files diff-friendly and safe. `spec/example.skel` is the annotated reference file for this profile.

**Safe subset.** Documents MUST NOT use custom YAML tags. Anchors/aliases and merge keys (`<<:`) are NOT RECOMMENDED for interchange — expand them before sharing; parsers MAY reject documents that exceed expansion limits (§10.1).

**Block scalars.** Use `>` (folded) for prose fields — `action`, `identity_lock`, `narrative`, BONE prompt text — so long text wraps without embedded `\n` noise. Use `|` (literal) only when line breaks are meaningful (lyrics, ASCII layout).

```yaml
action: >
  Harlan Morse hunches over the logbook,
  scrawling coordinates by candlelight.
```

**Comments.** `#` comments are for humans and are not part of the data model. Tools that rewrite `.skel` files SHOULD use a comment-preserving YAML library when possible; comment loss is not a conformance violation but is hostile to authors.

**Quoting.** Quote strings that YAML would otherwise mistype: version numbers (`"2.0"`), aspect ratios (`"16:9"`), ISO timestamps (`"2025-01-15T10:00:00Z"` — bare, they parse as YAML date objects, not strings), `"yes"`/`"no"`/`"on"`/`"off"`, and anything starting with `*`, `&`, `?`, or `%`.

**Canonical key order (RECOMMENDED, for clean git diffs).** Top level: `skel_version`, `metadata`, `bone_registry`, `acts`, `scenes`, `shots`, asset collections, `story_analysis`, `production`, `key_file`. Within entities: `id` first, structural refs second, content fields, then `status`/`intent`/`creative_status`, then `bones`, then `extensions` last. Writers SHOULD emit keys in this order and keep one array item per block sequence entry.

**SKEL and version control.** A stable serialization order (above) plus block scalars makes `story.skel` a well-behaved git citizen: edits produce local diffs, and merges conflict only where the story actually changed. Hosts SHOULD write files with a trailing newline and LF line endings.

---

## License

This specification is released under the [MIT License](https://opensource.org/licenses/MIT).
