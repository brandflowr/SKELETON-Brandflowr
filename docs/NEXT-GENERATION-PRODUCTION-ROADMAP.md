# SKEL Next-Generation Production Roadmap

> **Status:** Design proposal, not normative.  
> **Working targets:** SKEL 2.11+, BONE 1.2+, MUSCLE 1.2+, portable production sidecars 1.0.  
> **Frontier posture:** Living roadmap. Market and standards claims MUST be reverified against primary sources at every design and release checkpoint. Last broad review: 2026-08-15.  
> **Purpose:** Move SKEL from a strong storyboard interchange format toward a sequence-aware, approval-gated, agent-actionable production package without putting generator churn or runtime state into the core story document.

---

## 1. Outcome

The next generation of the SKEL family should support this production loop:

```text
story intent
  -> sequence plan
  -> continuity contract
  -> approved and locked references/keyframes
  -> provider-specific request assembled by a BONE
  -> generation routed through a host or MUSCLE
  -> immutable take record and review decision
  -> keeper selection
  -> OTIO editorial handoff
  -> portable, hash-verifiable production package
```

The central design decision is that these responsibilities do **not** all belong in `story.skel`.

- **SKEL core** owns durable, vendor-neutral story and creative facts.
- **BONE** owns replaceable generator/pipeline contracts, provider-facing fields, prompt assembly, routing hints, and output mapping.
- **MUSCLE** owns behavior at lifecycle hooks and returns capability-scoped atomic patches.
- **Portable sidecars** own high-churn production state shared across conforming hosts.
- **Host profiles and `x-` extensions** own implementation-specific storage and UI state.
- **Derived indexes** remain rebuildable and do not become canonical data.

The success condition is not “SKEL has every production field.” It is: **a portable creative contract can drive multiple generators, survive partial regeneration, preserve its decisions and provenance, and hand an edit to another tool without making any one provider or host canonical.**

### 1.1 Frontier Operating Discipline

Keeping SKEL at the front is a continuing acceptance criterion, not a one-time research task.

- **No stale capability claims:** Provider/model claims MUST cite an official source, carry a verification date, and be exercised through a reproducible probe or fixture before being marked supported.
- **No invented standards:** Community conventions and early products may inform experiments, but only published standards or tested SKEL contracts become normative.
- **BONE is the fast lane:** Provider fields, modality limits, request shapes, prompting guidance, and model routing update through versioned BONE releases without waiting for a SKEL core release.
- **SKEL promotes proven portable facts:** When the same requirement survives at least two materially different providers or tools, evaluate it for the portable production contract or core—not as vendor cargo culting.
- **MUSCLE is the behavior fast lane:** New validation, conversion, invalidation, routing, and audit behavior can ship as MUSCLEs while the underlying portable data contract stays stable.
- **Standards stay live:** OTIO, C2PA, color, localization, accessibility, packaging, and related interchange work are continuously watched and tested, not postponed as polish.
- **Experimental is an honest status:** Unverified or single-provider features are labeled `experimental`; they are not presented as conformant, portable, or production-ready.
- **Every release closes the loop:** Review official provider/standard changes, refresh affected BONEs and prompt skills, rerun capability probes, update the evidence date, and record compatibility/deprecation effects.

Milestones later in this document express dependency order and proof gates. They do **not** rank the importance of frontier work. Independent tracks SHOULD proceed in parallel whenever doing so does not prematurely freeze an unproven schema.

---

## 2. Starting Point

SKEL 2.10 already provides most of the required primitives:

- flat acts, scenes, and shots with stable IDs;
- character `identity_lock`, environment `style_lock`, wardrobe variants, props, and embedded/export snapshots;
- `scene.story_time` and narrative chronology;
- start-frame, end-frame, still, video-take, and audio-track BONE output slots;
- storyboard-aware and character-reference-aware starter BONEs;
- video/audio sidecars with statuses and generation provenance;
- `creative_status: locked`, host proposals, and atomic MUSCLE patches;
- delivery resolution, aspect, frame rate, color space, and audio targets;
- documented OTIO mapping intent, but no reference adapter;
- a Full Generation Loop tool map, but no portable persisted orchestration state.

The gap is integration. The current primitives are mainly per-shot and path-based. They do not yet provide:

1. a production sequence that groups shots independently of narrative scene hierarchy;
2. a resolved continuity contract with explicit override and invalidation rules;
3. typed, versioned references whose roles survive provider changes;
4. approved keyframes that can be locked without freezing the whole shot;
5. a multi-shot output that can map one generated clip back to several SKEL shots;
6. immutable take lineage, keeper decisions, and rejection/repair history;
7. a rational editorial timebase and tested OTIO round-trip;
8. persistent workflow runs, human gates, retries, and stale-write detection;
9. a portable package manifest tying the complete handoff together.

---

## 3. Ownership Rules

Use these questions whenever a proposed field has no obvious home.

1. **Would the fact remain true if every generator and host disappeared?**  
   Put it in SKEL core or the Studio registry.

2. **Does it describe what a particular generator accepts, how its prompt is written, or how its result is routed?**  
   Put it in a BONE definition or that BONE's attached data.

3. **Does it perform work, enforce a policy, transform data, or react to an event?**  
   Put the behavior in a MUSCLE or the host. Store only the result and audit record.

4. **Is it portable but high-churn production state—takes, approvals, run state, keyframe revisions, edit mappings?**  
   Put it in a versioned portable sidecar.

5. **Is it meaningful only to one application?**  
   Put it in that host profile or an `x-<vendor>` namespace.

6. **Can it be rebuilt exactly from canonical files?**  
   Keep it derived. Do not make it a second source of truth.

### 3.1 Decision Matrix

