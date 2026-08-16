import * as Actor from '@prelude/actor'
import * as Supervisor from './index.js'
import { clock, deferred, tick, worker, type WorkerState } from './test.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

function isSupervisorError(code: Supervisor.Code) {
  return (error: unknown) => error instanceof Supervisor.SupervisorError && error.code === code
}

await test('one-for-one restarts only the failing child', async () => {
  const supervisor = Supervisor.of({ strategy: 'one-for-one' })
  const a = supervisor.spawn(worker('a'))
  const b = supervisor.spawn(worker('b'))
  const c = supervisor.spawn(worker('c'))
  assert.deepEqual(supervisor.children, [ a, b, c ])

  await a.send('1')
  await c.send('1')
  await assert.rejects(b.ask('boom'), /b: boom/)
  await tick()

  assert.deepEqual([ a.restarts, b.restarts, c.restarts ], [ 0, 1, 0 ])
  assert.equal(supervisor.restarts, 1)
  assert.deepEqual(a.state.seen, [ '1' ], 'siblings keep their state')
  assert.equal(b.state.generation, 1)
  assert.equal(await b.ask('2'), 1, 'the failing child keeps processing with fresh state')
  assert.equal(supervisor.status, 'running')
  await supervisor.stop()
})

await test('all-for-one restarts every child', async () => {
  const supervisor = Supervisor.of({ strategy: 'all-for-one' })
  const a = supervisor.spawn(worker('a'))
  const b = supervisor.spawn(worker('b'))
  const c = supervisor.spawn(worker('c'))
  await a.send('1')
  await c.send('1')

  await assert.rejects(b.ask('boom'), /b: boom/)
  await tick()

  assert.deepEqual([ a.restarts, b.restarts, c.restarts ], [ 1, 1, 1 ])
  assert.deepEqual([ a.state.seen, b.state.seen, c.state.seen ], [ [], [], [] ])
  assert.equal(supervisor.restarts, 3)
  await supervisor.stop()
})

await test('rest-for-one restarts the failing child and those started after it', async () => {
  const supervisor = Supervisor.of({ strategy: 'rest-for-one' })
  const a = supervisor.spawn(worker('a'))
  const b = supervisor.spawn(worker('b'))
  const c = supervisor.spawn(worker('c'))
  await a.send('1')
  await c.send('1')

  await assert.rejects(b.ask('boom'), /b: boom/)
  await tick()

  assert.deepEqual([ a.restarts, b.restarts, c.restarts ], [ 0, 1, 1 ])
  assert.deepEqual(a.state.seen, [ '1' ])
  assert.deepEqual(c.state.seen, [])
  await supervisor.stop()
})

await test('exceeding the restart limit kills siblings, fails the child and the supervisor', async () => {
  const time = clock()
  const failures: string[] = []
  const supervisor = Supervisor.of({
    maxRestarts: 2,
    window: 1000,
    now: time.now,
    onFailure: (child, error) => failures.push(`${child.name}:${String(error)}`)
  })
  const a = supervisor.spawn(worker('a'))
  const b = supervisor.spawn(worker('b'))

  await assert.rejects(b.ask('boom 1'), /boom 1/)
  await tick()
  time.advance(100)
  await assert.rejects(b.ask('boom 2'), /boom 2/)
  await tick()
  time.advance(100)
  assert.equal(b.restarts, 2)
  assert.equal(supervisor.status, 'running')

  await assert.rejects(b.ask('boom 3'), /boom 3/)
  await assert.rejects(b.done, /boom 3/)
  assert.equal(b.status, 'failed')

  await assert.rejects(supervisor.done, isSupervisorError('restarts'))
  assert.equal(supervisor.status, 'failed')
  const error = supervisor.error as Supervisor.SupervisorError
  assert.match(error.message, /more than 2 restart\(s\) within 1000ms/)
  assert.match(String(error.cause), /boom 3/)

  await a.done
  assert.equal(a.status, 'stopped', 'siblings are killed, not failed')
  assert.deepEqual(supervisor.children, [])
  assert.deepEqual(failures, [ 'b:Error: b: boom 1', 'b:Error: b: boom 2', 'b:Error: b: boom 3' ])
  assert.throws(() => supervisor.spawn(worker('late')), isSupervisorError('stopped'))
})

