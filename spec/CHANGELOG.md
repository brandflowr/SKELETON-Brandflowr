# SKEL Changelog

All notable changes to the SKEL specification and implementation.

---

## [Unreleased]

---

## [2.9.0] — 2026-07-16

The launch-readiness release: every P0–P3 item from `docs/PRODUCTION-ROADMAP.md`. All data-model changes are additive (optional fields, widened `oneOf`s, new token categories) — existing 2.x documents remain valid.

### P0 — correctness fixes
- **Canonical production status** (ADR-018): core `shot.status` is the single home; the write-back protocol (BONE §2.6, LLM_INTEGRATION, ARCHITECTURE) now updates it. `extensions.x-genlock.production_status` is a deprecated mirror (sunset SKEL 3.0, MIGRATIONS.md §4). Both `status.image` and `status.video` gain `not_started` and `failed` — failed renders finally have a representable state, paired with the `renders/failures/` log path.
- **Custom tokens actually work**: every `v_setup` token field, `loc.tod`, and `transition_out` accepts `enum-or-^x-`; key-file `custom` entries now require a `category` (`CustomKeyFileToken`); validator rules `CUSTOM_TOKEN_UNDECLARED` / `CUSTOM_TOKEN_CATEGORY_MISMATCH` (skel-spec §4.3).
- `skel_version` / `bone_version` patterns widened to `^\d+\.\d+(\.\d+)?$` — `"2.0.1"` validates, matching §8's documented policy.
- **`loc.tod` enum extended** with `MORNING`, `AFTERNOON`, `EVENING`, `LATER`, `SAME` (+ `x-` customs); `CONT` semantics defined (previous scene by act order, then `scene_refs` order; `TOD_CONT_FIRST_SCENE` warning); normative screenplay import mapping table (§7.1.1) so Fountain/FDX time-of-day variants never destroy data.
- **Act-level BONE data resolves**: inheritance chain is now `defaults → metadata → act → scene → shot` (BONE §5, §4.4).
- `skel-spec.md` §2.2 metadata table caught up with the schema (`source`, `plugins` documented).
- **One path syntax**: RFC 6901 JSON Pointers everywhere (validator results, MUSCLE hook results, LLM examples); dot/bracket paths are non-conformant.
- `video-map.schema.json` accepts what hosts write: `VideoTake` gains legacy `prompt`/`promptJson`, the new `provenance` block, and an `extensions` escape hatch.
- ADR-014 amended (the removed `token.resolve` hook is noted as history).
- Input-format tag attributes are the `v_setup` field names verbatim (`<shot size="cu">`); `cam` is a deprecated read-only alias.
- Doc-drift sweep: README stray artifact removed; token counts unified; `target_duration_seconds` canonical over `_minutes` (`DURATION_CONFLICT`); `loc` canonical over `header` (`HEADER_LOC_MISMATCH`); `Extensions` keys schema-enforced to `^x-` via `propertyNames`; changelog repo name aligned to the actual remote (`brandflowr/SKELETON-Brandflowr`).
- **Referential integrity beyond structure** (§3.4): `character_refs`, `dialogue.character_ref`, `environment_ref`, `location_ref`, `prop_refs`, `carried_by`, audio refs — errors against embedded collections, warnings when only a studio registry could resolve them. New codes: `CHARACTER_REF_MISSING`, `ENVIRONMENT_REF_MISSING`, `LOCATION_REF_MISSING`, `PROP_REF_MISSING`, `AUDIO_REF_MISSING`, `MUSIC_CUE_SHOT_MISSING`.
- **Import truncation never destroys data** (§3.5): overlong source paragraphs park under `x-<format>` (e.g. `x-fountain.full_action`) per ADR-016.

