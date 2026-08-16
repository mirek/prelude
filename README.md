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
3. `pnpm makefiles:check` — rejects package recipes that build with `tsc` directly or use unquoted recursive globs.
4. `pnpm docs:check` — verifies package READMEs, license references, manifest descriptions and the package index below.
5. `pnpm test:check` — rejects unseeded randomness and unsupported `node:test` timeout arguments in the default suite.
6. `pnpm lint` — type-aware linting across `packages`.
7. `pnpm typecheck` — checks every package library and test TypeScript project independently.
8. `pnpm test` — runs all colocated `*.test.ts` files through Node's test runner.
9. `pnpm test:scripts` — runs the tests of the repository scripts themselves.
10. `pnpm build` — rebuilds every package with a `tsconfig.lib.json` from clean source.
11. `pnpm pack:check` — packs every public package and installs the tarballs into an isolated consumer project.

Concurrency tests use explicit barriers, fake schedulers, and awaited task settlement rather than random sleeps or eventual polling. Optional randomized stress coverage must use a reproducible seed.

The data structures with the largest state spaces (`rb-tree` and its `Bag`/`Map`, `radix-trie`, `range-set`, `sorted-array`, `set`, `channel`, `serial-queue`) also have model-based property tests (`packages/*/src/model.test.ts`, `laws.test.ts`) built on the private `@prelude/testing` package: `checkTrace` generates operation traces from a seed, replays them against the structure and a naive reference model with every invariant checked after each step, and on failure shrinks the trace and reports `seed`, `trial` and the minimal operation sequence. The default suite runs a bounded number of trials; `SLOW_TESTS=<factor>` multiplies them, which the weekly `Stress` workflow (`.github/workflows/stress.yml`, also runnable by hand) does with a factor of 20.

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

Generated from the workspace manifests by `pnpm docs:write`; `pnpm docs:check` fails when it drifts.

