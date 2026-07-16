# LLM ↔ SKEL Integration Guide

> How language models read, write, and act on SKEL documents and BONE data.
> This is a first-class feature of the SKEL/BONE system — not a bolt-on.

---

## Why SKEL is LLM-Native

Most production formats are built for human editors or specific tools. SKEL was designed to be read and written by both. The structural decisions that make SKEL good for Genlock are the same ones that make it good for LLMs:

| SKEL Decision | Why It Helps LLMs |
|---|---|
| Flat relational structure (no deep nesting) | LLMs can locate any shot by ID without traversing a tree |
| Shorthand tokens (`cu`, `noir`, `dolly`) | Compact, unambiguous vocabulary — no ambiguity about what "close-up" means |
| Self-describing `bone_registry` | LLM knows exactly what fields exist, what types they are, what's required |
| `llm_instructions` per BONE | Generator-specific writing guides live in the data, not the prompt |
| Inheritance chain | LLMs can reason about what's already set at the project/scene level and not repeat it |
| JSON Schema validation | LLMs can validate their own output before writing it back |

---

## What LLMs Can Do With SKEL

### 1. Read story structure
- Understand the full narrative: acts → scenes → shots → action + dialogue
- Identify which shots are missing BONE data (prompts)
- Understand production status across the project

### 2. Write BONE data (prompt authoring)
- Read the `bone_registry` to discover which generators are active
- Read `llm_instructions` per BONE to get per-generator writing guidance
- Walk the inheritance chain to know what's already set at scene/project level
- Write shot-level prompts that only override what's needed
- Write scene-level defaults that propagate to multiple shots

### 3. Set v_setup tokens
- Parse a shot's `action` description to infer appropriate camera, angle, movement, lighting
- Write correct token shorthand (`cu`, `high`, `dolly`, `noir`) — not free text
- Validate tokens against the keyfile before writing

### 4. Trigger generation and store results
- Assemble the final prompt using the BONE's `prompt_assembly` strategy
- Call the appropriate generator API (via MCP tool or external call)
- Poll for completion
- Download and store the rendered file per the BONE's `output` spec
- Write back to the SKEL doc / video-map / audio-map

Prompt assembly uses the same contract as `BONE/spec/bone-spec.md`: `template`, `sequential`, or `raw`. `template` expands `{{field_name}}` and supported system tokens such as `{{v_setup.size}}`, `{{character_refs}}`, and `{{scene.header}}`; `sequential` joins non-empty field values in definition order; `raw` sends the `text` field verbatim. The `assemble_prompt` tool should also apply `v_setup_injection`, `character_injection`, `separator`, and `max_length` consistently with the BONE schema.

### 5. Reason about creative intent
- Read `scene.intent` and `shot.intent` to understand why material exists, not just what it says
- Honor `intent.emphasis` and `intent.beat` when rewriting action or prompt text
- Check `creative_status` before modifying any scene or shot — `locked` entities must not be changed

### 6. Store proposals without applying them
- Write pending suggestions to `extensions.x-genlock.proposals` when the user wants options rather than immediate edits
- Use stable `prop_` IDs, one of the approved proposal types, and one of the approved statuses
- Do not treat `status: accepted` as a substitute for applying the change to the affected SKEL entity

### 7. Validate
- Run the SKEL validator on modified data before saving
- Report schema errors or referential integrity issues

### 8. Work with the asset layer
- Read `characters[]` (or the studio registry) before writing any prompt that shows a character; reuse `identity_lock` **verbatim** — never paraphrase it
- Respect wardrobe continuity: check `wardrobe_variants[].scene_refs` and `state_overrides` for the scene you are prompting
- Reuse `environment.style_lock` and `geography` verbatim for set consistency across shots
- Track props: when a shot's action mentions a tracked prop, add it to `prop_refs`; flag plot-critical props that vanish (`continuity_note` proposal)
- For episodic work, read `metadata.series` and the registry series document to know which arcs this episode advances and which cast is shared

---

## The Full Generation Loop (LLM Perspective)

