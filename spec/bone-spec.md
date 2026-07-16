# BONE Specification v1.1

**Base Object Narrative Export**

> A pluggable definition format for attaching AI generation config, production metadata, or any structured data to SKEL story entities.

Conformance language (MUST/SHOULD/MAY) follows skel-spec.md §1.1 (BCP 14).

---

## 1. Introduction

BONE (Base Object Narrative Export) is a plugin system for SKEL. While SKEL defines the story structure (acts, scenes, shots, visual setup), BONEs define everything that *acts on* that structure — AI image generators, video generators, audio tools, style systems, or any custom pipeline.

BONEs exist because the AI generation landscape changes faster than any spec can keep up with. Rather than hardcoding prompt formats into SKEL, BONEs let you swap generators, add new tools, and create custom pipelines without touching the core story format.

### 1.1 Design Principles

- **Replaceable**: Any BONE can be swapped for another without altering the story structure.
- **Self-describing**: A BONE definition declares its own fields, types, defaults, and UI hints.
- **Inheritable**: BONEs cascade — project defaults → act → scene → shot overrides.
- **Portable**: On export, BONE definitions embed into the SKEL file. One JSON, everything included.
- **Open**: BONE data on entities is a fully open object. The definition file describes the expected shape, but the schema doesn't constrain it.

### 1.2 File Convention

| Property       | Value                      |
| -------------- | -------------------------- |
| File extension | `.bone.json`               |
| Media type     | `application/vnd.skel.bone+json` |
| Encoding       | UTF-8                      |
| Schema URI     | `https://raw.githubusercontent.com/brandflowr/SKELETON-Brandflowr/v2.9.0/spec/bone.schema.json` (versioned, immutable; `main` carries the latest — see skel-spec.md §8.1) |

---

## 2. BONE Definition File

A `.bone.json` file describes a single tool, generator, or pipeline attachment. It declares what fields it expects, what types they are, what defaults to use, and how a UI should render them.

### 2.1 Structure

```json
{
  "bone_id": "flux-dev",
  "bone_version": "1.0",
  "label": "Flux Dev (Image Generation)",
  "description": "Flux Dev image generation with prompt, negative prompt, and guidance control.",
  "target": "image",
  "attaches_to": ["shot", "scene", "metadata"],
  "fields": {
    "text":     { "type": "string",  "required": true,  "ui": "textarea", "label": "Prompt" },
    "negative": { "type": "string",  "required": false, "ui": "textarea", "label": "Negative Prompt" },
    "guidance": { "type": "number",  "required": false, "ui": "slider",   "label": "Guidance Scale", "min": 1, "max": 20, "default": 7.5 },
    "seed":     { "type": "number",  "required": false, "ui": "number",   "label": "Seed" }
  },
  "defaults": {
    "guidance": 7.5
  }
}
```

### 2.2 Fields

