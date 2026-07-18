# SKEL Launch Punchlist

> Owner-facing operational checklist, post-2.9.0. Status as of 2026-07-16.
> Spec work itself is done — see [PRODUCTION-ROADMAP.md](../PRODUCTION-ROADMAP.md) (all P0–P3 implemented, released as 2.9.0).

---

## ✅ Done (verified live)

- [x] SKEL 2.9.0 committed and pushed to `main` (`9a46289`); working tree clean
- [x] CI green on GitHub (artifact validation, 33-fixture conformance corpus, MUSCLE host demo, continuity-guard, byte-identical Fountain round-trip, link check)
- [x] `v2.9.0` annotated tag pushed — **all versioned schema `$id` URLs verified 200**
- [x] GitHub Release published: <https://github.com/brandflowr/SKELETON-Brandflowr/releases/tag/v2.9.0> ← **canonical link for announcements**
- [x] Repo public; MIT license, security policy, and code of conduct auto-detected by GitHub
- [x] Repo description set + 10 topics applied (`skel`, `storyboard`, `screenplay`, `yaml`, `json-schema`, `open-format`, `ai-filmmaking`, `ai-video`, `fountain`, `specification`)

---

## 1. Claim the npm `@skel` scope — first-come, do soon

Availability signals (checked 2026-07-16): `@skel/spec` unpublished; **zero packages by any maintainer named `skel`** — scope very likely free. The unscoped package name `skel` is a parked 2013 placeholder (v0.0.0, owner `moll`) — it blocks only the *unscoped* name, not the scope, and would be disputable under npm's squatting policy if ever wanted.

- [ ] **Account** — sign up at <https://www.npmjs.com/signup> (skip if you have one), verify email, then enable 2FA under **Account Settings → Two-Factor Authentication** *before* publishing (npm prompts for an OTP at publish time).
- [ ] **Create the org — this is the claim.** <https://www.npmjs.com/org/create> → organization name: `skel` → plan: **Unlimited public packages — Free** → Create. The scope is yours the moment the org exists; nothing needs to be published and nothing is charged. npm validates the name instantly (this is also the definitive availability check).
  - *If `skel` is taken*, fallbacks in order: `skelformat`, `skel-spec`, `brandflowr` — then update the `name` in both `package.json` and `reference/cli/package.json` to match.
- [ ] **Publish `@skel/spec`** (soon after — a published spec package is a far stronger claim than an empty org, and the tarball is verified clean: 44 files, 142.5 kB — schemas, key file, `types/skel.d.ts`, README/LICENSE/TRADEMARKS):

  ```powershell
  npm login                      # opens browser auth
  cd D:\......2026-----v2026_code\SKELETON-Spec
  npm publish --access public    # OTP prompt if 2FA is on
  ```

  Notes: `--access public` is required — scoped packages default to private and fail without it. The org must exist first or the publish 404s. `npm pack --dry-run` previews the tarball.
- [ ] **Publish `@skel/cli`** so `npx @skel/cli validate story.skel` works anywhere:

  ```powershell
  cd reference\cli
  npm publish --access public
  ```

- [ ] **Org hygiene** (npmjs.com → org settings): require 2FA for all members; set publishing access to "Require two-factor authentication."
- [ ] **Verify** (or ask Claude to): `npm view @skel/spec` shows 2.9.0; `npx @skel/cli@latest validate spec/example.skel` works on a cold machine.

---

## 2. Announce

- [ ] Post publicly using the Release URL as the canonical link: <https://github.com/brandflowr/SKELETON-Brandflowr/releases/tag/v2.9.0>
- [ ] The release notes double as the announcement copy (asset/series layer, conformance machinery, tooling, getting-started block, editor modeline).

---

## 3. Near-term "claim the space" (days–weeks)

- [ ] **Domain** (optional, no urgency — `$id` URLs are safely pinned to git tags): `skelformat.org` / `skel.dev` before someone parks it.
- [ ] **GitHub Pages spec site** — rendered spec + stable schema paths; the step that makes it feel like a standard rather than a repo.
- [ ] **README "Implementers start here" section** — point tool-builders at `tests/conformance/` ("pass the corpus and per TRADEMARKS.md you can say 'reads SKEL'") and extenders at `MUSCLE_AUTHORING.md`.
- [ ] **Enable GitHub Discussions** (optional) — CONTRIBUTING currently routes everything through issues; Discussions gives ideas/questions a home that isn't a bug tracker.

---

## 4. Ongoing cadence — the moat

- [ ] **Dogfood loop**: every friction hit in real use becomes a *public* GitHub issue (even self-filed) → PR per CONTRIBUTING rules (schema + changelog + example in one PR) → steady MINOR releases. Public self-filed issues are the strongest external signal the spec is alive and use-driven.
- [ ] **Release discipline** per GOVERNANCE.md: version bump → changelog → tag (`vX.Y.Z` makes the `$id` URLs live) → GitHub Release → `npm publish` both packages in lockstep with the spec version.
- [ ] **Keep CI as the gate**: `npm run check` locally before any push; the conformance corpus grows with every new rule or fixed bug.
