# Predicate combinators

# Usage

```bash
npm i -E @prelude/predicate
```

```ts
import * as $ from '@prelude/predicate'

ws.on('message', (msgString: string) => {
  const msg = JSON.parse(msgString)
  if (!$.object({ method: $.string, params: $.tuple($.number) })(msg)) {
    console.error('Invalid msg.', msg)
    return
  }

  // `method` has `string` type here.
  const { method, params } = msg
  console.log({ method, params })
})
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
