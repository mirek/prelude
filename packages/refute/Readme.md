# Refute module

* `and: <Ts extends (Primitive | Refute<unknown>)[]>(...as: Ts) => Refute<IntersectionOfUnion<Lifted<Ts[number]>>>`

* `array: <T>(a: Refute<T>) => (values: unknown) => Result<T[]>`

  Combinator over an array.

* `assert: <T>(a: Refute<T>) => (value: unknown) => T`

  Combinator returning refute as assertion.

* `bigint: Refute<bigint>`

  Returns refute for `bigint` type.

* `boolean: Refute<boolean>`

  Returns refute for `boolean` type.

* `defined: <T>(value: T) => Result<Exclude<T, undefined>>`

  Returns refute for defined value type.

* `exact: <T extends Record<string, Primitive | Refute<unknown>>>(kvs: T) => (value: unknown) => Result<{ [k in keyof T]: Lifted<T[k]>; }>`

  Refute combinator over an exact object.

  See `object`

  See `partial`

  See `exactPartial`

* `exactPartial: <T extends Record<string, Primitive | Refute<unknown>>>(kvs: T) => (value: unknown) => Result<{ [k in keyof T]?: Lifted<T[k]>; }>`

  Refute combinator over an exact, partial object.

  See `object`

  See `partial`

  See `exact`

* `finite: (value: unknown) => Result<number>`

  Returns failure if `value` is not a finite number.

* `lift: <T extends Primitive | Refute<unknown>>(a: T) => Refute<Lifted<T>>`

* `null: Refute<null>`

  Returns refute for `null` type.

* `nullishOr: <T>(a: Refute<T>) => Refute<T>`

* `nullOr: <T>(a: Refute<T>) => Refute<T>`

* `number: Refute<number>`

  Returns refute for `number` type.

* `object: <T extends Record<string, Primitive | Refute<unknown>>>(kvs: T) => (value: unknown) => Result<{ [k in keyof T]: Lifted<T[k]>; }>`

  Refute combinator over an inexact object.

  See `partial`

  See `exact

  See `exactPartial`

* `oneOf: <T extends Primitive>(...values: readonly T[]) => Refute<T>`

  Returns failure if value doesn't strictly equal any of provided `values`.

* `or: <Ts extends (Primitive | Refute<unknown>)[]>(...as: Ts) => Refute<Lifted<Ts[number]>>`

* `partial: <T extends Record<string, Primitive | Refute<unknown>>>(kvs: T) => (value: unknown) => Result<{ [k in keyof T]?: Lifted<T[k]>; }>`

* `positive: Refute<number>`

  Returns confirms positive number.

* `predicate: <T>(a: Refute<T>) => (value: unknown) => value is T`

  Combinator returning refute result as predicate.

* `reason: <T>(a: Refute<T>) => (value: unknown) => string`

  Combinator returning refute reason or `undefined`.

* `record: <K extends string | number | symbol, V>(k: Refute<K>, v: Refute<V>) => Refute<Record<K, V>>`

* `regexp: (re: RegExp) => Refute<string>`

* `safeInteger: Refute<number>`

  Returns confirms safe integer.

* `safeReason: <T>(a: Refute<T>) => (value: unknown) => string`

  Combinator returning refute reason without interpolating value or `undefined`.

* `strftime: (f: string) => Refute<string>`

* `string: Refute<string>`

  Returns refute for `string` type.

* `symbol: Refute<symbol>`

  Returns refute for `symbol` type.

* `tuple: <T extends Refute<unknown>[]>(...as: T) => Refute<{ [I in keyof T]: Refuted<T[I]>; }>`

* `undefined: Refute<undefined>`

  Returns refute for `undefined` type.

* `undefinedOr: <T>(a: Refute<T>) => Refute<T>`

* `unique: <T>(a: Refute<T>, f?: (value: T) => Primitive) => (values: unknown) => Result<T[]>`

  Returns confirmation of an unique array.

# Usage

```bash
npm i -E @prelude/refute
```

```ts
import * as $ from '@prelude/refute'

const refute = $.object({
  foo: $.string,
  bar: $.number
})

const predicate = $.predicate(refute)

const assert = $.assert(refute)

const value = JSON.parse('...')
if (predicate(value)) {
  // value is { foo: string, bar: number }
}

const value_ = assert(value)
// value_ is { foo: string, bar: number }
// throws if not.

console.log($.reason(refute)({ bar: 'a' }))
// Invalid value at key bar, expected number, got a.
```

# Shared core and deliberate differences

Every check is implemented once in [`@prelude/validation`](../validation) and shared with `@prelude/assert` and `@prelude/predicate`; this package renders the structured failure into `Fail { status: 'refuted', reason, received }`, where `reason` spells the path (`at key a, at index 1, expected number`) and `received` is the innermost failing value. `predicate`, `assert`, `reason` and `safeReason` interpret a refute in the other modes. Built-in refutes carry their core validator, so containers compose structurally; a hand-written `Refute` is adapted from its `Fail`.

The three packages accept exactly the same values (`packages/refute/src/matrix.test.ts` checks that). Where they describe a failure differently, it is deliberate and kept for compatibility:

- a duplicate in `unique` is `duplicate value at index 1` here, `.1 ... a unique value` in assert;
- extra keys are named in words (`has unexpected extra key b`, `unexpected key b` for `exactPartial`), assert puts the first one in the path (`.b ... no extra keys`);
- a failing `record` key is `key, expected ...`, assert names it (`.a1 ...`);
- `nullOr`/`undefinedOr`/`nullishOr` prefix `was not null, ` here and suffix ` or null` in assert (only for a top-level failure there);
- `strftime` reports `received: { value, index }`;
- `predicate` takes the value first in `record`.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
