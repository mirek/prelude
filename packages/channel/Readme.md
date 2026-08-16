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

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
