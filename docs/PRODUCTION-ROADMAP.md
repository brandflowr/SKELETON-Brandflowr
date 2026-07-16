# SKEL Production-Grade Roadmap

> **✅ IMPLEMENTED — 2026-07-16, released as SKEL 2.9.0.** Every item below (all of P0–P3) landed in this repo; see `spec/CHANGELOG.md` [2.9.0] for the item-by-item record, ADR-017/018/019 for the decisions, and `npm run check` for the proof (artifact validation, 33-fixture conformance corpus, MUSCLE host demo, continuity-guard, byte-identical Fountain round-trip, link check — all green). One release step remains for the repo owner: create and push the `v2.9.0` git tag on the release commit so the tagged schema `$id` URLs go live (GOVERNANCE.md).

> Full-repo review for launch readiness. Every file in this repo was read; all shipped JSON artifacts were machine-validated against the shipped schemas; the MUSCLE reference host demo was executed (green). Findings below are grouped by priority, with file references.
>
> **P0** — contradictions and bugs to fix before launch.
> **P1** — data-model completeness: characters, series, studio registry, and the production-detail layer.
> **P2** — standards-grade hardening (what makes it a *spec*, not a schema).
> **P3** — ecosystem, tooling, and launch assets.

---

## Executive Summary

The core is genuinely strong and launch-worthy in shape: flat relational model (ADR-001), lifecycle-scoped validation (ADR-011), a clean data/behavior plugin split (BONE/MUSCLE, ADR-014/015), patch-based mutation with capability enforcement that actually works (verified by running `reference/muscle-host/demo`), round-trip provenance rules (ADR-016), and disciplined ADR/changelog history.

What separates it from production grade today:

1. **The asset layer is a stub.** `Character`, `Environment`, and `AudioAsset` are `{id, name, anything-goes}` while the schema and docs lean on a `studio.json` that is referenced in three places but specified nowhere. For a format whose flagship use case is *character-locked AI filmmaking*, the character model is the weakest object in the schema.
2. **No series/episode model.** Nothing represents "this story is episode 3 of season 1 and shares its cast with the other nine files."
3. **A handful of internal contradictions** — custom tokens that can't validate, two competing homes for production status, schema-vs-prose drift — that third-party implementers will hit in their first week.
4. **No conformance machinery** — no test corpus, no CI, no versioned schema URLs — which matters doubly because TRADEMARKS.md conditions use of the marks on *conformance* that currently can't be objectively tested.
5. **Missing delivery facts** (frame rate, resolution, color) that OTIO/NLE export and timecode math require.

---

## P0 — Correctness: Fix Before Launch

Each item below was verified against the shipped files.

### P0-1. `TOKEN_REFERENCE.md` ships an example that fails the schema
The "Fully Specified Shot" ([TOKEN_REFERENCE.md:169](../spec/TOKEN_REFERENCE.md)) includes a `prompt` field. `Shot` is `additionalProperties: false` and has no `prompt` — validation fails (confirmed with AJV-equivalent Draft-7 validation). The constraints table also still lists "Max `prompt` length 300 chars." Prompts moved to BONE `text` fields; the doc predates that. Fix the example and the constraints row.

### P0-2. Custom tokens are specified but impossible
`skel-spec.md` §4.3 says vendors MAY register `x-` custom tokens, and the key file has a `custom` array — but `v_setup.size/angle/lens/move/light/dof` are **closed enums** in [skel.schema.json:537-542](../spec/skel.schema.json). Any custom token fails validation, and a `custom` key-file entry has no way to declare *which category* it belongs to. Fix both halves:
- Schema: each token field becomes `anyOf: [ enum, { pattern: "^x-" } ]`.
- Key file: custom entries gain a required `category` field (`{ "category": "light", "token": "x-genlock-dreamy", ... }`).

### P0-3. Two competing homes for production status
Core `shot.status.image/video` ([skel.schema.json:548](../spec/skel.schema.json)) vs `extensions.x-genlock.production_status.image/video` ([x-genlock.schema.json:17](../spec/x-genlock.schema.json)). BONE §2.6 write-back and LLM_INTEGRATION both instruct pipelines to update the **x-genlock** one; the core spec defines `status`. A third-party tool reading core `status` never sees what the Genlock pipeline wrote. Decide: core `status` is canonical, write-back protocol targets it, and `x-genlock.production_status` is deprecated (or documented as a mirror with a sync rule).

