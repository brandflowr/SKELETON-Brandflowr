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

Spore stores two additional files alongside `story.json` (the SKEL document). These files carry production data that extends SKEL but is scoped to the Spore host application.

```
project/
  story.json          ← SKEL document (acts, scenes, shots, bones)
  audio-map.json      ← x-Spore: shot ID → dialogue/SFX/music track assignments
  video-map.json      ← x-Spore: shot ID → V1/V2/V3/V4 takes + active take flag
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
      { "id": "V1", "file": "assets/video/take1.mp4", "active": false },
      { "id": "V2", "file": "assets/video/take2.mp4", "active": true }
    ]
  }
}
```

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
- Enforces 4-shot limit during conversion

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
        ├──→ JSON.stringify()  ← write to story.json / .skel.json
        │
        └──→ AI Pipeline       ← shots[].bones + resolved v_setup
```

## Data Flow: Import

```
  .skel.json file (or native save dialog)
        │
        ▼
  JSON.parse()
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
| §3.1 Shot Limit (max 4) | `skel.schema.json` — `maxItems: 4` on `shot_refs`; enforced in Story Editor UI |
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
| `story.json` (project disk format) | IS the SKEL document — written by `useTauri.saveStory()`, read by `useTauri.loadStory()` |
| `useTauri.loadStory()` | Reads 3 formats: SKEL (skel_version present), old MasterStory, old nested chapters. Auto-migrates on first save. |
| `useTauri.saveStory()` | Always writes SKEL v2.0. Migrates legacy fields (imagePrompt → bones.flux-dev.text, etc.) |
| `app/types/Spore.ts` → `Shot` | Token maps normalize `shotType`, `cameraAngle`, `cameraMovement`, `lighting` |
| `useSKEL` composable | `validate()`, `resolveSetup()`, `resolveBonesForShot()`, `sizeLabel()`, etc. |
| Showrunner page | Fountain import button → `fountainToSkel()` → `SKELToStory()` → hydrate store |
| Showrunner page | Export `.skel.json` button → `storyToSKEL()` → `validateSKEL()` → native save dialog |
| Showrunner page | Import `.skel.json` button → `validateSKEL()` → `SKELToStory()` → create project |
| Story Editor | Real-time validation badge — error count in top bar after every save |
| Story Editor | Shot limit: reads `metadata.constraints.max_shots_per_scene`, disables Add Shot at limit |
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
