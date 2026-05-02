# BONE Specification v1.0

**Base Object Narrative Export**

> A pluggable definition format for attaching AI generation config, production metadata, or any structured data to SKEL story entities.

---

## 1. Introduction

BONE (Base Object Narrative Export) is a plugin system for SKEL. While SKEL defines the story structure (acts, scenes, shots, visual setup), BONEs define everything that *acts on* that structure — AI image generators, video generators, audio tools, style systems, or any custom pipeline.

BONEs exist because the AI generation landscape changes faster than any spec can keep up with. Rather than hardcoding prompt formats into SKEL, BONEs let you swap generators, add new tools, and create custom pipelines without touching the core story format.

### 1.1 Design Principles

- **Replaceable**: Any BONE can be swapped for another without altering the story structure.
- **Self-describing**: A BONE definition declares its own fields, types, defaults, and UI hints.
- **Inheritable**: BONEs cascade — project defaults → scene overrides → shot overrides.
- **Portable**: On export, BONE definitions embed into the SKEL file. One JSON, everything included.
- **Open**: BONE data on entities is a fully open object. The definition file describes the expected shape, but the schema doesn't constrain it.

### 1.2 File Convention

| Property       | Value                      |
| -------------- | -------------------------- |
| File extension | `.bone.json`               |
| MIME type      | `application/bone+json`    |
| Encoding       | UTF-8                      |
| Schema URI     | `https://Spore.dev/schemas/bone/v1.0/bone.schema.json` |

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
| `bone_version` | string   | yes      | Semver version of this BONE definition.                        |
| `label`        | string   | yes      | Human-readable name for UI display.                            |
| `description`  | string   | no       | What this BONE does.                                           |
| `target`       | string   | yes      | Primary category: `image`, `video`, `audio`, `style`, `custom`.|
| `attaches_to`  | string[] | yes      | Which SKEL entities this can attach to: `metadata`, `act`, `scene`, `shot`. |
| `fields`       | object   | yes      | Field definitions (see §2.3).                                  |
| `defaults`     | object   | no       | Default values for fields.                                     |

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

## 3. BONE Registry (in SKEL Document)

When a SKEL document is exported, all active BONE definitions are embedded in a top-level `bone_registry` object. This makes the file fully self-contained and portable.

```json
{
  "skel_version": "2.0",
  "metadata": { ... },
  "bone_registry": {
    "flux-dev": {
      "bone_version": "1.0",
      "label": "Flux Dev (Image Generation)",
      "target": "image",
      "attaches_to": ["shot", "scene", "metadata"],
      "fields": { ... },
      "defaults": { "guidance": 7.5 }
    },
    "runway-gen3": {
      "bone_version": "1.0",
      "label": "Runway Gen-3 Alpha (Video)",
      "target": "video",
      "attaches_to": ["shot"],
      "fields": { ... },
      "defaults": { "duration": 4 }
    }
  },
  "acts": [ ... ],
  "scenes": [ ... ],
  "shots": [ ... ]
}
```

The key in `bone_registry` matches the `bone_id` from the definition file.

---

## 4. BONE Data on Entities

Any SKEL entity (metadata, act, scene, shot) can carry a `bones` object. Each key references a registered BONE, and the value is a free-form object containing that BONE's data.

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
    },
    "suno-v3": {
      "text": "Dark ambient drone, distant foghorn, creaking wood",
      "duration": 30,
      "genre": "ambient"
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

---

## 5. Inheritance Chain

BONEs cascade from project → scene → shot. More specific levels override less specific ones. The merge is shallow (per-field replacement, not deep merge).

```
metadata.bones["flux-dev"]     → { negative: "blurry", guidance: 7.5 }
  ↓ scene overrides
scene.bones["flux-dev"]        → { guidance: 8 }
  ↓ shot overrides
shot.bones["flux-dev"]         → { text: "Close-up of...", guidance: 9, seed: 42 }

Resolved for shot:
{
  text: "Close-up of...",       ← from shot
  negative: "blurry",           ← inherited from metadata
  guidance: 9,                  ← shot overrides scene overrides metadata
  seed: 42                      ← from shot
}
```

Resolution order:
1. BONE definition `defaults`
2. `metadata.bones[bone_id]`
3. `scene.bones[bone_id]` (for shots in that scene)
4. `shot.bones[bone_id]`

---

## 6. Custom BONEs

Users can create custom BONE definitions for any purpose:

- A style consistency BONE that carries LoRA references and style tokens
- A character consistency BONE that carries face embeddings per shot
- An editorial BONE that tracks revision notes and approval chains
- A sound design BONE for foley and SFX cues

Custom BONEs follow the same spec. The `target` field uses `custom` and the `bone_id` should be prefixed to avoid collisions (e.g., `my-studio-editorial`).

---

## 7. Validation

### 7.1 Registry Validation

- Every key in an entity's `bones` object MUST have a corresponding entry in `bone_registry`.
- Parsers SHOULD warn (not error) on unregistered BONEs to allow forward compatibility.

### 7.2 Field Validation

- Fields marked `required: true` in the BONE definition MUST be present on the entity's BONE data after inheritance resolution.
- Type checking is advisory — parsers SHOULD validate types but MUST NOT reject documents on type mismatches in BONE data.

### 7.3 Attachment Validation

- A BONE's data on an entity type not listed in `attaches_to` SHOULD produce a warning.

---

## 8. Portability

### 8.1 Export

When exporting a SKEL document:
1. Collect all BONE IDs referenced across all entities.
2. Embed their full definitions in `bone_registry`.
3. The exported file is fully self-contained.

### 8.2 Import

When importing a SKEL document:
1. Read `bone_registry` to discover available BONEs.
2. If a local `.bone.json` exists with the same `bone_id`, prefer the local version (it may be newer).
3. If no local version exists, use the embedded definition.

---

## License

This specification is released under the [MIT License](https://opensource.org/licenses/MIT).
