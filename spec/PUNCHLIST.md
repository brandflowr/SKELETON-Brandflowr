# Spore Punchlist

> Everything needed to make Spore the definitive way to view your creation.
> Target project: Nightmare Seed

---

## Phase 0 — Data Layer Migration (CRITICAL PATH)

The app currently reads/writes the old MasterStory format. SKEL+BONE is spec'd and validated but not wired into the actual UI. Nothing else matters until this is done.

- [x] **P0-1: Rewrite `useTauri.loadStory()` to read SKEL natively** ✅
  - Reads 3 formats: SKEL (skel_version present), old MasterStory (scene_ref/shot_id), old nested (chapters)
  - Extracts BONE text from bones objects, reads v_setup tokens, status, notes
  - Reads startFrameImage/endFrameImage from extensions.x-Spore

- [x] **P0-2: Rewrite `useTauri.saveStory()` to write SKEL natively** ✅
  - Always writes SKEL format with skel_version: "2.0"
  - Maps UI values to SKEL tokens via token maps (size, angle, move, light)
  - Migrates imagePrompt/videoPrompt → bones.flux-dev.text / bones.runway-gen3.text
  - Preserves existing bone_registry, metadata.bones, and extensions on round-trip
  - Stores startFrameImage/endFrameImage in extensions.x-Spore

- [x] **P0-3: Migration utility for existing projects** ✅
  - Built into loadStory/saveStory — auto-detects format, reads any, writes SKEL
  - Token maps handle camera_setup.type → v_setup.size, etc.
  - First save of any old project auto-migrates to SKEL

- [x] **P0-4: Add a `useSKEL` composable** ✅
  - `validate(data)` — full schema + referential integrity check
  - `resolveSetup(v_setup)` — expand tokens to full definitions
  - `resolveBonesForShot(doc, shot)` — full inheritance chain resolution
  - `resolveBonesForScene(doc, scene)` — scene-level resolution
  - `listBonesByTarget(registry, 'image')` — filter BONEs by type
  - Label helpers: `sizeLabel('cu')` → `"Close-Up"` for UI display

---

## Phase 1 — Shot Editor BONE Integration

The shot editor is where users spend 80% of their time. It needs to speak BONE natively.

- [x] **P1-1: Replace hardcoded prompt textareas with dynamic BONE fields** ✅
  - Reads `bone_registry` from raw SKEL document
  - Renders fields dynamically per BONE definition using `ui` hints
  - Supports textarea, number, slider, select, file, text field types
  - Groups by target (IMAGE / VIDEO badges)
  - Falls back to legacy imagePrompt/videoPrompt textareas if no BONEs registered
  - Syncs BONE `text` fields back to legacy prompts for backward compat

- [x] **P1-2: Replace free-text camera inputs with token dropdowns** ✅
  - Shot Size → 9-option dropdown (ws through 2s)
  - Angle → 6-option dropdown (eye through worm)
  - Movement → 8-option dropdown (static through drone)
  - Lens → 5-option dropdown (wide through anamorphic)
  - Lighting → 8-option dropdown (natural through neon)
  - Added DOF dropdown (deep, shallow, rack)
  - Added Aspect Ratio dropdown (16:9 through 21:9)
  - Added Color and Mood free-text inputs

- [ ] **P1-3: BONE inheritance indicator**
  - Show which values are inherited (from metadata or scene) vs set on the shot
  - Visual: inherited values shown in muted text, shot-level overrides in normal text
  - "Reset to inherited" button per field

- [x] **P1-4: Production status split** ✅
  - Separate Image status and Video status button rows
  - Image: pending, generating, review, approved, rejected
  - Video: not_started, pending, generating, review, approved, rejected

---

## Phase 2 — Storyboard View Polish

The storyboard is the "wow" page. It needs to feel like looking at a real production board.

- [x] **P2-1: Show v_setup tokens as visual badges** ✅
  - Color-coded token chips: size=amber, angle=blue, move=emerald, light=purple, lens=cyan
  - Only shows non-default values (hides `eye` angle, `static` movement)
  - Compact `text-[8px]` font with border styling

- [x] **P2-2: BONE coverage indicator per shot** ✅
  - Image icon (green if BONE has text, muted if empty)
  - Video icon (green if BONE has text, muted if empty)
  - Reads from raw SKEL `bone_registry` to detect image/video BONEs

- [ ] **P2-3: Scene-level BONE defaults panel**
  - Expandable panel on each scene card
  - Set scene-wide BONE defaults (negative prompt, lighting style, etc.)
  - Shows inheritance: "3 shots inherit these defaults"

- [ ] **P2-4: Aspect ratio from v_setup**
  - Currently reads aspect from `project.json` metadata
  - Should read from `v_setup.aspect` per shot (shots can have different ratios)
  - Fall back to project default if not set

---

## Phase 3 — Story Editor SKEL Awareness

- [ ] **P3-1: Scene header auto-parsing**
  - When user types "INT. LIGHTHOUSE - NIGHT" in scene title
  - Auto-populate `loc.type`, `loc.name`, `loc.tod` from the slug line
  - Show parsed tokens as badges below the input

