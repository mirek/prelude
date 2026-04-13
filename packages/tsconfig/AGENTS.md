---
name: tsconfig
description: >
  Set up TypeScript packages in this monorepo so library code, tests, and node-only
  helpers each see the right global types. Isomorphic packages must NOT see Node.js
  types in their library source — only in test files. Achieved with solution-style
  tsconfig and project references, with tests colocated in `src/` next to the
  modules they cover (the convention in this repo).
  Use when: setting up a new package, adding tests to an existing one, fixing
  Node-types leaking into isomorphic code, or debugging VS Code IntelliSense
  routing across multiple tsconfig files.
---

# Package tsconfig layout (this repo)

## Problem

An isomorphic library must not depend on Node.js or browser-specific APIs in its
source. But tests use `node:test`, `node:assert`, etc., which require
`@types/node`. If `@types/node` is visible to the library compilation unit,
TypeScript silently allows `import "fs"`, `process.env`, `Buffer`, and other
Node-only APIs in `src/` — defeating the whole point of the package being
isomorphic.

## Solution: solution-style tsconfig + project references

TypeScript project references let one repo contain multiple compilation units,
each with its own `compilerOptions`. A **solution-style** tsconfig — a root
`tsconfig.json` with `"files": []` and only `"references"` — tells VS Code's
language server to route each open file to the right sub-project based on
`include` patterns. No `.vscode/settings.json` changes needed.

In this monorepo, tests live **next to** the code they exercise
(`src/foo.ts` + `src/foo.test.ts`). The lib sub-project includes `src/**/*.ts`
**excluding** `src/**/*.test.ts`. The test sub-project includes only
`src/**/*.test.ts`. Each `.ts` file is therefore covered by exactly one
sub-project, which is what solution-style routing requires.

## File layout per package

```
packages/<name>/
├── tsconfig.json          # solution root — references only
├── tsconfig.lib.json      # library compilation — no Node types
├── tsconfig.test.json     # test compilation — Node types available
├── package.json
└── src/
    ├── foo.ts             # routed to tsconfig.lib.json
    └── foo.test.ts        # routed to tsconfig.test.json
```

## Per-package files

### `tsconfig.json` — solution root

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.lib.json" },
    { "path": "./tsconfig.test.json" }
  ]
}
```

- `"files": []` is critical — it marks this as a solution-style config so VS
  Code routes by include patterns instead of trying to compile from this file.
- No `compilerOptions` here. Each sub-project defines its own.

### `tsconfig.lib.json` — library source

```json
{
  "extends": "@prelude/tsconfig/isomorphic.json",
  "compilerOptions": {
    "paths": {
      "@prelude/*": ["../*/src/index.ts"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "node_modules"]
}
```

- `extends` pulls in `types: []` (the isolation), the isomorphic `lib`
  (`ESNext` only — no DOM, no Node), and the ambient timer declarations from
  `isomorphic.d.ts`.
- `paths` resolves cross-package workspace imports (`@prelude/cmp` etc.) to
  the dependency's source. Without this, tsc tries to resolve via the
  package's `main`/`exports` fields, which point at unbuilt `mjs/` output
  and fail.
- `exclude` peels off the colocated tests so they belong to
  `tsconfig.test.json` instead.
- Backend-only packages (e.g., `fs`, `log`, `progress`, `repl`) extend
  `@prelude/tsconfig/backend.json` instead — same shape, but with
  `types: ["node"]` and Node visible in library code.

### `tsconfig.test.json` — tests

```json
{
  "extends": "@prelude/tsconfig/test.json",
  "compilerOptions": {
    "paths": {
      "@prelude/*": ["../*/src/index.ts"]
    }
  },
  "include": ["src/**/*.test.ts"],
  "exclude": ["node_modules"]
}
```

- `extends` pulls in `noEmit: true` and `types: ["node"]` — only the test
  sub-project sees `@types/node`.
- The same `paths` mapping is repeated here so test files can import workspace
  packages too.
- No `references` to the lib config: TypeScript project references would
  require `composite: true` on the lib, which conflicts with how cross-package
  source files get pulled into the program (they aren't in the lib's `include`
  list). VS Code routing works fine without this — the root `tsconfig.json`
  references both sub-projects, which is what the language server uses.

## Shared configs in `@prelude/tsconfig`

All per-package files extend one of these:

- **`isomorphic.json`** — strict ECMAScript-only environment. Sets
  `lib: ["ESNext"]` and `types: []`. Loads `isomorphic.d.ts`, which provides
  ambient declarations for `setTimeout` / `setInterval` that work in both
  Node and the browser.
- **`backend.json`** — Node environment. Sets `types: ["node"]`. Use for
  packages that legitimately need Node APIs in their library source
  (`fs`, `log`, `progress`, `repl`, etc.).
- **`test.json`** — extends `base.json`, adds `noEmit: true` and
  `types: ["node"]`. Used by every `tsconfig.test.json`.
- **`javascript-backend.json`** — `allowJs` + `checkJs`, for the JS-only
  packages (`eslint-config`).
- **`base.json`** — common compiler options shared by all of the above.

## How VS Code routes files

1. VS Code opens `tsconfig.json`, sees `"files": []` + `"references"`.
2. It identifies this as a solution-style config.
3. For each open file, it picks the sub-project whose `include`/`exclude`
   actually matches that file path.
4. `src/foo.ts` → matched by `tsconfig.lib.json` → no Node types.
5. `src/foo.test.ts` → matched by `tsconfig.test.json` → Node types available.
6. No restart, no per-workspace settings, no manual config — it just works.

## Build commands

Tests run directly through `tsx` / `node --test` and don't need `tsc` at all.
The ESM build (`make build-mjs`) must point `tsc` at the lib config explicitly,
since the root `tsconfig.json` now compiles nothing:

```makefile
build-mjs:
	rm -Rf mjs
	pnpm exec tsc -p tsconfig.lib.json -d --sourceMap --outDir mjs
```

The `-p tsconfig.lib.json` is the only change versus the old recipe — every
other flag stays the same.

## Common pitfalls

### Files not covered by any sub-project

Every `.ts` file in `src/` must match exactly one sub-project. If you add a
new file pattern (e.g., `src/**/*.bench.ts`), either fold it into the existing
include patterns or add a new `tsconfig.bench.json` referenced from the root.

### Forgetting to exclude tests from the lib config

If `tsconfig.lib.json` doesn't `exclude: ["src/**/*.test.ts"]`, both
sub-projects claim the same files — VS Code's routing becomes nondeterministic
and `tsc -b` errors.

### `"types": ["node"]` leaking into the lib config

Common mistake when copying tsconfig from a backend package. The whole
enforcement mechanism is `types: []` (inherited from `isomorphic.json`).
Adding `types: ["node"]` in the per-package `tsconfig.lib.json` re-enables
`@types/node` and silently breaks isomorphism. Don't.

### Importing test files from src

A non-test source file must never `import "./foo.test.js"`. The lib config
excludes test files, so the import would fail to resolve in the lib project
even though it works in the test project.

## Extending: extra file categories

To add benches, scripts, or examples that need their own type environment:

1. Create `tsconfig.<category>.json` with the right `extends` and `include`.
2. Add `{ "path": "./tsconfig.<category>.json" }` to the root `references`.
3. Update the lib config's `exclude` so the new files don't double-match.
