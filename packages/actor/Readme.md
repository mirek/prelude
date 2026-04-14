# Actor module

Minimal actor built on top of [`@prelude/channel`](../channel). An actor owns a
state value and sequentially processes messages from its inbox via a handler.

# Usage

```bash
npm i -E @prelude/actor
```

```ts
import * as Actor from '@prelude/actor'

type Message =
  | { type: 'inc', value: number }
  | { type: 'dec', value: number }

const counter =
  Actor.of({ counter: 0 }, async (state, message: Message) => {
    switch (message.type) {
      case 'inc':
        state.counter += message.value
        break
      case 'dec':
        state.counter -= message.value
        break
    }
  })

void Actor.run(counter)

await Actor.send(counter, { type: 'inc', value: 5 })
await Actor.send(counter, { type: 'dec', value: 2 })

await Actor.stop(counter)

console.log(counter.state.counter) // 3
```

# License

See [License.md](./License.md).
