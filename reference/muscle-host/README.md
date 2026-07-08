# Reference MUSCLE Host

A zero-dependency Node.js (≥18) reference implementation of the **host side** of the [MUSCLE spec](../../spec/muscle-spec.md). It exists so plugin authors and host implementers have running code that demonstrates the contract — it is a conformance/teaching artifact, not a product.

## What it implements

- **Discovery** (§6.1): scans directories for `*.muscle.json`, validates manifests, later scopes override earlier ones by `muscle_id`.
- **Invocation** (§4): builds the hook envelope, executes the `cli` route (JSON on stdin → JSON on stdout), honors `timeout_ms`. Other route types report as unavailable.
- **Mode enforcement** (§3.3): results that exceed the declared mode (`observe`/`transform`/`veto`) are rejected as failures.
- **Patch application** (§4.3): capability check per path, `creative_status: locked` protection, atomic apply with rollback, post-apply document sanity check, `metadata.plugins` recording (§6.3).
- **`subject_replacement`** (§4.2): derived values only; on `generate.route`, the replacement must be one of the candidate routes.
- **Deterministic ordering** (§3.1): priority, then registration order.

Not implemented: `mcp`/`api`/`skill` routes, sidecar capabilities, full AJV schema validation (a light structural sanity check stands in — production hosts must validate against `skel.schema.json`).

## Run the demo

```bash
cd demo
node run-demo.mjs
```

The demo runs the spec's `example.skel.json` through two hooks with three plugins:

| MUSCLE | Mode | Demonstrates |
|---|---|---|
| `shot-lint` | `veto` on `document.validate` | Custom lint rules merging into validation results |
| `note-stamper` | `transform` on `entity.changed` | A capability-scoped patch set applying cleanly |
| `rogue-writer` | `transform` on `entity.changed` | An undeclared write → entire patch set rejected, pipeline continues |

Expected output: lint warnings from shot-lint, one applied patch set from note-stamper, a rejection notice for rogue-writer, and a final document state showing `metadata.title` untouched.

## Use it as a library

```js
import { discoverMuscles, runHook } from "./muscle-host.mjs";

const muscles = discoverMuscles(["./muscles"]);
const report = runHook("document.validate", { muscles, document, lifecycle: "production" });
```

## Writing your own MUSCLE

See [`spec/MUSCLE_AUTHORING.md`](../../spec/MUSCLE_AUTHORING.md).
