# Changesets

Every pull request adds one markdown file here instead of editing package versions —
uniquely named files never conflict between concurrent pull requests. Format:

```md
---
"@prelude/assert": minor
"@prelude/predicate": patch
---

One-line summary of the change.
```

Packages are versioned independently. Name every package you changed with the bump it needs:

- `patch` — fixes and documentation;
- `minor` — new features;
- `major` — breaking changes.

A pull request that changes nothing publishable (CI, scripts, repository docs) still needs a
file, so that nothing is ever forgotten: run `pnpm changeset --empty`.

## How a release happens

1. Merged changesets accumulate on `main`. The **Publish** workflow
   (`.github/workflows/publish.yml`) opens or updates the `chore(release): version packages`
   pull request (branch `changeset-release/main`), which runs `pnpm version-packages`:
   `changeset version` bumps the named packages, prepends their `CHANGELOG.md` entries,
   rewires workspace dependents that need it, and deletes the consumed files.
2. Merging that pull request leaves `main` with no pending changesets, so the same workflow
   runs `pnpm verify` and then `pnpm release:publish`: every public package whose version is
   not yet on npm is published in dependency order with provenance, then tagged
   `<package>@<version>` right away. Packages already on npm are skipped (and never tagged
   by a later run, since `main` may have moved on), so a failed run is simply re-run.

npm authentication is OIDC trusted publishing: every `@prelude/*` package lists this
repository and the workflow file name `publish.yml` as its trusted publisher on npmjs.com, so
do not rename the workflow file. A brand-new package cannot use trusted publishing for its
first release — publish it once from a maintainer machine (`npm login`, then
`pnpm release:publish`, which requests provenance only on GitHub Actions; override with
`RELEASE_PROVENANCE=0|1`), add the trusted publisher on npmjs.com, and re-run the workflow.

Do not run `npm version` or `pnpm publish` in individual packages by hand.