await test('the restart window slides: old restarts stop counting', async () => {
  const time = clock()
  const supervisor = Supervisor.of({ maxRestarts: 1, window: 1000, now: time.now })
  const a = supervisor.spawn(worker('a'))

  await assert.rejects(a.ask('boom 1'), /boom 1/)
  time.advance(1001)
  await assert.rejects(a.ask('boom 2'), /boom 2/)
  time.advance(1001)
  await assert.rejects(a.ask('boom 3'), /boom 3/)
  await tick()

  assert.equal(a.restarts, 3)
  assert.equal(supervisor.status, 'running')

  time.advance(500)
  await assert.rejects(a.ask('boom 4'), /boom 4/)
  await assert.rejects(supervisor.done, isSupervisorError('restarts'))
})

await test('maxRestarts 0 gives up on the first failure', async () => {
  const supervisor = Supervisor.of({ maxRestarts: 0 })
  const a = supervisor.spawn(worker('a'))
  await assert.rejects(a.ask('boom'), /boom/)
  await assert.rejects(supervisor.done, isSupervisorError('restarts'))
  await assert.rejects(a.done, /boom/)
  assert.equal(a.status, 'failed')
})

await test('a child whose local policy resumes never reaches the supervisor', async () => {
  const supervisor = Supervisor.of({ maxRestarts: 0 })
  const a = supervisor.spawn({ ...worker('a'), onError: () => 'resume' })
  await assert.rejects(a.ask('boom'), /boom/)
  assert.equal(await a.ask('ok'), 1)
  assert.equal(supervisor.restarts, 0)
  await supervisor.stop()
  assert.equal(supervisor.status, 'stopped')
})

await test('stop terminates children in reverse start order and resolves', async () => {
  const order: string[] = []
  const supervisor = Supervisor.of()
  for (const name of [ 'a', 'b', 'c' ]) {
    const child = supervisor.spawn(worker(name))
    void child.done.then(() => order.push(name))
  }
  const supervisorDone = supervisor.done
  await supervisor.stop()
  await tick()
  assert.deepEqual(order, [ 'c', 'b', 'a' ])
  assert.equal(supervisor.status, 'stopped')
  assert.deepEqual(supervisor.children, [])
  await supervisorDone
  await supervisor.stop()
})

await test('kill terminates every child at once and dead-letters their mail', async () => {
  const gate = deferred()
  const dead: string[] = []
  const supervisor = Supervisor.of()
  const a = supervisor.spawn<string, null, void>({
    init: () => null,
    receive: () => gate.promise,
    onDeadLetter: message => dead.push(message)
  })
  void a.send('in-flight')
  void a.send('queued')
  await tick()
  const killing = supervisor.kill()
  assert.equal(supervisor.status, 'stopping')
  gate.resolve()
  await killing
  assert.equal(supervisor.status, 'stopped')
  assert.equal(a.status, 'stopped')
  assert.deepEqual(dead, [ 'queued' ])
})

await test('supervise adopts an existing actor and forgets children that terminate', async () => {
  const supervisor = Supervisor.of()
  const a = new Actor.Actor(worker('a'))
  assert.equal(supervisor.supervise(a), a)
  assert.equal(a.supervisor, supervisor)
  await assert.rejects(a.ask('boom'), /boom/)
  await tick()
  assert.equal(a.restarts, 1)

  await a.stop()
  await tick()
  assert.deepEqual(supervisor.children, [])
  assert.throws(() => supervisor.supervise(a), isSupervisorError('invalid'))
  await supervisor.stop()
})

await test('supervise re-adopts a listed child that another supervisor took over', async () => {
  const first = Supervisor.of({ name: 'first' })
  const second = Supervisor.of({ name: 'second' })
  const a = first.spawn(worker('a'))
  second.supervise(a)
  assert.equal(a.supervisor, second)

  assert.equal(first.supervise(a), a)
  assert.equal(a.supervisor, first)
  assert.deepEqual(first.children, [ a ])
  assert.deepEqual(second.children, [], 'the previous supervisor no longer lists the child')

  await assert.rejects(a.ask('boom'), /a: boom/)
  await tick()
  assert.equal(a.restarts, 1)
  assert.equal(first.restarts, 1, 'the failure is handled by first')
  assert.equal(second.restarts, 0, 'not by second')
  await first.stop()
  await second.stop()
})