| Field          | Type     | Required | Description                                                    |
| -------------- | -------- | -------- | -------------------------------------------------------------- |
| `bone_id`      | string   | yes      | Unique identifier. Lowercase, hyphens allowed.                 |
| `bone_version` | string   | yes      | Semver version of this BONE definition (`MAJOR.MINOR`, PATCH optional). |
| `label`        | string   | yes      | Human-readable name for UI display.                            |
| `description`  | string   | no       | What this BONE does.                                           |
| `target`       | string   | yes      | Primary category: `image`, `video`, `audio`, `style`, `custom`.|
| `provider`     | string   | no       | Provider namespace used for grouping/configuration, e.g. `higgsfield`, `runway`, `kling`, `flux`. |
| `attaches_to`  | string[] | yes      | Which SKEL entities this can attach to: `metadata`, `act`, `scene`, `shot`, `character`, `environment`. |
| `fields`       | object   | yes      | Field definitions (see §2.3).                                  |
| `defaults`     | object   | no       | Default values for fields.                                     |
| `prompt_assembly` | object | no       | How field values and story context assemble into the final prompt string. See Section 2.4. |
| `llm_instructions` | object | no      | How an LLM should write prompts for this specific generator. See Section 2.5. |
| `output`       | object   | no       | Where and how to store the rendered file after generation. See Section 2.6. |
| `routing`      | object   | no       | Optional provider routing metadata or lookup hints. See Section 2.7. |
| `execution_routes` | array | no       | Optional executable routes an agent can choose from. See Section 2.7. |
| `extensions`   | object   | no       | Vendor-specific extension data. Keys SHOULD be `x-` namespaced. |
| `requires`     | string[] | no       | Capability ids this BONE needs to fire; hosts join against their capability matrix for armed / needs-setup / unavailable readiness. |
| `pipeline_stage` | string | no       | Pipeline stage this BONE participates in (`proposal`, `scene_plan`, `generation`, `review`, ...). |
| `authoring_mode` | string | no       | `templated`, `atelier`, `hybrid`, or `x-` custom — how this BONE's prompts are authored. |
| `render_runtime` | string | no       | Preferred composition runtime (`native`, `remotion`, `hyperframes`, `ffmpeg`, or `x-` custom). Selector metadata only. |
| `style_tokens` | object   | no       | Color/typography/motion/grading/caption/a11y tokens for style-family BONEs. |
| `decision_log_refs` | string[] | no  | Host decision-log entry IDs that motivated or constrain this BONE. |
| `quality_gates` | array   | no       | Quality gates this BONE must satisfy (`{severity, message, ...}`) — governance metadata for host reviewer surfaces. |

### 2.3 Field Definitions

Each key in `fields` is a field name. The value describes the field:

| Property   | Type    | Required | Description                                              |
| ---------- | ------- | -------- | -------------------------------------------------------- |
| `type`     | string  | yes      | `string`, `number`, `boolean`, `array`, `object`.        |
| `required` | boolean | yes      | Whether this field must be present on the entity.        |
| `ui`       | string  | no       | UI hint: `text`, `textarea`, `number`, `slider`, `select`, `toggle`, `color`, `file`. |
| `label`    | string  | no       | Human-readable label for UI.                             |
| `default`  | any     | no       | Default value if not specified.                          |
| `min`      | number  | no       | Minimum value (for `number` type).                       |
| `max`      | number  | no       | Maximum value (for `number` type).                       |
| `options`  | array   | no       | Valid options (for `select` UI type).                    |
| `description` | string | no     | Help text for the field.                                 |

---

## 2.4 `prompt_assembly` Object

Defines how the BONE's field data and story context, such as `v_setup` tokens, character refs, and scene header, combine into the final string sent to an AI generation API. Hosts use it to drive assembled-prompt previews.

| Field                 | Type   | Required | Description |
| --------------------- | ------ | -------- | ----------- |
| `strategy`            | string | yes      | `template`, `sequential`, or `raw`. |
| `template`            | string | no       | Template string with `{{field_name}}` substitution. Required when strategy is `template`. |
| `v_setup_injection`   | object | no       | Controls injection of resolved `v_setup` tokens into the assembled prompt. |
| `character_injection` | object | no       | Controls injection of character data from `character_refs`. |
| `max_length`          | integer | no      | Maximum character length of the assembled prompt. Must be greater than `0`. Used for validation and preview warnings. |
| `separator`           | string | no       | Separator between sequential elements. Default: space. |

If a BONE omits `prompt_assembly`, hosts SHOULD use `sequential` behavior with a single-space separator.

Template variables use double braces. `{{field_name}}` resolves from the effective BONE data after defaults and inheritance. System tokens include `{{v_setup.size}}`, `{{v_setup.angle}}`, `{{v_setup.lens}}`, `{{v_setup.move}}`, `{{v_setup.light}}`, `{{v_setup.tod}}`, `{{v_setup.dof}}`, `{{character_refs}}`, `{{scene.header}}`, `{{scene.location}}`, and `{{scene.tod}}`. Missing variables resolve to an empty string, and assemblers SHOULD trim repeated whitespace and dangling punctuation in preview/output.

Strategies:
- `template`: uses the `template` string. `template` is required for this strategy.
- `sequential`: concatenates non-empty field values in `fields` definition order, joined by `separator`.
- `raw`: sends the `text` field value verbatim. No additional assembly.

