# Supervisor module

Restart strategies and restart limits for [`@prelude/actor`](../actor), in the
spirit of Erlang/OTP supervisors.

- `one-for-one` restarts the failing child; `all-for-one` restarts every child;
  `rest-for-one` restarts the failing child and those started after it.
- Restarts happen in place (`Actor.restart`): mailboxes and references survive.
- More than `maxRestarts` restarts within `window` ms makes the supervisor give
  up: it escalates to its own supervisor if it has one, otherwise it kills the
  remaining children and fails with a `SupervisorError`.
- Supervisors nest: a supervisor is itself a supervisable child.

# Usage

```bash
npm i -E @prelude/supervisor
```

```ts
import * as Supervisor from '@prelude/supervisor'

const supervisor = Supervisor.of({ strategy: 'one-for-one', maxRestarts: 3, window: 5000 })

const worker = supervisor.spawn({
  name: 'worker',
  init: () => ({ processed: 0 }),
  receive: (job: Job, state) => {
    state.processed += 1
    return process(job)          // a throw here restarts the worker with fresh state
  }
})

supervisor.supervise(existingActor)     // adopt an actor created elsewhere

await supervisor.stop()                 // stops children in reverse start order
```

Children escalate to the supervisor through their failure policy — the default
`'escalate'` directive — so a child with a local `onError` that returns
`'resume'` never reaches it.

## Nesting

```ts
const root = Supervisor.of({ strategy: 'one-for-one', maxRestarts: 1 })
const workers = root.supervise(Supervisor.of({ strategy: 'all-for-one', maxRestarts: 5 }))
workers.spawn(…)
```

When `workers` exhausts its restart budget it asks `root`; a `'restart'` from
`root` restarts every worker and resets the budget, a `'stop'` kills the workers
and fails `workers`, which in turn counts against `root`'s budget.

## Deterministic tests

Pass `now` to control the restart window:

```ts
let time = 0
const supervisor = Supervisor.of({ maxRestarts: 2, window: 1000, now: () => time })
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