await test('stopping the previous supervisor leaves a transferred child alone', async () => {
  const first = Supervisor.of({ name: 'first' })
  const second = Supervisor.of({ name: 'second' })
  const a = first.spawn(worker('a'))
  second.supervise(a)
  assert.deepEqual(first.children, [])
  await first.stop()
  assert.equal(a.status, 'running')
  await second.stop()
  assert.equal(a.status, 'stopped')
})

await test('concurrent failures under all-for-one do not deadlock', async () => {
  const supervisor = Supervisor.of({ strategy: 'all-for-one', maxRestarts: 10 })
  const a = supervisor.spawn(worker('a'))
  const b = supervisor.spawn(worker('b'))

  const results = await Promise.allSettled([ a.ask('boom'), b.ask('boom') ])
  assert.deepEqual(results.map(result => result.status), [ 'rejected', 'rejected' ])
  await tick()

  assert.equal(a.status, 'running')
  assert.equal(b.status, 'running')
  assert.ok(a.restarts >= 1 && b.restarts >= 1)
  assert.equal(await a.ask('x'), 1)
  assert.equal(await b.ask('x'), 1)
  await supervisor.stop()
})

await test('a sibling that cannot be restarted makes the supervisor give up', async () => {
  const supervisor = Supervisor.of({ strategy: 'all-for-one' })
  const a = supervisor.spawn(worker('a'))
  let inits = 0
  const broken = supervisor.spawn<string, null, void>({
    name: 'broken',
    init: () => {
      if (inits++ > 0) {
        throw new Error('cannot init')
      }
      return null
    },
    receive: () => {}
  })
  await assert.rejects(a.ask('boom'), /boom/)
  await assert.rejects(supervisor.done, isSupervisorError('restarts'))
  assert.match(String((supervisor.error as Error).cause), /cannot init/)
  await assert.rejects(broken.done, /cannot init/)
  await assert.rejects(a.done, /boom/)
})

await test('nested supervisors: giving up escalates to the parent, which may restart or stop', async () => {
  const time = clock()
  const parent = Supervisor.of({ name: 'parent', maxRestarts: 1, window: 1000, now: time.now })
  const child = parent.supervise(Supervisor.of({ name: 'child', maxRestarts: 0, now: time.now }))
  const sibling = parent.spawn(worker('sibling'))
  const a = child.spawn(worker('a'))
  const b = child.spawn(worker('b'))
  await b.send('1')

  // Child gives up at once (maxRestarts 0), parent restarts it: all its children restart.
  await assert.rejects(a.ask('boom 1'), /boom 1/)
  await tick()
  assert.equal(child.status, 'running')
  assert.deepEqual([ a.restarts, b.restarts ], [ 1, 1 ])
  assert.deepEqual(b.state.seen, [])
  assert.equal(sibling.restarts, 0, 'parent is one-for-one')

  // Second escalation within the parent's window: the parent gives up too.
  time.advance(10)
  await assert.rejects(a.ask('boom 2'), /boom 2/)
  await assert.rejects(child.done, isSupervisorError('restarts'))
  await assert.rejects(parent.done, isSupervisorError('restarts'))
  await assert.rejects(a.done, /boom 2/)
  await b.done
  await sibling.done
  assert.equal(b.status, 'stopped')
  assert.equal(sibling.status, 'stopped')
})

await test('a supervisor can be restarted by its parent like any child', async () => {
  const supervisor = Supervisor.of()
  const a = supervisor.spawn(worker('a'))
  await a.send('1')
  await supervisor.restart()
  assert.equal(a.restarts, 1)
  assert.deepEqual(a.state.seen, [])
  await supervisor.stop()
  await assert.rejects(supervisor.restart(), isSupervisorError('stopped'))
})

await test('failure decisions are serialised even while a sibling restart is pending', async () => {
  const gate = deferred()
  const supervisor = Supervisor.of({ strategy: 'all-for-one', maxRestarts: 10 })
  const slow = supervisor.spawn<string, { generation: number }, void>({
    name: 'slow',
    init: (() => { let n = 0; return () => ({ generation: n++ }) })(),
    receive: async () => { await gate.promise }
  })
  const flaky = supervisor.spawn(worker('flaky'))

  void slow.send('busy')
  await tick()
  const failing = flaky.ask('boom')
  await tick()
  // `slow` is mid-message, so its restart waits; the failing child's decision waits with it.
  assert.equal(flaky.restarts, 0)
  assert.equal(slow.restarts, 0)

  gate.resolve()
  await assert.rejects(failing, /boom/)
  await tick()
  assert.equal(slow.restarts, 1)
  assert.equal(flaky.restarts, 1)
  await supervisor.stop()
})

