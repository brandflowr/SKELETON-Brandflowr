# Security Policy

SKEL specifies a document format **and a plugin system that executes external tools** (MUSCLE). Security reports are taken seriously.

## Reporting a Vulnerability

- **Preferred:** GitHub → Security → *Report a vulnerability* (private advisory) on this repository.
- If private reporting is unavailable to you, open an issue titled `[security]` **without** exploit details and a maintainer will move the conversation to a private channel.

Please include: the affected file/section (spec text, schema, reference implementation), a reproduction or worked example, and the impact you foresee. You can expect an acknowledgment within 7 days.

## Scope

In scope:
- Spec-level weaknesses: anything that makes a *conforming* implementation unsafe (e.g. a gap in the MUSCLE capability model, path-template escapes, YAML loading guidance).
- The reference implementations in this repo: `reference/muscle-host/`, `reference/cli/`, `reference/fountain-adapter/`, `reference/continuity-guard/`, `scripts/`.
- The published schemas (validation bypasses with security consequences).

Out of scope:
- Vulnerabilities in third-party hosts or plugins (report to their maintainers; if the *spec* let them be vulnerable, that part is in scope here).
- Genlock Studio the application (separate codebase; reports reach the same maintainers, but file them against the app).

## Hardening Baseline

The normative security requirements implementations must follow live in the specs themselves:
- [skel-spec.md §10](./spec/skel-spec.md) — YAML safe loading, alias/size caps, external key-file integrity, path safety, NFC.
- [muscle-spec.md §10](./spec/muscle-spec.md) — consent-based enablement, argv-style invocation, payload/patch caps, filesystem boundaries, envelope privacy.

## Supported Versions

The latest MINOR release of the 2.x spec line and the reference implementations at `main`. Older tagged releases receive errata only for vulnerabilities that make conforming implementations unsafe.
