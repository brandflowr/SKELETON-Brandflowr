# SKEL Architecture Map

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INPUT SOURCES                                │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Markdown │  │ Fountain │  │  Final   │  │ Spore UI          │  │
│  │ + <shot> │  │ .fountain│  │  Draft   │  │ (Vue/Pinia state) │  │
│  │ tags     │  │          │  │  .fdx    │  │                   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │             │                  │             │
└───────┼──────────────┼─────────────┼──────────────────┼─────────────┘
        │              │             │                  │
        ▼              ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SKEL ENGINE (app/utils/SKEL/)                  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     converter.ts                             │   │
│  │                                                             │   │
│  │  masterStoryToSKEL()  ←── MasterStory (legacy disk format)  │   │
│  │  storyToSKEL()        ←── Story (UI tree / Vue state)       │   │
│  │  SKELToStory()        ──→ Story (UI tree / Vue state)       │   │
│  │                                                             │   │
│  │  Token Maps: SIZE_TO_TOKEN, ANGLE_TO_TOKEN, etc.            │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    SKELDocument                               │  │
│  │                                                              │  │
│  │  { skel_version, metadata, acts[], scenes[], shots[] }       │  │
│  └──────┬───────────────────────────────────┬───────────────────┘  │
│         │                                   │                      │
│         ▼                                   ▼                      │
│  ┌──────────────┐                   ┌──────────────────┐          │
│  │ validator.ts │                   │   keyfile.ts     │          │
│  │              │                   │                  │          │
│  │ Schema check │                   │ SKELKeyResolver  │          │
│  │ (AJV Draft7) │                   │                  │          │
│  │              │                   │ resolveToken()   │          │
│  │ Referential  │                   │ resolveSetup()   │          │
│  │ integrity    │                   │                  │          │
│  │              │                   │ Fallback defaults│          │
│  │ Duplicate ID │                   │ per spec §4.2    │          │
│  │ detection    │                   │                  │          │
│  └──────┬───────┘                   └────────┬─────────┘          │
│         │                                    │                     │
│         ▼                                    ▼                     │
│  ┌──────────────┐                   ┌──────────────────┐          │
│  │ Validation   │                   │ Resolved tokens  │          │
│  │ Result       │                   │ (full labels,    │          │
│  │ {valid,      │                   │  descriptions,   │          │
│  │  errors[]}   │                   │  engine params)  │          │
│  └──────────────┘                   └──────────────────┘          │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                      types.ts                                │  │
│  │                                                             │  │
│  │  SKELDocument, SKELAct, SKELScene, SKELShot, SKELVSetup,    │  │
│  │  SKELLoc, SKELMetadata, SKELKeyFile, SKELKeyFileToken       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       OUTPUT TARGETS                                │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  .skel.json  │  │ AI Pipeline  │  │ Spore        │             │
│  │  (file on    │  │ (Runway,     │  │ UI State     │             │
│  │   disk)      │  │  Kling, etc) │  │ (import)     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ OpenTimeline │  │     CSV      │                                │
│  │ IO (planned) │  │  (planned)   │                                │
│  └──────────────┘  └──────────────┘                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Spore-Specific Sidecar Data

Spore stores sidecar files alongside `story.skel`, the native SKEL document. These files carry production data that extends SKEL but is scoped to the Spore host application. `story.json` is legacy/migration input only.

```
project/
  story.skel          ← native SKEL YAML document (acts, scenes, shots, bones)
  audio-map.json      ← x-spore: shot ID → dialogue/SFX/music track assignments
  video-map.json      ← x-spore: shot ID → V1/V2/V3/V4 takes + active take flag
```

### audio-map.json

Maps shot IDs to up to three audio track types. Used by the Audio page, the Timeline, and the Production Player for synced playback.

```json
{
  "sh_abc123": {
    "dialogue": "assets/audio/voiceover_01.mp3",
    "sfx": "assets/audio/ambient_rain.wav",
    "music": null
  }
}
```

### video-map.json

Maps shot IDs to numbered video takes. One take is flagged as active. The Timeline renders dynamic V1–V4 track lanes based on the maximum take index used across the project.

```json
{
  "sh_abc123": {
    "takes": [
      { "id": "V1", "file": "assets/video/take1.mp4", "isActive": false },
      { "id": "V2", "file": "assets/video/take2.mp4", "isActive": true }
    ]
  }
}
```

The `isActive` flag marks exactly one take per shot as the active take. User-imported video takes use paths under `assets/video/`; AI-generated video renders use paths under `renders/video/` (see Render Output Protocol below). Both types coexist in `video-map.json` — the path prefix distinguishes their origin.

---

### Render Output Protocol

When an external generator or LLM writes a rendered file back to a project, it uses the following deterministic path convention:

