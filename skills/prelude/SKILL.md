---
name: prelude
description: >
  Develop TypeScript applications with the @prelude/* package family
  (mirek/prelude). Use when choosing a Prelude package, writing code against
  Prelude APIs — channels, actors and supervisors, async generators, parser
  combinators, validation (assert/predicate/refute), comparators, sorted
  collections, XML/JSON-RPC — or when deciding how Prelude packages compose.
---

# Prelude

Prelude is a family of small, focused TypeScript packages published under the
`@prelude/*` npm scope from the `mirek/prelude` monorepo. Each package does one
thing; they share conventions (namespace imports, `AbortSignal` cancellation,
sound comparators) so they compose without glue.

Documentation site: https://mirekrusin.com/prelude/ — package guides at
`/packages/<name>/`, generated API reference at `/api/`, an index for models
at `/llms.txt` and every guide concatenated at `/llms-full.txt`.

## Before writing code

1. **Check whether a package already does it** (table below) before
   hand-rolling a channel, retry loop, sorted array, validator or parser.
2. **Read the installed version's docs, not memory.** Signatures differ
   between major versions (several packages had a 2.x/3.x rewrite in 2026).
   `node_modules/@prelude/<name>/Readme.md` and the `.d.ts` files under
   `node_modules/@prelude/<name>/mjs/` are authoritative; the site's `/api/`
   documents the latest release.
3. **Do not invent APIs from naming patterns.** Sibling packages are similar
   but not identical (for example `record` takes `(value)` in `predicate` but
   `(key, value)` in `assert`/`refute`).

## Package selection

| Need | Package | Notes |
| --- | --- | --- |
| Go-style channels, `select` over reads/writes | `@prelude/channel` | buffered/unbuffered, async-iterable, `fail(err)` propagates errors |
| Stateful message processor with `send`/`ask` | `@prelude/actor` | built on channel; failure directives `resume`/`restart`/`stop`/`escalate` |
| Restart strategies for actors (OTP-style) | `@prelude/supervisor` | `one-for-one`, `all-for-one`, `rest-for-one`, restart budgets, nesting |
| Talk to an actor across a worker/port/socket | `@prelude/remote-actor` | `serve(actor, transport)` + `new RemoteActor(transport)`; implements `Ref` |
| Transform async streams with backpressure | `@prelude/async-generator` | `map` with `concurrency`, `batch`, `window`, `cargo`, `buffered`, `consume` |
| Lazy sync iterable helpers | `@prelude/generator` | `pipe`, `take`, `cycle`, `groupMap`, `permutations`, `primes`, … |
| `pipe`, `memoize`, `throttle`, `timeout`, `sleep`, retry (`eventually`) | `@prelude/function` | |
| Run async tasks one at a time, in order | `@prelude/serial-queue` | `of(task)`, `push`, `pushWith({ signal })`, `rejectAll` |
| Count outstanding work, await zero | `@prelude/wait-group` | default export `WaitGroup`; invalid counters fail the group atomically |
| Typed events with promise-based waits | `@prelude/emitter` | `on` returns an unregister fn; `eventually(name, { timeout, signal })` |
| Comparators | `@prelude/cmp` | results are strictly `-1 \| 0 \| 1`; `chain`, `map`, `reversed`, `nullOr` |
| Structural equality | `@prelude/eq` | `array`, `tuple`, `record`, `partial`, `epsilon` |
| Runtime validation that **throws** | `@prelude/assert` | `AssertionError` with the failing path |
| Runtime validation as **type guards** | `@prelude/predicate` | yes/no only |
| Runtime validation as **result values** | `@prelude/refute` | `{ ok }` / `Fail { reason, received }`; `predicate(r)`, `assert(r)` adapters |
| Shared validator core / structured failures | `@prelude/validation` | use directly only to build validators that plug into all three |
| Errors with severity and code | `@prelude/err` | `Err.warn(code, message)`, `Err.error`, `Err.fatal`, `Err.get` |
| Logging (Node) | `@prelude/log` | default export class; `LOG=debug` env control; `log.rescue(...)` |
| Parser combinators | `@prelude/parser` | `seq`, `either`, `star`, `sep1`, `between`, `lit`; `Rfc8259` JSON, `Rfc4180` CSV |
| XML 1.0 + namespaces (no DTD, never fetches) | `@prelude/xml` | `parse` → AST with locations; `json(element)` |
| JSON-RPC 2.0 over any transport | `@prelude/jsonrpc` | `handle(socket, { call, notification })`, `new Client(socket, { timeout })` |
| SemVer parse/compare | `@prelude/semver` | `cmp`, `stringCmp`, `dsc`, `stringDsc` |
| Arrays, strings, sets | `@prelude/array`, `@prelude/string`, `@prelude/set` | `array` re-exports `Cmp`; `string` exports `Lines` (with Myers/histogram diff) |
| Array kept sorted by comparator | `@prelude/sorted-array` | binary search, `insert`, `insertIgnore`, `upsert` |
| Persistent red-black tree, bag/map, rank queries | `@prelude/rb-tree` | immutable; counts per subtree → percentiles without traversal |
| Prefix matching over strings | `@prelude/radix-trie` | shortest/longest prefix |
| Sets of value-carrying ranges | `@prelude/range-set` | `union`/`intersection`/`difference` under pluggable `Value` merges |
| Files (Node) | `@prelude/fs` | JSON/string read-write, `dfs()` deterministic traversal, symlink-safe |
| Terminal progress bars (Node) | `@prelude/progress` | disposable; `start(fps, { signal })` |
| Remote clock offset / mid-second ticks | `@prelude/remote-clock` | |
| Run Markdown code blocks in a sandbox (Node) | `@prelude/repl` | |
| Shared `tsconfig` presets | `@prelude/tsconfig` | `isomorphic.json`, `backend.json`, `test.json`; needs TypeScript ≥ 6 |
| `pipe`/`pipe0` and shared utility types | `@prelude/prelude` | rarely needed directly; other packages re-export `pipe` |

Private, not on npm: `@prelude/json` (tagged JSON coders) and `@prelude/testing`
(seeded model checking). Do not depend on them from outside the monorepo.

## Conventions that hold across packages

- **Install exact versions**: `npm i -E @prelude/<name>`. Packages are ESM-only,
  Node ≥ 22, compiled to ES2024. Most are isomorphic (browser/worker/edge safe);
  `assert`, `fs`, `log`, `progress`, `rb-tree`, `refute` and `repl` are Node-only.
- **Namespace imports are idiomatic**: `import * as Ch from '@prelude/channel'`,
  `import * as $ from '@prelude/assert'`, `import * as Cmp from '@prelude/cmp'`.
  Only `@prelude/log` and `@prelude/wait-group` are used via their default export.
- **Public entrypoints only**: the package root, or a documented subpath
  `@prelude/<name>/<file>.js`. Never import `src/`, `dist/` or `mjs/` paths.
- **Cancellation is one convention**: anything that can wait takes an optional
  `AbortSignal` — usually in a trailing options object (`sleep(ms, { signal })`,
  `ch.read({ signal })`, `map(f, { concurrency, signal })`), and as the *first*
  argument for `select({ signal }, ...)`. An already-aborted signal rejects
  immediately; aborting rejects with `signal.reason` unchanged (no wrapping);
  settled operations detach. In-flight user code is **not** interrupted — pass
  the same signal into it. Prefer the iterator protocol (`break`, `return()`)
  for a graceful stop from the inside; use a signal to stop from the outside.
- **Comparators are `Cmp<T> = (a, b) => -1 | 0 | 1`**, never `a - b`. Use
  `Cmp.number`, `Cmp.string`, `Cmp.chain(...)`, `Cmp.map(cmp, f)`,
  `Cmp.reversed(cmp)` wherever a package asks for a comparator (`sorted-array`,
  `rb-tree`, `set.sorted`, `array.sort`).
- **`maybe*` returns `undefined`, the bare name throws**: `first`/`maybeFirst`,
  `at`/`maybeAt`, `read`/`maybeRead`, `find`/`maybeFind`. Pick deliberately.
- **Disposal**: actors are `await using`-disposable; progress is `using`-disposable.

## Composition patterns

**Validate at the boundary, once.** Parse untrusted input with the validation
flavour that matches the call site and let the type flow:

```ts
import * as $ from '@prelude/assert'
const Message = $.object({ method: $.string, params: $.tuple($.number, $.string), id: $.undefinedOr($.number) })
const message = Message(JSON.parse(raw)) // typed, or throws AssertionError('Expected .params.0 to be a number, got "x".')
```

Use `predicate` inside `if`, `refute` when you need the reason as data, and the
same combinator names across all three (`object`, `tuple`, `array`, `record`,
`nullOr`, `oneOf`, `regexp`, `instance`, …). The three accept exactly the same
values; only the failure rendering differs.

**Channels feed actors, supervisors own actors, remote-actor crosses boundaries.**

```ts
import * as Actor from '@prelude/actor'
import * as Supervisor from '@prelude/supervisor'

const supervisor = Supervisor.of({ strategy: 'one-for-one', maxRestarts: 3, window: 5000 })
const worker = supervisor.spawn({
  name: 'worker',
  init: () => ({ processed: 0 }),
  receive: async (job: Job, state, { signal }) => { state.processed++; return run(job, { signal }) }
})
await worker.ask(job)       // reply or the handler's error
await supervisor.stop()     // children stop in reverse start order
```

- The default failure directive is `'escalate'`; an **unsupervised** actor fails
  on its first unhandled error and dead-letters its mailbox. Give it an
  `onError` or a supervisor.
- Inside a handler, `self` has `send`/`stop`/`kill`/`restart` but **no `ask`**,
  and those calls take effect after the handler returns.
- `Ref<M, R>` (`{ name?, send, ask }`) is the interface to hand around; both
  `Actor` and `RemoteActor` implement it, so code written against `Ref` is
  location-transparent.
- `cap: 0` is a rendezvous mailbox; a bounded `cap` makes `send`/`ask` wait.

**Stream processing.** `async-generator` is the pipeline layer; `channel` is
the coordination layer. Convert with `Ch.ofAsyncIterable` / `for await` on a
channel. `G.map(f, { concurrency })` preserves order by default; use
`withIndex`/`unwrapIndexed` when you want completion order.

```ts
import * as G from '@prelude/async-generator'
await G.pipe(source, G.map(fetchOne, { concurrency: 4, signal }), G.batch(50), G.consume(storeBatch, { signal }))
```

**Errors.** Throw `Err.*(code, message)` from `@prelude/err` for errors callers
should match on by `code`; `remote-actor` and `jsonrpc` surface remote failures
as `RemoteError` with a `code`. `emitter.eventually` timeouts are an `Err` with
code `timeout`.

## Common mistakes

- Importing a sibling package's API by analogy (e.g. assuming `generator` and
  `async-generator` have identical export lists — `generator` has far more).
- Using `maybeRead()` on a channel that may carry `undefined`; use `next()` and
  check `done`.
- Wrapping or replacing `signal.reason`, or expecting an abort to interrupt a
  mapping function that is already running.
- Returning a `number` from a comparator; `Cmp.sign`/`Cmp.ofLt` convert safely.
- Treating `'resume'` as retry: it drops the message and keeps state. `'restart'`
  re-runs `init`; the mailbox survives.
- Declaring an `ESNext.Disposable`-style lib or Node 24+ globals in a package
  meant to run on Node 22 — extend `@prelude/tsconfig/*` instead.
- Reading `dist/` or a stale summary instead of the installed `Readme.md`.

## Contributing to the monorepo

Clone `mirek/prelude`, `pnpm install --frozen-lockfile`, `pnpm verify` runs the
full CI gate. Every PR needs a changeset (`pnpm changeset`). Package READMEs are
checked by `pnpm docs:check`; the documentation site and this skill are built by
`pnpm site:build` from `README.md`, `packages/*/Readme.md` and
`skills/prelude/SKILL.md`.