<!-- package-index:start -->
| Directory | Package | Description |
| --- | --- | --- |
| `packages/actor` | `@prelude/actor` | Actor module: stateful message processors with ask/reply, bounded mailboxes, failure directives and supervision hooks. |
| `packages/array` | `@prelude/array` | Array utilities: safe indexing, sampling and shuffling, sorting and searching, grouping, swap-delete and vector helpers. |
| `packages/assert` | `@prelude/assert` | Composable runtime assertions that narrow unknown values to typed ones and throw AssertionError with the failing path. |
| `packages/async-generator` | `@prelude/async-generator` | Composable async iterable transforms: map, filter, batch, window, buffered and concurrent processing with backpressure. |
| `packages/channel` | `@prelude/channel` | Go-style channels for async code: buffered or unbuffered, async-iterable, with select over reads and writes. |
| `packages/cmp` | `@prelude/cmp` | Sound comparators: strict -1 | 0 | 1 results, composition, reversal and helpers for sorting and searching. |
| `packages/emitter` | `@prelude/emitter` | Type-safe event emitter with once, predicate-filtered listeners and promise-based waits with timeouts. |
| `packages/eq` | `@prelude/eq` | Structural equality combinators for primitives, arrays, tuples, records and partial objects. |
| `packages/err` | `@prelude/err` | Errors with a severity and a code, plus helpers to create, inspect and rethrow them consistently. |
| `packages/fs` | `@prelude/fs` | Node.js file-system helpers: JSON and string read/write, existence checks and deterministic depth-first traversal. |
| `packages/function` | `@prelude/function` | Function utilities: pipe, memoize, throttle, timeout, retry (eventually), sleep, serial execution and logic combinators. |
| `packages/generator` | `@prelude/generator` | Iterable and generator utilities: lazy map, filter, flatMap, batch, group, permutations, primes and other transforms over sync iterables. |
| `packages/json` | `@prelude/json` (private) | JSON encoding and decoding of non-JSON-native values (Set, Map, Date, RegExp, bigint, errors) through tagged coders. |
| `packages/jsonrpc` | `@prelude/jsonrpc` | JSON-RPC 2.0 client and request handling over any message transport, with request timeouts, abort signals and typed payloads. |
| `packages/log` | `@prelude/log` | Lightweight logger with severity levels, namespaces, pluggable targets and environment-variable level control. |
| `packages/parser` | `@prelude/parser` | Parser combinators over string readers with location-aware failures, plus an RFC 8259 JSON grammar. |
| `packages/predicate` | `@prelude/predicate` | Predicate combinators. |
| `packages/prelude` | `@prelude/prelude` | Low-level primitives shared by @prelude/* packages: pipe and common utility types. |
| `packages/progress` | `@prelude/progress` | Terminal progress display for Node.js: multi-worker progress bars, spinners and percentages on stdout. |
| `packages/radix-trie` | `@prelude/radix-trie` | Radix (compressed prefix) trie for string sets: insert, membership and shortest/longest prefix matching. |
| `packages/range-set` | `@prelude/range-set` | Sets of value-carrying ranges over ordered keys with union, intersection and difference under pluggable value merges. |
| `packages/rb-tree` | `@prelude/rb-tree` | Persistent red-black tree with duplicate counts, range counting and Bag/Map wrappers, with exported invariant checks. |
| `packages/refute` | `@prelude/refute` | Validators that return ok/refuted results with a reason instead of throwing, with predicate and assertion interpreters. |
| `packages/remote-actor` | `@prelude/remote-actor` | Remote actor module: send/ask to an actor over any message transport (MessagePort, workers, sockets). |
| `packages/remote-clock` | `@prelude/remote-clock` | Clock synchronisation against a remote time source: offset estimation, remote now/date and mid-second ticks. |
| `packages/repl` | `@prelude/repl` | Node.js REPL helpers: run code snippets extracted from Markdown in a sandbox with builtin modules and globals. |
| `packages/semver` | `@prelude/semver` | Semantic Versioning 2.0 parsing, comparison and precedence ordering. |
| `packages/serial-queue` | `@prelude/serial-queue` | Promise-returning serial task queue: pushed work runs one at a time, in order, with bulk rejection. |
| `packages/set` | `@prelude/set` | Set helpers over the native Set: union, intersection, difference, equality, numeric ranges and sorted/shuffled views. |
| `packages/sorted-array` | `@prelude/sorted-array` | Arrays kept sorted by a comparator with binary search, insert, insert-ignore and upsert. |
| `packages/string` | `@prelude/string` | String utilities: blank checks, case conversion, indentation, truncation, line operations, search-replace and edit distance. |
| `packages/supervisor` | `@prelude/supervisor` | Supervisor module: restart strategies (one-for-one, all-for-one, rest-for-one) and restart limits for @prelude/actor. |
| `packages/testing` | `@prelude/testing` (private) | Workspace-internal test helpers: seeded pseudo-random generation and trace-based model checking with shrinking. |
| `packages/tsconfig` | `@prelude/tsconfig` | Shared TypeScript configurations for the prelude monorepo. |
| `packages/wait-group` | `@prelude/wait-group` | Go-style WaitGroup: count outstanding work and await completion, with invalid-counter protection. |
| `packages/xml` | `@prelude/xml` | XML parser built on @prelude/parser producing a small AST, with JSON conversion helpers. |
<!-- package-index:end -->

## Package documentation

Every package ships `Readme.md` and `License.md` (CC0-1.0). `pnpm docs:check` (part of `pnpm verify`) enforces the shared shape:

- a top-level heading and a specific `description` in `package.json` (no `Foo module.` placeholders — the description is what npm and the index above show);
- an install command (`npm i -E @prelude/<name>`) and an import example;
- a `# License` section that points at `./License.md`;
- no machine-local paths, badges for retired services, links to the retired standalone repositories, or license text that contradicts the manifest;
- relative links that resolve.

A minimal package README therefore looks like:

```markdown
# Foo module

One or two sentences on what the package is for and when to reach for it.

# Usage

    npm i -E @prelude/foo

    import * as Foo from '@prelude/foo'
    Foo.bar(1)

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
```

Package manifests get `repository`, `homepage`, `bugs`, `files`, `exports` and `types` from `pnpm manifests:write`, derived from the package directory, so they cannot drift from the repository layout.

## License

The repository root is licensed under `CC0-1.0`. Individual packages may declare their own licenses in package-level files/manifests.
