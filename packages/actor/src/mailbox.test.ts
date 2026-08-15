import * as Actor from './index.js'
import { deferred, tick } from './test.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('a bounded mailbox applies backpressure to send', async () => {
  const gate = deferred()
  const processed: number[] = []
  const actor = Actor.of(() => null, async (message: number) => {
    await gate.promise
    processed.push(message)
  }, { cap: 1 })

  const sends = [ 1, 2, 3 ].map(value => {
    let settled = false
    const promise = actor.send(value).then(() => { settled = true })
    return { promise, get settled() { return settled } }
  })
  await tick()
  // 1 is in flight, 2 fills the single slot, 3 waits for room.
  assert.deepEqual(sends.map(send => send.settled), [ true, true, false ])
  assert.equal(actor.pending, 2)

  gate.resolve()
  await Promise.all(sends.map(send => send.promise))
  await actor.stop()
  assert.deepEqual(processed, [ 1, 2, 3 ])
})

await test('senders blocked on a full mailbox are rejected and dead-lettered on kill', async () => {
  const gate = deferred()
  const dead: number[] = []
  const actor = Actor.of(() => null, async (_: number) => { await gate.promise }, {
    cap: 0,
    onDeadLetter: message => dead.push(message)
  })

  void actor.send(1)
  await tick()
  const blocked = actor.send(2)
  await tick()
  assert.equal(actor.pending, 1)

  const killing = actor.kill()
  await assert.rejects(blocked, (error: unknown) => error instanceof Actor.ActorError && error.code === 'killed')
  assert.deepEqual(dead, [ 2 ])
  gate.resolve()
  await killing
})

await test('senders blocked on a full mailbox are rejected on graceful stop', async () => {
  const gate = deferred()
  const processed: number[] = []
  const actor = Actor.of(() => null, async (message: number) => {
    await gate.promise
    processed.push(message)
  }, { cap: 1 })

  void actor.send(1)
  void actor.send(2)
  await tick()
  const blocked = actor.send(3)
  await tick()
  const stopping = actor.stop()
  await assert.rejects(blocked, (error: unknown) => error instanceof Actor.ActorError && error.code === 'stopped')
  gate.resolve()
  await stopping
  assert.deepEqual(processed, [ 1, 2 ], 'buffered messages are still processed')
})

await test('a rendezvous mailbox (cap 0) hands each message straight to the handler', async () => {
  const gate = deferred()
  const actor = Actor.of(() => null, async (message: number) => {
    await gate.promise
    return message
  }, { cap: 0 })

  const first = actor.ask(1)
  await tick()
  let secondEnqueued = false
  const second = actor.send(2).then(() => { secondEnqueued = true })
  await tick()
  assert.equal(secondEnqueued, false)
  gate.resolve()
  assert.equal(await first, 1)
  await second
  assert.equal(secondEnqueued, true)
  await actor.stop()
})

await test('pending reflects the mailbox depth', async () => {
  const gate = deferred()
  const actor = Actor.of(() => null, async (_: number) => { await gate.promise })
  assert.equal(actor.pending, 0)
  void actor.send(1)
  void actor.send(2)
  void actor.send(3)
  await tick()
  assert.equal(actor.pending, 2)
  gate.resolve()
  await actor.stop()
  assert.equal(actor.pending, 0)
})
