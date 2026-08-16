# Assert module

Composable runtime assertions. An `Assert<T>` takes an `unknown` value and either returns it typed as `T` or throws an `AssertionError` that names the expected shape, the offending value and the path to it. Combinators mirror `@prelude/predicate` (boolean guards) and `@prelude/refute` (result values); use this package when an invalid value should stop the program.

# Usage

```bash
npm i -E @prelude/assert
```

```ts
import * as $ from '@prelude/assert'

const message = $.object({
  method: $.string,
  params: $.tuple($.number, $.string),
  id: $.undefinedOr($.number)
})

const value = message(JSON.parse(input))
// value: { method: string, params: [number, string], id?: number }

// Throws AssertionError('Expected .params.0 to be a number, got "x".')
message({ method: 'add', params: ['x', 'y'] })
```

`AssertionError` carries `expected`, `value`, `key` and a `cause` chain, so nested failures keep their full path (`.foo.bar.0.baz`).

# API

Primitives and matchers: `bigint`, `boolean`, `defined`, `false`, `finite`, `null`, `nullish`, `number`, `positive`, `safeInteger`, `string`, `nonBlankString`, `symbol`, `true`, `undefined`, `unknown`, `eq`, `is`, `between`, `gt`, `gte`, `lt`, `lte`, `regexp`, `instance`, `oneOf`, `strftime`, `calendarDate`.

Containers: `array`, `tuple`, `object`, `partial`, `exact`, `exactPartial`, `record`, `unique`.

Combinators: `and`, `or`, `nullOr`, `undefinedOr`, `nullishOr`, `lift`, `predicate` (turns an assert into a type guard), `wrap` and `fail` for custom asserts.

Every check is implemented once in [`@prelude/validation`](../validation) and shared with `@prelude/predicate` and `@prelude/refute`; this package renders its structured failures as `AssertionError`s (`Expected .path to be <what>, got <value>.`). Built-in asserts carry their core validator, so containers compose structurally; a hand-written `Assert` is adapted by catching its `AssertionError`.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
