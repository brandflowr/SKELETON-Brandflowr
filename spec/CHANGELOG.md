# SKEL Changelog

All notable changes to the SKEL specification and implementation.

---

## [2.6.0] - 2026-06-14

### Schema consistency fixes (`spec/skel.schema.json` — the schema SPORE compiles)
- `KeyFile`: added `aspect`, `color`, `mood` token arrays. The shipped `skel-keyfile.json` already carries `color`/`mood` and `keyfile.ts` resolves them, so the default key file had been failing its own schema. Mirrored into `SKEL/spec/skel.schema.json`.
- `BoneDefinition` (embedded `bone_registry` entries): widened to `additionalProperties: true` plus documented `provider`/`prompt_assembly`/`llm_instructions`/`output`/`routing`/`execution`/`execution_routes`/`extensions` and `x-` namespacing. The old 7-field `additionalProperties:false` shape rejected SPORE's own Higgsfield bones on save.
- Added `metadata.lifecycle`, plus `intent`/`creative_status` on `Scene` and `Shot` (with `SceneIntent`/`ShotIntent`/`CreativeStatus` defs), and replaced the unconditional `minItems:1` on `acts`/`scenes`/`shots` with the lifecycle-conditional `allOf` (draft empty valid; production/export strict; export & any-`bones` ⇒ require `bone_registry`).

### Deep-detail merge (additive — existing 2.0 files stay valid)
Brought the canonical frame depth from the StoryboardZ-style generator output into SKEL:
- `Metadata`: added optional `subtitle`, `genre`, `classification`, `target_audience`, `target_duration_seconds`/`_minutes`, `budget_range`, `status`, `content_warnings[]`, `tags[]`, `production_notes`, `director`, `writer`.
- Optional top-level `characters[]`, `environments[]`, `audio_assets[]` (loose embedded snapshots; primary reference stays by id to `studio.json`, embed on `lifecycle: export`), plus informational `story_analysis` and `production` objects.
- `Scene`: added `duration_seconds`, `mood`, `key_story_elements[]`.
- `Shot`: added `title`, `visual_focus`, `cinematography` (verbose camera+lighting detail — `v_setup` stays the canonical shorthand), `sound_effects[]`, and `dialogue` is now **string OR a structured `Dialogue` object** (`text`/timing/`emotion`/`voice_settings`).
- New defs: `Dialogue`, `SoundCue`, `Cinematography`, `Character`, `Environment`, `AudioAsset`, `StoryAnalysis`, `Production`.

### BONE — `ai_generation` as a generator bone
- A shot's `ai_generation` block is modeled as a generator-bone instance in `shot.bones` (platform→`provider`, settings→fields, `prompt_components` = the assembled structured frame), reusing `bone_registry`/`prompt_assembly`/`output`.
- Added first-party structured bones `spore-video.bone.json` and `spore-image.bone.json` whose fields ARE the canonical nested frame (subject/action/scene/shot/camera/lighting/color_palette/style/…). Bundled into the workspace seed.
- `usePromptPreview.buildJsonPrompt` emits a structured bone's own frame as-is; flat bones keep the legacy camera-token shape.

### SPORE implementation
- App TS types (`app/utils/skel/types.ts`) fully aligned to the merged schema.
- Generator bones now load from bundled `spec/bones/` (recursive) as well as user `templates/bones/`.
- New **Video Builder** (bone-driven Form/Text/JSON) and an editable Start/End frame prompt box.
- Every generated image/video keeps the prompt that made it (text + JSON): images in the `x-spore` extension (`startFramePrompt`/`endFramePrompt`), video on the `VideoTake` (`prompt`/`promptJson`).
- `saveStory` now merge-preserves all rich, UI-unmodeled fields (structured dialogue, cinematography, intent, creative_status, sound_effects, scene mood, loc INT/EXT, extra metadata, top-level characters/environments/audio_assets/story_analysis/production) — an open+save in the editor no longer drops AI-generated depth.

---

## [2.5.0] - 2026-05-22