await test('invalid options are rejected', () => {
  assert.throws(() => Supervisor.of({ maxRestarts: -1 }), isSupervisorError('invalid'))
  assert.throws(() => Supervisor.of({ maxRestarts: 1.5 }), isSupervisorError('invalid'))
  assert.throws(() => Supervisor.of({ window: -1 }), isSupervisorError('invalid'))
  assert.throws(() => Supervisor.of({ window: NaN }), isSupervisorError('invalid'))
})

await test('await using stops the supervisor and its children', async () => {
  let a!: Actor.Actor<string, WorkerState, number>
  {
    await using supervisor = Supervisor.of()
    a = supervisor.spawn(worker('a'))
  }
  assert.equal(a.status, 'stopped')
})

await test('a nested supervisor escalating while its parent restarts it does not deadlock', async () => {
  const gate = deferred()
  const root = Supervisor.of({ name: 'root', strategy: 'all-for-one', maxRestarts: 10 })
  const slow = root.spawn<string, null, void>({
    name: 'slow',
    init: () => null,
    receive: async () => { await gate.promise }
  })
  const nested = root.supervise(Supervisor.of({ name: 'nested', maxRestarts: 0 }))
  const w = nested.spawn(worker('w'))
  const x = root.spawn(worker('x'))

  // `slow` is mid-message so root's all-for-one restart (for x) blocks on it...
  void slow.send('busy')
  await tick()
  const xFailure = x.ask('boom x')
  await tick()
  // ...meanwhile w fails, nested gives up at once and escalates to root, whose queue is busy.
  const wFailure = w.ask('boom w')
  await tick()
  gate.resolve()

  await assert.rejects(xFailure, /boom x/)
  await assert.rejects(wFailure, /boom w/)
  await tick(50)
  assert.equal(root.status, 'running')
  assert.equal(nested.status, 'running')
  assert.equal(await x.ask('after'), 1)
  assert.equal(await w.ask('after'), 1)
  await root.stop()
  assert.equal(root.status, 'stopped')
})

await test('a sibling that is already terminating is skipped rather than failing the restart', async () => {
  const gate = deferred()
  const root = Supervisor.of({ strategy: 'all-for-one', maxRestarts: 10 })
  const a = root.spawn(worker('a'))
  const b = root.spawn<string, null, void>({
    name: 'b',
    init: () => null,
    receive: async () => { await gate.promise }
  })
  void b.send('busy')
  await tick()
  const killed = b.kill()
  assert.equal(b.status, 'stopping')
  await assert.rejects(a.ask('boom'), /boom/)
  gate.resolve()
  await killed
  await tick()
  assert.equal(root.status, 'running')
  assert.equal(a.status, 'running')
  assert.equal(a.restarts, 1)
  assert.equal(root.restarts, 1)
  assert.equal(await a.ask('after'), 1)
  await root.stop()
})

await test('a child whose stop or kill rejects does not hang the supervisor', async () => {
  const unhandled: unknown[] = []
  const onUnhandled = (reason: unknown) => { unhandled.push(reason) }
  process.on('unhandledRejection', onUnhandled)
  try {
    const stubborn = (): Actor.Supervised => {
      let status: Actor.Status = 'running'
      const done = new Promise<void>(() => {})
      return {
        get status() { return status },
        done,
        stop: async () => { status = 'stopping'; throw new Error('stop failed') },
        kill: async () => { status = 'stopping'; throw new Error('kill failed') },
        restart: async () => {}
      }
    }
    const root = Supervisor.of()
    const worker_ = root.spawn(worker('w'))
    root.supervise(stubborn())
    await root.stop()
    assert.equal(root.status, 'stopped')
    assert.equal(worker_.status, 'stopped')

    const other = Supervisor.of()
    other.supervise(stubborn())
    const w2 = other.spawn(worker('w2'))
    await other.kill()
    assert.equal(other.status, 'stopped')
    assert.equal(w2.status, 'stopped')

    const failing = Supervisor.of({ maxRestarts: 0 })
    failing.supervise(stubborn())
    const w3 = failing.spawn(worker('w3'))
    await assert.rejects(w3.ask('boom'), /boom/)
    await assert.rejects(failing.done, isSupervisorError('restarts'))
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.deepEqual(unhandled, [])
  } finally {
    process.off('unhandledRejection', onUnhandled)
  }
})

