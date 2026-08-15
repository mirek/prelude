# Actor TODO

Outstanding work only. The `of/run/send/stop` toy has been replaced by the
`Actor` class (send/ask/stop/kill/restart, failure directives, bounded
mailboxes, dead letters, abort signals), `@prelude/supervisor` (one-for-one /
all-for-one / rest-for-one, restart limits, escalation) and
`@prelude/remote-actor` (send/ask over any frame transport). Phases below are
what is left, ordered by value-per-effort.

## Phase 1 — Messaging patterns

- [ ] Registry — named actors, `lookup(name)`, scoped to a `System`.
- [ ] Routers — `roundRobin`, `broadcast`, `consistentHash`, `random` over a
      pool of child actors. Router is itself a `Ref`.
- [ ] Pub/sub — topic bus with `subscribe` / `publish`. Built on routers.
- [ ] Pipe / forward — `pipe(from, to)`, `forward(actor, message)` preserving
      the original asker.
- [ ] Become / behavior switching — handler can return a new handler to
      implement state machines without `switch`-on-phase.

## Phase 2 — Observability

- [ ] Metrics surface — `processed`, `errors`, `handlerLatencyMs` (running
      stats) alongside the existing `pending` and `restarts`.
- [ ] `onMessage(before/after)` hook for tracing / structured logging.
- [ ] `onIdle` — fires when the mailbox drains; useful for tests and shutdown.
- [ ] Dead-letter queue inspection — iterate or drain the DLQ.

## Phase 3 — Correctness & ergonomics

- [ ] Typed dispatch helper — `match<M>({ type1: fn, type2: fn })` with
      exhaustiveness check, so users don't hand-roll `switch` + `never`.
- [ ] Immutable-state variant — `receive(message, state) => newState`,
      alongside the mutable variant. Pick per-actor.
- [ ] Per-message timeout independent of `ask`.
- [ ] Bounded mailbox overflow policies beyond blocking —
      `'drop-newest' | 'drop-oldest' | 'fail'`.
- [ ] Restart backoff in `@prelude/supervisor` (Erlang has none; Akka's
      `BackoffSupervisor` is the reference).

## Phase 4 — Testing kit

- [ ] `TestKit.createProbe()` — probe actor with `expectMessage(pred,
      timeout)`, `expectNoMessage(windowMs)`, `receiveN(n)`.
- [ ] Deterministic scheduler — single-stepping the run loop for property
      tests.

## Phase 5 — Remote

- [ ] Ask cancellation frames so a timed-out/aborted `ask` can be dropped from
      the remote mailbox before it is processed.
- [ ] Ready-made transports: WebSocket, Node `Worker` (`on('message')` rather
      than `addEventListener`), `BroadcastChannel`.
- [ ] Optional message codec (superstruct/zod-style validation at the boundary).

## Phase 6 — Persistence (optional, event-sourced actors)

Only if there's demand — this is a big surface.

- [ ] Journal interface — append events, load by actor id.
- [ ] Snapshot interface — periodic state snapshots with sequence number.
- [ ] `PersistentActor` variant — replay on start, persist on handler
      success, fail-and-restart on persist error.
- [ ] In-memory + filesystem journal reference implementations (via
      `@prelude/fs`).

## Non-goals (for now)

- Cluster membership, discovery, failure detection across nodes.
- Custom scheduler beyond what the JS event loop provides.
