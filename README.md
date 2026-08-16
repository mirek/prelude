# prelude monorepo

A pnpm workspace containing small, focused TypeScript utility packages published under the `@prelude/*` scope.

## What this repository contains

This repository is organized as a monorepo. Every directory under `packages/*` is a workspace package with its own `package.json`; `pnpm manifests:check` fails on a directory without one, because the build, typecheck and pack scripts discover packages by manifest and would otherwise skip it silently.

- Shared workspace configuration at the root (`pnpm-workspace.yaml`, root `package.json`).
- Individual package source, tests, and package-level docs in each `packages/<name>` directory.

## Quick start

### Prerequisites

- Node.js 22 or later (see [Supported runtimes](#supported-runtimes))
- pnpm `11.1.3` through the root `packageManager` declaration

### Install dependencies

```bash
pnpm install --frozen-lockfile
```

### Run the CI-equivalent quality gate

```bash
pnpm verify
```

`pnpm verify` runs the same checks as GitHub Actions, in this order:

1. `pnpm manifests:check` — verifies normalized package manifests, exports, and workspace TypeScript configs.
2. `pnpm release-hooks:check` — rejects package-local version, push, or publish hooks.
3. `pnpm test:check` — rejects unseeded randomness and unsupported `node:test` timeout arguments in the default suite.
4. `pnpm lint` — type-aware linting across `packages`.
5. `pnpm typecheck` — checks every package library and test TypeScript project independently.
6. `pnpm test` — runs all colocated `*.test.ts` files through Node's test runner.
7. `pnpm build` — rebuilds every package with a `tsconfig.lib.json` from clean source.
8. `pnpm pack:check` — packs every public package and installs the tarballs into an isolated consumer project.

Concurrency tests use explicit barriers, fake schedulers, and awaited task settlement rather than random sleeps or eventual polling. Optional randomized stress coverage must use a reproducible seed.

The package check verifies declared entry points, declaration resolution, root and subpath runtime imports, workspace dependency rewriting, the externally published TypeScript configs, and exclusion of development-only files. Isomorphic packages are additionally imported with Node's platform globals removed and every Node builtin unresolvable, and their declarations are type-checked without `@types/node`. Every publishable library also builds from source during its own `prepack` lifecycle.

GitHub Actions runs these checks independently on Node.js 22 (the supported floor), 24 and 26. The aggregate `CI` job is suitable as the required branch-protection check.

## Supported runtimes

Every published `@prelude/*` package declares `"engines": { "node": ">=22" }`; the root manifest declares the same. Node 22 is the oldest release line still in maintenance, and CI runs the full quality gate on it and on the current release lines, so the floor is exercised, not inferred.

- **Compile target.** `@prelude/tsconfig/base.json` sets `target: ES2024` and `lib: ["ES2024", "ES2025.Iterator", "ES2025.Collection"]`: the ES2024 language and library plus the ES2025 iterator helpers and `Set` methods, all of which Node 22 ships. `Symbol.dispose`/`Symbol.asyncDispose` (also in Node 22) are declared by `isomorphic.d.ts` rather than by the `ESNext.Disposable` lib, because that lib would also expose `DisposableStack`, `AsyncDisposableStack` and `SuppressedError`, which are Node 24+. Backend and test projects see those (and `Float16Array`) anyway through `@types/node`'s own lib references, so `.oxlintrc.json` bans them with `no-restricted-globals`. Nothing newer (`Promise.try`, `RegExp.escape`, ...) is visible to the compiler, so it cannot enter a package by accident. Widening the list is a support-policy change: it requires the feature to be available in the oldest supported Node and an entry in this section.
- **Node types.** The workspace type-checks against `@types/node` for the oldest supported release, so backend packages cannot use a Node API added after the floor.
- **Package classes.** A package is *isomorphic* when its `tsconfig.lib.json` extends `@prelude/tsconfig/isomorphic.json` (compiled with `types: []`, so no Node global or `node:` module resolves) or *Node-only* when it extends `backend.json`. Currently Node-only: `@prelude/assert`, `@prelude/fs`, `@prelude/log`, `@prelude/progress`, `@prelude/rb-tree`, `@prelude/refute`, `@prelude/repl` (and the private `@prelude/json`); every other package is isomorphic and is expected to run in browsers, workers and edge runtimes that support ES2024. `pnpm pack:check` enforces both classes on every CI Node version.
- **TypeScript.** `@prelude/tsconfig` declares `typescript >=6` as a peer dependency: its `lib` entries use the `ES2025.*` names TypeScript 6 introduced (5.x only knows them as `ESNext.*`). Package declarations are emitted and consumer-checked (`pack:check`) with the workspace TypeScript version; older compilers are not tested.
- **Dropping a runtime.** Raising the floor is a breaking change for every package: bump the `engines` constant in `scripts/normalize-package-manifests.mjs`, the CI matrix, `@types/node` and this section together, and release the affected packages with a major bump.

### Clean TypeScript build artifacts

```bash
make clean
```

## Package index

| Directory | Package | Description |
| --- | --- | --- |
| `packages/actor` | `@prelude/actor` | Actor module: stateful message processors with ask/reply, bounded mailboxes, failure directives and supervision hooks. |
| `packages/array` | `@prelude/array` | Array module. |
| `packages/assert` | `@prelude/assert` | Assert module. |
| `packages/async-generator` | `@prelude/async-generator` | Async generator module. |
| `packages/channel` | `@prelude/channel` | Channel module. |
| `packages/cmp` | `@prelude/cmp` | Cmp module. |
| `packages/emitter` | `@prelude/emitter` | Emitter module. |
| `packages/eq` | `@prelude/eq` | Eq module. |
| `packages/err` | `@prelude/err` | Err module. |
| `packages/fs` | `@prelude/fs` | Fs module. |
| `packages/function` | `@prelude/function` | Function module. |
| `packages/generator` | `@prelude/generator` | Generator module. |
| `packages/json` | `@prelude/json` | Json module. |
| `packages/jsonrpc` | `@prelude/jsonrpc` | Jsonrpc module. |
| `packages/log` | `@prelude/log` | Log package. |
| `packages/parser` | `@prelude/parser` | Parser combinators module. |
| `packages/predicate` | `@prelude/predicate` | Predicate combinators. |
| `packages/prelude` | `@prelude/prelude` | Prelude module. |
| `packages/progress` | `@prelude/progress` | Progress module. |
| `packages/radix-trie` | `@prelude/radix-trie` | Radix trie module. |
| `packages/range-set` | `@prelude/range-set` | Range set. |
| `packages/rb-tree` | `@prelude/rb-tree` | Red-black tree module. |
| `packages/refute` | `@prelude/refute` | Refute module. |
| `packages/remote-clock` | `@prelude/remote-clock` | Remote clock module. |
| `packages/remote-actor` | `@prelude/remote-actor` | Remote actor module: send/ask to an actor over any message transport (MessagePort, workers, sockets). |
| `packages/repl` | `@prelude/repl` | Repl package. |
| `packages/semver` | `@prelude/semver` | Semver module. |
| `packages/serial-queue` | `@prelude/serial-queue` | Serial queue module. |
| `packages/set` | `@prelude/set` | Set module. |
| `packages/sorted-array` | `@prelude/sorted-array` | Sorted array module. |
| `packages/string` | `@prelude/string` | String module. |
| `packages/supervisor` | `@prelude/supervisor` | Supervisor module: restart strategies (one-for-one, all-for-one, rest-for-one) and restart limits for @prelude/actor. |
| `packages/tsconfig` | `@prelude/tsconfig` | Shared TypeScript configurations for the prelude monorepo. |
| `packages/wait-group` | `@prelude/wait-group` | WaitGroup module. |
| `packages/xml` | `@prelude/xml` | Xml module. |

## License

The repository root is licensed under `CC0-1.0`. Individual packages may declare their own licenses in package-level files/manifests.
