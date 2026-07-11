# MUSCLE Specification v1.0

**Modular User-Scripted Companion Logic Extension**

> A behavior plugin format for SKEL. MUSCLEs inject logic at named points in the story workflow — import, validation, prompt assembly, generation, render write-back, and export — without ever touching `story.skel` directly.

---

## 1. Introduction

SKEL defines story structure. BONE defines the *data* that attaches to that structure (generator config, prompt contracts). MUSCLE defines the *behavior* that acts on it.

A MUSCLE is a manifest, not code. It declares which lifecycle hooks it subscribes to, what it is allowed to read and change, and how a host invokes it (MCP tool, CLI command, API endpoint). The host — Genlock, the `skel` CLI, or an LLM agent — calls the MUSCLE at each hook point with a JSON payload and receives a JSON result. MUSCLEs never mutate documents; they return **patches** that the host validates and applies atomically.

Staying with the skeleton metaphor: `.skel` is the body layout, `.bone` files are what attaches to it, `.muscle` files are what makes it move.

### 1.1 Design Principles

- **Manifest, not code**: A MUSCLE declares intent; the host executes routes. No embedded runtime, no sandboxing requirement in the host.
- **Patch, never mutate**: MUSCLEs return JSON Patch operations or proposals. The host validates, enforces capabilities and `creative_status: locked`, then applies atomically — or rejects and logs.
- **Capability-scoped**: A MUSCLE can only touch what its manifest declares. A patch outside declared capabilities causes the MUSCLE's entire patch set to be rejected (patch sets are atomic, §4.3).
- **Fail-safe**: A crashed, timed-out, or misbehaving MUSCLE never corrupts a project. Failures log and the pipeline continues (except `veto` hooks in strict lifecycles).
- **Deterministic**: Multiple MUSCLEs on one hook run in priority order, then registration order. Same inputs, same order, same result.
- **Recorded, not embedded**: Behavior is code and cannot be portably embedded on export. Documents record which MUSCLEs acted on them (`metadata.plugins`) for reproducibility.

### 1.2 File Convention

| Property       | Value                      |
| -------------- | -------------------------- |
| File extension | `.muscle.json`             |
| MIME type      | `application/muscle+json`  |
| Encoding       | UTF-8                      |
| Project folder | `muscles/` (workspace or project scope) |
| Schema URI     | `https://raw.githubusercontent.com/brandflowr/SKELETON-Brandflowr/main/spec/muscle.schema.json` |

---

## 2. MUSCLE Manifest File

### 2.1 Structure

```json
{
  "muscle_id": "studio-style-guard",
  "muscle_version": "1.0.0",
  "label": "Studio Style Guard",
  "description": "Enforces house style rules on assembled prompts.",
  "hooks": [
    { "on": "prompt.assemble.after", "mode": "transform", "priority": 50, "timeout_ms": 10000 }
  ],
  "capabilities": [
    "read:document",
    "patch:shot.bones",
    "patch:extensions.x-studio"
  ],
  "execution_routes": [
    { "type": "mcp",  "label": "Style Guard MCP", "tool": "style_guard.run_hook", "requires": ["mcp.style_guard"] },
    { "type": "cli",  "label": "Style Guard CLI", "command": "style-guard run-hook --payload -", "requires": ["cli.style-guard"] }
  ]
}
```

### 2.2 Fields

| Field              | Type     | Required | Description |
| ------------------ | -------- | -------- | ----------- |
| `muscle_id`        | string   | yes      | Unique identifier. Lowercase, hyphens allowed. Prefix to avoid collisions (e.g. `my-studio-style-guard`). |
| `muscle_version`   | string   | yes      | Semver version of this manifest. |
| `label`            | string   | yes      | Human-readable name for UI display. |
| `description`      | string   | no       | What this MUSCLE does. |
| `hooks`            | array    | yes      | Hook subscriptions (see §3). At least one. |
| `capabilities`     | string[] | yes      | What the MUSCLE may read and patch (see §5). |
| `execution_routes` | array    | yes      | How a host invokes this MUSCLE. Same shape as BONE Spec §2.7. Hosts choose the first available, configured route. |
| `config_schema`    | object   | no       | JSON Schema for per-project MUSCLE settings. Hosts MAY render a settings UI from it. |
| `extensions`       | object   | no       | Vendor-specific extension data. Keys SHOULD be `x-` namespaced. |

Unknown top-level fields are rejected unless placed under `extensions` or using an `x-` namespaced key — same rule as BONE.

---

## 3. Hooks

### 3.1 Hook Subscription

Each entry in `hooks`:

| Field        | Type    | Required | Description |
| ------------ | ------- | -------- | ----------- |
| `on`         | string  | yes      | Hook point name (see §3.2). |
| `mode`       | string  | yes      | `observe`, `transform`, or `veto` (see §3.3). |
| `priority`   | integer | no       | Execution order among MUSCLEs on the same hook. Lower runs first. Default `100`. Ties break by registration order. |
| `timeout_ms` | integer | no       | Host-enforced execution timeout. Default `30000`. |
| `filter`     | object  | no       | Optional narrowing: `{ "formats": ["fountain"] }` on import/export hooks, `{ "bone_ids": ["flux-dev"] }` on prompt/generation hooks, `{ "entities": ["shot"] }` on entity hooks. |

