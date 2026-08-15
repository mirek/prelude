import * as Actor from './index.js'
import { deferred, tick } from './test.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

interface Flaky {
  seen: string[]
  generation: number
}

function flaky(directive: Actor.Directive | (() => Actor.Directive | Promise<Actor.Directive>), extra: Pick<Actor.Options<string, Flaky, number>, 'supervisor' | 'onDeadLetter'> = {}) {
  let inits = 0
  const errors: [ unknown, string ][] = []
  const actor = Actor.of((): Flaky => ({ seen: [], generation: inits++ }), (message: string, state) => {
    if (message.startsWith('boom')) {
      throw new Error(message)
    }
    state.seen.push(message)
    return state.seen.length
  }, {
    ...extra,
    onError: (error, message) => {
      errors.push([ error, message ])
      return typeof directive === 'function' ? directive() : directive
    }
  })
  return { actor, errors }
}

await test('default policy: a throwing handler fails the actor and rejects done', async () => {
  const dead: [ string, unknown ][] = []
  const actor = Actor.of(() => null, (message: string) => {
    if (message === 'boom') {
      throw new Error('boom')
    }
  }, { onDeadLetter: (message, reason) => dead.push([ message, reason ]) })

  void actor.send('boom')
  void actor.send('after')
  await assert.rejects(actor.done, /boom/)
  assert.equal(actor.status, 'failed')
  assert.match(String(actor.error), /boom/)
  assert.deepEqual(dead.map(([ message ]) => message), [ 'after' ])
  assert.match(String(dead[0][1]), /boom/)
  await assert.rejects(actor.send('late'), /boom/, 'sends after failure carry the failure as reason')
})

await test('resume drops the failing message and keeps state', async () => {
  const { actor, errors } = flaky('resume')
  await actor.send('a')
  await actor.send('boom 1')
  assert.equal(await actor.ask('b'), 2)
  assert.deepEqual(actor.state.seen, [ 'a', 'b' ])
  assert.equal(errors.length, 1)
  assert.equal(errors[0][1], 'boom 1')
  assert.match(String(errors[0][0]), /boom 1/)
  assert.equal(actor.restarts, 0)
  await actor.stop()
  assert.equal(actor.status, 'stopped')
})

await test('restart re-initialises state, keeps the mailbox and counts restarts', async () => {
  const { actor } = flaky('restart')
  void actor.send('a')
  void actor.send('boom')
  void actor.send('b')
  const reply = actor.ask('c')
  assert.equal(await reply, 2, 'messages behind the failure are processed with fresh state')
  assert.deepEqual(actor.state.seen, [ 'b', 'c' ])
  assert.equal(actor.state.generation, 1)
  assert.equal(actor.restarts, 1)
  await actor.stop()
})

await test('stop directive fails the actor with the handler error', async () => {
  const { actor } = flaky('stop')
  void actor.send('boom')
  await assert.rejects(actor.done, /boom/)
  assert.equal(actor.status, 'failed')
})

await test('escalate without a supervisor stops the actor', async () => {
  const { actor } = flaky('escalate')
  void actor.send('boom')
  await assert.rejects(actor.done, /boom/)
})

await test('a throwing onError hook fails the actor with the hook error', async () => {
  const actor = Actor.of(() => null, () => { throw new Error('handler') }, {
    onError: () => { throw new Error('hook') }
  })
  void actor.send('x')
  await assert.rejects(actor.done, /hook/)
})

await test('async onError is awaited and can consult the actor', async () => {
  const seen: [ string, number ][] = []
  const actor = Actor.of(() => ({ n: 0 }), (message: string, state) => {
    state.n += 1
    if (message === 'boom') {
      throw new Error('boom')
    }
  }, {
    // Async hooks need an explicit return type: TypeScript widens literal
    // returns of async arrows when the contextual type is `T | Promise<T>`.
    onError: async (_, message, self): Promise<Actor.Directive> => {
      await Promise.resolve()
      seen.push([ message, self.state.n ])
      return 'resume'
    }
  })
  await actor.send('a')
  await actor.send('boom')
  await actor.send('b')
  await actor.stop()
  assert.deepEqual(seen, [ [ 'boom', 2 ] ])
  assert.equal(actor.state.n, 3)
})