### P1 — the asset & series layer (ADR-017)
- **Rich `Character`**: identity (`role`, `pronouns`, `age_range`, `aliases`), appearance with **`identity_lock`** (the canonical 30–60-word contract that `CharacterInjection: consistency_modifier` emits verbatim), `wardrobe_variants[]` with scene refs, `voice` profile feeding TTS BONEs, `identity_refs` (`lora`/`embedding`/`soul_id`/`face_ref`), narrative fields (`want`/`need`/`flaw`/`arc`/`relationships`), continuity state (`first_appearance`, `props_carried`, `state_overrides[]`), workflow fields.
- **`Environment` vs `Location` defined**: location = physical place; environment = dressed/lit variant with `style_lock`, `geography`, `tod_variants[]`, `weather_default`, `soundscape_refs`, `props_present`. New top-level `locations[]`.
- **`Prop`** continuity objects (new top-level `props[]` + `shot.prop_refs`): `significance` enum with the `PROP_CONTINUITY` storytelling lint for plot-critical props.
- **Studio registry specified**: `studio-spec.md` + `studio.schema.json` — `studio.json` is the story bible (characters/environments/locations/props/audio/voices/skins/palettes/series), with asset definitions `$ref`'d from `skel.schema.json` and snapshot/precedence rules. `metadata.skin_key` finally has a target.
- **Series & episodes**: `metadata.series` (`series_id`, `season`/`episode`/`episode_code`, `arc_refs`, `previously`) + registry `Series` documents (seasons → episodes, arcs, shared `cast_refs`).
- **Dialogue upgrades**: array form for multi-line exchanges in one shot; `mode` (`spoken|vo|os|thought|song|radio`) so Fountain `(V.O.)`/`(O.S.)` lands losslessly; `lang` (BCP 47) + `subtitle` + `metadata.language`; `DIALOGUE_AMBIGUOUS_SPEAKER` warning.
- **Transitions**: `transition_out` on shots and scenes, key-file-backed `transition` category (`cut`, `dissolve`, `fade_in`, `fade_out`, `smash_cut`, `match_cut`, `wipe`, `iris`, `whip`).
- **Plugin surface extended** (payload 1.1): `attaches_to` gains `character`/`environment`; MUSCLE capabilities gain `patch:characters`/`patch:environments`/`patch:props`; proposal types gain `add_character`/`rewrite_character`/`continuity_note`; `entity.changed` subjects/filters may name the new entities.
- **Temporal model**: `scene.story_time`, `time_elapsed_since_previous`, `narrative_mode` (`present|flashback|flashforward|dream|montage|imagined`) — a chronology axis for nonlinear stories.
- **Music cues**: document-level `music_cues[]` with shot-anchored in/out points — the score lane; the audio-map stays per-shot.
- **`metadata.delivery`**: `frame_rate`, `resolution`, `aspect`, `color_space`, `audio` targets — the facts OTIO export and timecode math need.
- **Recommended shapes** for `story_analysis` and `production` (still open objects).

