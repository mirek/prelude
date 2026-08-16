---
name: tsconfig
description: >
  Configure package-local TypeScript projects without leaking Node globals into
  isomorphic source, while resolving sibling workspace packages from source and
  keeping the published @prelude/tsconfig package usable by external consumers.
---

# TypeScript configuration

Each TypeScript package uses a solution-style root plus separate library and test
projects:

```text
packages/<name>/
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.test.json
└── src/
    ├── feature.ts
    └── feature.test.ts
```

## Package projects

`tsconfig.json` routes editors to the two actual projects:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.lib.json" },
    { "path": "./tsconfig.test.json" }
  ]
}
```

Isomorphic libraries extend the workspace-aware isomorphic config:

```json
{
  "extends": "@prelude/tsconfig/workspace-isomorphic.json",
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "node_modules"]
}
```

Backend libraries use `workspace-backend.json`. Tests use
`workspace-test.json`:

```json
{
  "extends": "@prelude/tsconfig/workspace-test.json",
  "include": ["src/**/*.test.ts"],
  "exclude": ["node_modules"]
}
```

The library project excludes colocated tests so every source file belongs to
exactly one editor project. Isomorphic library projects inherit `types: []`;
only backend and test projects see Node globals.

## Publishable versus workspace configs

The package intentionally separates public compiler policy from monorepo-only
resolution:

- `base.json`, `isomorphic.json`, `backend.json`, `test.json`, and
  `javascript-backend.json` are published. They contain no paths into this
  repository and can be extended from an external project.
- `workspace-isomorphic.json`, `workspace-backend.json`, and
  `workspace-test.json` add the `@prelude/* -> ../*/src/index.ts` mapping needed
  for clean source builds in this workspace. They are not published.

Do not move the workspace path mapping into a public config. A published alias to
`../*/src/index.ts` would point into nonexistent source directories inside an
installed consumer project.

## Verification and builds

From the repository root:

```bash
pnpm manifests:check
pnpm typecheck
pnpm build
pnpm pack:check
```

- `manifests:check` verifies package manifests and package tsconfigs have the
  normalized workspace/public split.
- `typecheck` checks every library and test project independently.
- `build` type-checks and emits each library into `mjs/`.
- `pack:check` packs every public package, installs all tarballs into an isolated
  external consumer, imports roots and subpaths, and resolves declarations using
  the published TypeScript configs.

Every publishable library has a `prepack` lifecycle that invokes
`scripts/build-package.mjs`, so `pnpm pack` from a clean checkout cannot package
missing JavaScript or declarations.

## Adding a package

1. Add the solution root and separate library/test configs.
2. Choose `workspace-isomorphic.json` or `workspace-backend.json` for the library.
3. Use `workspace-test.json` for tests.
4. Run `pnpm manifests:write` once to normalize the manifest and configs.
5. Run `pnpm verify` before committing.

## Runtime floor and library policy

`base.json` sets `target: ES2024` and an explicit `lib` list (ES2024 plus the
ES2025 iterator helpers and `Set` methods that Node 22 ships). Do not switch
either back to `ESNext` and do not add a `lib` entry per package: the list is
the machine-checked half of the support policy in the root README's "Supported
runtimes" section, and every entry must be available in the oldest supported
Node release. `@types/node` at the workspace root is pinned to that same
release for the same reason. `Symbol.dispose`/`Symbol.asyncDispose` come from
`isomorphic.d.ts` (isomorphic projects) or `@types/node` (backend and test
projects), not from `ESNext.Disposable`, whose `DisposableStack` family is
Node 24+; the root `.oxlintrc.json` bans those globals.

## Common failures

- Node APIs compile in an isomorphic library: the library extends a backend
  config or overrides `types`.
- Sibling `@prelude/*` imports fail: the project extends a public config instead
  of its workspace counterpart.
- External consumers resolve repository source paths: a public config contains
  the workspace alias.
- Editor routing is inconsistent: tests are included by both library and test
  projects, or a new file category is covered by neither.
- Packing succeeds only after a prior build: the manifest is missing the shared
  `prepack` lifecycle or the package is outside manifest normalization.