await test('an actor created with the supervisor option is adopted on its first failure', async () => {
  const root = Supervisor.of({ maxRestarts: 5 })
  const actor = new Actor.Actor<string, WorkerState, number>({ ...worker('direct'), supervisor: root })
  await assert.rejects(actor.ask('boom'), /boom/)
  await tick()
  assert.equal(actor.status, 'running')
  assert.equal(actor.restarts, 1)
  assert.deepEqual(root.children, [ actor ])
  assert.equal(await actor.ask('x'), 1)
  await root.stop()
  assert.equal(actor.status, 'stopped')
})

await test('an unknown child is adopted only while it still names the deciding supervisor', async () => {
  const first = Supervisor.of({ maxRestarts: 5 })
  const second = Supervisor.of({ maxRestarts: 5 })
  const gate = deferred()
  const stub: Actor.Supervised = {
    status: 'running',
    done: new Promise<void>(() => {}),
    stop: async () => {},
    kill: async () => {},
    restart: () => gate.promise
  }
  first.supervise(stub)
  const restarting = first.restart()
  const actor = new Actor.Actor<string, WorkerState, number>({ ...worker('moved'), supervisor: first })
  const decision = first.failure(actor, new Error('boom'), 'boom')
  second.supervise(actor)
  assert.equal(actor.supervisor, second)
  gate.resolve()
  await restarting
  assert.equal(await decision, 'restart', 'the queued failure is decided by the child\'s current supervisor')
  assert.equal(second.restarts, 1)
  assert.equal(actor.supervisor, second)
  assert.equal(second.children.includes(actor), true)
  assert.equal(first.children.includes(actor), false)
  await first.stop()
  assert.equal(actor.status, 'running', 'stopping the first supervisor leaves the other supervisor\'s child alone')

  const foreign = new Actor.Actor<string, WorkerState, number>(worker('foreign'))
  assert.equal(await second.failure(foreign, new Error('boom'), 'boom'), 'stop')
  assert.equal(foreign.supervisor, undefined)
  assert.equal(second.children.includes(foreign), false)
  await second.stop()
  assert.equal(actor.status, 'stopped')
  await foreign.stop()
})

await test('a real failure queued before a handover restarts the actor under its new supervisor', async () => {
  const first = Supervisor.of({ maxRestarts: 5 })
  const second = Supervisor.of({ maxRestarts: 5 })
  const gate = deferred()
  const stub: Actor.Supervised = {
    status: 'running',
    done: new Promise<void>(() => {}),
    stop: async () => {},
    kill: async () => {},
    restart: () => gate.promise
  }
  first.supervise(stub)
  const restarting = first.restart()
  const actor = first.spawn(worker('moved'))
  // The handler throws while first's decision queue is blocked; the escalation is queued on first.
  const asked = assert.rejects(actor.ask('boom'), /boom/)
  await tick()
  second.supervise(actor)
  gate.resolve()
  await restarting
  await asked
  await tick()
  assert.equal(actor.status, 'running', 'the reparented actor is restarted, not stopped')
  assert.equal(actor.restarts, 1)
  assert.equal(second.restarts, 1, 'decided by the new supervisor')
  assert.equal(second.children.includes(actor), true)
  await first.stop()
  assert.equal(actor.status, 'running')
  await second.stop()
  assert.equal(actor.status, 'stopped')
})

await test('supervising the same child twice does not duplicate it', async () => {
  const root = Supervisor.of({ strategy: 'all-for-one', maxRestarts: 10 })
  const a = root.spawn(worker('a'))
  const b = root.spawn(worker('b'))
  root.supervise(a)
  root.supervise(b)
  assert.deepEqual(root.children, [ a, b ])
  await assert.rejects(a.ask('boom'), /boom/)
  await tick()
  assert.equal(b.restarts, 1, 'the sibling is restarted once, not once per duplicate')
  await root.stop()
})
