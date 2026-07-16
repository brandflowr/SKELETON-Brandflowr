# SKEL Conformance Corpus

Fixtures with declared expectations, one per normative error/warning code (see [`spec/errors.md`](../../spec/errors.md)). This corpus is how the **Validator** conformance class (skel-spec.md §9) is objectively tested — and what the TRADEMARKS.md conformance condition means in practice.

- `valid/` — documents that MUST validate with no errors (and, where `forbid` is set, without specific codes).
- `invalid/` — documents that MUST fail with the expected code(s).
- `warn/` — documents that MUST validate while reporting the expected warning code(s).
- `manifest.json` — machine-readable expectations: `{ file, lifecycle?, sidecars?, expect: { valid, codes, forbid? } }`.

## Self-certifying your validator

Run your validator across every manifest entry and assert three things:

1. Your validity verdict matches `expect.valid`.
2. Every code in `expect.codes` appears in your reported errors or warnings.
3. No code in `expect.forbid` appears.

Reporting *additional* codes is permitted (the corpus checks presence, not exhaustiveness), except codes listed in `forbid`.

The reference implementation of this exact procedure is [`scripts/run-conformance.mjs`](../../scripts/run-conformance.mjs), driving [`reference/cli/lib/validate.mjs`](../../reference/cli/lib/validate.mjs). CI runs it on every push.

## Adding fixtures

New error codes arrive with a MINOR release **and a fixture** (errors.md §11). Keep fixtures minimal: the base valid document plus exactly one mutation.