| Concept | Canonical home | Why |
|---|---|---|
| Acts, scenes, shots, intent, dialogue | SKEL core | Durable narrative truth |
| `identity_lock`, wardrobe definitions, environment geography, prop identity | SKEL core / Studio registry | Portable creative facts |
| Project delivery intent | SKEL core | Applies regardless of generator |
| Rational timebase and starting timecode | SKEL core | Required for deterministic time math and interchange |
| Production sequence membership | `production-map.json` | Portable production grouping, orthogonal to narrative hierarchy |
| Continuity anchors and state events | `production-map.json` | Portable production contract with frequent revisions |
| Keyframe approval/lock/revision | `production-map.json` | Workflow state around media, not story prose |
| Reference semantic role and digest | `production-map.json` | Portable identity of an input asset |
| Provider slot such as `@image1` | BONE assembly result only | Provider-local and potentially different on every call |
| Provider input limits and accepted modalities | BONE definition | Generator capability, not story truth |
| Prompt fields, defaults, negative prompt, seed, model controls | BONE data | Replaceable generator configuration |
| Sequence request template | BONE definition | Provider-specific assembly contract |
| Continuity lint or stale-keyframe detection | MUSCLE / validator | Behavior over portable facts |
| Take media, lineage, review, keeper decision | Media sidecars | High-churn production record |
| Generation routing, retry, and post-processing | BONE route + MUSCLE/host | Executable behavior |
| Persistent DAG and step state | `workflow-state.json` | Operational state, not a generator definition |
| Tracks, gaps, transitions, nested edits | `.otio` | OTIO is already the editorial authority |
| SKEL-to-OTIO conversion behavior | Adapter MUSCLE/reference adapter | Transformation, not core data |
| Timeline panel layout and selection | Host extension | UI-specific state |
| C2PA manifest bytes/signatures | Media or credential file | Existing external standard |
| C2PA manifest reference and digest | Media sidecar/package manifest | Portable association with the asset |

### 3.2 What Must Not Go Into SKEL Core

The following are explicitly excluded from the core document:

- provider model names, API endpoints, upload slot numbers, or request JSON;
- queue IDs, polling state, retry counters, or account/cost state;
- every generated take and review event;
- a second implementation of OTIO tracks and nesting;
- executable workflow graphs;
- host window state, timeline zoom, or selected panels;
- cryptographic credential payloads;
- automatically derived knowledge-graph edges.

---

## 4. Proposed File Architecture

```text
project/
  story.skel
  production-map.json
  video-map.json
  audio-map.json
  workflow-state.json             # optional operational handoff
  edit.otio                       # optional editorial authority
  package-manifest.json           # required only for packaged handoff
  refs/
    ... approved source/reference media ...
  renders/
    images/
    video/
    audio/
    failures/
  credentials/
    ... optional C2PA manifests or related material ...
```

`story.skel` remains independently valid. A reader that does not implement production sidecars can still open, validate, and understand the story. Sidecars add production depth without changing the meaning of the core narrative.

### 4.1 Portable Sidecar Rule

Every portable sidecar MUST:

- declare its own version;
- bind to `metadata.story_id`;
- use SKEL IDs for cross-file references;
- reject absolute paths and workspace escapes;
- preserve unknown `x-` namespaced extensions;
- have a published JSON Schema and TypeScript types;
- define migration behavior independently of the SKEL document version;
- participate in reference-validator and conformance fixtures;
- declare whether records are mutable, append-only, or derived.

---

## 5. SKEL Core Changes

Core changes should remain small and additive.

### 5.1 Rational Timebase

`metadata.delivery.frame_rate` is currently a number. That cannot precisely carry rates such as `24000/1001`, and it does not define a starting timecode or drop-frame behavior.

Add an optional `metadata.delivery.timebase`:

```yaml
metadata:
  delivery:
    frame_rate: 23.976            # compatibility/display field
    timebase:
      rate:
        numerator: 24000
        denominator: 1001
      start_timecode: "01:00:00:00"
      drop_frame: false
```

Rules:

- `rate.numerator` and `rate.denominator` MUST be positive integers.
- Exporters SHOULD use `timebase.rate` when present.
- If `frame_rate` and `timebase.rate` are both present, validators SHOULD warn when they are materially inconsistent.
- Cue points and sidecar ranges SHOULD gain rational-frame forms; seconds remain accepted for compatibility.
- Drop-frame MUST only be allowed for compatible rates.

This belongs in SKEL because the intended delivery clock is a project fact, not generator configuration.

### 5.2 Document Revision

Add a portable document revision precondition without turning SKEL into a version-control system:

```yaml
metadata:
  revision:
    id: rev_0187
    content_sha256: "..."
```

The exact hash canonicalization needs an ADR before schema work. The hash input must omit the hash field itself (and define normalization, key order, comments, and line endings) so every conforming writer computes the same value. The revision exists to support stale-write rejection across agents and sidecars; Git remains the human-facing history.

### 5.3 Existing Core Facts Remain Canonical

Do not duplicate these in the production sidecar:

- character appearance and identity;
- environment identity and geography;
- prop identity;
- scene/shot creative intent;
- presentation order and story chronology;
- shot `creative_status` and media status summary;
- delivery intent.

The production map references and specializes these facts. It does not fork them.

---

## 6. `production-map.json` 1.0

`production-map.json` is the portable sequence, reference, continuity, and approval contract. It is part of the SKEL format family but is not embedded in `story.skel` during ordinary authoring.

### 6.1 Proposed Shape

