# Serial queue module

# Usage

```bash
npm i -E @prelude/serial-queue
```

```ts
import * as SerialQueue from '@prelude/serial-queue'
```

```ts
const queue = SerialQueue.of(async (url: string) => (await fetch(url)).text())
const bodies = await Promise.all(urls.map(url => SerialQueue.push(queue, url))) // one fetch at a time, in order
```

## Cancellation

`pushWith(queue, { signal }, ...args)` is `push` with an abort signal: aborting removes the entry from the queue and rejects its promise with `signal.reason`. An entry that is already running keeps running (its task cannot be interrupted) but its result is dropped, exactly like after `rejectAll(queue, err)`, which rejects every entry with `err`.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