### Creative Collaboration Layer (#9, #10, #11)

- Added `SceneIntent` definition to `skel.schema.json`: optional `purpose`, `conflict`, `emotional_turn`, and `story_function` fields on scenes. `story_function` is a fixed enum: `setup`, `escalation`, `reveal`, `reaction`, `decision`, `transition`, `payoff`, `button`.
- Added `ShotIntent` definition to `skel.schema.json`: optional `beat`, `function`, and `emphasis` fields on shots. `function` uses the same vocabulary as `story_function`.
- Added `CreativeStatus` definition to `skel.schema.json`: string enum `idea`, `drafted`, `needs_review`, `approved`, `locked`.
- Added `intent` (→ `SceneIntent`) and `creative_status` (→ `CreativeStatus`) to the `Scene` definition.
- Added `intent` (→ `ShotIntent`) and `creative_status` (→ `CreativeStatus`) to the `Shot` definition.
- Updated `skel-spec.md` §2.4 (scene fields) and §2.5 (shot fields) with `intent` and `creative_status` rows.
- Added §2.6 "Creative Collaboration Fields" to `skel-spec.md` with full documentation of `SceneIntent`, `ShotIntent`, and `creative_status`, including YAML examples and LLM behavioral rules.
- Updated `example.skel.json`: added `intent` and `creative_status: "approved"` to scene `sc_1`; added `intent` and `creative_status: "locked"` to shot `sh_3`.
- Added ADR-012 (Scene and Shot Creative Intent Fields) and ADR-013 (`creative_status` Field) to `DECISIONS.md`.
- Updated `LLM_INTEGRATION.md`: added "Reason about creative intent" to the What LLMs Can Do section; added "Respect `creative_status: locked`" rule with YAML examples; added "Preserve `intent` when rewriting" rule with YAML examples.
- All fields are optional — existing scenes and shots without them remain valid under all lifecycle modes.
- `creative_status` and `status.image`/`status.video` are clearly distinct: creative status tracks story development; production status tracks media generation.

### SPORE Proposal Storage (#12)

- Added `SKEL/spec/x-spore.schema.json`: supplementary JSON Schema Draft 7 for data stored under `extensions.x-spore`.
- Defined `extensions.x-spore.proposals` as reviewable proposal history with stable `prop_` IDs, author, type, status, summary, optional target/rationale/patch, and resolution timestamps.
- Standardized proposal statuses: `pending`, `accepted`, `rejected`, `superseded`.
- Standardized proposal types: `add_scene`, `rewrite_scene`, `add_shots`, `rewrite_shot`, `add_bone_prompts`, `structure_note`, `continuity_fix`.
- Updated `skel-spec.md`, `OVERVIEW.md`, and `LLM_INTEGRATION.md` to document proposal storage while keeping the core SKEL schema vendor-neutral.

---

## [2.4.0] - 2026-05-22

### Render Path Alignment (#15)
- Confirmed all spec files use `renders/{images|video|audio|failures}/` for AI render output and `assets/` for user-imported media. No stale `assets/images` or `assets/video` paths remain in render contexts.
- ARCHITECTURE.md sidecar examples intentionally retain `assets/video/` and `assets/audio/` paths with an explicit note distinguishing user-imported from AI-generated media.

### Sidecar Schemas (#14)
- Added `SKEL/spec/video-map.schema.json`: JSON Schema Draft 7 for `video-map.json`. Enforces shot-ID keys, takes arrays with `id`/`file`/`isActive` required fields, `V{n}` ID pattern, and optional `label`/`bone_id`/`duration`/`created_at` fields.
- Added `SKEL/spec/audio-map.schema.json`: JSON Schema Draft 7 for `audio-map.json`. Enforces shot-ID keys with optional `dialogue`/`sfx`/`music` string-or-null fields.
- Added `SKEL/spec/canvas-layout.schema.json`: JSON Schema Draft 7 for `canvas/layout.json`. Enforces `nodes` object keyed by entity ID, each with required `x`/`y` and optional `width`/`height`/`collapsed`/`extensions` fields. Includes optional `viewport` (zoom/pan) and `saved_at` timestamp.
- All three schemas validated with Python `json.load`.

