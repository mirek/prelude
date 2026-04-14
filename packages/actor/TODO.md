# Actor TODO

Roadmap from the current minimal `of/run/send/stop` toward a production-ready
actor. Phases are ordered by value-per-effort; each phase should leave the
package shippable.

## Phase 1 — Pragmatic core (next)

The smallest set that turns the toy into something usable in real code.

- [ ] `ask(actor, message, { timeout, signal })` — request/reply with
      correlation id, timeout, and `AbortSignal` support. Handler can return a
      reply value; `ask` rejects on timeout or abort.
- [ ] Error isolation + `onError` hook — handler throws no longer kill the
      run loop. Default: log + dead-letter. Hook can override.
- [ ] Bounded mailbox with overflow policy — `cap` + `overflow: 'block' |
      'drop-newest' | 'drop-oldest' | 'fail'`. Default stays unbounded for
      back-compat.
- [ ] `AbortSignal` threaded into handler — second arg or context object, so
      handlers can cooperatively cancel on stop/kill.
- [ ] Dead-letter hook — `onDeadLetter(message, reason)` for dropped/failed
      messages (overflow, post-stop sends, handler errors, ask timeouts).
- [ ] Test probe — `probe()` helper that returns an actor recording every
      message for assertions; virtual-clock friendly.

Exit criteria: counter example still works unchanged; `ask` round-trip test;
overflow policy test; handler-throws test doesn't crash the loop.

## Phase 2 — Lifecycle & supervision

Make failure recoverable rather than just survivable.

- [ ] Explicit states: `idle | running | stopping | stopped | crashed`, with
      idempotent transitions and a `stopped` promise.
- [ ] `kill(actor)` — immediate stop, drops inbox to dead-letter, aborts
      in-flight handler via signal.
- [ ] Graceful `stop({ drainTimeout })` — drain then force-kill on timeout.
- [ ] Restart strategies — `restart: 'never' | 'on-error' | { max, windowMs,
      backoff }`. Fresh state via `init()` factory rather than captured value.
- [ ] Supervisor actor — owns children, applies `one-for-one` /
      `rest-for-one` / `all-for-one` strategies. Parent/child links.
- [ ] Lifecycle hooks — `onStart`, `onStop`, `onCrash`, `onRestart`.

Exit criteria: crash-restart test with backoff; supervisor test with
one-for-one across 3 children.

## Phase 3 — Messaging patterns

Compose actors into systems without hand-rolling plumbing every time.

- [ ] Actor refs — opaque `Ref<M>` handle (send/ask only) distinct from the
      actor object (which exposes state + lifecycle). Prevents callers from
      poking at `state` directly.
- [ ] Registry — named actors, `lookup(name)`, scoped to a `System`.
- [ ] Routers — `roundRobin`, `broadcast`, `consistentHash`, `random` over a
      pool of child actors. Router is itself an actor-ref.
- [ ] Pub/sub — topic bus with `subscribe` / `publish`. Built on routers.
- [ ] Pipe / forward — `pipe(from, to)`, `forward(actor, message)` preserving
      original sender for `ask`.
- [ ] Become / behavior switching — handler can return a new handler to
      implement state machines without `switch`-on-phase.

Exit criteria: round-robin router test; pub/sub fan-out test; ping-pong via
`ask` + `forward`.

## Phase 4 — Observability

You can't run what you can't see.

- [ ] Actor id + optional name, propagated through hooks and errors.
- [ ] Metrics surface — `queueDepth`, `processed`, `errors`,
      `handlerLatencyMs` (histogram or just running stats). Pull-based, no
      hard dep on a metrics lib.
- [ ] `onMessage(before/after)` hook for tracing / structured logging.
- [ ] `onIdle` — fires when mailbox drains; useful for tests and shutdown.
- [ ] Dead-letter queue inspection — iterate or drain the DLQ.

Exit criteria: metrics snapshot test; tracing hook fires in order
before/after per message.

## Phase 5 — Correctness & ergonomics

Sharp edges that bite once real users show up.

- [ ] Reentrancy guard — handler cannot be invoked concurrently on the same
      actor; document FIFO-per-sender ordering.
- [ ] Typed dispatch helper — `match<M>({ type1: fn, type2: fn })` with
      exhaustiveness check, so users don't hand-roll `switch` + `never`.
- [ ] Immutable-state variant — `handler(state, msg) => newState | Promise<
      newState>`, alongside the mutable variant. Pick per-actor.
- [ ] Unhandled-message policy — `throw | log | deadLetter` (default
      deadLetter).
- [ ] Per-message timeout independent of `ask`.

Exit criteria: exhaustiveness test (TS compile error on missing case);
immutable counter example.

## Phase 6 — Testing kit

Make actor code as easy to test as pure functions.

- [ ] `TestKit.createProbe()` — probe actor with `expectMessage(pred,
      timeout)`, `expectNoMessage(windowMs)`, `receiveN(n)`.
- [ ] Virtual clock — swap `setTimeout` / `Date.now` so timeout tests are
      deterministic. Likely lives in a sibling package.
- [ ] Deterministic scheduler — single-stepping the run loop for property
      tests.
- [ ] Snapshot helpers for state + inbox.

Exit criteria: probe-based test for the ping-pong example; timeout test
runs in <5ms wall clock.

## Phase 7 — Persistence (optional, event-sourced actors)

Only if there's demand — this is a big surface.

- [ ] Journal interface — append events, load by actor id.
- [ ] Snapshot interface — periodic state snapshots with sequence number.
- [ ] `PersistentActor` variant — replay on start, persist on handler
      success, fail-and-restart on persist error.
- [ ] In-memory + filesystem journal reference implementations (via
      `@prelude/fs`).

Exit criteria: crash-and-recover test that replays events and matches
pre-crash state.

## Non-goals (for now)

- Distributed / remote actors (network transport, serialization, cluster
  membership). Out of scope until the local story is solid.
- Location transparency. Same reason.
- Custom scheduler beyond what the JS event loop provides.