```json
{
  "version": "1.0",
  "story_id": "str_last_signal",
  "base_revision": "rev_0187",
  "references": [
    {
      "id": "ref_harlan_identity_v3",
      "media_type": "image",
      "role": "character_identity",
      "entity_ref": "char_harlan",
      "path": "refs/characters/harlan/identity-v3.png",
      "revision": 3,
      "sha256": "...",
      "status": "approved",
      "derived_from": ["ref_harlan_identity_v2"]
    }
  ],
  "approvals": [
    {
      "id": "approval_continuity_v4",
      "target": {
        "type": "sequence_continuity",
        "ref": "seq_machine_reveal",
        "revision": 4
      },
      "decision": "approved",
      "by": "director",
      "at": "2026-08-15T19:55:00Z"
    }
  ],
  "sequences": [
    {
      "id": "seq_machine_reveal",
      "label": "Machine reveal",
      "purpose": "generation",
      "shot_refs": ["sh_4", "sh_5", "sh_6"],
      "continuity_contract": {
        "character_states": [
          {
            "character_ref": "char_harlan",
            "wardrobe_ref": "ward_storm",
            "emotional_state": "controlled dread",
            "screen_position": "frame_left"
          }
        ],
        "environment_ref": "env_machine_room_night",
        "prop_states": [
          { "prop_ref": "prop_watch", "state": "closed", "holder_ref": "char_harlan" }
        ],
        "lighting_state": "pulsing cyan practicals with warm spill from doorway",
        "screen_direction": "Harlan moves left-to-right toward the machine",
        "eyelines": [
          { "from_ref": "char_harlan", "to_ref": "prop_machine", "direction": "frame_right" }
        ],
        "spatial_notes": "Door remains behind Harlan frame-left; console is downstage-right.",
        "audio_state": "machine pulse continues under all cuts",
        "look_intent": "same palette, grain, lens family, and contrast across the sequence"
      },
      "keyframes": [
        {
          "id": "kf_sh4_start_v2",
          "shot_ref": "sh_4",
          "role": "start_frame",
          "reference_ref": "ref_sh4_start_v2",
          "revision": 2,
          "status": "locked",
          "approved_by": "director",
          "approved_at": "2026-08-15T20:00:00Z"
        }
      ],
      "gate": {
        "state": "ready",
        "requires": ["continuity_approved", "keyframes_approved", "prompts_approved"],
        "approval_refs": ["approval_continuity_v4"]
      },
      "generation_policy": {
        "allow_partial_regeneration": true,
        "invalidate_dependents_on_anchor_change": true
      },
      "bones": {
        "seedance-2": {
          "duration": 15,
          "resolution": "1080p"
        }
      }
    }
  ],
  "continuity_events": [
    {
      "id": "evt_watch_opens",
      "entity_type": "prop",
      "entity_ref": "prop_watch",
      "at": { "shot_ref": "sh_5", "boundary": "after" },
      "set": { "state": "open", "holder_ref": "char_harlan" }
    }
  ]
}
```

The example is illustrative; field names become normative only after an ADR and schema review.

### 6.2 Production Sequence Semantics

A production sequence is **not** another narrative hierarchy.

- It groups shots for generation, review, or editorial handoff.
- It MAY span scenes, although single-scene sequences are expected to be common.
- Its `shot_refs` order is local production order; it does not rewrite scene presentation order.
- A shot MAY appear in more than one sequence for alternate production plans.
- No implicit “effective sequence” exists. Every sequence execution MUST name its `sequence_id`.
- Overlapping sequences MUST NOT silently inherit from one another.
- A sequence with `purpose: generation` SHOULD declare whether its output is one compound clip or independent shot clips.

### 6.3 Continuity Contract

The continuity contract stores portable constraints, not prose copied into every provider prompt.

Initial anchor categories:

- character state: wardrobe, injury/dirt, emotional state, pose intent, screen position;
- prop state: condition, holder, placement, orientation;
- environment and spatial staging;
- lighting and weather state;
- screen direction and eyelines;
- look intent and color continuity;
- persistent audio bed or voice state;
- freeform notes for facts not yet structured.

Resolution order:

```text
SKEL/Studio canonical asset facts
  -> prior applicable continuity events
  -> sequence continuity contract
  -> shot-specific continuity override
  -> BONE provider mapping
```

The BONE consumes the resolved contract but does not own it. Changing from Seedance to another generator must not erase or reinterpret the portable continuity facts.

### 6.4 State Evolution

`Character.state_overrides` remains valid for simple per-scene wardrobe/injury snapshots. `continuity_events` generalizes state evolution across characters, props, environments, weather, and audio.

Rules:

- events anchor to a shot boundary or a rational timeline point;
- events are ordered deterministically;
- events set explicit state; they do not contain executable transition code;
- validators detect conflicting writes at the same boundary;
- derived “state at shot” views are indexes and MUST be rebuildable;
- changing an earlier event marks dependent keyframes/takes stale but never deletes them.

### 6.5 Typed References

A reference describes what an asset **means**, independently of how a provider uploads it.

Initial roles should include:

- `character_identity`, `character_pose`, `character_costume`;
- `environment`, `product`, `prop`, `style`;
- `storyboard`, `start_frame`, `end_frame`;
- `motion_video`, `camera_reference`, `performance_reference`;
- `voice`, `music`, `sound_reference`;
- `document` and `other`/`x-` extension roles.

Every reference SHOULD support:

- stable ID and revision;
- media type and MIME type;
- workspace-relative path or portable URI;
- semantic role and optional entity binding;
- SHA-256 digest;
- source/license notes;
- derivation links;
- draft/review/approved/locked/superseded status;
- optional time range for video/audio references;
- optional C2PA manifest reference.

Provider slot names such as `@image1` are deliberately absent. A BONE maps reference IDs to provider slots during request assembly and records that resolved mapping in provenance.

### 6.6 Keyframe Locks and Invalidation

Keyframe status is independent from `shot.creative_status`.