### P0-4. `skel_version` pattern contradicts the versioning policy
§8 says versions are `MAJOR.MINOR.PATCH` and documents "MAY omit the patch component" — but the schema pattern `^\d+\.\d+$` ([skel.schema.json:117](../spec/skel.schema.json)) **rejects** `"2.0.1"`. Same tension in `bone_version`. Make the pattern `^\d+\.\d+(\.\d+)?$`.

### P0-5. `loc.tod` enum will break real screenplay imports
Closed enum `DAY|NIGHT|DAWN|DUSK|CONT` ([skel.schema.json:456](../spec/skel.schema.json)). Fountain/FDX files routinely carry `MORNING`, `AFTERNOON`, `EVENING`, `LATER`, `MOMENTS LATER`, `SAME`, `CONTINUOUS`. An importer either fails validation or destroys data — violating ADR-016's preservation mandate. Either extend the enum (recommend adding `MORNING`, `AFTERNOON`, `EVENING`, `LATER`, `SAME`), allow `x-` customs, and/or define a normative importer mapping table. Also: define `CONT` semantics ("previous scene" = previous by act order + `scene_refs` order) and the validator warning for `CONT` on the first scene.

### P0-6. `status` enums are asymmetric and can't represent failure
`status.image` lacks `not_started` (video has it), and neither has `failed` — yet the spec defines a whole failure-log path (`renders/failures/`). A failed render currently has no representable state. Add `not_started` and `failed` to both.

### P0-7. Act-level BONE data exists but has no place in the inheritance chain
`Act` carries `bones` and `attaches_to` includes `"act"`, but BONE §5 resolution order is `defaults → metadata → scene → shot`. Act-level data silently never resolves. Either insert act (`defaults → metadata → act → scene → shot`) or remove `act` from the model.

### P0-8. Spec prose is behind the schema on `metadata.source` and `metadata.plugins`
Both are in the schema (v2.7.0, ADR-016/014) but missing from the §2.2 metadata field table in `skel-spec.md`. Third parties reading only the spec will reject documents the schema accepts.

### P0-9. Two path syntaxes for the same `SKELError.path`
[LLM_INTEGRATION.md](../spec/LLM_INTEGRATION.md) example: `"path": "shots[3].bones.flux-dev"`. MUSCLE/hook-payload: RFC 6901 (`/shots/0/bones/flux-dev/text`). Standardize on RFC 6901 everywhere — MUSCLEs already require it for patches.

### P0-10. `video-map.schema.json` rejects data the app writes
CHANGELOG 2.6.0 says every generated take keeps `prompt`/`promptJson` **on the VideoTake** — but `VideoTake` is `additionalProperties: false` with no such fields ([video-map.schema.json:29](../spec/video-map.schema.json)). Genlock's own sidecars fail the published schema. Add provenance fields (see P2-7 — this is the right place for `model`, `seed`, `prompt`, `params`) or an `extensions` escape hatch.

### P0-11. ADR-014 still lists the removed `token.resolve` hook
The hook was removed (Unreleased changelog) but ADR-014's hook list still names it. ADRs are history, but this one is the *current* decision record for MUSCLE — append an amendment note.

### P0-12. Input-format tag attribute names don't match `v_setup`
§5.1 uses `<shot cam="cu">`; the field is `size`. Define the canonical attribute vocabulary (recommend: attributes = `v_setup` field names exactly).

### P0-13. Small doc drift, quick sweep
- [README.md:8](../README.md) stray `3.` artifact line.
- OVERVIEW.md says "7 categories, 47 tokens"; README says "9 categories, 48 tokens" (actual: 9 categories, 48 tokens + empty `custom`).
- `KeyFile` schema defines an `aspect` token array; the shipped key file has none and TOKEN_REFERENCE doesn't document the category — reconcile (recommend: ship aspect tokens, see P2-5).
- `metadata.target_duration_seconds` **and** `_minutes` — two sources of truth; define precedence or drop one.
- Scene `header` duplicates `loc` — declare one canonical (recommend: `loc` canonical, `header` derived) and add a validator consistency warning.
- `Extensions` is described as "keys must start with x-" but the schema doesn't enforce it — add `"propertyNames": {"pattern": "^x-"}` (Draft-7 supports this).
- CHANGELOG "Public release preparation" names the repo `brandflowr/SKELETON-Spec`; the actual remote and every `$id` is `brandflowr/SKELETON-Brandflowr`. Pick the final public repo name now — it's baked into every schema URI.

