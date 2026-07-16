# SKEL Studio Registry Specification v1.0

**`studio.json` — the story bible**

> The canonical, cross-project home of characters, environments, locations, props, voices, skins, palettes, and series. One cast, many stories.

---

## 1. Purpose

A single `.skel` document embeds *snapshots* of the assets it uses so exports stay self-contained. But identity-locked filmmaking is a cross-project guarantee: the same character must look, sound, and dress the same in episode 3 as in episode 1. The studio registry is where that identity lives.

- **The registry is canonical.** `.skel` documents reference assets by ID; embedded snapshots are copies taken at export time.
- **The registry is a workspace-level file.** It is not per-project; every project in a workspace resolves against the same registry.
- Conformance language (MUST/SHOULD/MAY) follows skel-spec.md §1.1.

## 2. File Convention

| Property | Value |
|---|---|
| File name | `studio.json` |
| Location | `{workspace_root}/studio.json` (hosts MAY also support a per-studio path; the workspace root is the discovery default) |
| Format | JSON (UTF-8). YAML (`studio.skel.yaml`) MAY be offered by hosts, but interchange form is JSON. |
| Schema | [`studio.schema.json`](./studio.schema.json) |
| Media type | `application/vnd.skel.studio+json` |

## 3. Structure

Top level: `studio_version` (semver, currently `1.0`), `studio_id`, `name` (all required), plus optional `description`, `created_at`, `modified_at`, `notes`, `extensions`, and the collections:

| Collection | Item definition | Referenced from documents by |
|---|---|---|
| `characters[]` | `skel.schema.json#/definitions/Character` | `shot.character_refs`, `dialogue.character_ref`, `props[].carried_by`, series `cast_refs` |
| `environments[]` | `skel.schema.json#/definitions/Environment` | `scene.environment_ref` |
| `locations[]` | `skel.schema.json#/definitions/Location` | `scene.location_ref`, `environment.location_ref` |
| `props[]` | `skel.schema.json#/definitions/Prop` | `shot.prop_refs`, `character.props_carried`, `environment.props_present` |
| `audio_assets[]` | `skel.schema.json#/definitions/AudioAsset` | `sound_effects[].audio_ref`, `music_cues[].audio_ref`, `environment.soundscape_refs` |
| `voices[]` | `studio.schema.json#/definitions/Voice` | `character.voice.voice_settings.voice_ref` (RECOMMENDED indirection) |
| `skins[]` | `studio.schema.json#/definitions/Skin` | `metadata.skin_key` |
| `palettes[]` | `studio.schema.json#/definitions/Palette` | `skins[].palette_ref` |
| `series[]` | `studio.schema.json#/definitions/Series` | `metadata.series.series_id` |

The asset item definitions are **`$ref`s into `skel.schema.json`** — a single source of truth, so registry records and embedded snapshots cannot drift structurally. Validators MUST load both schemas to validate a registry.

IDs MUST be unique across all collections in one registry (same rule as skel-spec §3.3).

## 4. Snapshots and Precedence

**On export** (`metadata.lifecycle: export`):
1. The host collects every asset ID referenced by the document (skel-spec §3.4 list).
2. For each, it copies the registry record into the document's embedded collection, verbatim.
3. The exported file is self-contained: it validates and renders with no registry present.

**On import** of a document with embedded snapshots:
1. Assets whose IDs are unknown to the registry MAY be promoted into it (host SHOULD ask or record provenance in the asset's `extensions`).
2. Assets whose IDs already exist in the registry are **not** silently overwritten.

**Conflict rule.** When an embedded snapshot and a registry record share an ID but differ, the one with the newer `modified_at` wins; if neither carries a usable timestamp, the **registry wins** (it is canonical) and the host SHOULD surface the difference. Hosts MUST NOT merge field-by-field automatically.

**Working documents** (draft/production lifecycles) SHOULD NOT carry embedded snapshots — they reference by ID and resolve against the registry. This keeps one `identity_lock` authoritative while ten episodes are in flight.

## 5. Series Documents

A series turns a folder of `.skel` files into a show. It lives in `series[]`:

```json
{
  "series_id": "srs_lastsignal",
  "title": "The Last Signal",
  "format": "limited",
  "seasons": [
    {
      "season": 1,
      "episodes": [
        { "episode_code": "S01E01", "story_id": "str_ep1", "project_slug": "last-signal-e01", "title": "Landfall", "status": "delivered" },
        { "episode_code": "S01E02", "story_id": "str_ep2", "project_slug": "last-signal-e02", "title": "The Pattern", "status": "boarded" }
      ]
    }
  ],
  "arcs": [
    { "id": "arc_signal_origin", "title": "Where the signal comes from", "spans": ["S01E01", "S01E03"] }
  ],
  "cast_refs": ["char_harlan", "char_eli"]
}
```

- Each episode's `.skel` points back via `metadata.series` (skel-spec §2.2.1); `episode_code` SHOULD match on both sides.
- `cast_refs` names the shared cast: the registry characters whose `identity_lock` is the cross-episode identity guarantee.
- `arcs[].spans` lists episode codes in order; episodes advance arcs via `metadata.series.arc_refs`.
- Hosts MAY store a standalone `series.json` using the same `Series` definition; the registry-embedded form is canonical for discovery.

## 6. Validator Behavior

When a validator is given a registry (CLI: `--studio studio.json`):

1. Validate the registry itself against `studio.schema.json` (+ ID uniqueness).
2. Resolve document asset references first against the document's embedded collections, then against the registry.
3. Apply the dual-severity rule of skel-spec §3.4: unresolved-anywhere references are errors when the embedded collection exists, warnings otherwise.
4. When `metadata.series` is present and the registry carries the series: warn if `episode_code` disagrees with the registry's episode entry for this `story_id` (`SERIES_EPISODE_MISMATCH` — reserved code, additive).

## 7. Security

The registry is data, never code. Path-valued fields (`reference_sheet`, `reference_images`, `thumbnail`, `reference_image`) resolve inside the workspace root under the path-safety rules of skel-spec §10.3.

---

## License

This specification is released under the [MIT License](https://opensource.org/licenses/MIT).
