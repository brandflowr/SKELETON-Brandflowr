# Governance

How the SKEL, BONE, and MUSCLE specifications change.

## Roles

- **Maintainers** — Brandflowr AI LLC. Final say on spec changes, releases, and trademark-conformance questions. Current maintainers are listed as repository admins.
- **Contributors** — anyone. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## What Counts as a Spec Change

Anything that alters the contract: normative prose (`spec/*.md` MUST/SHOULD/MAY statements), any `*.schema.json`, the token key file, the error catalog, or the conformance corpus. Editorial fixes (typos, formatting, non-normative examples) are not spec changes.

## Change Process

1. **Issue first** for anything larger than a documentation fix or token proposal (CONTRIBUTING.md). Use the *Spec change* issue template.
2. **One PR carries the whole change**: prose + schema + example + changelog entry + (for new error codes) a conformance fixture. CI enforces that shipped artifacts validate.
3. A maintainer reviews for: backward compatibility (additive ⇒ MINOR), vendor neutrality (Genlock specifics belong in the host profile, not core), and conformance-testability.
4. Merge to `main` = accepted, unreleased. It ships with the next release.

**Token additions** are the lightweight path: an issue with the use case and proposed token name/category; if accepted, a PR updating `skel-keyfile.json`, `skel.schema.json` enums, `TOKEN_REFERENCE.md`, and `skel-spec.md` §4.1 together (MINOR).

**Architecture decisions** get an ADR in `spec/DECISIONS.md`. ADRs are history: amended with dated notes, never rewritten.

## Versioning

Semver per [CONTRIBUTING.md](./CONTRIBUTING.md) and skel-spec §8: additive = MINOR, breaking = MAJOR, editorial = PATCH. BONE and MUSCLE specs version independently but release together with the repo tag.

## Release Process

1. Cut `spec/CHANGELOG.md`: move `[Unreleased]` into a dated `[X.Y.Z]` section.
2. Bump every schema `$id` (and doc Schema-URI references, modeline examples) from the previous tag to `vX.Y.Z`.
3. Update `package.json` versions (`@skel/spec`, `@skel/cli`).
4. Run `npm run check` — everything green.
5. Commit, then **tag `vX.Y.Z`** on that commit and push the tag. The tagged raw URLs referenced by the `$id`s become live and immutable at that moment.
6. Create a GitHub release with notes cut from the changelog section.
7. (When publishing) `npm publish` for `@skel/spec` and `@skel/cli`.
8. Optionally sync consuming apps (`sync-spec.ps1` for Genlock Studio).

`main` always carries the latest published schema at the same paths — documents may pin either the tag (immutable) or `main` (tracking).

## Trademark & Conformance

Use of the SKEL/BONE/MUSCLE marks is conditioned on conformance ([TRADEMARKS.md](./TRADEMARKS.md)). "Conformant" means: the claimed class's MUST checklist (skel-spec §9.1) holds and the implementation passes `tests/conformance/`. Disputes are resolved by the maintainers against the corpus, not by argument.
