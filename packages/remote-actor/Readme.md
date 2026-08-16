# Remote actor module

Talk to an [`@prelude/actor`](../actor) that lives on the other side of a
message boundary — a worker, a `MessagePort`, a socket — through the same
`send`/`ask` interface as a local one.

- `serve(actor, transport)` answers frames from the transport.
- `new RemoteActor(transport)` is a `Ref`: `send`, `ask` (with `timeout` and
  `signal`), `close`.
- Frames are plain data; any transport that can carry JSON or structured clones
  works. `fromPort` adapts MessagePort-like objects, `pair()` connects two ends
  in memory, `channel` multiplexes several actors over one transport.
- Remote handler errors reject `ask` with a `RemoteError` carrying the remote
  error's `name`, `message` and `code`.

# Usage

```bash
npm i -E @prelude/remote-actor
```

Serving side (e.g. inside a worker):

```ts
import * as Actor from '@prelude/actor'
import * as Remote from '@prelude/remote-actor'

const counter = Actor.of(() => ({ count: 0 }), (message: Message, state) => { /* … */ })
Remote.serve(counter, Remote.fromPort(self))
```

Calling side:

```ts
import * as Remote from '@prelude/remote-actor'

const counter = new Remote.RemoteActor<Message, number>(Remote.fromPort(worker))
await counter.send({ type: 'inc', value: 5 })
console.log(await counter.ask({ type: 'get' }, { timeout: 1000 })) // 5
counter.close()
```

Several actors over one connection:

```ts
Remote.serve(users, Remote.channel(port, 'users'))
Remote.serve(orders, Remote.channel(port, 'orders'))

const users = new Remote.RemoteActor(Remote.channel(port, 'users'))
```

## Transport

```ts
interface Transport {
  post(frame: Frame): void | Promise<void>
  subscribe(listener: (frame: Frame) => void): () => void
}
```

Implement it over anything ordered and bidirectional. `RemoteActor` and `serve`
ignore frames they do not understand, so a transport may carry other traffic.

## Semantics

- `send` resolves when the transport has accepted the frame; delivery is not
  acknowledged. A message to a stopped remote actor is dead-lettered there.
- `ask` resolves with the handler's return value or rejects with a
  `RemoteError` (`code: 'remote'`), an `ActorError` (`code: 'timeout'`), the
  abort reason, or a `RemoteError` (`code: 'closed'`) if the client is closed.
- Frames from one client stay in issue order.
- One `RemoteActor` per served actor (or per `channel` key); two clients sharing
  a channel would collide on ask ids.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
