import * as Actor from './index.js'
import { deferred, tick } from './test.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

type Counter =
  | { type: 'inc', value: number }
  | { type: 'dec', value: number }
  | { type: 'get' }

function counter() {
  return Actor.of(() => ({ count: 0 }), (message: Counter, state) => {
    switch (message.type) {
      case 'inc':
        state.count += message.value
        return state.count
      case 'dec':
        state.count -= message.value
        return state.count
      case 'get':
        return state.count
    }
  })
}

await test('counter: send mutates state, ask returns the reply, stop drains', async () => {
  const actor = counter()
  assert.equal(actor.status, 'running')
  assert.equal(actor.state.count, 0)

  await actor.send({ type: 'inc', value: 5 })
  await actor.send({ type: 'inc', value: 3 })
  assert.equal(await actor.ask({ type: 'dec', value: 2 }), 6)
  assert.equal(await actor.ask({ type: 'get' }), 6)

  await actor.stop()
  assert.equal(actor.status, 'stopped')
  assert.equal(actor.state.count, 6)
  assert.equal(actor.error, undefined)
  await actor.done
})

await test('constructor form infers state and message types', async () => {
  const actor = new Actor.Actor({
    name: 'counter',
    init: () => ({ count: 0 }),
    receive: (message: Counter, state) => {
      if (message.type === 'inc') {
        state.count += message.value
      }
      return state.count
    }
  })
  assert.equal(actor.name, 'counter')
  assert.equal(await actor.ask({ type: 'inc', value: 2 }), 2)
  await actor.stop()
})

await test('stateless actor defaults its state to undefined', async () => {
  const seen: string[] = []
  const actor = new Actor.Actor({
    receive: (message: string, state) => {
      assert.equal(state, undefined)
      seen.push(message)
    }
  })
  await actor.send('a')
  await actor.stop()
  assert.deepEqual(seen, [ 'a' ])
  assert.equal(actor.state, undefined)
})

await test('messages are processed one at a time in arrival order', async () => {
  const gates = Array.from({ length: 4 }, () => deferred())
  const started: number[] = []
  const finished: number[] = []
  const actor = Actor.of(() => null, async (value: number) => {
    started.push(value)
    await gates[value].promise
    finished.push(value)
    return value * 10
  })

  const replies = [ 0, 1, 2, 3 ].map(value => actor.ask(value))
  await tick()
  assert.deepEqual(started, [ 0 ])
  assert.equal(actor.pending, 3)

  gates[2].resolve()
  gates[3].resolve()
  await tick()
  assert.deepEqual(started, [ 0 ], 'later gates do not let later messages jump the queue')

  gates[0].resolve()
  assert.equal(await replies[0], 0)
  await tick()
  assert.deepEqual(started, [ 0, 1 ])

  gates[1].resolve()
  assert.deepEqual(await Promise.all(replies), [ 0, 10, 20, 30 ])
  assert.deepEqual(finished, [ 0, 1, 2, 3 ])
  assert.equal(actor.pending, 0)
  await actor.stop()
})

await test('send resolves when the message is enqueued, not when it is processed', async () => {
  const gate = deferred()
  const processed: number[] = []
  const actor = Actor.of(() => null, async (value: number) => {
    await gate.promise
    processed.push(value)
  })

  await actor.send(1)
  await actor.send(2)
  assert.deepEqual(processed, [])

  gate.resolve()
  await actor.stop()
  assert.deepEqual(processed, [ 1, 2 ])
})

await test('handler context exposes the actor and a live signal', async () => {
  let seen: Actor.Context<string, null> | undefined
  const actor = Actor.of(() => null, (_: string, __, context) => {
    seen = context
  })
  await actor.send('x')
  await tick()
  assert.equal(seen?.self, actor)
  assert.equal(seen?.signal.aborted, false)
  await actor.stop()
  assert.equal(seen?.signal.aborted, false, 'graceful stop does not abort the signal')
})

await test('init runs synchronously in the constructor and its errors propagate', () => {
  let calls = 0
  Actor.of(() => { calls += 1; return null }, () => {})
  assert.equal(calls, 1)
  assert.throws(
    () => Actor.of(() => { throw new Error('boom') }, () => {}),
    /boom/
  )
})

await test('invalid mailbox capacity is rejected', () => {
  for (const cap of [ -1, 1.5, NaN, -Infinity ]) {
    assert.throws(
      () => Actor.of(() => null, () => {}, { cap }),
      (error: unknown) => error instanceof Actor.ActorError && error.code === 'invalid'
    )
  }
})

await test('await using stops the actor at the end of the block', async () => {
  let actor!: Actor.Actor<string, null, void>
  {
    await using scoped = Actor.of(() => null, (_: string) => {})
    actor = scoped
    await actor.send('hello')
    assert.equal(actor.status, 'running')
  }
  assert.equal(actor.status, 'stopped')
})

await test('an unobserved failure does not surface as an unhandled rejection', async () => {
  const actor = Actor.of(() => null, () => { throw new Error('boom') })
  void actor.send('x')
  await tick()
  assert.equal(actor.status, 'failed')
  // If the runtime reported an unhandled rejection the test process would fail;
  // reaching this line with a failed actor and no listener attached is the assertion.
})
