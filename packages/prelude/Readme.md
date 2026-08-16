# Prelude module

Low level, shared primitives for `@prelude/*` packages: `pipe`/`pipe0` for left-to-right function composition and the `IntersectionOfUnion` utility type.

# Usage

```bash
npm i -E @prelude/prelude
```

```ts
import { pipe } from '@prelude/prelude'

const slug = pipe('  Hello World ', s => s.trim(), s => s.toLowerCase(), s => s.replace(/\s+/g, '-'))
// 'hello-world'
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
