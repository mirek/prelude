# Fs module

# Usage

```bash
npm i -E @prelude/fs
```

```ts
import * as Fs from '@prelude/fs'
```

## Depth-first traversal

```ts
for await (const entry of Fs.dfs('/workspace')) {
  console.log(entry.path)
}
```

`dfs()` yields entries in deterministic name order. Directory symbolic links are followed by default, but each canonical directory target is traversed only once, so cycles and duplicate aliases terminate. Dangling links are yielded and not followed.

Links that resolve outside the requested root are yielded but not traversed by default:

```ts
Fs.dfs('/workspace', () => true, {
  followLinks: true,
  allowOutsideRoot: false
})
```

Set `followLinks: false` to inspect links without entering them. Set `allowOutsideRoot: true` only when traversal through external directory links is intentional. The `recurse(entry)` callback is evaluated before any directory or link is entered.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