- `draft`: may change freely;
- `review`: awaiting human decision;
- `approved`: accepted but may be superseded through an explicit revision;
- `locked`: automation MUST NOT replace or mutate it;
- `stale`: remains available but one of its dependencies changed;
- `superseded`: retained for history but no longer current.

An anchor or reference revision change MUST NOT delete dependent keyframes. A host or continuity MUSCLE proposes stale transitions with a machine-readable reason. A human may keep the existing keyframe, approve a revision, or regenerate only the affected shot.

### 6.7 Approval Records and Gates

Approvals are append-only records targeting a specific entity and revision. They may approve or reject a continuity contract, reference, keyframe, prompt snapshot, sequence plan, or take.

- Changing the target creates a new revision and requires a new approval; it never rewrites the old approval.
- Summary status on the target is a convenience view and MUST agree with the latest applicable approval record.
- A gate references required approval categories and, when available, exact approval IDs.
- Hosts MUST recompute gate readiness when a target revision changes.
- A ready gate becoming stale prevents new generation but does not erase already completed runs or takes.
- Approval identity is a portable actor string unless a host supplies a stronger organizational identity mapping.

---

## 7. BONE 1.2 Direction

BONE remains the fast-moving generator compatibility layer. Multi-shot support requires extending BONE, but portable sequence truth must stay outside it.

### 7.1 BONE Owns

- accepted input modalities and provider limits;
- provider/model identifiers and capability requirements;
- generator-specific fields and defaults;
- prompt or request assembly;
- mapping typed references into provider request slots;
- sequence duration, resolution, seed, strength, and similar model controls;
- provider routing and execution routes;
- neutral output target and write-back instructions;
- provider-specific quality gates;
- prompt-skill binding and LLM writing guidance.

### 7.2 BONE Does Not Own

- who a character is;
- the canonical continuity state;
- whether a creative reference was approved by the director;
- take keeper/rejection decisions;
- workflow run state;
- edit-track structure;
- package file integrity;
- provider-independent story or production IDs.

### 7.3 Sequence Execution Scope

Proposed BONE additions:

```json
{
  "attaches_to": ["shot", "scene", "metadata", "sequence"],
  "execution_scope": ["shot", "sequence"],
  "input_contract": {
    "modalities": ["text", "image", "video", "audio"],
    "reference_roles": ["character_identity", "storyboard", "start_frame", "motion_video"],
    "limits": {
      "image": 9,
      "video": 3,
      "audio": 3
    }
  },
  "capability_evidence": [
    {
      "source": "https://provider.example/official-model-docs",
      "verified_at": "2026-08-15T00:00:00Z",
      "scope": ["modalities", "reference_limits", "sequence_output"],
      "probe_ref": "probes/seedance-2-sequence-v1.json"
    }
  ]
}
```

These are provider capability declarations. They do not change the portable reference objects. `capability_evidence` binds time-sensitive declarations to official documentation and a reproducible local probe; it is evidence metadata, not a promise that a remote service will never change.

A sequence-capable BONE builds two related views rather than flattening every member into one object:

```text
sequence request config:
  BONE defaults
  -> metadata BONE data
  -> production sequence BONE data

ordered member view for each shot:
  BONE defaults
  -> metadata BONE data
  -> act BONE data
  -> scene BONE data
  -> shot BONE data

provider request:
  sequence request config
  + ordered member views
  + resolved continuity contract
  + approved reference records
```

Member-shot fields do not shallow-merge into one another. Act/scene inheritance remains part of each member shot's effective data, while sequence data controls the batch call. A sequence spanning multiple scenes does not pretend to have one parent scene. The production-map validator resolves sequence BONE keys against the `story.skel` BONE registry (or the host's local registry during ordinary authoring).

### 7.4 Provider Reference Binding

BONE assembly converts portable references into transient provider bindings:

```json
{
  "resolved_bindings": [
    { "reference_ref": "ref_harlan_identity_v3", "provider_slot": "@image1" },
    { "reference_ref": "ref_storyboard_v5", "provider_slot": "@image2" }
  ]
}
```

The binding is part of the resolved request and generation provenance. It is not written back as canonical continuity data.

This allows two BONEs to consume the same production sequence while assigning completely different upload slots or request shapes.

### 7.5 Sequence Output

Add a neutral BONE output target for a multi-shot result, tentatively `sequence_video_take`.

The write-back must record:

- `sequence_ref`;
- the compound media asset;
- zero or more shot segments with source ranges;
- the BONE and resolved request that produced it;
- whether the provider returned one compound clip or separate shot clips.

Example segment mapping:

```json
{
  "sequence_ref": "seq_machine_reveal",
  "path": "renders/video/seq_machine_reveal.v3.mp4",
  "segments": [
    { "shot_ref": "sh_4", "source_range": { "start_frame": 0, "duration_frames": 96 } },
    { "shot_ref": "sh_5", "source_range": { "start_frame": 96, "duration_frames": 120 } },
    { "shot_ref": "sh_6", "source_range": { "start_frame": 216, "duration_frames": 144 } }
  ]
}
```

This mapping is essential for OTIO export and targeted regeneration.

### 7.6 Starter BONE Work

Update `seedance-2` first as the reference sequence-capable BONE:

- replace path-only character/storyboard fields with portable reference bindings;
- retain current fields as migration aliases for reading;
- declare supported modalities and limits;
- add sequence prompt/request assembly;
- emit `sequence_video_take` when generating a compound clip;
- record exact resolved bindings and input digests in provenance;
- retain `prompt_skill` as the declarative source of current provider-specific writing guidance.

Add a second sequence-capable BONE before finalizing the contract. A supposedly portable design tested against only one provider is not yet portable.

### 7.7 BONE Freshness and Registry Status

The BONE registry should expose freshness separately from schema validity:

- `verified`: official source reachable and capability probe passes;
- `changed`: official contract changed and compatibility review is pending;
- `experimental`: single-provider or incompletely verified behavior;
- `stale`: verification window or evidence is no longer trustworthy;
- `deprecated`: provider/model has announced or completed retirement;
- `unavailable`: route exists in historical projects but can no longer execute.

A stale BONE can remain readable for reproducibility while being blocked from new production execution. Embedded historical BONE definitions remain immutable evidence of what a prior run used; registry updates produce a new BONE version rather than rewriting old exports.

---

## 8. Media Maps and Take Lineage

The current `video-map.json` and `audio-map.json` remain the canonical media assignment sidecars. Their next additive versions should share common provenance/review definitions where practical.

### 8.1 Take Identity and Lineage

Add optional fields:

- `revision`;
- `parentTakeIds[]` rather than only one replacement link;
- `generationRunId`;
- `sequenceRef` and optional `segments[]`;
- `inputReferenceRefs[]`;
- `resolvedBoneHash`;
- `sha256`, MIME type, and byte size;
- `contentCredentials` reference;
- append-only `reviewEvents[]`;
- append-only `repairEvents[]`.

Take creation facts and media digest are immutable after recording. Review decisions are appended as events.

### 8.2 Keeper Semantics

Do not equate “active in the current UI” with “approved keeper.”

- `isActive` remains a host/playback selection for compatibility.
- A keeper decision is an explicit review event.
- More than one keeper MAY exist for alternate edits.
- Rejection MUST allow structured reason codes plus notes.
- Repair requests SHOULD reference the rejected take and the fields/regions to preserve or change.
- Automation MUST NOT choose a final keeper unless a workflow explicitly delegates that decision.
- Selecting a keeper SHOULD atomically update the detailed sidecar event and the corresponding core `shot.status.video` summary to `approved`; a mismatch produces a validator warning rather than silently choosing one source.

Suggested decision states:

```text
unreviewed -> shortlisted -> keeper
                     \-> rejected
                     \-> repair_requested
```

### 8.3 Provenance

Extend the existing BONE provenance instead of inventing a separate competing block. Add:

- exact BONE definition digest;
- resolved request payload or digest;
- ordered resolved reference bindings and their media digests;
- parent take IDs;
- host/tool version;
- optional C2PA manifest path/URI and digest.

C2PA remains the authority for signed Content Credentials. SKEL records associations; it does not implement signatures inside JSON Schema.

---

## 9. MUSCLE 1.2 Direction

MUSCLE remains behavior, not workflow storage.

### 9.1 Required Contract Extensions

Extend hook envelopes with:

- `document_revision`;
- sidecar names and revisions;
- an optional `sequence` subject;
- an optional `take`/`review` subject;
- portable reference summaries when allowed by capability;
- expected base revisions for returned patches.

Add granular capabilities:

- `read:production-map`;
- `patch:production-map`;
- `read:workflow-state`;
- `patch:workflow-state` only for explicitly trusted orchestration MUSCLEs;
- `read:package-manifest`;
- `patch:media-review`;
- `write:package` for export tooling.

If one MUSCLE patch set touches multiple files, the host MUST apply it as a multi-file transaction or reject it. A successful story patch paired with a failed production-map patch is not atomic.

### 9.2 Initial MUSCLEs

| MUSCLE | Responsibility |
|---|---|
| `continuity-guard` v2 | Resolve state at each shot; flag anchor conflicts, screen-direction breaks, missing references, and stale locked keyframes |
| `sequence-readiness` | Veto generation when required approvals/references are missing |
| `reference-invalidator` | Propose stale transitions after upstream reference or state changes |
| `take-auditor` | Verify digests, provenance completeness, and required review fields |
| `otio-adapter` | Import/export OTIO while preserving unmappable data under `x-otio` |
| `package-builder` | Assemble and verify a portable production package |

### 9.3 Hooks

Prefer widening existing lifecycle hooks before adding a large hook vocabulary:

- `document.validate` receives declared sidecars when permitted;
- `prompt.assemble.before/after` may use a sequence subject;
- `generate.route` may route a shot or sequence request;
- `render.complete` may record a shot or sequence take;
- `entity.changed` gains `sequence`, `reference`, and `take_review` subjects;
- `import.*` and `export.*` continue to host OTIO adapters.

Add new hooks only where the existing lifecycle cannot express the event without ambiguity.

### 9.4 Concurrency

Every automated patch or proposal must carry its base revision. The host:

1. compares the base revision with current state;
2. rejects stale patches without attempting a best-effort merge;
3. returns a structured conflict result;
4. preserves the rejected proposal for review when appropriate;
5. requires the agent/MUSCLE to re-read and recompute.

This extends the current atomic-patch safety model without making MUSCLE a collaborative editor.

---

## 10. `workflow-state.json` 1.0

Workflow state is a portable, optional execution ledger. It coordinates BONE and MUSCLE operations but does not replace either system.

Minimum model:

```json
{
  "version": "1.0",
  "story_id": "str_last_signal",
  "workflows": [
    {
      "id": "wf_seq_machine_reveal_v4",
      "sequence_ref": "seq_machine_reveal",
      "status": "waiting_for_approval",
      "steps": [
        {
          "id": "approve_keyframes",
          "type": "human_gate",
          "status": "complete"
        },
        {
          "id": "generate_sequence",
          "type": "bone_execute",
          "bone_id": "seedance-2",
          "depends_on": ["approve_keyframes"],
          "status": "complete",
          "generation_run_id": "run_92b4"
        },
        {
          "id": "choose_keeper",
          "type": "human_gate",
          "depends_on": ["generate_sequence"],
          "status": "pending"
        }
      ],
      "next_action": {
        "step_ref": "choose_keeper",
        "actor": "director"
      }
    }
  ]
}
```

Required properties:

