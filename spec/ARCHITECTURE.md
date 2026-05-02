# SKEL Architecture Map

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INPUT SOURCES                                │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Markdown │  │ Fountain │  │  Final   │  │ Spore UI     │  │
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
│  │  masterStoryToSKEL()  ←── MasterStory (disk format)         │   │
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
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       OUTPUT TARGETS                                │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  .skel.json  │  │ AI Pipeline  │  │ Spore   │             │
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

### keyfile.ts
- `SKELKeyResolver` class loads `skel-keyfile.json` (or custom key file)
- `resolveToken(category, token)` → single token lookup
- `resolveSetup(v_setup)` → expands entire visual setup block with fallback defaults
- Fallback chain: token → key file lookup → spec default → raw fallback

### converter.ts
- `masterStoryToSKEL(MasterStory)` → SKELDocument (disk format export)
- `storyToSKEL(Story)` → SKELDocument (UI state export)
- `SKELToStory(SKELDocument, projectId)` → Story (import into UI)
- Token mapping tables normalize free-text values (e.g., "Close-Up" → `cu`)
- Enforces 4-shot limit during conversion

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
        ├──→ validateSKEL()    ← validator.ts (optional pre-flight check)
        │
        ├──→ JSON.stringify()  ← write to .skel.json
        │
        └──→ AI Pipeline       ← shots[].prompt + resolved v_setup
```

## Data Flow: Import

```
  .skel.json file (or API payload)
        │
        ▼
  JSON.parse()
        │
        ▼
  validateSKEL()         ← validator.ts (reject bad files)
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
        ├──→ Prompt assembly   ← combine shot.prompt + resolved token descriptions
        │
        └──→ API call          ← Runway / Kling / Sora / etc.
```

---

## Spec Files ↔ Implementation Mapping

| Spec Section | Implementation |
|---|---|
| §2 Document Structure | `types.ts` — all interfaces |
| §3.1 Shot Limit (max 4) | `skel.schema.json` — `maxItems: 4` on `shot_refs` |
| §3.3 ID Uniqueness | `validator.ts` — duplicate ID detection |
| §3.4 Referential Integrity | `validator.ts` — cross-reference validation |
| §3.5 Character Limits | `skel.schema.json` — `maxLength` on `action`, `prompt`, `logline` |
| §4 Key File | `keyfile.ts` — `SKELKeyResolver` |
| §4.2 Default Fallbacks | `keyfile.ts` — `DEFAULTS` constant |
| §6 Extensions | `types.ts` — `extensions?: Record<string, any>` on all entities |
| §7 Interchange | `converter.ts` — bidirectional MasterStory/Story ↔ SKEL |
| §8 Versioning | `skel.schema.json` — `skel_version` pattern validation |

---

## Integration Points with Spore

| Spore Component | SKEL Integration |
|---|---|
| `app/types/Spore.ts` → `MasterStory` | `masterStoryToSKEL()` reads this for disk-format export |
| `app/types/Spore.ts` → `Story` | `storyToSKEL()` / `SKELToStory()` for UI state round-trip |
| `app/types/Spore.ts` → `Shot` | Token maps normalize `shotType`, `cameraAngle`, `cameraMovement`, `lighting` |
| Pinia stores | Import `validateSKEL` + converters directly |
| Storyboard page | Export button → `storyToSKEL()` → download `.skel.json` |
| File import dialog | Upload `.skel.json` → `validateSKEL()` → `SKELToStory()` → hydrate store |

---

## Future Modules (Planned)

| Module | Purpose | Priority |
|---|---|---|
| `parser.ts` | Parse Markdown + `<shot>` XML tags → SKELDocument | High |
| `fountain.ts` | Import `.fountain` files → SKELDocument | Medium |
| `fdx.ts` | Import Final Draft `.fdx` → SKELDocument | Medium |
| `otio.ts` | Export SKELDocument → OpenTimelineIO | Low |
| `csv.ts` | Export flat shot table to CSV | Low |
| `cli.ts` | Standalone `SKEL validate` / `SKEL convert` CLI | Medium |
