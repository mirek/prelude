---
title: Normalize package documentation and metadata
priority: medium
area: documentation
---

# Normalize package documentation and metadata

## Problem

Package documentation is visibly stale and inconsistent. Examples include an absolute `/Users/mirek/...` generated type, old `preludejs/*` and `master/esm` links, README license sections that say MIT while manifests and license files say CC0, missing READMEs for `assert`, `docs`, and `tsconfig`, generic root descriptions, and a root prerequisite that names pnpm 10 while `packageManager` pins pnpm 11.

Most package manifests also omit repository, homepage, bugs, keywords, and runtime support metadata, making npm pages harder to navigate.

## Work

- Establish a concise package README template with purpose, install/import examples, supported runtime, API entry points, and the canonical license.
- Regenerate API excerpts reproducibly without machine-local paths.
- Remove dead badges and links or reconnect them to active services.
- Add consistent npm metadata and package-specific descriptions.
- Add a lightweight check for local absolute paths, license contradictions, dead internal links, and package-index drift.

## Acceptance criteria

- Every published package has accurate README and manifest metadata.
- Documentation contains no machine-local paths or contradictory license claims.
- The root package index is generated or checked against workspace manifests.
- Tool version instructions match the pinned repository configuration.
