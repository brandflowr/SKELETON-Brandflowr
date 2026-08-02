# Packaging and Host Consumption

`@skel/spec` is the release artifact for schemas, public TypeScript types, host profiles, and the reference validator. Tagged GitHub schema URLs remain immutable; the npm version and Git tag use the same version.

## Package contents

- `spec/**` — current schemas, specifications, examples, and starter BONE/MUSCLE manifests
- `types/skel.d.ts` — public document, sidecar, registry, and host-profile types
- `profiles/**` — machine-readable host implementation profiles
- `reference/cli/lib/validate.mjs` — the Validator-class reference implementation, exported as `@skel/spec/validator`

AJV, `ajv-formats`, and `js-yaml` are runtime dependencies because the validator export imports them.

## Recommended host integration

Pin an exact release:

```json
{
  "dependencies": {
    "@skel/spec": "2.10.0"
  }
}
```

Import schemas directly when the host bundler supports JSON modules:

```js
import skelSchema from "@skel/spec/spec/skel.schema.json" with { type: "json" };
import videoMapSchema from "@skel/spec/spec/video-map.schema.json" with { type: "json" };
import { validateDocument } from "@skel/spec/validator";
```

An application may initially keep vendored schema files to avoid a runtime refactor. In that mode, the package/repository is still the authority: run `sync-spec.ps1 -Destination <host>/spec`, then enforce byte equality against the installed package in host CI. Do not hand-edit a generated mirror.

## Genlock transition

Genlock 1.0 can continue using its current bundled files and runtime behavior. The 2.10 release first makes those persisted bytes authoritative upstream. A later application change can replace local JSON imports and hand-maintained types with exact-version package imports without changing the stored format.

The machine-readable `profiles/genlock/profile.json` records current partial conformance and the `2.0` writer version. Updating that declaration to claimed 2.10 conformance requires the application changes and conformance evidence described in `GENLOCK_HOST_PROFILE.md`; installing the package alone does not make that claim.

## Release verification

```powershell
npm install
npm run check
npm pack --dry-run
```

Before publishing, verify that every current schema `$id` contains the release tag, create the matching Git tag, and validate a clean installation of the tarball. Never republish different bytes for an existing version.
