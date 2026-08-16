# Array module

* `at: <T>(values: T[], index: number) => T`

  Returns value at `index`.

  Throws {Error} if index is out of bounds.

* `atClamp: <T>(values: T[], index: number) => T`

  Like `at` but bounds less than zero index to 0 and out of bound to last.

* `bsearch: <T>(values: T[], cmp: Cmp1<T>) => number`

* `clone: <T>(values: T[]) => T[]`

* `Cmp: typeof import("@prelude/cmp")`

* `deleteSwapRandom: <T>(values: T[]) => T`

  Deletes and returns random element. Removed element is replaced by last element.

  Throws {Error} if `values` array is empty.

  Returns deleted element.

* `first: <T>(values: T[]) => T`

  Returns first element of an array.

  Throws if array length is 0.

* `groups: <T, R extends string | number | boolean | symbol>(values: T[], keyOfValue: (value: T) => R) => T[][]`

  Returns values grouped by key (result of `keyOfValue`).

* `indices: (n: number) => number[]`

  Returns array with 0 to n-1 indices.

* `last: <T>(values: T[]) => T`

  Returns last element of an array.

  Throws {Error}

* `maybeAt: <T>(values: T[], index: number) => T`

  Returns value at `index` or `undefined`.

* `maybeFirst: <T>(values: T[]) => T`

  Returns first element of an array or `undefined`.

* `maybeLast: <T>(values: T[]) => T`

  Returns last element of an array or `undefined`.

* `maybeSample: <T>(values: T[]) => T`

  Returns random element or `undefined` if array is empty.

* `atCycle: <T>(values: T[], index: number) => T`

  Like `at` but wraps using modulo on length.

  Throws {Error} if array is empty or index is not a safe integer.

* `nulls: (n: number) => null[]`

  Returns an array of `n` nulls.

* `of: <T>(n: number, valueOrFunction: T | ((index: number) => T)) => T[]`

* `ones: (n: number) => number[]`

* `permutations: <T>(values: T[]) => Generator<T[], any, unknown>`

  Based on [Permutation Generation Methods, Robert Sedgewick](http://homepage.math.uiowa.edu/~goodman/22m150.dir/2007/Permutation%20Generation%20Methods.pdf).

  Returns permutations of an array.

* `randomIndex: (length: number) => number`

* `sample: <T>(values: T[]) => T`

  Returns random element.

  Throws if array is empty.

* `shuffle: <T>(values: T[]) => T[]`

  In-place shuffle.

* `shuffled: <T>(values: T[]) => T[]`

  Returns shuffled array.

* `sort: <T>(values: T[], cmp: t<T>) => T[]`

* `sorted: <T>(values: T[], cmp: t<T>) => T[]`

* `swap: <T>(values: T[], i: number, j: number) => T[]`

  In-place swap elements at index `i` and `j`.

* `swapDeleteAt: <T>(values: T[], index: number) => T`

* `swapDeleteFirst: <T>(values: T[], predicate: (value: T, index: number, values: T[]) => boolean) => T`

* `unique: <T, R extends string | number | boolean | symbol>(values: T[], keyOfValue: (value: T) => R) => T[]`

  Returns unique array.

* `zeroes: (n: number) => number[]`

  Returns an array of `n` zeroes.

# Usage

```bash
npm i -E @prelude/array
```

```ts
import * as A from '@prelude/array'
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
