---
title: Guarantee valid published artifacts
priority: critical
area: packaging
---

# Guarantee valid published artifacts

## Problem

Published package manifests point at ignored `mjs` output, but most packages do not build during `prepack`. A direct publish from a clean checkout can therefore create a package whose export targets do not exist. Tarball contents are also inconsistent because most packages have no `files` allowlist.

`@prelude/tsconfig` has an additional concrete defect: `isomorphic.json` loads `isomorphic.d.ts`, while its `files` list includes a nonexistent `types/` directory and omits `isomorphic.d.ts`.

## Work

- Make `prepack` build each publishable package from clean sources.
- Use explicit `files` allowlists and consistent `exports` entries for JavaScript, declarations, and supported subpaths.
- Include `isomorphic.d.ts` in `@prelude/tsconfig` and validate that every published config can be extended by an external fixture project.
- Pack every public package and install the tarballs into consumer fixtures that test root and subpath imports.
- Check that workspace dependency ranges are rewritten correctly in tarballs.

## Acceptance criteria

- `pnpm pack` from a clean checkout produces self-contained, importable packages.
- Every path named by `exports`, `module`, or `types` exists in the tarball.
- ESM runtime imports and NodeNext TypeScript imports work from an external consumer project.
- Tarballs exclude source tests, benchmarks, local build recipes, and unrelated files unless intentionally documented.