### 3.2 Hook Points

Hook names are dot-namespaced and versioned by payload (`payload_version` in the envelope, see §4).

| Hook | Fires | Typical use |
| ---- | ----- | ----------- |
| `import.before` | Before a source file is parsed | Pre-process Fountain/FDX source text |
| `import.after` | After parse, before the SKELDocument is handed to the host | Enrich, normalize, park foreign data under `x-<format>` |
| `document.validate` | After schema + referential integrity checks | Custom lint rules; add errors/warnings |
| `prompt.assemble.before` | Before `prompt_assembly` runs for a shot/BONE pair | Adjust effective BONE data |
| `prompt.assemble.after` | After the prompt string is assembled | Rewrite, style-enforce, inject |
| `generate.route` | When choosing an execution route for a BONE | Custom routing, queueing, cost gating |
| `render.complete` | After a render file lands per the BONE `output` spec | Post-process (upscale, watermark), extra write-backs |
| `entity.changed` | After a scene/shot/act edit is committed in the host | Sync to external systems, audit trails |
| `export.before` | Before serializing to a target format | Transform, redact, restore `x-<format>` data |
| `export.after` | After the export file is written | Notify, upload, hand off |

Hosts MAY implement a subset. A host MUST ignore subscriptions to hooks it does not implement and SHOULD report them as inactive rather than erroring.

`document.validate`, `import.after`, and `export.before` carry no `subject` — the whole document is the subject (sent per read capabilities).

> A `token.resolve` hook (custom token categories/overrides during key file resolution) was considered for v1.0 and deferred: its result contract needs real-world shaping first. It may return in a later minor version.

### 3.3 Hook Modes

| Mode | May return patches | May return errors | Failure/timeout effect |
| ---- | ------------------ | ----------------- | ---------------------- |
| `observe` | no | no (logs only) | Logged, pipeline continues |
| `transform` | yes | warnings only | Logged, patches discarded, pipeline continues |
| `veto` | no | yes | In `draft` lifecycle: logged, continues. In `production`/`export`: the operation fails closed. |

`veto` MUSCLEs participate in validation: their errors merge into the standard `SKELValidationResult` (`errors[]` / `warnings[]`, `SKELError` shape) with `code` prefixed by the `muscle_id`.