### P2 — standards-grade hardening (ADR-019)
- **Versioned, immutable schema URLs**: every `$id` and doc Schema-URI points at the `v2.9.0` tag; `main` stays as latest; release process in GOVERNANCE.md.
- **Conformance classes** (Reader / Writer / Validator / Full Host, skel-spec §9) + **conformance corpus** (`tests/conformance/`, 33 fixtures with a machine-readable manifest) — the trademark policy's conformance condition is now objectively testable.
- **RFC 2119/8174 boilerplate** + terminology section; **vendor-neutral core**: neutral BONE output targets (`still`/`start_frame`/`end_frame`/`video_take`/`audio_track`) with read-accepted legacy aliases, host mapping moved to the new `GENLOCK_HOST_PROFILE.md` (ADR-018). First-party bones bumped to 1.1 on the neutral names.
- **Security Considerations**: skel-spec §10 (YAML safe-load, alias/size caps, key-file integrity hashes, path safety, NFC) and muscle-spec §10 (consent-based enablement, argv-style invocation, payload/patch caps, filesystem boundaries, envelope privacy).
- **Token vocabulary expansion**: 13 categories, 131 tokens (+ per-category additions: `est`/`fs`/`cowboy`/`ins`/`3s`/`group`, `profile`/`three_quarter`, 10 new moves incl. `dolly_zoom`/`arc`, 9 new lights incl. `silhouette`/`volumetric`, `split`/`tilt_shift`, 7 new colors, 10 new moods, new **`weather`** and **`texture`** categories, aspect additions `4:5`/`1.85:1`/`3:2`); `color`/`mood` promoted from free strings to validated enums-or-`x-`.
- **Normative error catalog** (`spec/errors.md`): stable codes, severities, dual-severity asset-ref rule, MUSCLE namespacing, registry policy.
- **Generation provenance** (BONE §2.8): `{bone_id, provider, model, prompt, params, generated_at, job_id}` blocks in `video-map` takes, `audio-map` tracks, and `x-genlock` image slots — reproducibility + AI-content disclosure.
- **i18n & accessibility**: `metadata.language` + `Dialogue.lang`/`subtitle`, NFC normalization guidance, `shot.audio_description` for described video.
- **Media types** interim-switched to the vendor tree (`application/vnd.skel+yaml`, `vnd.skel.bone+json`, `vnd.skel.muscle+json`, `vnd.skel.studio+json`) pending IANA registration; **editor modeline convention** documented (yaml-language-server `$schema` line).
- **YAML authoring profile** (skel-spec §11) + `spec/example.skel` — the annotated native-YAML twin of the JSON example (closes SKEL-S1/S2).
- **Ordering precedence** (§3.6): refs arrays canonical, `order` derived, `ORDER_MISMATCH` warning.

### P3 — ecosystem & launch assets
- **Reference `skel` CLI** (`reference/cli/`, `@skel/cli`): `validate` (full contract: lifecycle, RFC 6901 paths, `--json`, `--with-sidecars`, `--studio`), `convert` (YAML⇄JSON), `inspect`. The validator library (`lib/validate.mjs`) implements `spec/errors.md` end to end.
- **CI** (`.github/workflows/ci.yml`): validates every shipped artifact against its schema, AJV-strict meta-validation, conformance corpus, MUSCLE host demo with sanity assertion, continuity-guard test, Fountain round-trip, markdown link check. Root `package.json` (`@skel/spec`) with `npm run check` running the same suite locally.
- **`@skel/spec` package**: schemas + key file + hand-maintained TypeScript types (`types/skel.d.ts`) covering the full 2.9 model, sidecars, studio registry, and validation shapes.
- **OSS hygiene**: `SECURITY.md` (disclosure policy for a spec that executes plugins), `GOVERNANCE.md` (change + release process; tags make `$id` URLs live), `CODE_OF_CONDUCT.md`, issue templates (spec change / token proposal / bug) and a spec-change PR checklist.
- **Working Fountain adapter** (`reference/fountain-adapter/`): import + export with per-element raw parking under `x-fountain`; round-trip test proves byte-identical export, schema-valid import, stable IDs across cycles, and edit-aware re-rendering (ADR-016 made demonstrable).
- **Worked MUSCLE beyond lint**: `continuity-guard` (manifest + reference tool + test) cross-checks props/wardrobe/first-appearance against shots via the real veto-hook contract — dogfoods the P1 asset layer.
- **Examples**: `spec/examples/kitchen-sink.skel.json` (every 2.9 feature in one valid export document) and `spec/examples/episodic/` (two thin episodes + one `studio.json` sharing cast and identity lock — the cross-episode guarantee, demonstrated).
- **Community registry** (`registry/`): first-party BONE/MUSCLE index with conformance flags and the reverse-prefix collision policy.
- **`spec/MIGRATIONS.md`**: v1→v2, legacy `story.json`, `x-spore`→`x-genlock` sunset, status-mirror migration, target aliases, `$id` policy, media types.
- `sync-spec.ps1`: new spec files added to the Genlock sync list.
- **Governance fields upstreamed** from the Genlock host's diverged schema copy into the canonical `bone.schema.json` / `skel.schema.json` `BoneDefinition` (healing the fork): optional `requires[]`, `pipeline_stage`, `authoring_mode` (`templated|atelier|hybrid` or `x-`), `render_runtime` (`native|remotion|hyperframes|ffmpeg` or `x-`), `style_tokens`, `decision_log_refs[]`, `quality_gates[]` (`QualityGate` def). Documented in bone-spec §2.2.

