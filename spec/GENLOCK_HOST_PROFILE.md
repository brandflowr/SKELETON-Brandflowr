# Genlock Studio Host Profile

> How Genlock Studio, the primary SKEL host, maps the vendor-neutral spec onto its own storage. This document is **informative** for third parties (it shows what a complete host profile looks like) and **normative for Genlock**. The core SKEL/BONE/MUSCLE specs never require anything Genlock-specific.

---

## 1. Identity

| Property | Value |
|---|---|
| Host | Genlock Studio (desktop app) |
| Extension namespace | `x-genlock` (legacy alias read-accepted: `x-spore`, sunset SKEL 3.0 — see MIGRATIONS.md) |
| Supplementary schema | [`x-genlock.schema.json`](./x-genlock.schema.json) |
| Native story file | `story.skel` (YAML) per project; `story.json` is legacy/migration input only |
| Workspace config | `.genlock/` |

**Terminology:** SKEL "acts" surface as **Chapters** in the Genlock UI. Same entity, different label.

## 2. BONE Output Target Mapping

The neutral write-back slots (BONE Spec §2.6) map to Genlock storage as:

| Neutral target | Genlock storage |
|---|---|
| `still` | `shot.extensions.x-genlock.image` |
| `start_frame` | `shot.extensions.x-genlock.startFrameImage` |
| `end_frame` | `shot.extensions.x-genlock.endFrameImage` |
| `video_take` | `video-map.json` take append (`isActive` promotion rules per `video-map.schema.json`) |
| `audio_track` | `audio-map.json` track assignment (`dialogue`/`sfx`/`music` per the BONE's target category) |

Genlock reads the deprecated alias targets (`image`, `startFrameImage`, `endFrameImage`, `videoTake`) from older BONE definitions and treats them as the corresponding neutral slots.

## 3. Production Status

Genlock updates the **core** `shot.status.image` / `shot.status.video` (canonical since SKEL 2.9). For projects that may be opened by pre-2.9 builds, Genlock MAY mirror writes into `extensions.x-genlock.production_status`; on read, the core field wins on conflict.

## 4. Sidecars

Stored alongside `story.skel` in each project folder:

| File | Schema | Purpose |
|---|---|---|
| `video-map.json` | [`video-map.schema.json`](./video-map.schema.json) | Shot → numbered video takes with one active take; take-level `provenance`. |
| `audio-map.json` | [`audio-map.schema.json`](./audio-map.schema.json) | Shot → dialogue/sfx/music track assignments; per-track `provenance`. |
| `canvas/layout.json` | [`canvas-layout.schema.json`](./canvas-layout.schema.json) | Presentational canvas node positions + viewport. Never story data. |

## 5. Render Output Protocol

Deterministic paths, relative to the workspace root (also in ARCHITECTURE.md):

```
projects/{slug}/renders/images/{shot_id}.{bone_id}.{format}
projects/{slug}/renders/video/{shot_id}.v{n}.{format}
projects/{slug}/renders/audio/{shot_id}.{bone_id}.{format}
projects/{slug}/renders/failures/{shot_id}.{bone_id}.log
```

`assets/` folders hold user-imported media; `renders/` holds AI output. Both may appear in `video-map.json` — the path prefix distinguishes origin. Genlock's Refresh Outputs action re-attaches renders whose filenames match shot IDs.

## 6. Proposals

Genlock stores reviewable AI/user suggestions under `extensions.x-genlock.proposals` (skel-spec §6.3, schema in `x-genlock.schema.json`). Proposal history survives accept/reject; agents never apply a proposal by editing the proposal object alone.

## 7. Provenance

Image-render provenance lives at `extensions.x-genlock.provenance.{start_frame|end_frame|still}` (see `x-genlock.schema.json`); video/audio provenance lives on the sidecar entries. Legacy prompt-capture fields (`startFramePrompt`, `endFramePrompt`, `VideoTake.prompt`/`promptJson`) remain read-valid.

## 8. Studio Registry

Genlock resolves asset references against `{workspace_root}/studio.json` per `studio-spec.md`, embeds snapshots on export, and treats the registry as canonical for cross-project identity (`identity_lock`, `style_lock`, series cast).

---

*Writing your own host?* Copy this document's structure: declare your namespace, your target mapping, your sidecars (if any), and your registry location. Everything else is the core specs.
