# Predicate combinators

# Usage

```bash
npm i -E @prelude/predicate
```

```ts
import * as $ from '@prelude/predicate'

ws.on('message', (msgString: string) => {
  const msg = JSON.parse(msgString)
  if (!$.object({ method: $.string, params: $.tuple($.number) })(msg)) {
    console.error('Invalid msg.', msg)
    return
  }

  // `method` has `string` type here.
  const { method, params } = msg
  console.log({ method, params })
})
```

# API

`string`, `number`, `boolean`, `bigint`, `symbol`, `undefined`, `null`, `nil` (null or undefined), `unknown`, `defined`, `finite`, `safeInteger`, `positive`, `nonBlankString`, `gt`/`gte`/`lt`/`lte`, `between`, `eq`, `is`, `oneOf`, `regexp`, `instance`, `strftime`, `calendarDate`; containers `array`, `tuple`, `object`, `partial`, `exact`, `exactPartial`, `record(value, key?)`, `unique`; combinators `intersection`, `union`, `nullOr`, `undefinedOr`, `nilOr`; the `rpc` method decorator.

Every check is implemented once in [`@prelude/validation`](../validation) and shared with `@prelude/assert` and `@prelude/refute`, so the three agree on what they accept; this package only answers yes or no. Built-in predicates carry their core validator, so containers compose structurally; a hand-written type guard is adapted as an opaque predicate. Note that `record` takes the value predicate first (`record(P.number)` for string keys), unlike `assert`/`refute`'s `record(key, value)`.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
