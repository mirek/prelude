# Remote clock module

# Usage

```bash
npm i -E @prelude/remote-clock
```

```ts
import * as RemoteClock from '@prelude/remote-clock'
```

```ts
const clock = RemoteClock.of()
// ...merge measurements with RemoteClock.record(clock, before, remote, after)
for await (const now of RemoteClock.midSeconds(clock, { signal })) {
  console.log(new Date(now).toISOString()) // once per remote second, mid-second
}
```

`midSeconds(clock, { signal })` and `midSecondsInterval(clock, callback, { signal })` stop on abort: the pending timer is cleared and the generator throws `signal.reason`; `midSecondsInterval` also returns a stop function.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