await test('escalate consults the supervisor with (child, error, message)', async () => {
  const calls: unknown[][] = []
  const supervisor: Actor.Supervisor = {
    failure: (child, error, message) => {
      calls.push([ child, error, message ])
      return 'restart'
    }
  }
  const { actor } = flaky('escalate', { supervisor })
  await actor.send('a')
  await actor.send('boom')
  await tick()
  assert.equal(actor.restarts, 1)
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], actor)
  assert.match(String(calls[0][1]), /boom/)
  assert.equal(calls[0][2], 'boom')
  await actor.stop()
})

await test('a supervisor assigned after construction is used', async () => {
  const actor = Actor.of(() => null, () => { throw new Error('boom') })
  actor.supervisor = { failure: () => 'resume' }
  await actor.send('x')
  await actor.send('y')
  await actor.stop()
  assert.equal(actor.status, 'stopped')
})

await test('local policy wins over the supervisor unless it escalates', async () => {
  let supervisorCalls = 0
  const supervisor: Actor.Supervisor = { failure: () => { supervisorCalls += 1; return 'stop' } }
  const { actor } = flaky('resume', { supervisor })
  await actor.send('boom')
  await actor.send('a')
  await actor.stop()
  assert.equal(supervisorCalls, 0)
  assert.deepEqual(actor.state.seen, [ 'a' ])
})

await test('a supervisor that escalates is treated as stop', async () => {
  const { actor } = flaky('escalate', { supervisor: { failure: () => 'escalate' } })
  void actor.send('boom')
  await assert.rejects(actor.done, /boom/)
})

await test('policy-driven restart retries init through the policy and can give up', async () => {
  let inits = 0
  const directives: string[] = []
  const actor = Actor.of(() => {
    inits += 1
    if (inits === 2) {
      throw new Error('init 2')
    }
    return { generation: inits }
  }, (message: string) => {
    if (message === 'boom') {
      throw new Error('boom')
    }
  }, {
    onError: error => {
      directives.push(String(error))
      return directives.length < 3 ? 'restart' : 'stop'
    }
  })

  await actor.send('boom')
  await tick()
  assert.equal(actor.state.generation, 3, 'second init attempt succeeded after the first threw')
  assert.equal(actor.restarts, 1)
  assert.deepEqual(directives, [ 'Error: boom', 'Error: init 2' ])
  await actor.stop()
})

await test('kill during an async policy decision wins', async () => {
  const decide = deferred<Actor.Directive>()
  const actor = Actor.of(() => ({ generation: 0 }), () => { throw new Error('boom') }, {
    onError: () => decide.promise
  })
  void actor.send('x')
  await tick()
  const killed = actor.kill()
  decide.resolve('restart')
  await killed
  assert.equal(actor.status, 'stopped')
  assert.equal(actor.restarts, 0)
})

await test('a message queued while the policy runs is processed by the resumed actor', async () => {
  const decide = deferred<Actor.Directive>()
  const seen: string[] = []
  const actor = Actor.of(() => null, (message: string) => {
    if (message === 'boom') {
      throw new Error('boom')
    }
    seen.push(message)
  }, { onError: () => decide.promise })
  void actor.send('boom')
  await tick()
  void actor.send('after')
  await tick()
  assert.deepEqual(seen, [])
  decide.resolve('resume')
  await actor.stop()
  assert.deepEqual(seen, [ 'after' ])
})

await test('restart requested while the policy is deciding applies immediately and is not repeated', async () => {
  const decide = deferred<Actor.Directive>()
  let inits = 0
  const actor = Actor.of(() => ({ generation: inits++ }), () => { throw new Error('boom') }, {
    onError: () => decide.promise
  })
  void actor.send('x')
  await tick()
  await actor.restart()
  assert.equal(actor.restarts, 1)
  assert.equal(actor.state.generation, 1)
  decide.resolve('restart')
  await tick()
  assert.equal(actor.restarts, 1, 'the policy restart is folded into the explicit one')
  assert.equal(actor.status, 'running')
  await actor.stop()
})