- stable workflow, run, and step IDs;
- explicit dependencies and conditions;
- `pending`, `running`, `waiting_for_approval`, `complete`, `failed`, `cancelled`, and `stale` states;
- idempotency key per executable step;
- attempt records rather than a mutable retry counter alone;
- input/output references and revision preconditions;
- time, actor, route, and failure records;
- explicit `next_action` as a derived-but-recorded handoff hint;
- budget/cost ceilings as optional policy, never implied spending authority.

The sidecar MUST NOT contain credentials or secrets. It may be omitted or redacted from an ordinary creative export and included in an agent-handoff or audit package.

---

## 11. OpenTimelineIO Adapter

OTIO should become a tested adapter and optional editorial authority, not a nested object inside SKEL.

### 11.1 Export Mapping

- SKEL story/sequence IDs -> OTIO metadata keys;
- keeper or selected takes -> `Clip` media references;
- sequence compound clips -> clips with shot source ranges;
- shot duration/rational timebase -> OTIO rational times;
- `transition_out` -> OTIO transitions where representable;
- audio-map tracks and music cues -> audio tracks/clips;
- production notes and repair requests -> markers;
- missing media -> explicit missing references, not silent gaps;
- unmappable SKEL fields -> `metadata.skel` or an agreed namespaced block.

### 11.2 Import and Round-Trip

- preserve OTIO clip/track/marker identity under `x-otio`;
- preserve unsupported OTIO constructs rather than flattening them away;
- keep SKEL entity IDs stable across repeated cycles;
- report lossy mappings before write;
- never claim all downstream adapters preserve all OTIO features;
- test rational rates, gaps, transitions, multiple video/audio tracks, nested stacks, markers, and time warps.

### 11.3 Authority Rule

Once a production designates `edit.otio` as editorial authority, SKEL remains the story/shot identity source and OTIO becomes the cut/timing source. Hosts must surface conflicts rather than silently choosing whichever file was modified last.

---

## 12. Portable Production Package

`package-manifest.json` turns a folder or ZIP into an inspectable handoff.

### 12.1 Manifest Responsibilities

- package format/version and creation metadata;
- `story_id` and document revision;
- file entries with role, path, media type, size, and SHA-256;
- required versus optional files;
- embedded Studio snapshots and BONE definitions needed offline;
- referenced MUSCLE IDs/versions without embedding executable behavior;
- missing-media declarations;
- optional C2PA associations;
- package profile and redaction policy.

### 12.2 Package Profiles

| Profile | Includes |
|---|---|
| `story_exchange` | `story.skel`, embedded BONE definitions/assets needed for export validation |
| `production_handoff` | story + production map + media maps + approved refs + manifest |
| `editorial_handoff` | production handoff + OTIO + selected/keeper media |
| `agent_handoff` | production handoff + redacted workflow state and actionable next step |
| `audit_archive` | all decisions, provenance, digests, credentials, and superseded records allowed by policy |

Package validation MUST work offline and MUST fail on required-file hash mismatch.

---

## 13. Color, Localization, and Accessibility

These are parallel frontier tracks. Their schemas may depend on the sequence/take/timebase foundation, but research, standards alignment, provider experiments, and adapter prototypes SHOULD advance continuously rather than wait for a later “polish” cycle.

### 13.1 Color

- Keep show-level color intent and delivery color space portable.
- Add typed references for LUT, ASC CDL, and OCIO configuration assets.
- Store application points in the production map or OTIO metadata.
- Put provider-specific grade controls in BONE fields.
- Do not embed binary LUTs in `story.skel`.

### 13.2 Localization

Add a future `localization-map.json` rather than overloading `Dialogue.subtitle`:

- locale and fallback chain;
- subtitle/caption/SDH tracks;
- dubbing and voice-cast variants;
- textless plates and on-screen-text replacements;
- dialogue/audio asset references;
- review/approval state per locale;
- delivery file references.

Existing `metadata.language`, `Dialogue.lang`, `Dialogue.subtitle`, and `shot.audio_description` remain the simple core representation.

---

## 14. Validation and Conformance

### 14.1 New Semantic Checks

Reserve stable error/warning codes for at least:

- production map `story_id` mismatch;
- stale `base_revision`;
- missing sequence shot/reference/entity IDs;
- duplicate sequence/reference/keyframe/event IDs;
- invalid or conflicting continuity events;
- locked keyframe mutation;
- invalid keyframe status transition;
- missing required approval gate;
- reference digest/path mismatch;
- unsupported BONE sequence attachment;
- BONE input limit exceeded;
- compound take segment overlap/gap/out-of-range;
- take parent cycles;
- keeper decision referencing a missing take;
- timebase/frame-rate conflict;
- invalid drop-frame combination;
- OTIO lossy mapping warning;
- package missing file or digest mismatch;
- multi-file patch revision conflict.

### 14.2 Conformance Fixtures

Add valid fixtures for:

- minimal production map;
- approved/locked keyframe sequence;
- typed multimodal references;
- continuity event resolution;
- single-shot and compound sequence takes;
- multiple keepers for alternate edits;
- rational `24000/1001` timebase;
- production and editorial package profiles;
- a second provider BONE consuming the same sequence.

Add invalid/warn fixtures for every semantic code above.

### 14.3 Reference Tests

- sequence continuity resolution is deterministic;
- reference changes produce stale proposals without deletion;
- BONE A and BONE B map the same reference IDs to different provider slots;
- locked keyframes survive partial regeneration;
- a compound sequence output maps to shot source ranges;
- SKEL -> OTIO -> SKEL preserves IDs and supported timing;
- unsupported OTIO structures round-trip under `x-otio`;
- stale agent patches are rejected;
- package validation detects one changed byte;
- all SKEL 2.10 fixtures remain valid unchanged.