- [x] **P3-2: Shot limit enforcement** ✅
  - Reads `metadata.constraints.max_shots_per_scene` from raw SKEL on boot
  - Disables "Add Shot" button when limit reached
  - Shows count: "3/4 shots" on every Add Shot button
  - New shots default to SKEL tokens (ms, eye, static) instead of empty strings

- [ ] **P3-3: Order field management**
  - Drag-to-reorder scenes and shots
  - Auto-update `order` fields on all affected entities
  - Persist order on save

---

## Phase 4 — BONE Editor & Management

This is the extensibility play. Users create and manage their own BONEs.

- [ ] **P4-1: BONE manager page**
  - List all installed `.bone.json` files from `templates/bones/`
  - Show: bone_id, label, target, field count, attaches_to
  - Enable/disable BONEs per project

- [ ] **P4-2: BONE definition editor**
  - Create new `.bone.json` files from the UI
  - Add/remove/edit fields with type, required, ui hint, default, min/max/options
  - Live preview of what the shot editor will render

- [ ] **P4-3: BONE import/export**
  - Import `.bone.json` from disk
  - Export BONEs as shareable files
  - Hook into marketplace pack system (new pack type: `bone`)

- [ ] **P4-4: Project BONE registry management**
  - UI to select which BONEs are active for a project
  - Set project-level defaults per BONE on `metadata.bones`
  - Auto-embed active BONEs into `bone_registry` on export

---

## Phase 5 — Export & Portability

The "one JSON, everything included" promise.

- [x] **P5-1: Export to `.skel.json`** ✅
  - "Export .skel.json" button on showrunner metadata panel
  - Runs `validateSKEL()` before export — shows error if invalid
  - Embeds `key_file` inline for full portability
  - Native save dialog with `.skel.json` filter
  - Success/error feedback inline

- [x] **P5-2: Import from `.skel.json`** ✅
  - "Import .skel.json" button on showrunner metadata panel
  - Validates on import, shows errors for invalid documents
  - Creates new project from imported data (title → slug)
  - Writes SKEL doc as story.json
  - Extracts BONE definitions to `templates/bones/` if not already installed
  - Auto-switches to imported project

- [ ] **P5-3: Export to CSV**
  - Flat shot table: scene header, shot action, v_setup tokens, BONE text prompts, status
  - For spreadsheet workflows and production breakdowns

---

## Phase 6 — Validation & Guardrails

- [x] **P6-1: Real-time validation in story editor** ✅
  - Runs `validateSKEL()` after every save
  - Shows error count badge in top bar (red with AlertTriangle icon)
  - Reads validation errors and warnings from the validator

- [ ] **P6-2: BONE field validation**
  - After inheritance resolution, check required fields per BONE definition
  - Show "Missing: prompt text" warnings on shots with incomplete BONE data

- [ ] **P6-3: Referential integrity auto-repair**
  - On load, detect orphaned shots (scene_id points to deleted scene)
  - Offer to reassign or delete orphans
  - Detect missing shot_refs and offer to rebuild from shot.scene_id

---

## Phase 7 — Production Player Upgrade

- [x] **P7-1: Read v_setup for playback hints** ✅
  - Already reads `duration` for timing (was pre-existing)
  - v_setup tokens now visible via HUD overlay during playback

- [x] **P7-2: BONE data overlay** ✅
  - Camera HUD overlay: color-coded v_setup tokens (size, angle, move, light, lens)
  - Toggle button in sidebar: "Camera HUD" Show/Hide
  - Hides default values (eye, static) to reduce clutter

---

## Phase 8 — Claude Skill Integration

- [x] **P8-1: Skill template updated for SKEL+BONE** ✅
  - `skill_template.md` fully rewritten with SKEL structure, v_setup tokens, BONE system
  - Documents `shot_refs`, `scene_id`, `bones`, `status`, `v_setup` vocabulary
  - Includes available BONEs table (flux-dev, runway-gen3, kling-v1)
  - Inheritance chain documented for Claude

- [ ] **P8-2: Claude writes BONE data natively**
  - "Write image prompts for all shots" → Claude writes `bones.flux-dev.text` (not `imagePrompt`)
  - "Write video prompts for scene 2" → Claude writes `bones.runway-gen3.text`
  - Claude reads `metadata.bones` for project defaults and doesn't repeat them per shot

---

## Priority Order

| Priority | Phase | Why |
|---|---|---|
| ✅ DONE | Phase 0 | Data layer migrated — reads any format, writes SKEL |
| ✅ DONE | Phase 1 | Shot editor speaks BONE + token dropdowns |
| 🟡 NEXT | Phase 2 | Token chips + BONE coverage done, scene defaults + aspect deferred |
| ✅ DONE | Phase 5 | Export/import .skel.json with validation |
| 🟡 NEXT | Phase 3 | Shot limit enforced, validation on save, header parsing deferred |
| ✅ DONE | Phase 6 | Validation on save with error badge |
| 🔵 LATER | Phase 4 | BONE editor — user-created .bone.json files |
| ✅ DONE | Phase 7 | Camera HUD overlay in production player |
| 🟡 NEXT | Phase 8 | Skill template done, dynamic generation deferred |