```
READ  story.skel                          → load native SKEL YAML document
READ  bone_registry                       → know which generators are active
READ  metadata.bones                      → know project-level BONE defaults
READ  scene.bones for target scene        → know scene-level defaults

FOR each shot in target scene:
  RESOLVE bones for shot                  → inheritance: metadata → scene → shot
  READ bone.llm_instructions              → generator-specific writing guide
  WRITE shot.bones[bone_id].text          → the prompt (respects inheritance, no redundancy)
  WRITE shot.v_setup tokens               → size, angle, move, light, etc.

VALIDATE story.skel against SKEL schema   → catch errors before save
SAVE story.skel

FOR each shot (render phase):
  ASSEMBLE prompt via prompt_assembly     → expand tokens to natural language, inject chars
  CALL generator API with assembled prompt + BONE params (guidance, seed, duration, etc.)
  POLL for job completion
  DOWNLOAD rendered file
  RESOLVE output path from bone.output    → workspace + slug + shot_id + bone_id + format
  SAVE file to resolved path
  UPDATE the target's write-back slot      → still / start_frame / end_frame (host image slots),
                                             video-map.json, or audio-map.json
  RECORD provenance                        → bone_id, provider, model, prompt, params (BONE Spec §2.8)
  SET shot.status.image or .video → "review"   (core status is canonical; "failed" on error)
  SAVE story.skel

DONE → Genlock picks up new files on reload
```

---

## Proposal Storage

When an LLM suggests changes that should remain reviewable, it MAY write proposal objects under `extensions.x-genlock.proposals` on the affected entity. This keeps pending ideas out of core SKEL fields until the user accepts them.

```json
"extensions": {
  "x-genlock": {
    "proposals": [
      {
        "id": "prop_123",
        "by": "codex",
        "type": "rewrite_scene",
        "status": "pending",
        "summary": "Tighten the reveal around the tape deck.",
        "target": { "entity": "scene", "id": "sc_1" },
        "rationale": "The current reveal lands before the audience understands the risk."
      }
    ]
  }
}
```

Allowed statuses are `pending`, `accepted`, `rejected`, and `superseded`. Allowed types are `add_scene`, `rewrite_scene`, `add_shots`, `rewrite_shot`, `add_bone_prompts`, `structure_note`, and `continuity_fix`.

Agents SHOULD preserve proposal history unless the user asks to remove it. To accept a proposal, apply the actual change to the target SKEL data, update the proposal status to `accepted`, and set `resolved_at`. To reject or supersede a proposal, update only its status and resolution metadata.

The supplementary schema for this namespace is `SKEL/spec/x-genlock.schema.json`; the core SKEL schema remains vendor-neutral.

---

## Writing BONE Data — Rules

These rules apply to any LLM writing prompts into a SKEL document.

### Don't repeat inherited values
If `negative: "blurry, low quality"` is set at `metadata.bones["flux-dev"]`, do not write it on every shot. The inheritance chain will resolve it. Only write shot-level overrides.

```json
// ❌ WRONG — repeating inherited negative prompt on every shot
"flux-dev": {
  "text": "...",
  "negative": "blurry, low quality"   // already on metadata, waste
}

// ✅ CORRECT — only the shot-specific prompt
"flux-dev": {
  "text": "Close-up of weathered hands writing in a leather logbook by candlelight."
}
```