---

## 15. Versioning and Migration

Proposed release units:

| Artifact | Working version | Compatibility intent |
|---|---|---|
| SKEL core | 2.11 | Additive `delivery.timebase` and revision support |
| BONE | 1.2 | Add sequence scope, input contract, reference binding, sequence output target |
| MUSCLE | 1.2 | Add revision-aware sidecar/sequence subjects and capabilities |
| Production map | 1.0 | New optional portable sidecar |
| Video/audio maps | 1.1 | Additive lineage, review, digests, and sequence mapping |
| Workflow state | 1.0 | New optional operational sidecar |
| Package manifest | 1.0 | New portable handoff contract |

Migration rules:

- Every valid SKEL 2.10 document remains valid.
- Projects without production sidecars behave exactly as they do today.
- Existing path-only Seedance fields remain read-accepted during a documented transition.
- Existing `replacesTakeId` remains accepted and maps to a one-element parent list.
- Existing `isActive` remains playback selection; it is not auto-promoted to keeper.
- Existing numeric `frame_rate` remains accepted.
- No migration fabricates approvals, locks, keepers, hashes, or provenance.
- Hosts must not claim support solely because they preserve unknown sidecar bytes.

Before starting these releases, complete the existing 2.10 release hygiene: verify/publish the `v2.10.0` tag referenced by schema `$id`s, align package/type version labels, and update conformance evidence.

---

## 16. Implementation Phases

### Phase 0 — Release Integrity

- verify and publish the immutable `v2.10.0` tag;
- correct stale TypeScript/doc version labels;
- confirm schema URLs resolve;
- record the true Genlock reader/writer/validator/Full Host status;
- keep the existing green conformance baseline.

**Exit:** 2.10 can be consumed and verified exactly as documented.

### Phase 1 — ADRs and Interchange Spikes

- ADR: core/BONE/MUSCLE/sidecar ownership boundary;
- ADR: production sequence is a portable sidecar entity, not story hierarchy;
- ADR: reference identity, revisions, locks, and invalidation;
- ADR: document hashing/canonicalization and multi-file transactions;
- ADR: rational timebase and OTIO authority;
- add a frontier evidence register and reproducible provider capability probes;
- define registry freshness/deprecation states for BONEs and prompt skills;
- prototype SKEL -> OTIO -> SKEL with three representative fixtures;
- test the same sequence against two materially different BONEs.

**Exit:** the uncertain architectural choices are proven before schemas harden them.

### Phase 2 — Portable Contracts

- add `production-map.schema.json`;
- add shared reference, continuity, approval, and rational-time definitions;
- extend video/audio sidecars additively;
- add package-manifest schema;
- update public TypeScript types;
- add examples, migrations, error catalog entries, and fixtures;
- extend the reference validator to load the production map.

**Exit:** a complete production plan validates without executing a generator.

### Phase 3 — BONE Sequence Execution

- update BONE schema/spec for sequence attachment and execution scope;
- define sequence request context and neutral output target;
- update `seedance-2` to bind portable references;
- add a second provider BONE;
- implement sequence resolution and assembly in reference tooling;
- record resolved input bindings and BONE digests in provenance.

**Exit:** two providers consume the same portable sequence without provider fields leaking into core or the production contract.

### Phase 4 — Continuity and Take Workflow

- upgrade `continuity-guard` for events, anchors, and invalidation;
- implement append-only review/repair events and keeper decisions;
- add targeted regeneration behavior;
- add compound take segmentation and validation;
- extend X-Ray diagnostics for sequence readiness, stale keyframes, and take lineage.

**Exit:** one shot can be regenerated without deleting or silently invalidating approved neighboring work.

### Phase 5 — OTIO and Packaging

- ship the bidirectional reference adapter/MUSCLE;
- cover rational time, audio, transitions, markers, gaps, nesting, and time warps;
- build and verify package profiles;
- add offline package validation and digest checking;
- add optional C2PA references.

**Exit:** a keeper edit can move to and from OTIO with explicit, tested loss boundaries.

### Phase 6 — Orchestration

- add `workflow-state.schema.json`;
- implement revision-preconditioned multi-file patches;
- persist runs, attempts, human gates, and next actions;
- wire BONE execution and MUSCLE hooks through the workflow engine;
- add recovery tests for crash, timeout, stale state, and duplicate callbacks.

**Exit:** an interrupted agent workflow resumes safely without replaying completed paid work or bypassing approval gates.

### Phase 7 — Frontier Expansion Integration

- color asset references and application points;
- localization/accessibility sidecar;
- series/franchise continuity extensions to the Studio registry;
- derived continuity-query index;
- provider-specific physics/simulation BONE packs.

Discovery and prototypes for these tracks run in parallel from Phase 1. Phase 7 is their integration/release gate, not the start of the work.

---

## 17. Repository Work Breakdown

### SKELETON-Spec

- ADRs in `spec/DECISIONS.md`;
- normative prose updates;
- new/updated schemas;
- public TypeScript types;
- error catalog and conformance fixtures;
- reference validator support;
- sequence resolver and BONE assembly reference implementation;
- OTIO adapter and round-trip tests;
- package builder/verifier;
- starter BONE/MUSCLE updates;
- examples and migration guide;
- package exports and release verification.

### SKELETON-Viewer and SKELETON-X-Ray

- load a project folder or package, not only one story file;
- validate associated sidecars;
- show production sequences and shot membership;
- inspect resolved continuity and state-at-shot;
- display reference approval/lock/stale status;
- display take lineage, keeper decisions, and provenance;
- show OTIO mapping/loss warnings;
- preserve read-only/local-first behavior;
- avoid separate hand-maintained implementations where shared code can be extracted.

### Genlock Host

