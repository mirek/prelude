# Progress module

# Usage

```bash
npm i -E @prelude/progress
```

```ts
import * as Progress from '@prelude/progress'
```

```ts
const progress = Progress.of(2).start()
progress.update({ index: 0, target: 0.5, text: 'downloading' })
progress.stop()
```

`start(fps, { signal })` stops rendering when the signal aborts, and a `Progress` is disposable (`using progress = Progress.of(1).start()`).

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
