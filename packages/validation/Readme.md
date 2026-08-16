# Validation core

The one implementation behind `@prelude/assert` (throwing), `@prelude/predicate` (type guards) and `@prelude/refute` (result values). A `Validator<T>` checks an unknown value and returns `{ ok: true, value }` or a structured `Failure` — the path to the offending value, what was expected (as data, not text) and the value itself — which each host package renders in its own words. Use it directly when you want that structure, or when you write a validator that should plug into all three packages.

# Usage

```bash
npm i -E @prelude/validation
```

```ts
import * as V from '@prelude/validation'

const message = V.object({
  method: V.string,
  params: V.tuple(V.number, V.nullOr(V.string))
})

message({ method: 'add', params: [ 1, 2 ] })
// { ok: false,
//   path: [ { kind: 'key', key: 'params' }, { kind: 'index', index: 1 }, { kind: 'or', alternative: 'null' } ],
//   expected: { kind: 'type', name: 'string' },
//   received: 2 }
```

Validators: `string`, `number`, `boolean`, `bigint`, `symbol`, `undefined_`, `null_`, `true_`, `false_`, `unknown`, `defined`, `nullish`, `finite`, `safeInteger`, `positive`, `nonBlankString`, `gt`/`gte`/`lt`/`lte`, `between`, `eq`, `is`, `oneOf`, `regexp`, `instance`, `strftime`, `calendarDate`; containers `array`, `tuple`, `object`, `partial`, `exact`, `exactPartial`, `record`, `unique`; combinators `or`, `and`, `nullOr`, `undefinedOr`, `nullishOr`, `lift` (a primitive becomes an equality check, a RegExp a match, `null` the null check).

Semantics shared by every host: `exact`/`exactPartial` look at own properties only (a declared `__proto__` key works), `partial` skips `undefined` properties, `tuple` checks every declared position and rejects extra elements, `unique` keys on the validated element (or on `f(element)`), `regexp` resets `lastIndex` of global/sticky patterns, `or` collects every alternative's failure, `and` returns the first.

# Failures

`Failure.path` segments: `key`, `index`, `keyOf` (a failing *property name* in `record`) and `or` (a `nullOr`/`undefinedOr`/`nullishOr` wrapper the failure passed through). `Failure.expected` is a tagged union (`type`, `literal`, `oneOf`, `regexp`, `extraKeys`, `union`, `strftime`, ... see `Expected` in `prelude.ts`); `Failure.received` is the innermost failing value.

Host packages attach their core validator to every function they export under the well-known symbol `validatorOf` (`unwrap(fn)`), so `assert.object({ a: assert.string })` composes structurally rather than by catching errors — and any function you wrap with `wrapped(fn, validator)` composes the same way.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
