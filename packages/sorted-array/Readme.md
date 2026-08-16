# Sorted array module

# Usage

```bash
npm i -E @prelude/sorted-array
```

```ts
import * as Sa from '@prelude/sorted-array'
const xs = Sa.strings()
Sa.insert(xs, 'foo')
Sa.insert(xs, 'bar')
Sa.insert(xs, 'baz')
console.log(Sa.hasValue(xs, 'baz'))
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