`v_setup_injection` sub-fields:

| Field          | Type     | Description |
| -------------- | -------- | ----------- |
| `enabled`      | boolean  | Whether to inject `v_setup` tokens. Default: `false`. |
| `position`     | string   | `append`, `prepend`, or `inline`. `inline` is used by `{{v_setup.*}}` template tokens. |
| `token_format` | string   | `natural`, `technical`, or `none`. |
| `tokens`       | string[] | Which `v_setup` categories to inject. Valid core tokens: `size`, `angle`, `lens`, `move`, `light`, `tod`, `dof`, `aspect`, `color`, `mood`, `custom`. |

`character_injection` sub-fields:

| Field      | Type    | Description |
| ---------- | ------- | ----------- |
| `enabled`  | boolean | Whether to inject character data. Default: `false`. |
| `position` | string  | `prepend`, `append`, or `subject_prefix`. |
| `format`   | string  | `name_only`, `name_and_description`, or `consistency_modifier`. |

Validators MUST report malformed `prompt_assembly` objects: unknown strategy names, missing `template` for `template` strategy, invalid injection enum values, and non-positive `max_length`. Validators SHOULD warn when `raw` strategy is used without a `text` field definition.

## 2.5 `llm_instructions` Object

Tells a language model how to write prompts for this specific generator. When an LLM generates prompts for shots in Genlock, it reads this before writing. This makes the BONE a prompt authoring contract, not just a data container.

| Field           | Type     | Required | Description |
| --------------- | -------- | -------- | ----------- |
| `writing_guide` | string   | no       | Main instruction set for writing prompts for this generator. Plain text or Markdown. |
| `field_guides`  | object   | no       | Per-field writing instructions. Keys are field names. |
| `examples`      | array    | no       | Input/output pairs showing correct prompt construction. |
| `do`            | string[] | no       | Rules the LLM should follow. |
| `dont`          | string[] | no       | Rules the LLM should not break. |

## 2.6 `output` Object

Tells any LLM or automated pipeline where to store a rendered file after the generator completes, and which files or fields to update. Without this field, a BONE is a prompt contract only. With `output`, a BONE becomes a generation pipeline spec.

| Field                | Type   | Required | Description |
| -------------------- | ------ | -------- | ----------- |
| `format`             | string | yes      | Output file extension: `png`, `jpg`, `mp4`, `gif`, `wav`, etc. |
| `target`             | string | yes      | Which write-back slot receives the result. Neutral vocabulary below; hosts map slots to their own storage. |
| `path_template`      | string | no       | Storage path relative to workspace root. Supports `{slug}`, `{shot_id}`, `{bone_id}`, `{format}`, and `{n}`. Resolved paths are subject to the path-safety rules of skel-spec.md §10.3: inside the workspace root, no `..`, no absolute paths, no symlink escapes. |
| `completion_status` | string | no       | Production status to set on the shot after a successful download. Default: `review`. |

**Neutral target vocabulary.** `target` names a write-back slot, not a vendor field:

| Target | Meaning | Write-back |
|---|---|---|
| `still` | A standalone image for the shot | Host's still-image slot for the shot |
| `start_frame` | The shot's first-frame reference image | Host's start-frame slot |
| `end_frame` | The shot's last-frame reference image | Host's end-frame slot |
| `video_take` | A new video take | Append to `video-map.json`: new take `isActive: true`, all prior takes for that shot `isActive: false` |
| `audio_track` | An audio track assignment | Assign in `audio-map.json`; track type (`dialogue`, `sfx`, or `music`) is determined by the BONE's top-level `target` category |

Each **host profile** documents where the image slots physically live. Genlock Studio's mapping (see `GENLOCK_HOST_PROFILE.md`): `still` → `shot.extensions.x-genlock.image`, `start_frame` → `…startFrameImage`, `end_frame` → `…endFrameImage`.

*Deprecated aliases:* readers MUST also accept the pre-1.1 target values `image`, `startFrameImage`, `endFrameImage`, and `videoTake` as synonyms of `still`, `start_frame`, `end_frame`, and `video_take`; writers MUST emit the neutral names (see MIGRATIONS.md).