```
{workspace_root}/projects/{slug}/renders/images/{shot_id}.{bone_id}.{format}    ← image renders
{workspace_root}/projects/{slug}/renders/video/{shot_id}.v{n}.{format}          ← video renders
{workspace_root}/projects/{slug}/renders/audio/{shot_id}.{bone_id}.{format}     ← audio renders
{workspace_root}/projects/{slug}/renders/failures/{shot_id}.{bone_id}.log       ← failure logs
```

The `renders/` folders are created by the Render Output Protocol card in the Showrunner page. They are distinct from the `assets/` folders used for user-imported media.

After writing a render file, the generator or LLM updates:
- **Image renders** → `shot.extensions.x-spore.startFrameImage` (or `endFrameImage` / `image`) in `story.skel`
- **Video renders** → `video-map.json`: append a new take with `isActive: true`, set all prior takes for that shot to `isActive: false`
- **Audio renders** → `audio-map.json`: assign the file as `dialogue`, `sfx`, or `music` per the BONE's target
- **Production status** → `shot.extensions.x-spore.production_status.image` or `.video` set to `"review"`

Spore's Refresh Outputs action scans `renders/` folders and re-attaches any outputs that match shot IDs found in filenames.

---

## Module Responsibilities

### types.ts
- Single source of truth for all SKEL TypeScript interfaces
- Mirrors `skel.schema.json` exactly
- No runtime code — types only

### validator.ts
- Compiles `skel.schema.json` via AJV at module load
- `validateSKEL(data)` runs two passes:
  1. JSON Schema validation (structure, types, enums, constraints)
  2. Referential integrity (act↔scene↔shot ID cross-references, uniqueness)
- Returns `{ valid: boolean, errors: SKELError[] }`
- Called after every save in Spore (real-time validation badge in UI)

### External validator contract
- CLI entry point: `spore validate projects/example/story.skel`
- MCP / agent tool: `validate_skel`
- The external contract wraps the same validation behavior as `validator.ts`, but accepts a file path and returns stable machine-readable errors.
- Required stages:
  1. Parse `.skel` YAML, or `.skel.json` export input when explicitly requested.
  2. Determine lifecycle from `metadata.lifecycle`, defaulting to `draft`, unless an explicit CLI/tool override is provided.
  3. Run JSON Schema validation against the parsed data model.
  4. Run referential integrity checks for IDs, act/scene/shot refs, and lifecycle-specific structure.
  5. Resolve BONE registry references and validate required BONE fields after inheritance.
  6. Optionally validate sidecar files (`audio-map.json`, `video-map.json`, canvas layout) against shot IDs.
- Required result shape:

```ts
type SKELValidationResult = {
  valid: boolean
  lifecycle: 'draft' | 'production' | 'export'
  errors: SKELError[]
  warnings: SKELError[]
}

type SKELError = {
  code: string
  severity: 'error' | 'warning'
  path: string
  message: string
}
```

- CLI exit codes:
  - `0`: valid, no errors
  - `1`: validation completed with errors
  - `2`: file could not be read or parsed

### keyfile.ts
- `SKELKeyResolver` class loads `skel-keyfile.json` (or custom key file)
- `resolveToken(category, token)` → single token lookup
- `resolveSetup(v_setup)` → expands entire visual setup block with fallback defaults
- Fallback chain: token → key file lookup → spec default → raw fallback

### converter.ts
- `masterStoryToSKEL(MasterStory)` → SKELDocument (legacy disk format export; handles auto-migration from old nested format)
- `storyToSKEL(Story)` → SKELDocument (UI state export)
- `SKELToStory(SKELDocument, projectId)` → Story (import into UI)
- Token mapping tables normalize free-text values (e.g., "Close-Up" → `cu`)
- Preserves all detected shots in the source scene during conversion

### fountainToSkel (app/utils/fountainToSkel.ts)
- Parses `.fountain` screenplay files into structured tokens
- Groups tokens into the SKEL hierarchy: acts (chapters), scenes, shots
- Extracts: action blocks, dialogue, character names, scene headings (INT/EXT/tod)
- Output: valid `SKELDocument` ready for import

---

## Data Flow: Export

```
Spore UI State (Pinia)
        │
        ▼
  storyToSKEL()          ← converter.ts
        │
        ▼
  SKELDocument           ← in-memory object
        │
        ├──→ validateSKEL()    ← validator.ts (pre-flight check, errors shown in UI)
        │
        ├──→ YAML.stringify()  ← write to story.skel
        │
        ├──→ JSON.stringify()  ← explicit .skel.json export only
        │
        └──→ AI Pipeline       ← shots[].bones + resolved v_setup
```

## Data Flow: Import

