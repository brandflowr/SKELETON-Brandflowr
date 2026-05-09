# SKEL Changelog

All notable changes to the SKEL specification and implementation.

---

## [2.1.0] — 2026-05-08

### Specification Clarifications
- **Terminology note added**: `acts` (SKEL spec) = "Chapters" (Spore UI). Documented in OVERVIEW.md to prevent confusion when reading SKEL documents alongside the app.
- **Split production status**: `status` object on shots now carries separate `image` and `video` states. Image: `pending | generating | review | approved | rejected`. Video adds `not_started`.

### New Implementations (Spore)

**Fountain Import**
- `fountainToSkel()` utility implemented — parses `.fountain` screenplay files into a valid `SKELDocument`
- Extracts: scene headings (INT/EXT, location, time of day), action blocks, dialogue, character names
- Groups into acts (chapters), scenes, shots with proper ID references
- Triggered from Showrunner page

**Audio Map (x-Spore extension)**
- `audio-map.json` sidecar file: maps shot IDs → dialogue, SFX, and music track assignments
- Used by Audio page (library + assignments), Production Player (synced playback), and Timeline (audio track lanes with waveform visualization via wavesurfer.js)

**Video Takes / Multi-Take Map (x-Spore extension)**
- `video-map.json` sidecar file: maps shot IDs → numbered video takes (V1–V4) with active take flag
- Timeline renders dynamic track lanes based on max take index used in project
- Active take streams in Timeline monitor via Tauri asset protocol (native streaming, no base64)
- "Set Active" promotes any take to primary; auto-promotes if active is deleted

**Timeline**
- NLE-style editor with preview monitor (3-up: prev/current/next) and multi-track lane system
- Video tracks: V1 shows shot thumbnails + status colors; V2/V3/V4 show assigned takes
- Audio tracks: waveform visualization, synced to playhead per shot assignment
- Timecode display at 24fps (MM:SS:FF)
- Minimap overview bar, scene divider markers, red playhead with requestAnimationFrame animation
- Click-to-seek on ruler, drag-to-resize shot duration (saves to SKEL `duration` field)
- Drag-to-reorder shots: ghost element, drop indicator, commits on mouseup, zero re-renders during drag
- Markers: double-click ruler to add colored marker with label; M key shortcut
- Context menu: right-click shot → duplicate, seek, delete
- Undo/redo: 50-entry history for duration edits and reorders (Ctrl+Z / Ctrl+Y)
- Zoom: 20–200px/s range (buttons, +/- keys, Ctrl+scroll)

**SKEL-Native Storage**
- `useTauri.loadStory()` reads three formats: SKEL v2.0, legacy MasterStory, legacy nested chapters. Auto-detects, normalizes, migrates on first save.
- `useTauri.saveStory()` always writes SKEL v2.0. Migrates `imagePrompt`/`videoPrompt` → `bones.flux-dev.text` / `bones.runway-gen3.text`.
- `useSKEL` composable: `validate()`, `resolveSetup()`, `resolveBonesForShot()`, `resolveBonesForScene()`, `listBonesByTarget()`, label helpers.

**Real-Time Validation**
- Story Editor runs `validateSKEL()` after every save
- Error count badge shown in top bar (red AlertTriangle icon) when validation fails

**Shot Editor BONE Integration**
- Dynamic BONE fields rendered from `bone_registry` — textarea, number, slider, select, file, text
- Fields grouped by target (IMAGE / VIDEO badges)
- Token dropdowns: shot size (9), camera angle (6), movement (8), lens (5), lighting (8), DOF (3), aspect ratio
- Free-text color and mood fields added to `v_setup`
- Falls back to legacy prompt textareas if no BONEs registered; syncs `text` back to legacy fields

**Production Player**
- Camera HUD overlay: color-coded v_setup tokens (size, angle, move, light, lens)
- Toggle Show/Hide; hides defaults (eye, static) to reduce clutter
- Pop-out as standalone Tauri window

**Storyboard**
- v_setup token chips: color-coded (size=amber, angle=blue, move=emerald, light=purple, lens=cyan)
- Only non-default values shown
- BONE coverage indicator per shot (image/video green if text present, muted if empty)

