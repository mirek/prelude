# @prelude/testing

Workspace-internal (private, not published) helpers for property-style tests: a seeded pseudo-random generator and `checkTrace`, which generates operation traces, replays them against a data structure and its reference model, and on failure shrinks the trace to a minimal reproduction that is reported together with the seed.

# Usage

Not published; workspace packages depend on it as a `devDependency` (`pnpm add -D @prelude/testing@workspace:*`).

```ts
import * as Testing from '@prelude/testing'

await Testing.checkTrace({
  seed: 42,
  trials: 100,
  length: 40,
  op: rng => ({ key: rng.int(8), remove: rng.bool(0.3) }),
  run: ops => {
    // rebuild the structure and its model from scratch, applying every op and
    // checking invariants after each one; throw on the first violation
  }
})
```

Set `SLOW_TESTS=<factor>` (for example `SLOW_TESTS=20`) to multiply the trial counts; the scheduled stress workflow does this weekly.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
