---
title: Define the supported runtime matrix
priority: medium
area: compatibility
---

# Define the supported runtime matrix

## Problem

The repository recommends a "recent LTS" Node release but declares no `engines` fields, compiles with `target: ESNext`, and currently develops against Node 25 type definitions. Published code can therefore gain syntax or APIs that do not run on the LTS versions consumers reasonably infer are supported.

The packages also mix isomorphic, Node-only, and environment-agnostic claims without a machine-checked compatibility contract.

## Work

- Choose the minimum supported Node version and TypeScript/module-resolution versions.
- Set explicit compile targets and `engines` metadata compatible with that decision.
- Classify packages as isomorphic or Node-only and test accidental platform-global imports.
- Test the minimum and current supported runtimes in CI and add browser/bundler smoke tests for isomorphic packages.
- Document the support and deprecation policy.

## Acceptance criteria

- Runtime and compiler support is declared in the root and published manifests.
- CI executes consumer smoke tests on every supported runtime class.
- `ESNext` or experimental APIs cannot enter a package unless the support policy explicitly permits them.