---

## [2.3.0] - 2026-05-22

### Output/Write-back Alignment
- Updated Storage Convention in `LLM_INTEGRATION.md`: render paths now use `renders/images/`, `renders/video/`, `renders/audio/`, and `renders/failures/` to match the SPORE Render Output Protocol.
- Replaced `active` with `isActive` as the canonical field name for video takes in `video-map.json`.
- Updated `video-map.json` write-back example in `LLM_INTEGRATION.md` to use `isActive` and `renders/video/` paths.
- Updated image and audio write-back examples in `LLM_INTEGRATION.md` to use `renders/images/` and `renders/audio/` paths.
- Updated default `path_template` values in `SKEL/spec/bone-spec.md` §2.6 to use `renders/` paths.
- Clarified `video_take` target: new take sets `isActive: true`, all prior takes for that shot set to `isActive: false`.
- Clarified `audio_track` target: track type (`dialogue`, `sfx`, `music`) comes from the BONE's `target` field.
- Added `renders/failures/` path for failed render diagnostics.
- Added "Render Output Protocol" subsection to `ARCHITECTURE.md` documenting render paths, write-back targets, and the distinction between `assets/` (user-imported) and `renders/` (AI-generated) paths.
- Fixed `"active"` → `"isActive"` in the `video-map.json` example in `ARCHITECTURE.md`.

---

## [2.2.0] - 2026-05-22

### Source Of Truth Alignment
- Clarified that `story.skel` / `.skel` is SPORE's native UTF-8 YAML authoring format.
- Clarified that `.skel.json` is an explicit export/interchange format using the same data model.
- Marked `story.json` as legacy/migration input only in SKEL overview and architecture docs.
- Updated LLM integration docs to read, validate, write, and save `story.skel`.
- Added `metadata.lifecycle` with `draft`, `production`, and `export` validation modes.
- Relaxed base schema array/ref `minItems` rules so empty projects can validate as drafts, while production/export keep stricter structural requirements.
- Made `bone_registry` conditional-required: BONE-bearing documents and export lifecycle documents must include it, while empty drafts may omit it or use `{}`.
- Documented that entity `bones` keys must resolve to matching `bone_registry` keys as a validator-level referential integrity check.
- Added the external validator contract for `spore validate` and `validate_skel`, including lifecycle selection, minimum checks, result shape, and error codes.

### BONE Alignment
- Updated embedded BONE definition schema support for `prompt_assembly`, `llm_instructions`, and `output`.
- Synchronized SKEL/BONE documentation language so examples using newer BONE fields are formally valid.
- Added embedded BONE definition schema support for provider/routing metadata: `provider`, `routing`, `execution_routes`, `extensions`, and top-level `x-` namespaced fields.
- Normalized SPORE extension namespace examples and write-back paths to lowercase `x-spore`.
- Normalized `prompt_assembly` behavior across BONE specs, embedded BONE schemas, and LLM integration docs, including strategy semantics, template tokens, injection options, and validator expectations.
- Tightened embedded BONE `prompt_assembly` schema validation for `template`, `sequential`, and `raw` strategies while keeping nested injection metadata extensible.

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

**Audio Map (x-spore extension)**
- `audio-map.json` sidecar file: maps shot IDs → dialogue, SFX, and music track assignments
- Used by Audio page (library + assignments), Production Player (synced playback), and Timeline (audio track lanes with waveform visualization via wavesurfer.js)

**Video Takes / Multi-Take Map (x-spore extension)**
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

**Scene Length**
- Scenes can contain as many shots as the story requires.
- Add Shot and Import Sequence no longer enforce a per-scene shot count.

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
- Referential integrity across `scene_refs`, `shot_refs`, and parent IDs
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
- Unrestricted scene shot counts
- Front-loading rule for `action` and `prompt` fields

> v1.0 was never implemented. Superseded by v2.0 flat relational structure.