### P0-14. Referential integrity stops at act/scene/shot
No rules or error codes for `character_refs`, `environment_ref`, `location_ref`, `dialogue.character_ref`, `sound_effects[].audio_ref`. Add to §3.4 + the validator contract: refs MUST resolve to the embedded collection when present, SHOULD warn when only resolvable against an external studio registry. New codes: `CHARACTER_REF_MISSING`, `ENVIRONMENT_REF_MISSING`, `AUDIO_REF_MISSING`.

### P0-15. Import truncation policy for `action`
`action` max 200 chars (§3.5) + front-loading (§3.2) vs ADR-016 "never drop data." Define where the untruncated source paragraph goes on import (recommend: `x-<format>` extension namespace per ADR-016, e.g. `x-fountain.full_action`).

---

## P1 — The Asset & Series Layer ("characters, series, everything")

This is the flagship gap. The pitch of the whole system — *character-locked, storyboard-driven AI filmmaking* — needs the character to be the richest object in the format, not the thinnest.

### P1-1. A real `Character` definition

Replace the `{id, name}` stub with a full definition (all fields optional except `id`, `name` — keeps existing docs valid):

| Group | Fields |
|---|---|
| Identity | `id`, `name`, `aliases[]`, `pronouns`, `age` / `age_range`, `species`, `role` (`protagonist`, `antagonist`, `deuteragonist`, `supporting`, `minor`, `background`, `narrator`), `archetype` |
| Appearance | `identity_lock` (**the 30–60-word canonical description** — the exact text the `character-reference-sheet` BONE consumes and every downstream prompt reuses verbatim), `height`, `build`, `hair`, `eyes`, `skin`, `distinguishing_marks[]` |
| Wardrobe | `default_wardrobe`, `wardrobe_variants[]` (`{id, label, description, scene_refs[]}`) — costume continuity per scene |
| Voice | `voice` (`{description, accent, casting, voice_settings}`) — `voice_settings` feeds TTS BONEs; today it only exists ad hoc on `Dialogue` |
| Assets | `reference_sheet` (path), `reference_images[]`, `identity_refs` (`{lora, embedding, soul_id, face_ref}`), `thumbnail` |
| Narrative | `bio`, `want`, `need`, `flaw`, `arc`, `secrets[]`, `relationships[]` (`{character_ref, type, description}`) |
| Continuity | `first_appearance` (shot ref), `props_carried[]` (prop refs), per-scene `state_overrides[]` (`{scene_ref, wardrobe_ref, injuries, notes}`) |
| Workflow | `creative_status`, `notes`, `tags[]`, `bones`, `extensions` |

```yaml
characters:
  - id: char_harlan
    name: Harlan Morse
    role: protagonist
    pronouns: he/him
    age_range: "55-65"
    identity_lock: >
      Weathered white man in his early sixties, heavy build, salt-and-pepper
      beard, deep-set gray eyes, wind-burned skin, navy wool keeper's coat
      over a cable-knit sweater, brass pocket watch on a chain.
    distinguishing_marks: ["scar through left eyebrow", "missing tip of right ring finger"]
    wardrobe_variants:
      - id: ward_storm
        label: Storm gear
        description: Yellow oilskin over the keeper's coat, sou'wester hat
        scene_refs: [sc_2]
    voice:
      description: Low, gravelled, deliberate; long pauses
      accent: Maine coastal
      voice_settings: { provider: elevenlabs, voice_id: "..." , stability: 0.7 }
    identity_refs: { lora: "loras/harlan_v3.safetensors", soul_id: "hf_abc123" }
    want: To keep the light running and be left alone.
    need: To admit the signal is his own guilt, encoded.
    relationships:
      - { character_ref: char_eli, type: estranged_son, description: "Blames Harlan for the wreck." }
    first_appearance: sh_1
    creative_status: approved
```

