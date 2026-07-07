# Contributing to SKELETON-Spec

SKEL (Story Keyframe Extensible Layout) is an open specification. Contributions are welcome.

## Ways to Contribute

- **Report spec gaps** — Open an issue if a use case isn't covered
- **Propose new tokens** — File an issue with your use case and suggested token name
- **Submit examples** — Additional `.skel.json` examples are valuable
- **Fix errors** — Typos, schema bugs, example errors — direct PRs welcome

## Spec Versioning

SKEL follows semver:

| Change | Version bump |
|---|---|
| New optional field added | MINOR |
| Breaking change to existing fields or structure | MAJOR |
| New token added to key file | MINOR |
| Clarification, example fix, documentation update | PATCH |

## Pull Request Guidelines

1. Keep PRs focused — one change per PR
2. If changing the spec, update `spec/skel.schema.json` to match
3. If adding tokens to the key file, update both `spec/skel-keyfile.json` and `spec/TOKEN_REFERENCE.md`
4. Update `spec/CHANGELOG.md` with your change under an `[Unreleased]` section
5. Any new `.skel.json` example must pass schema validation

## Discussion

Open an issue first for any change larger than a documentation fix or token addition.
