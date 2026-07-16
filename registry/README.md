# Community Registry

A flat index (`registry.json`) mapping public BONE and MUSCLE ids to their home repositories, so tools and humans can discover plugins and detect id collisions before they ship.

## Listing your plugin

PR an entry with: `id`, `label`, `source` (URL to the manifest/definition), optional `implementation` URL, optional `provider`. Maintainers set `conformance`:

- `verified` — validates against the published schema; MUSCLEs additionally behave against the reference host.
- `listed` — indexed, not yet verified.

## Collision policy

`bone_id` / `muscle_id` are first-come in this registry. **Prefix with your studio/handle** (reverse-prefix convention, e.g. `acme-shot-lint`, `my-studio-editorial`) — unprefixed generic names are reserved for first-party artifacts in this repository. A PR whose id collides with an existing entry is rejected; rename and resubmit.