```
  .skel file (native) or .skel.json file (export/interchange)
        │
        ▼
  YAML.parse() / JSON.parse()
        │
        ▼
  validateSKEL()         ← validator.ts (reject bad files, surface errors)
        │
        ▼
  SKELToStory()          ← converter.ts
        │
        ▼
  Story object           ← hydrate Pinia store
  + extract BONEs        ← write .bone.json files to templates/bones/
```

## Data Flow: Fountain Import

```
  .fountain file
        │
        ▼
  fountainToSkel()       ← app/utils/fountainToSkel.ts
        │
        ▼
  SKELDocument           ← acts[], scenes[], shots[] with action + dialogue
        │
        ▼
  SKELToStory()          ← converter.ts
        │
        ▼
  Story object           ← hydrate Pinia store
```

## Data Flow: AI Generation

```
  SKELDocument
        │
        ▼
  SKELKeyResolver        ← keyfile.ts
        │
  resolveSetup(shot.v_setup)
        │
        ▼
  Resolved tokens        ← { size: { label: "Close-Up", ... }, light: { label: "Film Noir", contrast: "high" } }
        │
        ├──→ Prompt assembly   ← combine shot.bones[id].text + resolved token descriptions
        │
        └──→ API call          ← Runway / Kling / Sora / etc.
```

---

## Spec Files ↔ Implementation Mapping

| Spec Section | Implementation |
|---|---|
| §2 Document Structure | `types.ts` — all interfaces |
| §3.1 Front-Loading | `fountain-to-skel.ts` — shot actions derive from source beats |
| §3.3 ID Uniqueness | `validator.ts` — duplicate ID detection |
| §3.4 Referential Integrity | `validator.ts` — cross-reference validation |
| §3.5 Character Limits | `skel.schema.json` — `maxLength` on `action`, `prompt`, `logline` |
| §4 Key File | `keyfile.ts` — `SKELKeyResolver` |
| §4.2 Default Fallbacks | `keyfile.ts` — `DEFAULTS` constant |
| §6 Extensions | `types.ts` — `extensions?: Record<string, any>` on all entities |
| §7.1 Fountain import | `fountainToSkel.ts` — ✅ implemented |
| §7.2 Interchange (export) | `converter.ts` — bidirectional MasterStory/Story ↔ SKEL |
| §8 Versioning | `skel.schema.json` — `skel_version` pattern validation |

---

## Integration Points with Spore

| Spore Component | SKEL Integration |
|---|---|
| `story.skel` (project disk format) | Native SKEL YAML document - written by `useTauri.saveStory()`, read by `useTauri.loadStory()` |
| `story.json` | Legacy/migration input only. Read when present in older projects, then migrated to `story.skel` on save. |
| `useTauri.loadStory()` | Reads native `story.skel`, `.skel.json` imports, and legacy project formats. Auto-migrates legacy data on first save. |
| `useTauri.saveStory()` | Always writes native SKEL v2.0 YAML to `story.skel`. Migrates legacy fields (imagePrompt → bones.flux-dev.text, etc.) |
| `app/types/Spore.ts` → `Shot` | Token maps normalize `shotType`, `cameraAngle`, `cameraMovement`, `lighting` |
| `useSKEL` composable | `validate()`, `resolveSetup()`, `resolveBonesForShot()`, `sizeLabel()`, etc. |
| Showrunner page | Fountain import button → `fountainToSkel()` → `SKELToStory()` → hydrate store |
| Showrunner page | Export `.skel.json` button → `storyToSKEL()` → `validateSKEL()` → native save dialog |
| Showrunner page | Import `.skel` / `.skel.json` button → `validateSKEL()` → `SKELToStory()` → create project |
| Story Editor | Real-time validation badge — error count in top bar after every save |
| Story Editor | Add Shot and Import Sequence append to the selected scene without a count cap |
| Shot Editor | Dynamic BONE fields: reads `bone_registry`, renders fields per BONE `ui` hints |
| Shot Editor | Token dropdowns: size (9), angle (6), move (8), lens (5), light (8), DOF (3), aspect |
| Shot Editor | Split production status: image (5 states) / video (6 states) |
| Storyboard | v_setup token chips (color-coded), BONE coverage indicators per shot |
| Production Player | Camera HUD overlay: resolved v_setup tokens displayed during playback |
| Timeline | Multi-track lanes: V1–V4 video tracks built from `video-map.json` takes |
| Timeline | Audio track waveforms: tracks built from `audio-map.json` assignments |

---

## Future Modules (Planned)

| Module | Purpose | Priority |
|---|---|---|
| `parser.ts` | Parse Markdown + `<shot>` XML tags → SKELDocument | High |
| `fdx.ts` | Import Final Draft `.fdx` → SKELDocument | Medium |
| `otio.ts` | Export SKELDocument → OpenTimelineIO | Low |
| `csv.ts` | Export flat shot table to CSV | Low |
| `cli.ts` | Standalone `SKEL validate` / `SKEL convert` CLI | Medium |