**Default path templates (used when `path_template` is omitted):**

```
image BONEs:   projects/{slug}/renders/images/{shot_id}.{bone_id}.{format}
video BONEs:   projects/{slug}/renders/video/{shot_id}.v{n}.{format}
audio BONEs:   projects/{slug}/renders/audio/{shot_id}.{bone_id}.{format}
failure logs:  projects/{slug}/renders/failures/{shot_id}.{bone_id}.log
```

**What an LLM or pipeline does after receiving a completed render:**

1. Resolve the storage path using the template and context (workspace root, slug, shot_id, bone_id, format).
2. Download or move the file to that path.
3. Write the path to the slot specified by `target`:
   - Image targets (`still`/`start_frame`/`end_frame`) → update the host's mapped image slot in `story.skel`
   - `video_take` → append entry to `video-map.json` with `isActive: true`; set `isActive: false` on all prior takes for that shot
   - `audio_track` → append entry to `audio-map.json` with the appropriate track type
4. Set the **core** `shot.status.image` (or `.video`) to `completion_status`. (Core `status` is canonical since SKEL 2.9; hosts MAY additionally mirror to a vendor extension for pre-2.9 readers — see MIGRATIONS.md.)
5. Record generation provenance for the render (§2.8).
6. On failure, set `shot.status.image`/`.video` to `failed` and write a log entry to the `renders/failures/` path.
7. Save `story.skel`.

Hosts pick up updated files on reload or file-watch. No app restart required.

---

## 2.7 Provider Routing Metadata

BONE definitions MAY declare provider and routing metadata so Genlock and agents can group generators, choose an execution path, and display provider readiness without hardcoding every generator in the app.

`provider` is a short lowercase namespace. Examples: `higgsfield`, `runway`, `kling`, `flux`.

`routing` is an optional open object for provider-specific lookup hints, default model IDs, or external routing-table keys. Projects MAY also keep routing in workspace config or generated agent skills instead of embedding it in the BONE.

`execution_routes` is an optional ordered list of executable routes. Agents SHOULD choose the first route that is available and configured.

| Field      | Type     | Required | Description |
| ---------- | -------- | -------- | ----------- |
| `type`     | string   | yes      | `mcp`, `cli`, `skill`, `api`, or `manual`. |
| `label`    | string   | no       | Human-readable route label. |
| `tool`     | string   | no       | MCP/tool identifier, e.g. `higgsfield.generate_image`. |
| `command`  | string   | no       | CLI command template or executable name. |
| `endpoint` | string   | no       | API endpoint or route key. |
| `requires` | string[] | no       | Capability/config keys required before this route is usable. |
| `args`     | object   | no       | Route-specific argument mapping hints. |

Example:

```json
{
  "provider": "higgsfield",
  "execution_routes": [
    {
      "type": "mcp",
      "label": "Higgsfield MCP",
      "tool": "higgsfield.generate_image",
      "requires": ["settings.higgsfield.executionRoute", "auth.higgsfield"]
    },
    {
      "type": "cli",
      "label": "Higgsfield CLI",
      "command": "higgsfield generate create",
      "requires": ["cli.higgsfield"]
    }
  ]
}
```

Unknown top-level fields are rejected by the core BONE schema unless they are explicitly defined, placed under `extensions`, or use an `x-` namespaced top-level key.

---

## 2.8 Generation Provenance

Renders should carry enough metadata to be reproduced, audited, and disclosed as AI-generated. Wherever a render lands (a `video-map.json` take, an audio-map track, a host image slot), the writer SHOULD record a **provenance block**:

```json
{
  "provenance": {
    "bone_id": "seedance-2",
    "provider": "bytedance",
    "model": "seedance-2.0",
    "prompt": "...the final assembled prompt...",
    "params": { "seed": 777, "duration": 15 },
    "generated_at": "2026-07-16T12:00:00Z",
    "job_id": "..."
  }
}
```

