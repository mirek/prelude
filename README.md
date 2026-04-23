# prelude monorepo

A pnpm workspace containing small, focused TypeScript utility packages published under the `@prelude/*` scope.

## What this repository contains

This repository is organized as a monorepo with one package per directory under `packages/*`.

- Shared workspace configuration at the root (`pnpm-workspace.yaml`, root `package.json`).
- Individual package source, tests, and package-level docs in each `packages/<name>` directory.

## Quick start

### Prerequisites

- Node.js (recent LTS recommended)
- pnpm `10.31.0` (or compatible)

### Install dependencies

```bash
pnpm install
```

### Run checks from the repo root

```bash
pnpm lint
pnpm test
pnpm test:r
```

- `pnpm lint`: type-aware linting across `packages`.
- `pnpm test`: runs `tsx --test` over package tests.
- `pnpm test:r`: runs `test` recursively for each workspace package.

### Clean TypeScript build artifacts

```bash
make clean
```

## Package index

| Directory | Package | Description |
| --- | --- | --- |
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
| `packages/repl` | `@prelude/repl` | Repl package. |
| `packages/semver` | `@prelude/semver` | Semver module. |
| `packages/serial-queue` | `@prelude/serial-queue` | Serial queue module. |
| `packages/set` | `@prelude/set` | Set module. |
| `packages/sorted-array` | `@prelude/sorted-array` | Sorted array module. |
| `packages/string` | `@prelude/string` | String module. |
| `packages/tsconfig` | `@prelude/tsconfig` | Shared TypeScript configurations for the prelude monorepo. |
| `packages/wait-group` | `@prelude/wait-group` | WaitGroup module. |
| `packages/xml` | `@prelude/xml` | Xml module. |

## License

The repository root is licensed under `CC0-1.0`. Individual packages may declare their own licenses in package-level files/manifests.
