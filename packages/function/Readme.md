# Function module

# Usage

```bash
npm i -E @prelude/function
```

```ts
import * as F from '@prelude/function'
```

## Cancellation

`sleep`, `timeout`, `eventually` and `throttle` accept `{ signal }` (see the repository README, "Cancellation"): aborting clears the pending timer and rejects with `signal.reason`; `eventually` stops retrying and `throttle` drops its pending trailing call. An attempt or `f` already in flight is left to settle on its own.

```ts
const controller = new AbortController()
setTimeout(() => controller.abort(), 100)
await F.sleep(10_000, { signal: controller.signal }) // rejects after 100 ms with signal.reason
await F.eventually(() => fetch(url, { signal: controller.signal }).then(r => r.ok), { delay: 500, signal: controller.signal })
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
