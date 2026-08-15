import * as Actor from './index.js'
import { deferred, tick } from './test.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

function isActorError(code: Actor.Code) {
  return (error: unknown) => error instanceof Actor.ActorError && error.code === code
}

await test('stop processes queued messages, then refuses new ones', async () => {
  const gate = deferred()
  const processed: number[] = []
  const dead: number[] = []
  const actor = Actor.of(() => null, async (message: number) => {
    await gate.promise
    processed.push(message)
  }, { onDeadLetter: message => dead.push(message) })

  void actor.send(1)
  void actor.send(2)
  const stopping = actor.stop()
  assert.equal(actor.status, 'stopping')
  await assert.rejects(actor.send(3), isActorError('stopped'))
  assert.deepEqual(dead, [ 3 ])

  gate.resolve()
  await stopping
  assert.equal(actor.status, 'stopped')
  assert.deepEqual(processed, [ 1, 2 ])
})

await test('stop and kill are idempotent and resolve after termination', async () => {
  const actor = Actor.of(() => null, () => {})
  await actor.stop()
  await actor.stop()
  await actor.kill()
  assert.equal(actor.status, 'stopped')

  const other = Actor.of(() => null, () => {})
  await Promise.all([ other.kill(), other.kill(), other.stop() ])
  assert.equal(other.status, 'stopped')
})

await test('stop resolves even when the actor fails while draining; done rejects', async () => {
  const actor = Actor.of(() => null, (message: string) => {
    if (message === 'boom') {
      throw new Error('boom')
    }
  })
  void actor.send('boom')
  await actor.stop()
  assert.equal(actor.status, 'failed')
  await assert.rejects(actor.done, /boom/)
  assert.match(String(actor.error), /boom/)
})

await test('stop waits for the in-flight handler', async () => {
  const gate = deferred()
  let finished = false
  const actor = Actor.of(() => null, async (_: string) => {
    await gate.promise
    finished = true
  })
  void actor.send('x')
  await tick()
  const stopping = actor.stop()
  await tick()
  assert.equal(finished, false)
  gate.resolve()
  await stopping
  assert.equal(finished, true)
})

await test('kill aborts the in-flight signal, dead-letters the queue and rejects asks', async () => {
  const gate = deferred()
  const dead: [ string, unknown ][] = []
  let aborted: unknown
  const actor = Actor.of(() => null, async (message: string, _, { signal }) => {
    signal.addEventListener('abort', () => { aborted = signal.reason }, { once: true })
    await gate.promise
    return message
  }, { onDeadLetter: (message, reason) => dead.push([ message, reason ]) })

  const inFlight = actor.ask('first')
  const queued = actor.ask('second')
  void actor.send('third')
  await tick()
  assert.equal(actor.pending, 2)

  const killing = actor.kill()
  assert.equal(actor.status, 'stopping', 'the handler is still running')
  assert.ok(isActorError('killed')(aborted))
  await assert.rejects(queued, isActorError('killed'))
  assert.deepEqual(dead.map(([ message ]) => message), [ 'second', 'third' ])
  assert.ok(dead.every(([ , reason ]) => isActorError('killed')(reason)))

  await assert.rejects(actor.send('fourth'), isActorError('killed'))

  gate.resolve()
  await killing
  assert.equal(actor.status, 'stopped')
  await assert.rejects(inFlight, isActorError('killed'), 'the in-flight reply is discarded once killed')
  await actor.done
})

await test('kill accepts a custom reason', async () => {
  const dead: unknown[] = []
  const actor = Actor.of(() => null, (message: string) => message, {
    onDeadLetter: (_, reason) => dead.push(reason)
  })
  const reason = new Error('shutdown')
  await actor.kill(reason)
  await assert.rejects(actor.send('x'), /shutdown/)
  assert.deepEqual(dead, [ reason ])
})

await test('kill while idle terminates promptly and later kill after stop is a no-op', async () => {
  const actor = Actor.of(() => null, () => {})
  await actor.kill()
  assert.equal(actor.status, 'stopped')
  await actor.stop()
  assert.equal(actor.status, 'stopped')
})

await test('a message handed over just before kill is dead-lettered, not processed', async () => {
  const processed: string[] = []
  const dead: string[] = []
  const actor = Actor.of(() => null, (message: string) => { processed.push(message) }, {
    onDeadLetter: message => dead.push(message)
  })
  // The write hands the message to the waiting run loop synchronously; the loop
  // itself only resumes on a later microtask, by which time we have killed.
  void actor.send('x')
  await actor.kill()
  assert.deepEqual(processed, [])
  assert.deepEqual(dead, [ 'x' ])
})

await test('restart while idle re-initialises the state and keeps the mailbox open', async () => {
  let inits = 0
  const actor = Actor.of(() => ({ n: inits++ }), (message: number, state) => {
    state.n += message
    return state.n
  })
  assert.equal(await actor.ask(10), 10)
  await actor.restart()
  assert.equal(actor.restarts, 1)
  assert.deepEqual(actor.state, { n: 1 })
  assert.equal(await actor.ask(1), 2)
  await actor.stop()
})

await test('restart while busy aborts the in-flight signal and applies after it settles', async () => {
  const gate = deferred()
  const events: string[] = []
  const actor = Actor.of(() => ({ id: events.length }), async (message: string, state, { signal }) => {
    events.push(`start:${message}:${state.id}`)
    await gate.promise
    events.push(`aborted:${signal.aborted}`)
    return state.id
  })

  const first = actor.ask('first')
  const second = actor.ask('second')
  await tick()
  const restarting = actor.restart()
  await tick()
  assert.equal(actor.restarts, 0, 'restart waits for the in-flight message')

  gate.resolve()
  assert.equal(await first, 0, 'the in-flight reply is still delivered')
  await restarting
  assert.equal(actor.restarts, 1)
  assert.notEqual(await second, 0, 'the next message sees fresh state')
  assert.deepEqual(events, [ 'start:first:0', 'aborted:true', `start:second:${actor.state.id}`, 'aborted:false' ])
  await actor.stop()
})

await test('handler failure caused by a requested restart does not run the failure policy', async () => {
  const gate = deferred()
  let policyCalls = 0
  const actor = Actor.of(() => null, async (_: string, __, { signal }) => {
    await gate.promise
    signal.throwIfAborted()
  }, { onError: () => { policyCalls += 1; return 'stop' } })

  const asked = actor.ask('x')
  await tick()
  const restarting = actor.restart()
  gate.resolve()
  await assert.rejects(asked, isActorError('restarted'))
  await restarting
  assert.equal(policyCalls, 0)
  assert.equal(actor.status, 'running')
  await actor.stop()
})

await test('restart on a terminated actor rejects; init throwing on restart fails the actor', async () => {
  const stopped = Actor.of(() => null, () => {})
  await stopped.stop()
  await assert.rejects(stopped.restart(), isActorError('stopped'))

  let inits = 0
  const actor = Actor.of(() => {
    if (inits++ > 0) {
      throw new Error('init failed')
    }
    return null
  }, () => {})
  await assert.rejects(actor.restart(), /init failed/)
  await assert.rejects(actor.done, /init failed/)
  assert.equal(actor.status, 'failed')
})

await test('done resolves for stopped actors and rejects for failed ones', async () => {
  const ok = Actor.of(() => null, () => {})
  const okDone = ok.done
  await ok.stop()
  await okDone

  const bad = Actor.of(() => null, () => { throw new Error('bad') })
  const badDone = bad.done
  await bad.send('x')
  await assert.rejects(badDone, /bad/)
  assert.equal(bad.status, 'failed')
})