**Mode enforcement is a host obligation.** The declared `mode` is the contract: a host MUST reject a result that exceeds it — patches or `subject_replacement` from an `observe` or `veto` subscription, or `errors` from an `observe` or `transform` subscription. A violating result is treated as a MUSCLE failure per this section (the offending fields are discarded and logged; the pipeline continues per the mode's failure rule).

---

## 4. Invocation Contract

Hosts invoke a MUSCLE by executing one of its `execution_routes`, passing a **hook envelope** as JSON (stdin for `cli`, tool arguments for `mcp`, request body for `api`) and reading a **hook result** as JSON. Both are defined in `hook-payload.schema.json`.

### 4.1 Hook Envelope (host → MUSCLE)

```json
{
  "payload_version": "1.0",
  "hook": "prompt.assemble.after",
  "muscle_id": "studio-style-guard",
  "lifecycle": "production",
  "context": {
    "workspace_root": "/path/to/workspace",
    "project_slug": "the-last-signal",
    "config": {}
  },
  "document": { "skel_version": "2.0", "...": "full SKELDocument, per read capabilities" },
  "subject": {
    "entity": "shot",
    "id": "sh_1",
    "bone_id": "flux-dev",
    "assembled_prompt": "Close-up of weathered hands..."
  }
}
```

- `context.config` carries per-project settings validated against the MUSCLE's `config_schema`.
- `subject` is hook-specific; each hook's subject shape is defined in `hook-payload.schema.json`.
- Hosts MAY omit `document` or send a reduced view when the MUSCLE lacks `read:document`.

### 4.2 Hook Result (MUSCLE → host)

```json
{
  "payload_version": "1.0",
  "ok": true,
  "patches": [
    { "op": "replace", "path": "/shots/0/bones/flux-dev/text", "value": "..." }
  ],
  "errors": [],
  "warnings": [
    { "code": "studio-style-guard.tone", "severity": "warning", "path": "/shots/0", "message": "Prompt tone drifts from style guide." }
  ],
  "logs": ["checked 1 shot in 12ms"]
}
```

- `patches` is an RFC 6902 JSON Patch array targeting the SKELDocument. Hooks whose subject is a derived value (e.g. `prompt.assemble.after`) MAY instead return `subject_replacement` (e.g. the rewritten prompt string) — see the per-hook shapes in `hook-payload.schema.json`.
- `subject_replacement` MUST only affect **derived, non-persisted values** — the in-flight assembled prompt, the chosen execution route. It is not capability-checked precisely because it can never reach `story.skel`. All document mutation goes through `patches`, which are always capability-checked.
- On `generate.route`, a `subject_replacement` MUST be one of the candidate `routes` from the subject. A host MUST reject any other value and fall back to its default route selection.
- `errors`/`warnings` use the `SKELError` shape from ARCHITECTURE.md.
- A malformed result is treated as a MUSCLE failure per §3.3.

### 4.3 Patch Application Rules (host obligations)

1. Reject any patch whose path is outside the MUSCLE's declared `capabilities`.
2. Reject any patch touching an entity whose `creative_status` is `locked`.
3. Apply the full patch set from one MUSCLE atomically — all or nothing.
4. Re-run schema validation after applying; if the document becomes invalid, roll back and treat as MUSCLE failure.
5. Apply MUSCLEs in hook order (§3.1); each MUSCLE sees the document state produced by the previous one.
6. Log every applied and rejected patch set (see §7).
7. When applying a patch under a declared `patch:extensions.x-<ns>` capability, create the target entity's `extensions` container if it does not exist. A namespace-scoped MUSCLE must not need (and must not be granted) broader capabilities just to create the container.

---

## 5. Capabilities

Capability strings scope what a MUSCLE may see and change.

| Capability | Grants |
| ---------- | ------ |
| `read:document` | Receive the full SKELDocument in the envelope. |
| `read:sidecars` | Receive `audio-map.json` / `video-map.json` content. |
| `patch:metadata` | Patch paths under `/metadata` (except `plugins`, which is host-owned). |
| `patch:acts` \| `patch:scenes` \| `patch:shots` | Patch those entity arrays' core fields. |
| `patch:shot.bones` \| `patch:scene.bones` | Patch BONE data on those entities. |
| `patch:v_setup` | Patch shot `v_setup` tokens. |
| `patch:extensions.x-<ns>` | Patch only the named extension namespace on any entity. |
| `patch:sidecars` | Patch audio/video map sidecars. |
| `write:renders` | Write files under `renders/` (for `render.complete` post-processing). |

Hosts MUST surface a MUSCLE's capabilities to the user before enabling it. Wildcards are not permitted except the namespace form `patch:extensions.x-<ns>`.

---

## 6. Registration, Discovery, and Recording

### 6.1 Discovery

Hosts look for manifests in, by ascending precedence:

1. Built-in/first-party MUSCLEs shipped with the host
2. Workspace scope: `{workspace_root}/muscles/*.muscle.json`
3. Project scope: `{workspace_root}/projects/{slug}/muscles/*.muscle.json`

A project-scope manifest with the same `muscle_id` overrides workspace scope. Discovered ≠ enabled: MUSCLEs are opt-in per project.

### 6.2 Enablement

Project enablement lives in host config (not in `story.skel`), keyed by `muscle_id` with optional pinned version and `config` object.

### 6.3 Recording in the Document

When a MUSCLE's patches are applied to a document, the host records it in `metadata.plugins`:

```yaml
metadata:
  plugins:
    - id: studio-style-guard
      version: 1.0.0
      last_ran: 2026-07-07T12:00:00Z
```

`metadata.plugins` is host-owned: MUSCLEs cannot patch it. It answers "what acted on this document," not "what must run to open it" — a document with unknown plugin records MUST still load everywhere.

---

## 7. Failure Isolation and Logging

- Execution failures (crash, timeout, malformed result, rejected patches) write a log entry to `{workspace_root}/projects/{slug}/renders/failures/{muscle_id}.{hook}.log`, consistent with the Render Output Protocol.
- A failure never blocks saving `story.skel`, except a `veto` failure under `production`/`export` lifecycle, which fails the guarded operation (import/export/generation), never the underlying document.
- Hosts SHOULD disable a MUSCLE after repeated consecutive failures and surface that to the user.

---

## 8. Versioning

- `muscle_version` is semver and versions the manifest.
- `payload_version` versions the hook envelope/result contract. Hosts and MUSCLEs negotiate on major version: a host MUST NOT invoke a MUSCLE expecting a higher major payload version than the host implements.
- Hook payload changes follow the same rule as SKEL: additive within a major version, breaking changes bump the major.

---

## 9. Relationship to BONE

| | BONE | MUSCLE |
|---|---|---|
| Answers | "What data/config attaches to this entity?" | "What runs when X happens?" |
| Form | Data definition (fields, defaults, UI hints, prompt contract) | Behavior manifest (hooks, capabilities, routes) |
| Export | Embedded in `bone_registry` (portable) | Recorded in `metadata.plugins` (reproducibility, not embedded) |
| Mutates document | Never (it *is* data) | Never directly — returns patches the host applies |

A generator integration typically ships both: a `.bone.json` (prompt contract + output spec) and, optionally, a `.muscle.json` (custom routing, post-processing, sync).

---

## License

This specification is released under the [MIT License](https://opensource.org/licenses/MIT).
