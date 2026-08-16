# WaitGroup module

# Usage

```bash
npm i -E @prelude/wait-group
```

```ts
import WaitGroup from '@prelude/wait-group'

const group = new WaitGroup(2)
const complete = group.wait()

group.done()
group.done()

await complete
```

## Counter and settlement contract

- The constructor, `add(delta)`, and `done(delta)` accept non-negative safe integers only. Invalid arguments throw without changing a healthy group.
- Reaching zero resolves every current waiter. Repeated waits at zero resolve immediately.
- A group that reaches zero can be reused by calling `add()` again.
- Counter underflow and overflow fail atomically: the prior counter is retained, all current waiters reject, and the group enters a terminal failed state.
- `reject(error)` also enters the terminal failed state. The first failure is preserved.
- Future `wait()` calls reject with the original failure, while future `add()` and `done()` calls throw it synchronously.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
