import * as Actor from './index.js'
import { deferred, tick } from './test.js'
import { mock, test } from 'node:test'
import assert from 'node:assert/strict'

await test('ask resolves with the handler return value, sync or async', async () => {
  const actor = Actor.of(() => null, (message: number) =>
    message % 2 === 0 ? message * 2 : Promise.resolve(message * 3))
  assert.equal(await actor.ask(2), 4)
  assert.equal(await actor.ask(3), 9)
  await actor.stop()
})

await test('ask rejects with the handler error and the actor keeps going under resume', async () => {
  const actor = Actor.of(() => null, (message: string) => {
    if (message === 'bad') {
      throw new TypeError('bad message')
    }
    return message.toUpperCase()
  }, { onError: () => 'resume' })

  await assert.rejects(actor.ask('bad'), TypeError)
  assert.equal(await actor.ask('ok'), 'OK')
  assert.equal(actor.status, 'running')
  await actor.stop()
})

await test('ask times out and the message is still processed later', async () => {
  mock.timers.enable({ apis: [ 'setTimeout' ] })
  try {
    const gate = deferred()
    const processed: string[] = []
    const actor = Actor.of(() => null, async (message: string) => {
      await gate.promise
      processed.push(message)
      return message
    })

    const slow = actor.ask('slow', { timeout: 100 })
    const errored = slow.then(() => undefined, (error: unknown) => error)
    mock.timers.tick(99)
    await tick()
    mock.timers.tick(1)
    const error = await errored
    assert.ok(error instanceof Actor.ActorError)
    assert.equal(error.code, 'timeout')
    assert.match(error.message, /100ms/)

    gate.resolve()
    await actor.stop()
    assert.deepEqual(processed, [ 'slow' ], 'timed out asks are not silently dropped from the mailbox')
  } finally {
    mock.timers.reset()
  }
})

await test('ask timer is cleared when the reply arrives first', async () => {
  mock.timers.enable({ apis: [ 'setTimeout' ] })
  try {
    const actor = Actor.of(() => null, (message: string) => message)
    assert.equal(await actor.ask('fast', { timeout: 100 }), 'fast')
    mock.timers.tick(1000)
    await tick()
    await actor.stop()
  } finally {
    mock.timers.reset()
  }
})

await test('ask honours an abort signal before and after enqueueing', async () => {
  const gate = deferred()
  const actor = Actor.of(() => null, async (message: string) => {
    await gate.promise
    return message
  })

  const already = new AbortController()
  already.abort(new Error('already'))
  await assert.rejects(actor.ask('a', { signal: already.signal }), /already/)

  const later = new AbortController()
  const pending = actor.ask('b', { signal: later.signal })
  await tick()
  later.abort(new Error('later'))
  await assert.rejects(pending, /later/)

  gate.resolve()
  await actor.stop()
})

await test('ask abort listener is removed once the ask settles', async () => {
  const controller = new AbortController()
  const actor = Actor.of(() => null, (message: string) => message)
  assert.equal(await actor.ask('x', { signal: controller.signal }), 'x')
  // Aborting afterwards must not throw or affect anything.
  controller.abort()
  assert.equal(await actor.ask('y'), 'y')
  await actor.stop()
})

await test('ask on a stopped actor rejects immediately and is dead-lettered', async () => {
  const dead: [ string, unknown ][] = []
  const actor = Actor.of(() => null, (message: string) => message, {
    onDeadLetter: (message, reason) => dead.push([ message, reason ])
  })
  await actor.stop()
  await assert.rejects(
    actor.ask('late'),
    (error: unknown) => error instanceof Actor.ActorError && error.code === 'stopped'
  )
  assert.equal(dead.length, 1)
  assert.equal(dead[0][0], 'late')
  assert.ok(dead[0][1] instanceof Actor.ActorError)
})

await test('asks queued behind a failure are rejected with the failure', async () => {
  const gate = deferred()
  const actor = Actor.of(() => null, async (message: string) => {
    await gate.promise
    if (message === 'boom') {
      throw new Error('boom')
    }
    return message
  })

  const first = actor.ask('boom')
  const second = actor.ask('after')
  const third = actor.ask('later')
  gate.resolve()

  await assert.rejects(first, /boom/)
  await assert.rejects(second, /boom/)
  await assert.rejects(third, /boom/)
  assert.equal(actor.status, 'failed')
})

await test('a mix of send and ask keeps FIFO order', async () => {
  const seen: number[] = []
  const actor = Actor.of(() => null, (message: number) => {
    seen.push(message)
    return message
  })
  void actor.send(1)
  const two = actor.ask(2)
  void actor.send(3)
  const four = actor.ask(4)
  assert.deepEqual(await Promise.all([ two, four ]), [ 2, 4 ])
  await actor.stop()
  assert.deepEqual(seen, [ 1, 2, 3, 4 ])
})

await test('an infinite ask timeout waits for the reply', async () => {
  const gate = deferred()
  const actor = Actor.of(() => null, async (message: string) => {
    await gate.promise
    return message
  })
  const asked = actor.ask('slow', { timeout: Infinity })
  await new Promise(resolve => setTimeout(resolve, 5))
  gate.resolve()
  assert.equal(await asked, 'slow')
  await actor.stop()
})

await test('an ask timeout above the timer limit means no timeout', async () => {
  const warnings: string[] = []
  const onWarning = (warning: Error) => { warnings.push(warning.name) }
  process.on('warning', onWarning)
  try {
    const actor = Actor.of(() => null, async (message: string) => {
      await new Promise(resolve => setTimeout(resolve, 20))
      return message
    })
    assert.equal(await actor.ask('slow', { timeout: 2 ** 31 }), 'slow')
    await new Promise(resolve => setImmediate(resolve))
    assert.ok(!warnings.includes('TimeoutOverflowWarning'), 'unexpected TimeoutOverflowWarning')
    await actor.stop()
  } finally {
    process.off('warning', onWarning)
  }
})