### MUSCLE v1.0→1.1 hardening — from spec to working plugin system
- **Removed the `token.resolve` hook** from `muscle-spec.md`, `muscle.schema.json`, and `hook-payload.schema.json` (with its `TokenResolveSubject`). Its result contract was undefined; deferred to a future minor version, noted in the spec (ADR-014 amendment).
- `muscle-spec.md` §3.3: **mode enforcement is now an explicit host obligation** — results exceeding the declared `observe`/`transform`/`veto` mode are rejected as MUSCLE failures.
- `muscle-spec.md` §4.2: `subject_replacement` is explicitly restricted to **derived, non-persisted values** (it is not capability-checked because it can never reach `story.skel`); on `generate.route` it MUST be one of the candidate routes, otherwise hosts fall back to default selection.
- `muscle-spec.md` §4.3 rule 7: hosts MUST **auto-create the `extensions` container** when applying a patch under a declared `patch:extensions.x-<ns>` capability (found by running the reference host: namespace-scoped plugins were otherwise unable to write to untouched entities).
- `muscle-spec.md` §1.1: fixed per-patch/atomic wording — a patch outside capabilities rejects the entire (atomic) patch set.
- `muscle.schema.json`: allow a top-level `$schema` field in manifests.
- New `spec/MUSCLE_AUTHORING.md`: step-by-step plugin authoring guide (hook/mode selection, manifest, tool, patches, testing, shipping).
- New `spec/muscles/` example manifests: `studio-style-guard.muscle.json`, `fountain-adapter.muscle.json`, `continuity-guard.muscle.json` — all validate against `muscle.schema.json`.
- New `reference/muscle-host/`: zero-dependency Node reference host implementing discovery (§6.1), CLI-route invocation (§4), mode enforcement (§3.3), capability-scoped atomic patch application with locked-entity protection and rollback (§4.3), and `metadata.plugins` recording (§6.3). Ships a runnable demo (`demo/run-demo.mjs`) with three plugins: a veto linter, a conforming patcher, and a deliberately misbehaving plugin whose undeclared write is rejected.

### Public release preparation
- README: documented the MUSCLE spec and schemas in the spec table; replaced the external BONE repo pointer with a two-layer plugin system section (BONE = data, MUSCLE = behavior) — this repo is the single canonical home for SKEL, BONE, and MUSCLE.
- `bone-spec.md` / `bone.schema.json`: Schema URI and `$id` now point to this repo (`brandflowr/SKELETON-Brandflowr`) instead of the retired separate BONE repo.
- LICENSE copyright year updated to 2025–2026; copyright and trademark notices added to README.
- Added `TRADEMARKS.md` (SKEL™, BONE™, MUSCLE™, SPORE™ — marks of Brandflowr AI LLC; conforming-use policy).
- Moved internal session notes (`master-instructions.md`) out of the repo root into `docs/internal/`.

> **Release checklist reminder:** this release's schema `$id`s point at the `v2.9.0` tag — create and push the `v2.9.0` git tag on the release commit (GOVERNANCE.md §Release Process) so those URLs go live.

---

## [2.8.0] — 2026-07-10

