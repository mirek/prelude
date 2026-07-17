---
title: Replace unsafe per-package release hooks
priority: high
area: release
---

# Replace unsafe per-package release hooks

## Problem

Nearly every package duplicates a Makefile release recipe that runs `git push`, pushes tags, and publishes from `postversion`. The recipes differ in registry command, access flag, build order, and test behavior. A failure midway can leave Git tags, remote commits, and npm packages in different states, and workspace dependents are not versioned as one release plan.

## Work

- Adopt one root release workflow with explicit package selection, dependency ordering, changelogs, and dry-run support.
- Separate local version edits from authenticated remote publication.
- Publish only after CI has validated the exact commit and its packed artifacts.
- Use npm provenance and protected environment approval where available.
- Delete duplicated push/publish logic from package Makefiles.

## Acceptance criteria

- Release preparation is reviewable as a normal pull request.
- A dry run reports versions, dependency range changes, tags, and tarball contents without mutating Git or npm.
- Publication is resumable or safely repeatable after a partial failure.
- All packages follow the same access, provenance, and changelog policy.
