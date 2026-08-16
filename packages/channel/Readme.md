# Channel module

# Usage

```bash
npm i -E @prelude/channel
```

```ts
import * as Ch from '@prelude/channel'
```

## Reading and completion

- `read()` returns the next value and throws `Channel closed.` after completion.
- `next()` returns the complete iterator result. A value has `done: false`; completion has `done: true`.
- `maybeRead()` returns the next value or `undefined` after completion.

When a channel can contain `undefined`, `maybeRead()` cannot distinguish a queued `undefined` value from completion because both produce `undefined`. Use `next()` and inspect its `done` property when that distinction matters.

## Failure

- `fail(err)` closes the channel and rejects pending and subsequent reads with `err`; `failed` and `error` expose the state.
- `ofIterable()` and `ofAsyncIterable()` fail their channel when the source throws, so consumers see the error instead of a silent completion.

## Cancellation

`read`, `maybeRead`, `write`, `maybeWrite` and `writeIgnore` take `{ signal }`; `select`, `selectNext` and `selectAsync` take `{ signal }` as their first argument; `after`, `ofIterable` and `ofAsyncIterable` take it in a trailing options object.

- Aborting a pending read or write withdraws it — nothing is consumed or delivered — and rejects it with `signal.reason`; a write that was already accepted (buffered or handed to a reader) is unaffected.
- Aborting a `select` withdraws every attempt and rejects (the `select` generator throws) with `signal.reason`.
- Aborting `after`, `ofIterable` or `ofAsyncIterable` fails the channel with `signal.reason`, so readers reject and the producer stops.

```ts
const controller = new AbortController()
const value = await ch.read({ signal: controller.signal })
for await (const value of Ch.select({ signal: controller.signal }, a, b)) { ... }
```

Closing a channel (`close`, `closeWriting`, breaking out of `for await`) remains the way to stop *all* readers and writers.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
