# Set module

# Usage

```bash
npm i -E @prelude/set
```

```ts
import * as Sets from '@prelude/set'
import * as Cmp from '@prelude/cmp'
// ...
Sets.equal(a, b)
Sets.difference(a, b)
Sets.union(a, b)
Sets.intersection(a, b)
Sets.sorted(a, Cmp.number) // sorted array
Sets.shuffled(a)
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
