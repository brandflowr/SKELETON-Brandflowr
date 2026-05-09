# LLM ↔ SKEL Integration Guide

> How language models read, write, and act on SKEL documents and BONE data.
> This is a first-class feature of the SKEL/BONE system — not a bolt-on.

---

## Why SKEL is LLM-Native

Most production formats are built for human editors or specific tools. SKEL was designed to be read and written by both. The structural decisions that make SKEL good for Spore are the same ones that make it good for LLMs:

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

### 5. Validate
- Run the SKEL validator on modified data before saving
- Report schema errors or referential integrity issues

---

## The Full Generation Loop (LLM Perspective)

```
READ  story.json                          → load SKEL document
READ  bone_registry                       → know which generators are active
READ  metadata.bones                      → know project-level BONE defaults
READ  scene.bones for target scene        → know scene-level defaults

FOR each shot in target scene:
  RESOLVE bones for shot                  → inheritance: metadata → scene → shot
  READ bone.llm_instructions              → generator-specific writing guide
  WRITE shot.bones[bone_id].text          → the prompt (respects inheritance, no redundancy)
  WRITE shot.v_setup tokens               → size, angle, move, light, etc.

VALIDATE story.json against SKEL schema   → catch errors before save
SAVE story.json

FOR each shot (render phase):
  ASSEMBLE prompt via prompt_assembly     → expand tokens to natural language, inject chars
  CALL generator API with assembled prompt + BONE params (guidance, seed, duration, etc.)
  POLL for job completion
  DOWNLOAD rendered file
  RESOLVE output path from bone.output    → workspace + slug + shot_id + bone_id + format
  SAVE file to resolved path
  UPDATE story.json shot extensions        → startFrameImage / image / etc.
  UPDATE video-map.json or audio-map.json  → for video/audio targets
  SET production_status → "review"
  SAVE story.json

DONE → Spore picks up new files on reload
```

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

### Check shot limits
SKEL enforces a shot limit per scene (default: 4). Read `metadata.constraints.max_shots_per_scene` before adding shots. Do not add shots that would exceed the limit.

### Validate before saving
After writing BONE data, run the SKEL validator. Fix errors before writing the file to disk. A saved invalid SKEL is worse than an unsaved valid one.

---

## Storage Convention (Render Output)

After a generator returns a result, the storage path is always deterministic. An LLM resolves it as follows:

```
workspace_root  = from CLAUDE.md or project config
project_slug    = metadata.extensions.x-Spore.slug  (or derived from title)
shot_id         = shot.id
bone_id         = the BONE that generated this render
format          = bone.output.format
n               = next available take number (for video_take targets)

Image path:  {workspace_root}/projects/{slug}/assets/images/{shot_id}.{bone_id}.{format}
Video path:  {workspace_root}/projects/{slug}/assets/video/{shot_id}.v{n}.{format}
Audio path:  {workspace_root}/projects/{slug}/assets/audio/{shot_id}.{bone_id}.{format}
```

After saving the file, write back:

**For image targets** — edit `story.json`, find the shot by ID, update:
```json
"extensions": {
  "x-Spore": {
    "startFrameImage": "projects/{slug}/assets/images/{shot_id}.{bone_id}.png",
    "production_status": { "image": "review" }
  }
}
```

**For video_take targets** — edit `video-map.json`:
```json
{
  "{shot_id}": {
    "takes": [
      { "id": "v1", "file": "projects/{slug}/assets/video/{shot_id}.v1.mp4", "active": true }
    ]
  }
}
```
If a take already exists, append as `v2`, `v3`, etc. Set the new take as `active: true`, set all others to `active: false`.

**For audio_track targets** — edit `audio-map.json`:
```json
{
  "{shot_id}": {
    "dialogue": "projects/{slug}/assets/audio/{shot_id}.{bone_id}.wav"
  }
}
```
Track type (`dialogue`, `sfx`, `music`) is determined by the BONE's `target` field.

---

## CLAUDE.md Skill File — Required Sections

The `CLAUDE.md` file auto-installed in every Spore workspace teaches Claude the project context. It must contain:

1. **Workspace path** — so Claude can resolve absolute file paths
2. **Active project slug** — or instructions to read it from `project.json`
3. **SKEL structure summary** — acts → scenes → shots, v_setup tokens, bone data
4. **Render output protocol** — the storage convention above (verbatim or paraphrased)
5. **Write-back protocol** — which files to update after a render (story.json, video-map, audio-map)
6. **Validation requirement** — always run validator before saving
7. **Available BONEs** — list of active bone_ids and their targets for this project

The skill file is regenerated by clicking "Regenerate Skill File" on the Studio home page. It should be regenerated any time BONEs are added/removed from a project.

---

## MCP Tools for the Generation Loop

To enable the full autonomous loop (read → write → generate → store), the following MCP tools are needed:

| Tool | Purpose |
|---|---|
| `read_story` | Read and parse the current project's `story.json` |
| `write_story` | Write updated SKEL data back to `story.json` |
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
- Spore MCP server (dedicated server exposing these as tools to Claude)
- Direct file operations via the existing workspace file access Claude already has

The minimal viable implementation uses direct file reads/writes — Claude reads `story.json`, edits it in memory, writes it back. The MCP server approach is the production-grade path.

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

The routing table should be extensible — adding a new generator means adding a `.bone.json` + an entry in the routing table. No changes to SKEL or Spore required.
