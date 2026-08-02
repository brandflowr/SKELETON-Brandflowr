# SKEL Migrations & Alias Policy

> Every rename and structural change, with its migration path and sunset. Readers stay liberal; writers emit only current forms.

---

## 1. v1 → v2: Nested Tree → Flat Relational (2025-07)

v1 (VSON) nested Story → Acts → Scenes → Shots. v2 flattens to top-level `acts[]`, `scenes[]`, `shots[]` linked by IDs (ADR-001).

**Migration:** walk the tree depth-first; emit each level into its flat array; populate `scene_refs`/`shot_refs` from child order and `act_id`/`scene_id` from the parent; preserve original IDs where present, else mint `nanoid(12)`. v1 was never publicly implemented — this path exists for completeness only.

## 2. Legacy `story.json` Ingestion

Genlock projects created before SKEL-native storage carry `story.json` (MasterStory) or older nested-chapter files.

- Hosts read `story.json` **only when `story.skel` is absent**, auto-detect the shape (SKEL v2 / MasterStory / nested chapters), normalize, and write `story.skel` on first save.
- Legacy prompt fields migrate into BONE data: `imagePrompt` → `bones.flux-dev.text`, `videoPrompt` → `bones.runway-gen3.text`.
- `story.json` is never written again after migration; keep it or delete it, it is inert.

## 3. `x-spore` → `x-genlock` (2.8.0, 2026-07-10)

The vendor namespace renamed with the SPORE → Genlock rebrand.

- **Readers** MUST accept `x-spore` as an alias of `x-genlock` (same shapes; `x-spore.schema.json` was renamed to `x-genlock.schema.json` structure-unchanged).
- **Writers** MUST emit `x-genlock` only.
- On save, hosts SHOULD migrate an `x-spore` block to `x-genlock` (merge if both exist; `x-genlock` wins per key).
- **Sunset:** `x-spore` read support ends at SKEL 3.0.

## 4. Production Status: Extension Mirror → Core Field (2.9.0)

Pre-2.9 pipelines wrote `extensions.x-genlock.production_status`; the core `shot.status` existed but was not what the write-back protocol updated (PRODUCTION-ROADMAP P0-3).

- **Canonical since 2.9:** core `shot.status.image` / `shot.status.video`.
- **Readers:** when only the mirror exists, treat it as the status; when both exist and disagree, the **core field wins**.
- **Writers/pipelines:** write core `status`; MAY additionally mirror for pre-2.9 readers.
- **Migration on save:** copy mirror → core where core is absent; leave the mirror in place until…
- **Sunset:** the mirror is removed from `x-genlock.schema.json` at SKEL 3.0.

Also in 2.9: both status enums gained `not_started` and `failed`. Pre-2.9 validators reject those values; upgrade the schema before writing them (sync order matters for embedded hosts).

## 5. BONE Output Targets: Vendor Fields → Neutral Slots (BONE 1.1, 2026-07-16)

`output.target` values were Genlock storage field names. BONE 1.1 defines neutral slots with a host mapping (BONE Spec §2.6, GENLOCK_HOST_PROFILE.md §2).

| Deprecated (read-accepted) | Current (writers emit) |
|---|---|
| `image` | `still` |
| `startFrameImage` | `start_frame` |
| `endFrameImage` | `end_frame` |
| `videoTake` | `video_take` |

**Sunset:** alias reading ends at BONE 2.0.

## 6. `skel_version` / `bone_version` Patterns (2.9.0)

Patterns widened from `^\d+\.\d+$` to `^\d+\.\d+(\.\d+)?$` so documents may pin a patch release (`"2.0.1"`), matching §8's long-documented policy. No migration needed; all existing values remain valid.

## 7. Schema `$id` URLs: `main` → Tagged Releases (2.9.0)

Pre-2.9 `$id`s pointed at the mutable `main` branch. From 2.9.0, `$id`s point at the tagged release URL (`.../v2.9.0/spec/...`); `main` continues to serve the latest schema for humans.

- Documents pinning a `main` URL keep validating; they simply track latest.
- New documents SHOULD pin the tagged URL of the release they target (skel-spec §8.1).

## 8. Media Types (2.9.0)

`application/skel+yaml`, `application/bone+json`, and `application/muscle+json` were never registered. Until IANA registration lands, the interim types are the vendor-tree forms:

| Old (unregistered) | Interim (current) |
|---|---|
| `application/skel+yaml` | `application/vnd.skel+yaml` |
| `application/bone+json` | `application/vnd.skel.bone+json` |
| `application/muscle+json` | `application/vnd.skel.muscle+json` |
| — | `application/vnd.skel.studio+json` |

Tools matching on media types SHOULD accept both spellings until registration resolves the final names.

## 9. Genlock Media Sidecars: Direct Maps → Versioned Envelopes (2.10.0)

SKEL 2.9 published a direct-map sidecar design that the Genlock desktop runtime never wrote. SKEL 2.10 standardizes the bytes used by Genlock 1.0:

- video: `{ "version": "1.0", "takes": { "<shot-id>": VideoTake[] } }`
- audio: `{ "version": "1.0", "tracks": { "<shot-id>": AudioTrack[] } }`

The 2.9 tagged schemas remain immutable. A 2.10 migration wraps video entries under `takes`, moves each prior `ShotVideoEntry.takes` array directly under its shot key, and renames `file` → `path`, `duration` → `durationSeconds`, `created_at` → `createdAt`, and `bone_id` → `boneId`.

For audio, each non-null `dialogue`, `sfx`, or `music` assignment becomes one typed track with a stable generated `id`, `path` equal to the old string, a human-readable `label`, and `volume: 1`. Per-type provenance moves onto that track. Hosts MUST preview and explicitly commit this migration; they MUST NOT rewrite sidecars merely because a project was opened.

## 10. Portable Studio Registry vs Genlock Runtime Registry (2.10.0)

`studio.schema.json` remains the portable, snake_case, cross-host story-bible format. Genlock 1.0's live `.genlock/studio.json` uses a smaller camelCase runtime model defined by `genlock-studio.schema.json`. They are distinct contracts.

Adapters map stable IDs and known fields explicitly (`referenceImages` ↔ `reference_images`, `createdAt` ↔ `created_at`, `updatedAt` ↔ `modified_at`, and `aiConsistencyModifier` ↔ an appropriate portable identity/style-lock field). Unmapped fields MUST be reported or preserved in an `x-genlock` extension; silent loss is non-conformant. Export embeds portable snapshots, not raw runtime records.

## 11. Structured Genlock Prompt and Writing Snapshots (2.10.0)

`startFramePrompt` and `endFramePrompt` now accept either a legacy string or a structured `AssetPrompt` object. Readers continue accepting strings. Current Genlock writers may emit `{text, json, promptTemplate, boneId, model, createdAt}`; at least `text` or `json` is required.

The optional `extensions.x-genlock.writing` block records the resolved Writer Profile, Voice, Craft Skills, resolution timestamp, and source hash. It is a pinned reproducibility snapshot, not a pointer to mutable host configuration.

## 12. BONE Prompt-Skill Binding (2.10.0)

`prompt_skill` is an optional declarative skill-package identifier on a BONE. It tells a host or agent where provider-specific prompt guidance lives. It grants no capability, triggers no execution, and does not replace MUSCLE consent or execution rules.