| Field | Description |
|---|---|
| `bone_id` | BONE that generated the render. |
| `provider` | Provider namespace (matches the BONE's `provider`). |
| `model` | Exact model identifier used. |
| `prompt` | The final assembled prompt string sent to the generator. |
| `params` | Generation parameters (seed, guidance, duration, resolution, ...). |
| `generated_at` | ISO 8601 timestamp. |
| `job_id` | Provider job/request ID. |

Three wins: **reproducibility** (re-render the same take), **auditability** (which model made this frame — increasingly a disclosure requirement for AI content), and a stable home for the prompt-per-render guarantee. Schema homes: `video-map.schema.json` (`VideoTake.provenance`), `audio-map.schema.json` (`ShotAudioEntry.provenance`), and host image-slot namespaces (Genlock: `x-genlock.provenance`, see `x-genlock.schema.json`).

---

## 3. BONE Registry (in SKEL Document)

When a SKEL document is exported, all active BONE definitions are embedded in a top-level `bone_registry` object. This makes the file fully self-contained and portable.

```json
{
  "skel_version": "2.0",
  "metadata": { "..." : "..." },
  "bone_registry": {
    "flux-dev": {
      "bone_version": "1.0",
      "label": "Flux Dev (Image Generation)",
      "target": "image",
      "attaches_to": ["shot", "scene", "metadata"],
      "fields": { "...": "..." },
      "defaults": { "guidance": 7.5 }
    },
    "runway-gen3": {
      "bone_version": "1.0",
      "label": "Runway Gen-3 Alpha (Video)",
      "target": "video",
      "attaches_to": ["shot"],
      "fields": { "...": "..." },
      "defaults": { "duration": 4 }
    }
  },
  "acts": [],
  "scenes": [],
  "shots": []
}
```

The key in `bone_registry` matches the `bone_id` from the definition file.

---

## 4. BONE Data on Entities

Any SKEL entity (metadata, act, scene, shot) and any asset entity (character, environment) can carry a `bones` object. Each key references a registered BONE, and the value is a free-form object containing that BONE's data.

### 4.1 Shot-Level BONEs

```json
{
  "id": "sh_1",
  "action": "Harlan writes in the logbook.",
  "v_setup": { "size": "cu", "angle": "high" },
  "bones": {
    "flux-dev": {
      "text": "Close-up of weathered hands writing in a leather logbook, candlelight flickering, noir lighting.",
      "negative": "blurry, cartoon, low quality",
      "guidance": 9,
      "seed": 42
    },
    "runway-gen3": {
      "text": "Static camera. Candle flame flickers, casting moving shadows across logbook pages.",
      "duration": 4,
      "motion_strength": 0.3
    }
  }
}
```

### 4.2 Scene-Level BONEs

Scene-level BONEs set defaults for all shots in that scene. Shot-level data overrides scene-level.

```json
{
  "id": "sc_1",
  "header": "INT. LIGHTHOUSE - NIGHT",
  "bones": {
    "flux-dev": {
      "negative": "blurry, cartoon, low quality, bright colors",
      "guidance": 8
    }
  }
}
```

### 4.3 Metadata-Level BONEs

Project-wide defaults. Every entity inherits these unless overridden.

```json
{
  "metadata": {
    "story_id": "...",
    "title": "The Last Signal",
    "bones": {
      "flux-dev": {
        "negative": "blurry, low quality",
        "guidance": 7.5
      }
    }
  }
}
```

### 4.4 Act-Level and Asset-Level BONEs

Acts participate in the inheritance chain between metadata and scene (§5): an act-level `bones` entry sets defaults for every shot in that act — useful when Act 2 shifts the whole look ("everything after the storm goes desaturated").

Characters and environments MAY carry `bones` for **per-asset** pipelines that are not shot-scoped: the `character-reference-sheet` BONE is conceptually per-character, and `attaches_to: ["character"]` expresses exactly that. Asset-level BONE data does not participate in the shot inheritance chain — it configures generation *about the asset* (a reference sheet, an environment plate), not generation of a specific shot.

---

## 5. Inheritance Chain

BONEs cascade from project → act → scene → shot. More specific levels override less specific ones. The merge is shallow (per-field replacement, not deep merge).

```
metadata.bones["flux-dev"]     → { negative: "blurry", guidance: 7.5 }
  ↓ act overrides
act.bones["flux-dev"]          → { color_hint: "desaturated" }
  ↓ scene overrides
scene.bones["flux-dev"]        → { guidance: 8 }
  ↓ shot overrides
shot.bones["flux-dev"]         → { text: "Close-up of...", guidance: 9, seed: 42 }

Resolved for shot:
{
  text: "Close-up of...",       ← from shot
  negative: "blurry",           ← inherited from metadata
  color_hint: "desaturated",    ← inherited from act
  guidance: 9,                  ← shot overrides scene overrides metadata
  seed: 42                      ← from shot
}
```

Resolution order:
1. BONE definition `defaults`
2. `metadata.bones[bone_id]`
3. `act.bones[bone_id]` (for shots in scenes of that act)
4. `scene.bones[bone_id]` (for shots in that scene)
5. `shot.bones[bone_id]`

---

## 6. Custom BONEs

Users can create custom BONE definitions for any purpose:

- A style consistency BONE that carries LoRA references and style tokens
- A character consistency BONE that carries face embeddings per shot
- An editorial BONE that tracks revision notes and approval chains
- A sound design BONE for foley and SFX cues

Custom BONEs follow the same spec. The `target` field uses `custom` and the `bone_id` should be prefixed to avoid collisions (e.g., `my-studio-editorial`).

### 6.1 First-Party AI Filmmaking BONEs

Genlock ships a small AI filmmaking base pack for character-locked, storyboard-driven video generation:

| BONE | Target | Purpose |
| ---- | ------ | ------- |
| `character-reference-sheet` | image | Creates neutral 8-view identity sheets for character continuity. Attaches per-character (`attaches_to: ["character", ...]`) and consumes the character's `identity_lock` verbatim. |
| `storyboard-grid-9` | image | Creates a 3x3 continuous-scene storyboard grid with readable production-note strips. |
| `seedance-2` | video | Creates 15-second Seedance 2 video prompts from text, storyboard grids, or character sheets plus storyboard grids. |

These BONEs are prompt authoring contracts. LLMs SHOULD read their `llm_instructions` before writing prompt data and SHOULD preserve character-lock text (`identity_lock`, skel-spec.md §2.7.1) verbatim across the character sheet, storyboard, and video BONEs. When a storyboard grid exists, video BONEs SHOULD prefer storyboard-driven prompting over independent text-only shot prompts because it reduces character, geography, and camera drift.

---

## 7. Validation

### 7.1 Registry Validation

- Empty `draft` SKEL documents MAY omit `bone_registry`, or MAY include it as `{}`.
- If any SKEL entity contains a `bones` object, the SKEL document MUST include `bone_registry`.
- Every key in an entity's `bones` object MUST have a corresponding entry in `bone_registry`.
- In `export` lifecycle, every referenced BONE definition MUST be embedded in `bone_registry` and MUST validate against the BONE definition schema.
- Parsers MAY warn on unused BONE definitions in `bone_registry`, but unresolved BONE keys in entity data are validation errors.

### 7.2 Field Validation

- Fields marked `required: true` in the BONE definition MUST be present on the entity's BONE data after inheritance resolution.
- Type checking is advisory — parsers SHOULD validate types but MUST NOT reject documents on type mismatches in BONE data.

### 7.3 Attachment Validation

- A BONE's data on an entity type not listed in `attaches_to` SHOULD produce a warning (`BONE_ATTACHMENT_INVALID`, see `spec/errors.md`).

---

## 8. Portability

### 8.1 Export

When exporting a SKEL document:
1. Collect all BONE IDs referenced across all entities.
2. Embed their full definitions in `bone_registry`.
3. Set `metadata.lifecycle` to `export`, or validate under export rules.
4. Reject the export if any referenced BONE ID cannot be resolved to a full definition.
5. The exported file is fully self-contained.

### 8.2 Import

When importing a SKEL document:
1. Read `bone_registry` to discover available BONEs.
2. If a local `.bone.json` exists with the same `bone_id`, prefer the local version (it may be newer).
3. If no local version exists, use the embedded definition.

---

## License

This specification is released under the [MIT License](https://opensource.org/licenses/MIT).
