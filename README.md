# prelude monorepo

A pnpm workspace containing small, focused TypeScript utility packages published under the `@prelude/*` scope.

## What this repository contains

This repository is organized as a monorepo with one package per directory under `packages/*`.

- Shared workspace configuration at the root (`pnpm-workspace.yaml`, root `package.json`).
- Individual package source, tests, and package-level docs in each `packages/<name>` directory.

## Quick start

### Prerequisites

- Node.js 22 or 24
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

The package check verifies declared entry points, declaration resolution, root and subpath runtime imports, workspace dependency rewriting, the externally published TypeScript configs, and exclusion of development-only files. Every publishable library also builds from source during its own `prepack` lifecycle.

GitHub Actions runs these checks independently on Node.js 22 and 24. The aggregate `CI` job is suitable as the required branch-protection check.

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
| `packages/docs` | `@prelude/docs` | (no description in package manifest) |
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