- exact-version package consumption;
- production-map authoring and approval UI;
- sequence BONE resolution/execution;
- multi-file atomic save and revision preconditions;
- take/keeper review surfaces;
- OTIO import/export and authority/conflict UI;
- package import/export;
- MUSCLE discovery, consent, and hook execution;
- workflow persistence/recovery;
- conformance evidence before updating the host profile.

The Genlock application implementation must be audited in its own repository before these host tasks are estimated or marked complete.

---

## 18. Acceptance Criteria

The initiative is successful when all of the following are true:

1. A plain SKEL 2.10 project still opens and validates unchanged.
2. `story.skel` contains no provider upload slots, queue state, or take history.
3. One portable sequence can be executed by two different BONEs.
4. Approved reference IDs and keyframe locks survive generator replacement.
5. A continuity anchor change marks dependents stale without deleting history.
6. A user can regenerate one shot while preserving locked neighboring keyframes and keepers.
7. One multi-shot generated clip maps deterministically back to its member shots.
8. Keeper status is distinct from active playback selection.
9. Every take can identify its inputs, BONE definition, resolved request, parents, and review history.
10. Stale agent/MUSCLE writes fail closed with a structured conflict.
11. OTIO round-trip preserves supported timing and IDs and reports every lossy mapping.
12. A production package validates offline, including required-file digests.
13. The viewers can inspect the portable package without uploading it.
14. No conforming host must implement a specific provider, workflow engine, or UI.
15. Every supported provider capability has dated primary-source evidence and a reproducible passing probe.
16. Stale, changed, experimental, and deprecated BONEs are surfaced honestly and cannot masquerade as current verified integrations.
17. Each release records its frontier evidence cutoff and reviews cross-provider convergence for promotion into portable SKEL contracts.

---

## 19. Independent Frontier Design Tracks

These remain active design tracks but should not force unproven semantics into the sequence-production contract. “Independent” means separately proven and versioned, not lower priority:

- **Branching/interactive narratives:** changes core traversal and ordering semantics; requires its own ADR and may belong in SKEL 3.0.
- **Full spatial scene graphs:** reference OpenUSD or another external artifact before inventing geometry in YAML; keep initial spatial continuity descriptive and relational.
- **Knowledge graph:** derive query edges from canonical IDs, refs, state events, and chronology first.
- **Automatic keeper selection:** may be a review-assist MUSCLE, never an implicit core rule.
- **Provider-specific physics controls:** BONE fields and prompt skills, with only portable story constraints in the production map.
- **Cryptographic signing:** integrate C2PA associations and package hashes; do not design a competing signature standard.

---

## 20. Frontier Watch and Evidence Register

Maintain a machine-readable or table-based register alongside this roadmap with, at minimum:

| Field | Meaning |
|---|---|
| `capability_id` | Stable portable or provider capability being watched |
| `layer` | SKEL, BONE, MUSCLE, sidecar, adapter, host, or derived tooling |
| `provider_or_standard` | Authority responsible for the changing contract |
| `official_sources[]` | Primary documentation/specification URLs |
| `verified_at` | Last human/tool verification time |
| `probe_ref` | Reproducible fixture, API probe, or round-trip test |
| `status` | verified, changed, experimental, stale, deprecated, unavailable |
| `impact` | Affected schemas, BONEs, adapters, migrations, and hosts |
| `next_review_trigger` | Release, official change notice, failed probe, or scheduled audit |

Operating rules:

1. Search results, model summaries, social posts, and competitor marketing are discovery inputs, not evidence by themselves.
2. Prefer official specifications, API schemas, changelogs, model cards, and release documentation.
3. A capability is “supported” only when documentation and a reproducible test agree.
4. When official documentation and observed behavior disagree, mark the capability `changed` or `experimental`; do not silently patch prompts and keep the old claim.
5. Provider churn should ordinarily cause a BONE/prompt-skill update, not a SKEL core change.
6. Repeated cross-provider convergence is a trigger to review the portable contract immediately rather than waiting for the next major release.
7. Every public SKEL release notes the frontier evidence cutoff date and any known stale/experimental integrations.

## 21. External Alignment References

- [OpenTimelineIO documentation](https://opentimelineio.readthedocs.io/en/latest/) — editorial clips, tracks, transitions, markers, gaps, nesting, effects, and external media references.
- [C2PA specifications](https://spec.c2pa.org/) — signed Content Credentials and provenance association.
- [ByteDance Seedance 2.0 launch](https://seed.bytedance.com/blog/seedance-2-0-official-launch) — multimodal text/image/video/audio inputs, multi-shot generation, editing, and continuation.
- [Luma keyframe guide](https://lumalabs.ai/learning-hub/how-to-use-keyframes) — start/end keyframe workflow.
- [RenderScript Studio](https://renderscript.studio/) — early production-package benchmark for approvals, references, agent handoff, take logs, and keeper sheets; informative, not normative.

Vendor product behavior is evidence for portable requirements, not a schema authority. Before a field becomes normative, verify it against an official API or published standard and test it through at least two implementations.

---

## 22. First Concrete Milestone

The first implementable milestone is intentionally smaller than the full roadmap:

> **Milestone A — Portable Sequence Contract**

Deliver:

1. the ownership and sequence ADRs;
2. `production-map.schema.json` with sequences, typed references, continuity anchors, keyframes, and gates;
3. rational delivery timebase;
4. additive take lineage/review fields;
5. BONE sequence scope and reference binding;
6. an updated `seedance-2` BONE plus one second provider BONE;
7. validator rules and conformance fixtures;
8. one end-to-end example proving partial regeneration without changing locked references.

Workflow-engine and UI discovery SHOULD proceed in parallel, but their persistent schema and broad implementation MUST remain gated on Milestone A proving the ownership boundary and cross-provider portability.
