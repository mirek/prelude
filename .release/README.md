# Release workflow

Releases are prepared as ordinary pull requests and published only from the exact verified `main` commit.

## 1. Add release plans

Create one or more JSON files under `.release/plans/`:

```json
{
  "summary": "Add stable tuple validation.",
  "packages": {
    "@prelude/assert": "minor",
    "@prelude/predicate": "patch"
  }
}
```

Allowed bumps are `patch`, `minor`, and `major`. Multiple plans are combined using the highest requested bump. Workspace dependents are added automatically with a patch bump so their packed dependency versions remain aligned.

## 2. Inspect the release without mutation

```bash
pnpm release:plan
```

The dry run reports:

- selected and automatically propagated packages in dependency order;
- old and new versions;
- workspace dependency versions written into tarballs;
- Git tags;
- actual dry-run tarball contents.

It does not edit Git history, create tags, or contact npm for publication.

## 3. Prepare a reviewable pull request

```bash
pnpm release:prepare
pnpm verify
```

Preparation updates package versions and changelogs, removes consumed plan files, and writes `.release/prepared.json`. Commit those edits and review them through the normal pull-request and CI process.

Do not run `npm version` in individual packages. Packages contain no push or publish lifecycle hooks.

npm provenance is requested automatically on GitHub Actions only; `pnpm publish --provenance` fails elsewhere. A bootstrap publish from a maintainer machine (needed before a trusted publisher can be configured for a brand-new package) just runs `pnpm release:publish` after `npm login`. Set `RELEASE_PROVENANCE=0` or `1` to override the default.

## 4. Publish the verified commit

After the release-preparation pull request is merged, run the **Publish** workflow (`.github/workflows/publish.yml`) on `main`. It authenticates to npm through OIDC trusted publishing, so the workflow filename must stay `publish.yml`; the `npm` GitHub environment may require approval.

The workflow:

1. checks out the exact `main` commit;
2. installs with the frozen lockfile;
3. runs the complete verification and installed-tarball gate;
4. publishes packages in dependency order with public access and npm provenance;
5. creates and pushes one annotated `<package>@<version>` tag per package.

Publication is resumable. Existing npm versions and correctly placed tags are skipped; conflicting tags or unexpected registry failures stop the workflow.
