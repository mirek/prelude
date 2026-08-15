# Actor module

An actor owns a piece of state and processes messages from its mailbox one at a
time. Built on [`@prelude/channel`](../channel).

- `send` enqueues, `ask` enqueues and awaits the handler's reply.
- Handler errors go through a failure policy: `resume`, `restart`, `stop` or
  `escalate` to a supervisor ([`@prelude/supervisor`](../supervisor)).
- Bounded mailboxes apply backpressure to senders.
- `stop` drains, `kill` aborts; both are idempotent. `done` reports the fate.
- Actors are location transparent through the `Ref` interface
  ([`@prelude/remote-actor`](../remote-actor)).

# Usage

```bash
npm i -E @prelude/actor
```

```ts
import * as Actor from '@prelude/actor'

type Message =
  | { type: 'inc', value: number }
  | { type: 'get' }

const counter = Actor.of(() => ({ count: 0 }), (message: Message, state) => {
  switch (message.type) {
    case 'inc':
      state.count += message.value
      return state.count
    case 'get':
      return state.count
  }
})

await counter.send({ type: 'inc', value: 5 })
console.log(await counter.ask({ type: 'inc', value: 2 })) // 7
console.log(await counter.ask({ type: 'get' }))           // 7

await counter.stop()
console.log(counter.status, counter.state.count)         // stopped 7
```

The same actor with the constructor form:

```ts
const counter = new Actor.Actor({
  name: 'counter',
  init: () => ({ count: 0 }),
  receive: (message: Message, state) => { /* … */ }
})
```

## Lifecycle

An actor starts processing as soon as it is created.

| | |
| --- | --- |
| `status` | `running` → `stopping` → `stopped` \| `failed` |
| `stop()` | Refuse new messages, process the queue, terminate. Resolves once terminated. |
| `kill(reason?)` | Abort the in-flight handler's `signal`, drop the queue as dead letters, terminate. |
| `restart()` | Re-initialise state via `init`, keeping the mailbox and every reference. |
| `done` | Resolves after `stop`/`kill`; rejects with the failure when the actor `failed`. |
| `await using` | Actors are async-disposable: `await using actor = Actor.of(…)` stops it at block exit. |

## Failure policy

When the handler throws, `ask` rejects with the error and the actor decides what
to do next:

```ts
const worker = Actor.of(() => ({ retries: 0 }), handler, {
  onError: (error, message, self) =>
    error instanceof TransientError ? 'resume' :   // drop the message, keep the state
    self.restarts < 3 ? 'restart' :                // fresh state, same mailbox
    'escalate'                                     // ask the supervisor; without one: 'stop'
})
```

The default is `'escalate'`; an unsupervised actor therefore fails on the first
unhandled error, dead-letters the rest of its mailbox and rejects `done`.
`onError` is awaited, so it may be asynchronous (annotate the return type as
`Promise<Directive>`: TypeScript widens literal returns of async arrows when the
contextual type is `T | Promise<T>`).

## Mailbox

```ts
Actor.of(init, receive, { cap: 100 })   // send/ask wait when 100 messages are queued
Actor.of(init, receive, { cap: 0 })     // rendezvous: each message is handed straight to the handler
```

Messages that were accepted but will never be processed — dropped by `kill`, by
a failure, or refused because the actor was not running — are reported to
`onDeadLetter(message, reason, self)`.

## Handler context

```ts
Actor.of(init, async (message, state, { self, signal }) => {
  await fetch(url, { signal })     // aborted by kill, failure or restart
  await self.send(nextMessage)     // self has send/stop/kill/restart, but no ask
  if (done) {
    self.stop()                    // takes effect once this handler returns
  }
})
```

`self` has no `ask`, and its `stop`/`kill`/`restart` return nothing: the handler
is the in-flight work those calls would have to wait for, so a promise there
could never resolve. They take effect once the handler (or hook) returns.

## `Ref`

`Ref<M, R>` is `{ name?, send, ask }`: hand it to code that should talk to the
actor without managing its lifecycle. `Actor` and `RemoteActor` both implement it.

# License

See [License.md](./License.md).
