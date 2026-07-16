## What

<!-- One paragraph: what changes and why. Link the issue (required for spec changes larger than editorial fixes). -->

## Kind of change

- [ ] Editorial (typos, formatting, non-normative examples) — PATCH
- [ ] Token addition — MINOR
- [ ] Additive spec change (new optional field/def/hook/capability) — MINOR
- [ ] Breaking change — MAJOR (needs prior maintainer sign-off in the issue)

## Spec-change checklist (delete if editorial)

One PR carries the whole change (GOVERNANCE.md):

- [ ] Normative prose updated (`spec/*.md`)
- [ ] Schema(s) updated to match (`spec/*.schema.json`)
- [ ] Example updated or added (`spec/example.skel*`, `spec/examples/`)
- [ ] `spec/CHANGELOG.md` entry under `[Unreleased]`
- [ ] New error codes: `spec/errors.md` + a `tests/conformance/` fixture
- [ ] New tokens: `skel-keyfile.json` + schema enums + `TOKEN_REFERENCE.md` + spec §4.1 together
- [ ] `npm run check` passes locally
