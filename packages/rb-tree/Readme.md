# Red-black tree module

Red-black tree based on:
- [Chris Okasaki. Red-black trees in a functional setting. J. Funct. Program., 9(4):471–477, 1999.](https://www.cs.tufts.edu/comp/150FP/archive/chris-okasaki/redblack99.pdf)
- [Kimball Germane and Matthew Might (2014). "Deletion: The curse of the red-black tree." Journal of Functional Programming, 24(4), pp 423-433. July 2014.](https://matt.might.net/papers/germane2014deletion.pdf)

Modifications include:
1. keeping track of number elements to support multiset (aka. bag)
2. keeping track of number of elements in children – to answer range queries on counts (ie. percentile on multiset)

Keeping track of those counts doesn't increase complexity of operations.
This is due to functional/immutable implementation.
Updating counts doesn't require any traversal.
Node creation has to keep sum of their immediate children, which is constant time operation.

# Usage

```bash
npm i -E @prelude/rb-tree
```

```ts
import * as RbTree from '@prelude/rb-tree'
import * as Cmp from '@prelude/cmp'

const rb = RbTree.of(Cmp.string, (_: string) => _)
RbTree.insert(rb, 'foo')
RbTree.insert(rb, 'bar')
console.log(RbTree.has(rb, 'foo')) // true
console.log(RbTree.has(rb, 'baz')) // false
for (const _ of RbTree.each(rb)) {
  console.log(_)
}
// bar
// foo
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
