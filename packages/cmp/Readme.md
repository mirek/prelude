# Summary

## String comparision result

Strict comparision result `-1 | 0 | 1` is used instead of arbitrary `number`.

This preserves soundness in contrast to wide `number` type which includes `NaN` (also to lesser extent `-Infinity`, `Infinity` and `-0` could affect soundness).

Similarly to languages like C using `a - b` as number comparision should be discouraged as it can create underflow issues. Ie. comparision result of `Int32Array` elements can't be stored as `a - b` result in `Int32Array` as it would require 33 bits of storage to correctly represent this result (ie. `new Int32Array([ -2147483648 - 1 ]) // Int32Array(1) [ 2147483647 ]`).

Narrow, low cardinality, precise type `-1 | 0 | 1` is easier to store, match on and use in combinator functions and in general. It promotes soundness and avoids potential bugs on edge cases.

# Cmp module

* `array: <T>(cmp: Cmp<T>) => (as: T[], bs: T[]) => R`

  Compares arrays element-wise up to common length.

  If all are equal then returns comparision result on array lengths.

* `ascending: <T>(cmp: Cmp<T>) => t<T>`

  Maps comparision function to ascending predicate.

* `chain: <T>(...cmps: Cmp<T>[]) => Cmp<T>`

  Returns comparision function based on provided list of comparisions where first non-equal result is returned.

* `collator: (collator_: Collator) => (a: string, b: string) => R`

  Returns collator based string comparision function.

* `curry: <T>(cmp: Cmp<T>, a: T, position: 'lhs' | 'rhs' = 'lhs') => Cmp1<T>`

  Returns curried comparision function by prefilling left hand side.

* `descending: <T>(cmp: Cmp<T>) => t<T>`

  Maps comparision function to descending predicate.

* `epsilon: (a: number, b: number, epsilon_?: number) => boolean`

  Returns `true` if the difference between `a` and `b` is within epsilon (defaults to `Number.EPSILON`), `false` otherwise.

* `equal: <T>(cmp: Cmp<T>) => (a: T, b: T) => boolean`

  Returns predicate function returning `true` if elements are equal, `false` otherwise.

* `every: <T>(f: t<T>) => (as: T[]) => boolean`

* `locale: (locales?: string | string[], options?: CollatorOptions) => (a: string, b: string) => R`

  Returns locale aware string comparision function.

* `map: <T, U>(cmp: Cmp<U>, f: (value: T) => U) => (a: T, b: T) => R`

  Returns composed comparision function from provided comparision and value mapping.

* `max: <T>(cmp: Cmp<T>, first: T, ...rest: T[]) => T`

  Returns maximum element from provided list of arguments.

* `min: <T>(cmp: Cmp<T>, first: T, ...rest: T[]) => T`

  Returns minimum element from provided list of arguments.

* `negate: <T>(f: t<T>) => (a: T, b: T) => boolean`

* `nonAscending: <T>(cmp: Cmp<T>) => t<T>`

  Maps comparision function to non-ascending predicate.

* `nonDescending: <T>(cmp: Cmp<T>) => t<T>`

  Maps comparision function to non-descending predicate.

* `nullish: Cmp<unknown>`

  Returns nullish comparision function; nullish value is considered lower than non-nullish.

* `nullishOr: <T>(cmp: Cmp<T>) => (a: T, b: T) => R`

  Returns composed non-nullish comparision function as nullish-handling function, nullish values are considered lower than non-nullish values.

* `null: Cmp<unknown>`

  Returns `null` comparision function; `null` value is considered lower than non-`null`.

* `nullOr: <T>(cmp: Cmp<T>) => (a: null | T, b: null | T) => R`

  Returns composed non-nullable comparision function as null-handling function, `null` values are considered lower than non-`null` values.

* `number: (a: number, b: number) => R`

  Returns number comparision function.

* `ofGt: <T>(gt: (a: T, b: T) => boolean) => (a: T, b: T) => R`

  Returns comparision function from greater-than function.

* `ofLt: <T>(lt: (a: T, b: T) => boolean) => (a: T, b: T) => R`

  Returns comparision function from lower-than function.

* `Predicate` module

* `reversed: <T>(f: Cmp<T>) => Cmp<T>`

  Returns reversed comparision of `f`.

* `sign: (value: number) => R`

  Returns sign of a number.

  Throws {TypeError} if `value` is `NaN`.

* `string: Cmp<string>`

  Returns string comparision function.

# Usage

```bash
npm i -E @prelude/cmp
```

```ts
import * as Cmp from '@prelude/cmp'

console.log([
  'world',
  'hello'
].sort(Cmp.string))
// [ 'hello', 'world' ]
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
