# @prelude/range-set

Sets of value-carrying ranges over ordered keys (numbers, dates, anything with a comparator). `union`, `intersection` and `difference` merge overlapping ranges and combine their values through a pluggable `Value` merge (`sum`, `min`, `max`, `left`, `right`, ...), keeping the result normalized: sorted, non-overlapping and with adjacent equal-valued ranges joined.

# Usage

```bash
npm i -E @prelude/range-set
```

```ts
import * as RangeSet from '@prelude/range-set'

const r = RangeSet.Range.of

let a: RangeSet.T<number, number> = { ranges: [], key: RangeSet.Key.closed, value: RangeSet.Value.sum }
a = RangeSet.union(a, { ranges: [r(1, 3, 1)] })          // [1..3] = 1
a = RangeSet.union(a, { ranges: [r(2, 5, 1)] })          // [1..1] = 1, [2..3] = 2, [4..5] = 1
a = RangeSet.difference(a, { ranges: [r(0, 1, 0)] })      // [2..3] = 2, [4..5] = 1
```

`Key.closed` treats integer endpoints as inclusive with `next`/`prev` steps of 1; `Key.halfOpen` keeps endpoints as given. Supply your own `Key` (comparator plus `next`/`prev`) for other domains such as `Date`.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
