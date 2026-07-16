# skel-fountain — Reference Fountain ⇄ SKEL Adapter

The working implementation behind [`spec/muscles/fountain-adapter.muscle.json`](../../spec/muscles/fountain-adapter.muscle.json), proving ADR-016: *interchange is the first proof of the plugin system*.

```bash
node reference/fountain-adapter/skel-fountain.mjs import screenplay.fountain story.skel.json
node reference/fountain-adapter/skel-fountain.mjs export story.skel.json screenplay.fountain
node reference/fountain-adapter/test-roundtrip.mjs      # the proof
```

## What the round-trip test proves

1. **Import** parses title page, scene headings (with the §7.1.1 time-of-day mapping — `CONTINUOUS` → `CONT`, `MOMENTS LATER` → `LATER`), action blocks (front-loaded `action` ≤ 200 chars, full paragraph parked as `x-fountain.full_action` per §3.5), dialogue with `(V.O.)`/`(O.S.)` → `dialogue.mode`, character extraction into `characters[]`, transitions → `transition_out`, and parks sections/synopses/notes/boneyards verbatim.
2. **The imported document validates** against `skel.schema.json` via the reference validator.
3. **Export is byte-identical** to the source for an unmodified document (canonical Fountain spacing: one blank line between elements, single trailing newline).
4. **Second cycle is stable**: re-importing the export yields the same IDs and re-exports to the same bytes — no entity duplication (ADR-016 stable-ID rule).
5. **Edits win over parked raw**: change a shot's `action` and the exporter re-renders that element instead of emitting stale source text.

## Preservation model

Every parsed element parks its exact raw text under `x-fountain`: the title page and preamble on `metadata.extensions`, per-scene ordered element lists (`{type, raw, shot_ref, dialogue_index}`) on each scene, and source paragraphs on shots. Export emits parked raw when the mapped SKEL field is unchanged, else re-renders — lossless by default, honest under edits.

## MUSCLE mode

`skel-fountain run-hook --payload -` implements the manifest's cli route: on `import.after` (format `fountain`) it returns capability-scoped patches parking document-level Fountain data (`patch:metadata`, `patch:extensions.x-fountain`); the standalone `import`/`export` commands are the full adapter.
