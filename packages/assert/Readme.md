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

Primitives and matchers: `bigint`, `boolean`, `defined`, `false`, `finite`, `null`, `number`, `positive`, `safeInteger`, `string`, `symbol`, `true`, `undefined`, `unknown`, `eq`, `is`, `between`, `gt`, `gte`, `lt`, `lte`, `regexp`, `instance`, `oneOf`.

Containers: `array`, `tuple`, `object`, `partial`, `exact`, `exactPartial`, `record`, `unique`.

Combinators: `and`, `or`, `nullOr`, `undefinedOr`, `nullishOr`, `lift`, `predicate` (turns an assert into a type guard), `wrap` and `fail` for custom asserts.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
