---
title: Fix clean workspace package builds
priority: critical
area: build
---

# Fix clean workspace package builds

## Problem

Package-level TypeScript builds cannot resolve imports from sibling `@prelude/*` packages. Every `tsconfig.lib.json` omits the source-path mapping described by `packages/tsconfig/AGENTS.md`, so clean builds of packages such as `array`, `async-generator`, `emitter`, `fs`, `jsonrpc`, `parser`, `semver`, and `xml` fail with `TS2307`.

The root `tsconfig.json` hides this because it has its own path mapping and excludes tests. Once dependency resolution is repaired, `async-generator/src/map.ts` also exposes a real generic return-type error that the root check currently misses.

## Work

- Put workspace source resolution in one shared config or generate correct per-package mappings for both library and test projects.
- Keep isomorphic package builds isolated from Node globals.
- Fix all type errors revealed by package-local builds, including the concurrent async-generator map return type.
- Add a root `typecheck` command that checks every library and every test project rather than only the root include set.
- Ensure editor project references and command-line builds use the same configuration.

## Acceptance criteria

- A clean install followed by the root type-check command succeeds.
- Every `packages/*/tsconfig.lib.json` and `tsconfig.test.json` can be checked independently.
- Every package build completes without relying on previously generated sibling `mjs` or `dts` directories.
- A regression test or CI check fails if a new workspace import cannot be resolved.