### Read llm_instructions before writing
Every BONE definition can carry `llm_instructions.writing_guide`. Read it first. Different generators have radically different prompt structures:
- Flux Dev → single descriptive prompt, high guidance works well
- Runway Gen-3 → motion-first, second sentence describes movement
- Seedance 2 → segmented fields: subject / action / camera / environment / style
- Kling v1 → camera control as a separate field, not embedded in the prompt
- Higgsfield → [read the BONE's specific guide]

### Use token shorthand for v_setup
Do not write free text into v_setup fields. Use the correct token from the keyfile:

```json
// ❌ WRONG
"v_setup": { "size": "close-up shot", "light": "film noir style" }

// ✅ CORRECT
"v_setup": { "size": "cu", "light": "noir" }
```

The keyfile expands these at assembly time. The Assembled Prompt Preview will show the LLM-readable expansion.

### Respect `creative_status: locked`
Before modifying any scene or shot, check `creative_status`. If the value is `locked`, do NOT modify that entity's `action`, `dialogue`, `notes`, `bones`, or any other content field. You may read it, reference it, or use it to inform other work — but treat it as frozen.

```yaml
# ❌ WRONG — modifying a locked shot
shot:
  id: sh_3
  creative_status: locked
  action: "Harlan freezes. His eyes widen."   # ← do not rewrite this

# ✅ CORRECT — skip locked entities, work on unlocked ones
```

If a user explicitly asks you to modify a locked entity, confirm the intent before proceeding. Do not silently override the lock.

### Preserve `intent` when rewriting
When a scene or shot has an `intent` object, read it before rewriting `action`, `dialogue`, or prompt text. The rewrite must serve the same `beat`, `function`, and `emphasis`.

```yaml
# Scene intent tells you WHY the scene exists
intent:
  purpose: "Reveal that the machine predicts speech."
  emotional_turn: "Curiosity becomes dread."
  story_function: reveal

# Shot intent tells you what the shot MUST communicate
intent:
  beat: "The VU needle moves before Eli speaks."
  emphasis: "End on the machine, not the people."
```

Rules:
- Do not rewrite `intent` itself unless explicitly asked.
- If your rewrite cannot honor `emphasis` or `beat`, flag the conflict rather than silently ignoring it.
- `story_function` and `function` values are: `setup`, `escalation`, `reveal`, `reaction`, `decision`, `transition`, `payoff`, `button`.

### Validate before saving
After writing BONE data, run the SKEL validator. Fix errors before writing the file to disk. A saved invalid SKEL is worse than an unsaved valid one.

---

## External Validator Contract

Genlock-compatible tools MUST expose validation in a way that an LLM or external automation can run before saving or rendering.

### CLI

```powershell
genlock validate projects/example/story.skel
```

Optional flags:
- `--lifecycle draft|production|export` overrides `metadata.lifecycle` for this validation run.
- `--json` returns machine-readable output.
- `--with-sidecars` validates `audio-map.json`, `video-map.json`, and canvas layout files when present.

Exit codes:
- `0`: valid, no errors.
- `1`: validation completed with errors.
- `2`: file could not be read or parsed.

### MCP / Agent Tool

Tool name:

```text
validate_skel
```

Input:

```json
{
  "path": "projects/example/story.skel",
  "lifecycle": "production",
  "include_sidecars": true
}
```

Output:

```json
{
  "valid": false,
  "lifecycle": "production",
  "errors": [
    {
      "code": "BONE_UNRESOLVED",
      "severity": "error",
      "path": "/shots/3/bones/flux-dev",
      "message": "Referenced BONE key does not exist in bone_registry."
    }
  ],
  "warnings": []
}
```

`path` is always an RFC 6901 JSON Pointer — the same syntax MUSCLE hook results use. Dot/bracket paths are non-conformant.

Minimum checks:
- `.skel` YAML parses correctly.
- The parsed SKEL data model passes schema validation for the selected lifecycle.
- IDs are unique across acts, scenes, shots, and embedded asset collections.
- `act.scene_refs` match real scenes.
- `scene.shot_refs` match real shots.
- `scene.act_id` matches a real act.
- `shot.scene_id` matches a real scene.
- `music_cues` in/out anchors match real shots.
- Asset references resolve (`character_refs`, `dialogue.character_ref`, `environment_ref`, `location_ref`, `prop_refs`, `audio_ref`s) — errors when the embedded collection is present, warnings when only a studio registry could resolve them (skel-spec §3.4).
- Any entity with `bones` requires `bone_registry`.
- Every entity `bones` key resolves to `bone_registry`.
- BONE data passes required-field checks after inheritance resolution (defaults → metadata → act → scene → shot).
- Sidecar shot IDs resolve to real shots when sidecar validation is enabled.

Error codes are normative and stable — the complete catalog with severities and conditions is [`spec/errors.md`](./errors.md). Core codes: `YAML_PARSE_ERROR`, `SCHEMA_ERROR`, `DUPLICATE_ID`, `ACT_SCENE_REF_MISSING`, `SCENE_SHOT_REF_MISSING`, `SCENE_ACT_MISSING`, `SHOT_SCENE_MISSING`, `MUSIC_CUE_SHOT_MISSING`, `CHARACTER_REF_MISSING`, `ENVIRONMENT_REF_MISSING`, `LOCATION_REF_MISSING`, `PROP_REF_MISSING`, `AUDIO_REF_MISSING`, `BONE_REGISTRY_MISSING`, `BONE_UNRESOLVED`, `BONE_REQUIRED_FIELD_MISSING`, `SIDECAR_SHOT_MISSING`.

---

## Storage Convention (Render Output)

After a generator returns a result, the storage path is always deterministic. An LLM resolves it as follows:

```
workspace_root  = from CLAUDE.md or project config
project_slug    = metadata.extensions.x-genlock.slug  (or derived from title)
shot_id         = shot.id
bone_id         = the BONE that generated this render
format          = bone.output.format
n               = next available take number (for video_take targets)

Image path:    {workspace_root}/projects/{slug}/renders/images/{shot_id}.{bone_id}.{format}
Video path:    {workspace_root}/projects/{slug}/renders/video/{shot_id}.v{n}.{format}
Audio path:    {workspace_root}/projects/{slug}/renders/audio/{shot_id}.{bone_id}.{format}
Failure path:  {workspace_root}/projects/{slug}/renders/failures/{shot_id}.{bone_id}.log
```

After saving the file, write back:

**For image targets** (`still` / `start_frame` / `end_frame`) — edit `story.skel`, find the shot by ID, write the file path into the host's mapped image slot and set the **core status**:
```json
"status": { "image": "review" },
"extensions": {
  "x-genlock": {
    "startFrameImage": "projects/{slug}/renders/images/{shot_id}.{bone_id}.png",
    "provenance": { "start_frame": { "bone_id": "{bone_id}", "model": "...", "prompt": "...", "params": { "seed": 42 } } }
  }
}
```
(`x-genlock.startFrameImage` is Genlock's slot for the neutral `start_frame` target — see GENLOCK_HOST_PROFILE.md. Core `shot.status` is canonical; `x-genlock.production_status` is a deprecated mirror you no longer need to write.)

**For video_take targets** — edit `video-map.json`:
```json
{
  "{shot_id}": {
    "takes": [
      { "id": "v1", "file": "projects/{slug}/renders/video/{shot_id}.v1.mp4", "isActive": true }
    ]
  }
}
```
If a take already exists, append as `v2`, `v3`, etc. Set the new take as `isActive: true`, set all others to `isActive: false`.

**For audio_track targets** — edit `audio-map.json`:
```json
{
  "{shot_id}": {
    "dialogue": "projects/{slug}/renders/audio/{shot_id}.{bone_id}.wav"
  }
}
```
Track type (`dialogue`, `sfx`, `music`) is determined by the BONE's `target` field.

---

## CLAUDE.md Skill File — Required Sections

The `CLAUDE.md` file auto-installed in every Genlock workspace teaches Claude the project context. It must contain:

1. **Workspace path** — so Claude can resolve absolute file paths
2. **Active project slug** — or instructions to read it from `project.json`
3. **SKEL structure summary** — acts → scenes → shots, v_setup tokens, bone data
4. **Render output protocol** — the storage convention above (verbatim or paraphrased)
5. **Write-back protocol** — which files to update after a render (`story.skel`, video-map, audio-map)
6. **Validation requirement** — always run validator before saving
7. **Available BONEs** — list of active bone_ids and their targets for this project

The skill file is regenerated by clicking "Regenerate Skill File" on the Studio home page. It should be regenerated any time BONEs are added/removed from a project.

---

## MCP Tools for the Generation Loop

To enable the full autonomous loop (read → write → generate → store), the following MCP tools are needed:

| Tool | Purpose |
|---|---|
| `read_story` | Read and parse the current project's `story.skel` |
| `write_story` | Write updated SKEL data back to `story.skel` |
| `resolve_bones` | Resolve inheritance chain for a shot — returns effective BONE data |
| `assemble_prompt` | Run `prompt_assembly` for a shot + bone — returns the final string |
| `validate_skel` | Validate the SKEL document — returns errors/warnings |
| `call_generator` | Send assembled prompt to a named generator (Higgsfield, Runway, Flux, etc.) |
| `poll_job` | Poll a generator job by ID until complete or failed |
| `download_file` | Download a URL to a resolved workspace path |
| `update_video_map` | Append or update a take in `video-map.json` |
| `update_audio_map` | Update `audio-map.json` with a new track assignment |
| `set_shot_status` | Update production status for a shot (image or video) |

These can be implemented as:
- Genlock MCP server (dedicated server exposing these as tools to Claude)
- Direct file operations via the existing workspace file access Claude already has

The minimal viable implementation uses direct file reads/writes — Claude reads `story.skel`, edits it in memory, writes it back. The MCP server approach is the production-grade path.

---

## Generator Routing via BONE

A BONE's `bone_id` determines which generator to call. The routing table lives in the CLAUDE.md skill file (or a project config) and maps bone_id → API endpoint or MCP tool call:

```
flux-dev        → Flux Dev API (image generation)
runway-gen3     → Runway Gen-3 Alpha API (video)
kling-v1        → Kling v1 API (video)
seedance-2      → Seedance 2 API (video)
higgsfield      → Higgsfield API (video)
```

When Claude encounters a shot with BONE data, it:
1. Reads `bone_registry[bone_id].target` → knows image vs video vs audio
2. Looks up the routing table → knows which API to call
3. Reads `bone_registry[bone_id].output.format` → knows expected file format
4. Assembles the prompt via `prompt_assembly`
5. Calls the generator with the assembled prompt + any extra params (guidance, seed, duration, etc.)

The routing table should be extensible — adding a new generator means adding a `.bone.json` + an entry in the routing table. No changes to SKEL or Genlock required.