### Vendor Rename: SPORE → Genlock
- The host application vendor name changed from SPORE to Genlock (Genlock Studio). SKEL, BONE, and MUSCLE keep their names.
- Extension namespace renamed: `extensions.x-spore` → `extensions.x-genlock`. Writers now emit `x-genlock`; readers continue to accept the legacy `x-spore` namespace as a pre-rename alias.
- Supplementary schema file renamed: `spec/x-spore.schema.json` → `spec/x-genlock.schema.json` (`$id`, title, and description updated; structure unchanged).
- First-party starter bones renamed: `spore-video`/`spore-image`/`spore-style` → `genlock-video`/`genlock-image`/`genlock-style`.
- Workspace config directory renamed: `.spore/` → `.genlock/`.
- Docs, schema descriptions, and the reference MUSCLE host rebranded accordingly. Historical changelog entries below retain the names in use at the time.

---

## [2.7.0] — 2026-07-07

### MUSCLE v1.0 — behavior plugin system (new spec, additive)
- New `muscle-spec.md`: MUSCLE (Modular User-Scripted Companion Logic Extension) — behavior plugins as `.muscle.json` manifests. Named lifecycle hooks (`import.*`, `document.validate`, `token.resolve`, `prompt.assemble.*`, `generate.route`, `render.complete`, `entity.changed`, `export.*`), three hook modes (`observe`/`transform`/`veto`), scoped capabilities, and `execution_routes` reusing the BONE §2.7 vocabulary. Plugins return RFC 6902 patches; hosts validate, enforce capabilities and `creative_status: locked`, and apply atomically. (ADR-014, ADR-015)
- New `muscle.schema.json` (validates manifests) and `hook-payload.schema.json` (hook envelope/result contract, per-hook subject shapes).
- `skel.schema.json`: added optional `metadata.plugins` (host-owned record of plugins whose patches were applied — reproducibility only; documents with unknown records must still load). Existing documents remain valid; documents using the new field require the updated schema in consuming apps first (sync before use).

### Round-trip interchange rules (ADR-016, additive)
- `skel.schema.json`: added optional `metadata.source` provenance (`format`, `file`, `tool`, `imported_at`).
- Interchange rules: importers MUST preserve unmappable source data under `x-<format>` extension namespaces (strengthens ADR-005 from "ignore" to "preserve"); per-entity source refs live under the same namespaces; entity IDs are stable across import/export cycles.
- Format adapters (Fountain export, FDX, OTIO, CSV) are specified as MUSCLEs on `import.*`/`export.*` hooks.
- `sync-spec.ps1`: added the three new spec files to the sync list.

### Spec editorial fixes (no data-model changes)
- Corrected the SKEL acronym expansion to "Story Keyframe Extensible Layout" in README and OVERVIEW (per ADR-010; "Visual Relational Action Data" was the retired VRAD name).
- Removed the stale 4-shot-per-scene validation rule from §5.3 (superseded by ADR-003: shot counts are unrestricted).
- §3.2 Front-Loading: replaced the reference to a nonexistent `prompts` object with BONE prompt fields (BONE Spec §2.4).
- Fixed section numbering gaps (§2.7, §3.1–3.5 now sequential; §3.3/§3.4/§3.5 again match the ARCHITECTURE.md conformance map).
- Replaced the fictional `Spore.dev` schema URI with the GitHub raw URL.
- §2 prose caught up with the 2.6.0 schema: documented the expanded `metadata` fields, scene `duration_seconds`/`mood`/`key_story_elements`/`bones`, shot `title`/`visual_focus`/`cinematography`/`sound_effects`, structured `dialogue`, and the optional top-level `characters`/`environments`/`audio_assets`/`story_analysis`/`production` collections (new §2.7).
- §4 and TOKEN_REFERENCE.md now document the `color` and `mood` token categories shipped in `skel-keyfile.json`, and note the deliberate uppercase exception for `tod` tokens.
- §8 Versioning now uses full semver (`MAJOR.MINOR.PATCH`), matching CONTRIBUTING.md.

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