Key design points:
- **`identity_lock` is the contract**, not decoration. The `character-reference-sheet` BONE's `llm_instructions` already say "reuse the same character description verbatim downstream" — give that description a canonical home in the data model instead of a per-shot BONE field.
- **`bones` on characters** — see P1-8: the reference-sheet BONE is conceptually per-character, but `attaches_to` today can't express that.
- Ship a matching `CharacterInjection.format: consistency_modifier` definition: it should be specified to emit `identity_lock`.

### P1-2. A real `Environment` / location definition

Same treatment: `id`, `name`, `loc_type` (INT/EXT), `description`, **`style_lock`** (canonical prompt text, mirroring `identity_lock`), `era_period`, `geography` (spatial layout notes — what's left of the door, where the window faces; the thing AI shot continuity always breaks), `tod_variants[]` (`{tod, lighting, description}` — the lighthouse at NIGHT is a different prompt than at DAWN), `weather_default`, `soundscape_refs[]`, `reference_images[]`, `props_present[]`, `bones`, `extensions`.

Also: **define the difference between `location_ref` and `environment_ref`** on scenes (both exist, neither is defined). Recommendation: a *location* is the physical place (one lighthouse), an *environment* is a dressed/lit variant of it (lighthouse-interior-storm-night); scenes point at environments, environments point at their parent location.

### P1-3. Props — first-class continuity objects

Nothing in the format can say "the brass pocket watch from sh_1 must be on the desk in sh_7." Add top-level `props[]`:

```yaml
props:
  - id: prop_watch
    name: Brass pocket watch
    description: Tarnished brass pocket watch, cracked crystal, engraved "E.M."
    significance: plot_critical   # set_dressing | recurring | plot_critical
    first_appearance: sh_1
    carried_by: char_harlan
    reference_image: assets/props/watch.png
```

…and optional `prop_refs[]` on shots. `significance: plot_critical` gives LLM continuity passes (and the existing `continuity_fix` proposal type!) something machine-checkable: a validator warning when a plot-critical prop appears once and never again is a *storytelling lint* no other format has.

### P1-4. Specify the Studio Registry (`studio.json`) — the story bible

The schema says three times "primary reference is by id (studio.json)" — and no such spec exists anywhere in this repo. This is the most load-bearing unspecified file in the system. Write `studio-spec.md` + `studio.schema.json`:

- `studio_version`, `studio_id`, `name`
- `characters[]`, `environments[]`, `locations[]`, `props[]` — same definitions as the embedded snapshots (single `$ref` source so they can't drift)
- `voices[]` (casting/TTS registry), `skins[]` / style presets (`skin_key` on metadata currently dangles with no target), `palettes[]`
- `series[]` — see P1-5
- Precedence + snapshot rules: on export, embedded snapshots are copied from the registry; on import, embedded snapshots MAY be promoted into the registry; conflicts resolve by `modified_at`.

This is also the answer to cross-project consistency: one cast, many stories.

### P1-5. Series & episodes

Nothing today can express episodic structure. Two additions:

**a) `metadata.series` object** (in each episode's `.skel`):

```yaml
metadata:
  series:
    series_id: srs_lastsignal
    series_title: The Last Signal
    season: 1
    episode: 3
    episode_code: S01E03
    arc_refs: [arc_signal_origin]      # season-arc IDs from the series doc
    previously: [str_ep2_storyid]      # story_ids this episode assumes
```

**b) A series document** in the studio registry (or standalone `series.json`): `series_id`, `title`, `format` (`limited`, `ongoing`, `anthology`), `seasons[] → episodes[]` (`{episode_code, story_id, project_slug, title, logline, status}`), `arcs[]` (`{id, title, description, spans}`), shared `cast_refs` into the studio registry.

This turns "a folder of .skel files" into a *show*, and it's what makes cross-episode identity lock (the whole Genlock pitch) a data guarantee instead of a convention.

### P1-6. Dialogue upgrades

- **Multiple lines per shot.** `dialogue` is one string-or-object — a two-person exchange in a single shot is unrepresentable. Extend the `oneOf` with `array of Dialogue` (backward compatible).
- **`mode`** enum on `Dialogue`: `spoken | vo | os | thought | song | radio` — Fountain's `(V.O.)`/`(O.S.)` currently has nowhere to land on import (ADR-016 violation in waiting).
- **`lang`** (BCP 47) per line + `metadata.language` project default; `subtitle` optional display text. This is the i18n seed (see P2-8).
- Validator: `dialogue.character_ref` SHOULD be present when the shot has >1 `character_refs` (ambiguity warning).

### P1-7. Transitions

No cut/dissolve/fade exists. Screenplays have them, OTIO needs them, and video generators increasingly accept them. Add optional `transition_out` on shots and scenes (token category: `cut`, `dissolve`, `fade_in`, `fade_out`, `smash_cut`, `match_cut`, `wipe`, `iris`, `whip`), key-file-backed like every other token.

### P1-8. Extend the plugin surface to the new entities

- `attaches_to` gains `character` and `environment` (the `character-reference-sheet` BONE is *per character*; today it can only fake it via metadata/scene/shot).
- MUSCLE capabilities gain `patch:characters`, `patch:environments`, `patch:props` — currently the optional collections can't be touched by any plugin at all.
- New proposal types: `add_character`, `rewrite_character`, `continuity_note`.

### P1-9. Temporal model for nonlinear stories

Presentation order ≠ story chronology, and the format can't say so. Optional scene fields: `story_time` (sortable in-world position: timestamp, day number, or ordinal), `time_elapsed_since_previous` (display string), `narrative_mode` (`present | flashback | flashforward | dream | montage | imagined`). LLM continuity reasoning ("is the scar already there in this scene?") is impossible without a chronology axis. Cheap to add, enormous depth signal.

### P1-10. Music & audio that spans shots

`sound_effects` and `audio-map.json` are strictly per-shot; a score cue crossing eight shots must be duplicated eight times with no linkage. Add scene-level (or top-level) `music_cues[]`: `{id, audio_ref, in: {shot_ref, offset_seconds}, out: {shot_ref, offset_seconds}, volume, notes}`. Timeline gets real score lanes; the audio-map stays the per-shot assignment layer.

### P1-11. `metadata.delivery` — the missing production facts

No fps anywhere in the format (Genlock's timeline hardcodes 24), no resolution, no color space. OTIO export, timecode math, and NLE handoff all need them:

```yaml
metadata:
  delivery:
    frame_rate: 24            # fps; timecode base
    resolution: { width: 3840, height: 2160 }
    aspect: "2.39:1"          # project default; v_setup.aspect overrides per shot
    color_space: rec709        # rec709 | srgb | p3-d65 | rec2020 | aces-cct
    audio: { sample_rate: 48000, channels: 2, loudness_target_lufs: -14 }
```

### P1-12. Give `story_analysis` and `production` recommended shapes

Both are `additionalProperties: true` blobs. Keep them open, but publish recommended structures so tools converge: `story_analysis` (`themes[]`, `motifs[]`, `character_arcs[]` keyed by `character_ref`, `emotional_curve[]` per scene, `pacing_notes`), `production` (`schedule`, `budget` with per-BONE cost estimates, `crew[]`, `generation_stats`).

---

## P2 — Standards-Grade Hardening

### P2-1. Versioned, immutable schema URLs
Every `$id` points at `raw.githubusercontent.com/.../main/...` — a mutable branch. Validation results change under people's feet and old documents can't pin the schema they were written against. Publish per-release URLs (git tags: `.../v2.8.0/spec/skel.schema.json`, or GitHub Pages `schemas.skel.dev/2.8/`), keep `main` as "latest," and document the policy. (There are currently **zero git tags** in this repo — start tagging releases; the changelog already has the version history.)

### P2-2. Conformance classes + test corpus
TRADEMARKS.md conditions the marks on implementations that "conform to the published specification" — but there is no objective conformance test. Ship:
- **Conformance classes**: *Reader*, *Writer*, *Validator*, *Full Host* — each with a MUST checklist (§9 is the seed).
- **`tests/conformance/`**: a corpus of valid and invalid fixtures with expected error codes (`invalid/duplicate-id.skel.json` → `DUPLICATE_ID`, one per code in the LLM_INTEGRATION catalog). This is how implementers self-certify, how CI guards the spec, and how the trademark policy becomes enforceable.

### P2-3. RFC 2119 + normative/informative separation
The spec uses MUST/SHOULD/MAY — add the RFC 2119/8174 boilerplate and a terms section (parser, validator, importer, exporter, host). Then split Genlock from SKEL: `skel-spec.md` currently normatively references Genlock UI behavior, and BONE `output.target` values (`startFrameImage` → `extensions.x-genlock.…`) hard-wire a vendor extension into the vendor-neutral spec. Define neutral target names (`still`, `start_frame`, `end_frame`, `video_take`, `audio_track`) with a *host mapping* section; move Genlock specifics to a "Genlock host profile" doc. An open format whose core write-back protocol lands in `x-genlock` will read as a single-vendor format to every evaluator.

### P2-4. Security Considerations section (spec-level)
Every serious format+plugin spec has one; SKEL runs *external executables from manifests*, so it needs one badly:
- **YAML loading**: require safe-load (no arbitrary tag construction), cap alias expansion (billion-laughs), cap document size.
- **MUSCLE trust model**: manifests are untrusted input; enabling = consent screen showing capabilities + routes (spec'd) — add: hosts MUST NOT auto-enable discovered manifests, SHOULD warn on `capabilities` growth across version updates, command routes MUST be invoked argv-style (no shell interpolation of payload data).
- **Path safety**: `path_template` and `{slug}`/`{shot_id}` substitutions MUST resolve inside the workspace root; reject `..`, absolute paths, and symlink escapes. Same for render write-back and `write:renders`.
- **External `key_file` URIs**: fetch-once + cache, optional integrity hash (`key_file: {uri, sha256}`).
- **Resource limits**: max patch-set size, max hook payload size, default timeouts (already present) — state them as host obligations.
- **Privacy**: hook envelopes ship the full document + absolute `workspace_root` to third-party tools; note it, and note `read:document` is the gate.

### P2-5. Token vocabulary expansion (the cinematography depth pass)
The current vocabulary covers the basics; these are the gaps a working director/board artist hits in week one. All additive MINOR changes:

| Category | Add | Why |
|---|---|---|
| `size` | `est` (establishing), `fs` (full shot), `cowboy`, `ins` (insert), `3s`, `group` | insert shots and establishing shots are storyboard bread-and-butter |
| `angle` | `over_head` vs existing `bird` is fine — add `profile`, `three_quarter` | reference-sheet and continuity language already uses them |
| `move` | `zoom_in`, `zoom_out`, `dolly_zoom` (vertigo), `arc` (orbit), `truck`, `pedestal`, `whip_pan`, `roll`, `push_in`, `pull_out` | `dolly_zoom` and `orbit` are first-class controls in Kling/Runway/Seedance camera APIs — the format should speak their language |
| `light` | `silhouette`, `backlit`, `rembrandt`, `moonlight`, `firelight`, `overcast`, `harsh_sun`, `strobe`, `volumetric` | current 8 can't express "silhouette against the lighthouse beam" |
| `dof` | `split` (split diopter), `tilt_shift` | distinctive looks AI models handle well |
| `color` | `teal_orange`, `monochrome`, `sepia`, `desaturated`, `vibrant`, `pastel`, `bleach_bypass` | two tokens (`warm`/`cool`) is the thinnest category in the file |
| `mood` | `eerie`, `melancholic`, `hopeful`, `foreboding`, `serene`, `chaotic`, `nostalgic`, `oppressive`, `whimsical`, `triumphant` | two moods (`tense`, `romantic`) cannot board most genres |
| `aspect` | `4:5`, `1.85:1`, `3:2` | social delivery (4:5) and theatrical flat (1.85) are missing from the enum |
| **new: `weather`** | `clear`, `rain`, `heavy_rain`, `snow`, `fog`, `storm`, `wind`, `overcast`, `heat_haze` | weather is in half of all AI video prompts and has no structured home — it's currently smuggled into prose |
| **new: `texture`** (optional) | `film_35mm`, `film_16mm`, `digital_clean`, `vhs`, `grainy` | film-stock emulation is a standard AI style axis |

Also promote `color` and `mood` in `v_setup` from free `string` to the same enum-or-`x-` pattern as the other categories (today they're the only unvalidated token fields — inconsistent).

### P2-6. Normative error catalog
Promote the "recommended error codes" list to a normative artifact (`spec/errors.md` or a JSON registry): stable code, severity, RFC 6901 path convention, message guidance. MUSCLE veto codes already namespace by `muscle_id` — the same registry gives first-party codes a single home and makes CI assertions possible (see P2-2).

### P2-7. Generation provenance (the C2PA-adjacent story)
Renders currently record almost nothing about how they were made. Define a provenance block wherever a render lands (video-map takes, image extensions, audio-map entries):

```json
{ "provenance": { "bone_id": "seedance-2", "provider": "bytedance", "model": "seedance-2.0",
  "prompt": "...", "params": { "seed": 777, "duration": 15 },
  "generated_at": "2026-07-16T12:00:00Z", "job_id": "..." } }
```

Three wins: reproducibility (re-render the same take), auditability (which model made this frame — increasingly a disclosure requirement for AI content in 2026), and it fixes P0-10 properly instead of patching it.

### P2-8. Internationalization & accessibility
- `metadata.language` (BCP 47) + per-`Dialogue` `lang` (P1-6).
- Unicode guidance: UTF-8 mandated (done); add NFC normalization for IDs and name matching.
- Accessibility hooks: optional `shot.audio_description` (described-video text) and caption/subtitle export guidance. Cheap, rare in competing formats, and a genuine "over the top" detail.

### P2-9. Media type + file identity
`application/skel+yaml` / `application/bone+json` / `application/muscle+json` are unregistered. Either pursue IANA registration (RFC 9512 defines the `+yaml` suffix — SKEL is a legitimate candidate) or interim-switch to `application/vnd.skel+yaml`. Also define the **editor modeline convention** now:

```yaml
# yaml-language-server: $schema=https://…/v2.8.0/spec/skel.schema.json
skel_version: "2.0"
```

— one documented line and every VS Code user gets validation + token autocomplete for free. Highest leverage-to-effort item in this whole document.

### P2-10. YAML authoring profile (closes SKEL-S1/S2/S3)
The native format is YAML and the repo contains **zero YAML examples** — every example is `.skel.json`. Before launch:
- `spec/example.skel` (YAML twin of the JSON example, with comments showing off *why* YAML).
- A "YAML profile" section: safe subset (no custom tags; anchors/aliases discouraged or banned for interchange), block-scalar conventions for `action`/prompts, comment conventions, canonical key order for clean git diffs (a stable serialization order recommendation makes `story.skel` a well-behaved git citizen — worth a short "SKEL and version control" note).

### P2-11. Ordering precedence rule
`order` fields vs array order vs `scene_refs`/`shot_refs` order — three orderings, no declared winner. Recommend: **refs arrays are canonical**; `order` is derived display metadata; validators warn on disagreement.

---

## P3 — Ecosystem & Launch Assets

### P3-1. `skel` CLI as a launch artifact
The external validator contract is fully specified (ARCHITECTURE.md, LLM_INTEGRATION.md) but only implemented inside the app. Ship a standalone reference CLI in this repo (like `reference/muscle-host/`): `skel validate` (with `--lifecycle`, `--json`, `--with-sidecars`), `skel convert` (yaml↔json), `skel inspect`. `npx @skel/cli validate story.skel` is the single best adoption hook an open format can have.

### P3-2. CI — automate exactly what this review ran by hand
GitHub Actions (there is currently **no `.github/`**):
1. Validate every `spec/**/*.json` example against its schema (this review caught P0-1 doing exactly this).
2. Meta-validate schemas (AJV strict compile).
3. Run `reference/muscle-host/demo` and assert the sanity check.
4. Markdown link check + spell pass.
5. (After P2-2) run the conformance corpus.
6. (After P2-10) YAML-lint `.skel` examples.

### P3-3. Publish the schemas/types as a package
ADR-007 said "extract later" — launch is *later*. `@skel/spec` npm package exporting the JSON Schemas + generated TypeScript types (currently `types.ts` lives only in the app repo, so every third party will hand-roll their own drifting types).

### P3-4. OSS repo hygiene for a spec that wants adopters
`SECURITY.md` (disclosure policy — you're specifying a plugin system that executes commands), `GOVERNANCE.md` (who accepts spec changes, how tokens get added — CONTRIBUTING has the seed), issue/PR templates (spec-change template requiring schema+changelog+example updates in one PR, mirroring CONTRIBUTING rules), `CODE_OF_CONDUCT.md`, tagged releases with release notes cut from the changelog, and GitHub Pages rendering of the spec.

### P3-5. Prove ADR-016 with a working Fountain adapter
`spec/muscles/fountain-adapter.muscle.json` is a manifest with no implementation. Ship the actual adapter tool in `reference/` (import + export, preserving `x-fountain` data and stable IDs) with a round-trip test: `fountain → skel → fountain` byte-comparable. "Interchange is the first proof of the plugin system" is the spec's own claim — make it demonstrable.

### P3-6. Example depth — examples are the real docs
- `example.skel` YAML twin (P2-10).
- A **kitchen-sink example**: characters (full P1-1 shape), environments, props, structured multi-line dialogue, transitions, music cues, story_analysis, production, intent + creative_status everywhere, proposals in extensions.
- An **episodic pair**: two thin episode files + one `studio.json`/series doc showing shared cast and identity lock across episodes — the demo that sells the whole Genlock thesis.
- A worked MUSCLE beyond lint: e.g. a `continuity-guard` that cross-checks `props_carried`/`wardrobe_variants` against shots (dogfoods P1-3 and shows off `veto` mode).

### P3-7. Community registry
A `registry/` index (or `registry.json`) mapping public BONE/MUSCLE ids → repo/URL + verified-conformance flag, plus the collision policy (reverse-prefix convention is stated; give it a home). Optional now; cheap to seed with the six first-party bones.

### P3-8. Migration & alias policy
`MIGRATIONS.md`: v1→v2 structural migration (nested→flat), `x-spore`→`x-genlock` alias with a stated sunset version, legacy `story.json` ingestion rules (currently only described in app-side docs).

---

## Suggested Sequencing

| Phase | Contents | Outcome |
|---|---|---|
| **1. Pre-launch correctness** (days) | All of P0; P2-10 YAML example; P3-2 CI items 1–4 | Repo is internally consistent and self-checking; no first-week implementer landmines |
| **2. The asset layer** (1–2 weeks) | P1-1..P1-5, P1-8 (characters, environments, props, studio registry, series); P3-6 episodic example | The "characters, series, everything" release — the headline feature set |
| **3. Production depth** (1 week) | P1-6..P1-7, P1-9..P1-12 (dialogue, transitions, temporal, music, delivery); P2-5 token expansion | Board-artist- and NLE-credible; AI-pipeline vocabulary parity |
| **4. Standards & ecosystem** (ongoing) | P2-1..P2-9, P2-11; P3-1, P3-3..P3-5, P3-7, P3-8 | Conformance-testable open standard with a CLI, package, and governance |

All P1/P2 data-model changes are **additive** (optional fields, widened `oneOf`s, new token categories) → SKEL 2.x MINOR releases per the existing versioning policy. Nothing here requires a v3.

---

## Appendix — What Was Verified in This Review

- Read: every file in the repo (spec, schemas, bones, muscles, reference host, scripts, governance docs).
- Machine-validated (JSON Schema Draft-7): `example.skel.json`, `skel-keyfile.json` (vs `KeyFile` def), all 6 `spec/bones/*.bone.json` (vs `bone.schema.json`), all 5 `.muscle.json` manifests (vs `muscle.schema.json`) — **all pass**.
- Reproduced the P0-1 failure: TOKEN_REFERENCE.md's "Fully Specified Shot" fails `Shot` validation (`prompt` not allowed).
- Executed `reference/muscle-host/demo/run-demo.mjs` — green: veto warnings surface, rogue-writer's out-of-capability patch rejected, note-stamper patch applied, `metadata.plugins` recorded, sanity check PASS.
- Confirmed: no git tags, no `.github/` (no CI), remote = `brandflowr/SKELETON-Brandflowr`.