**Shot Limit Enforcement**
- Reads `metadata.constraints.max_shots_per_scene` from SKEL document on boot
- Disables "Add Shot" button when limit reached; shows "3/4 shots" count

**Export / Import**
- Export `.skel.json` from Showrunner — validates before export, embeds `key_file` inline, native save dialog
- Import `.skel.json` from Showrunner — validates on import, creates project, extracts BONE definitions to `templates/bones/`

**Claude / MCP Skill Integration**
- `skill_template.md` fully rewritten for SKEL+BONE vocabulary
- Documents `shot_refs`, `scene_id`, `bones`, `status`, `v_setup`, inheritance chain
- Available BONEs table for Claude context

### Documentation Updates
- `OVERVIEW.md`: status table updated, terminology note added, audio/video map sidecar docs added, Fountain import marked complete, all planned items from Punchlist reflected
- `ARCHITECTURE.md`: Integration points updated to reflect SKEL-native storage; `fountainToSkel` module documented; sidecar data section added; Future Modules updated (fountain.ts removed — implemented)

---

## [2.0.0] — 2025-07-15

### Specification
- **BREAKING**: Renamed from VSON to VRAD (Visual Relational Action Data)
- **BREAKING**: Moved from nested hierarchy (v1.0) to flat relational structure
- Acts, scenes, and shots are now top-level arrays linked by ID references
- Added `extensions` object with `x-` namespacing on all entities
- Added `key_file` field (inline or external URI)
- Added `narrative` field on scenes
- Added `dialogue`, `character_refs`, `duration` fields on shots
- Added `move` (camera movement) and `dof` (depth of field) to `v_setup`
- Defined file convention: `.skel` / `.skel.json`, MIME type `application/skel+yaml`
- Defined interchange mappings for Fountain, Final Draft, OpenTimelineIO, CSV
- Defined versioning policy (MAJOR.MINOR semver)

### Schema
- JSON Schema Draft 7 (`skel.schema.json`)
- Full validation: required fields, enums, maxLength, maxItems, patterns
- 4-shot limit enforced via `maxItems: 4` on `shot_refs`
- Character limits: `action` (200), `prompt` (300), `logline` (280)

### Key File
- Default key file with 7 categories, 47 tokens
- Categories: size (9), angle (6), lens (5), move (8), light (8), tod (5), dof (3), custom (extensible)
- Extra metadata on tokens (e.g., `noir` includes `contrast: "high"`, `shadow_density: "heavy"`)

### Implementation
- `types.ts` — TypeScript interfaces matching schema
- `validator.ts` — AJV schema validation + referential integrity + duplicate ID detection
- `keyfile.ts` — `SKELKeyResolver` with spec-compliant fallback defaults (§4.2)
- `converter.ts` — Bidirectional conversion:
  - `masterStoryToSKEL()` — MasterStory → SKELDocument
  - `storyToSKEL()` — Story (UI tree) → SKELDocument
  - `SKELToStory()` — SKELDocument → Story (UI tree)
- Token mapping tables for shot sizes, angles, movements, lighting
- Removed `ajv-formats` dependency (not needed)

### Documentation
- `OVERVIEW.md` — Entry point, file inventory, quick start, status tracker
- `ARCHITECTURE.md` — System diagram, module responsibilities, data flows, integration points
- `DECISIONS.md` — 9 Architecture Decision Records
- `CHANGELOG.md` — This file

### Example
- `example.skel.json` — "The Last Signal" (2 acts, 3 scenes, 9 shots)
- Validates against schema ✅
- Passes referential integrity checks ✅

---

## [1.0.0] — 2025-07-15 (Superseded)

### Specification (as VSON)
- Initial nested hierarchy: Story → Acts → Scenes → Shots
- Basic `v_setup` with `size`, `angle`, `light`
- Key file concept with shorthand tokens
- 4-shot limit per scene
- Front-loading rule for `action` and `prompt` fields

> v1.0 was never implemented. Superseded by v2.0 flat relational structure.
