import * as Actor from '@prelude/actor'
import * as Remote from './index.js'
import { MessageChannel } from 'node:worker_threads'
import { mock, test } from 'node:test'
import assert from 'node:assert/strict'

type Counter =
  | { type: 'inc', value: number }
  | { type: 'get' }
  | { type: 'boom' }
  | { type: 'boom-string' }

function counter() {
  return Actor.of(() => ({ count: 0 }), (message: Counter, state) => {
    switch (message.type) {
      case 'inc':
        state.count += message.value
        return state.count
      case 'get':
        return state.count
      case 'boom':
        throw new Actor.ActorError('kaboom', 'invalid')
      case 'boom-string':
        throw 'not an error'
    }
  })
}

async function tick(times = 10) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve()
  }
}

await test('send and ask round-trip through an in-memory pair', async () => {
  const local = counter()
  const [ server, client ] = Remote.pair()
  const stop = Remote.serve(local, server)
  const remote = new Remote.RemoteActor<Counter, number>(client, { name: 'counter' })
  assert.equal(remote.name, 'counter')

  await remote.send({ type: 'inc', value: 5 })
  assert.equal(await remote.ask({ type: 'inc', value: 2 }), 7)
  assert.equal(await remote.ask({ type: 'get' }), 7)
  assert.equal(local.state.count, 7)
  assert.equal(remote.pending, 0)

  stop()
  remote.close()
  await local.stop()
})

await test('remote handler errors reject ask with a RemoteError carrying the wire error', async () => {
  const local = counter()
  const [ server, client ] = Remote.pair()
  Remote.serve(local, server)
  const remote = new Remote.RemoteActor<Counter, number>(client)

  await assert.rejects(remote.ask({ type: 'boom' }), (error: unknown) => {
    assert.ok(error instanceof Remote.RemoteError)
    assert.equal(error.code, 'remote')
    assert.equal(error.message, 'kaboom')
    assert.deepEqual(error.remote, { name: 'ActorError', message: 'kaboom', code: 'invalid' })
    return true
  })
  await local.stop()
})

await test('non-Error throwables are serialised as plain errors', async () => {
  const local = counter()
  const [ server, client ] = Remote.pair()
  Remote.serve(local, server)
  const remote = new Remote.RemoteActor<Counter, number>(client)
  await assert.rejects(remote.ask({ type: 'boom-string' }), (error: unknown) => {
    assert.ok(error instanceof Remote.RemoteError)
    assert.deepEqual(error.remote, { name: 'Error', message: 'not an error' })
    return true
  })
  await local.stop()
})

await test('a custom error serializer is honoured', async () => {
  const local = counter()
  const [ server, client ] = Remote.pair()
  Remote.serve(local, server, { serializeError: () => ({ name: 'Redacted', message: 'no details' }) })
  const remote = new Remote.RemoteActor<Counter, number>(client)
  await assert.rejects(remote.ask({ type: 'boom' }), /no details/)
  await local.stop()
})

await test('asking a stopped remote actor surfaces its ActorError code', async () => {
  const local = counter()
  const [ server, client ] = Remote.pair()
  Remote.serve(local, server)
  const remote = new Remote.RemoteActor<Counter, number>(client)
  await local.stop()
  await assert.rejects(remote.ask({ type: 'get' }), (error: unknown) =>
    error instanceof Remote.RemoteError && error.remote?.code === 'stopped')
})

await test('ask times out; a late reply is ignored', async () => {
  mock.timers.enable({ apis: [ 'setTimeout' ] })
  try {
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    const local = Actor.of(() => null, async (message: string) => {
      await gate
      return message
    })
    const [ server, client ] = Remote.pair()
    Remote.serve(local, server)
    const remote = new Remote.RemoteActor<string, string>(client)

    const slow = remote.ask('slow', { timeout: 50 })
    await tick()
    assert.equal(remote.pending, 1)
    mock.timers.tick(50)
    await assert.rejects(slow, (error: unknown) => error instanceof Actor.ActorError && error.code === 'timeout')
    assert.equal(remote.pending, 0)

    release()
    await tick()
    assert.equal(await remote.ask('fast'), 'fast', 'the connection keeps working after the late reply')
    await local.stop()
  } finally {
    mock.timers.reset()
  }
})

await test('an ask timeout above the timer limit means no timeout', async () => {
  const warnings: string[] = []
  const onWarning = (warning: Error) => { warnings.push(warning.name) }
  process.on('warning', onWarning)
  try {
    const local = Actor.of(() => null, async (message: string) => {
      await new Promise(resolve => setTimeout(resolve, 20))
      return message
    })
    const [ server, client ] = Remote.pair()
    Remote.serve(local, server)
    const remote = new Remote.RemoteActor<string, string>(client)

    assert.equal(await remote.ask('slow', { timeout: 2 ** 31 }), 'slow')
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(warnings, [])
    assert.equal(remote.pending, 0)
    remote.close()
    await local.stop()
  } finally {
    process.off('warning', onWarning)
  }
})

await test('ask honours abort signals', async () => {
  const local = counter()
  const [ server, client ] = Remote.pair()
  Remote.serve(local, server)
  const remote = new Remote.RemoteActor<Counter, number>(client)

  const already = new AbortController()
  already.abort(new Error('already'))
  await assert.rejects(remote.ask({ type: 'get' }, { signal: already.signal }), /already/)
  assert.equal(remote.pending, 0)

  const controller = new AbortController()
  assert.equal(await remote.ask({ type: 'get' }, { signal: controller.signal }), 0)
  controller.abort()
  assert.equal(await remote.ask({ type: 'get' }), 0, 'aborting after settlement is harmless')
  await local.stop()
})

await test('close rejects pending asks and refuses further traffic', async () => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  const local = Actor.of(() => null, async (message: string) => {
    await gate
    return message
  })
  const [ server, client ] = Remote.pair()
  Remote.serve(local, server)
  const remote = new Remote.RemoteActor<string, string>(client)

  const pending = remote.ask('x')
  await tick()
  remote.close()
  assert.equal(remote.closed, true)
  await assert.rejects(pending, (error: unknown) => error instanceof Remote.RemoteError && error.code === 'closed')
  await assert.rejects(remote.send('y'), (error: unknown) => error instanceof Remote.RemoteError && error.code === 'closed')
  await assert.rejects(remote.ask('z'), (error: unknown) => error instanceof Remote.RemoteError && error.code === 'closed')
  remote.close()

  release()
  await tick()
  await local.stop()
})

await test('close honours falsy reasons and stays idempotent', async () => {
  let posts = 0
  const [ , client ] = Remote.pair()
  const remote = new Remote.RemoteActor<string, string>({
    post: () => { posts += 1 },
    subscribe: listener => client.subscribe(listener)
  })
  const pending = remote.ask('x')
  await tick()
  remote.close(null)
  remote.close(null)
  assert.equal(remote.closed, true)
  await assert.rejects(pending, (reason: unknown) => reason === null)
  await assert.rejects(remote.send('y'), (reason: unknown) => reason === null)
  await assert.rejects(remote.ask('z'), (reason: unknown) => reason === null)
  assert.equal(posts, 1, 'nothing is posted after close')
  assert.equal(remote.pending, 0)
})

await test('stopping the server stops answering', async () => {
  mock.timers.enable({ apis: [ 'setTimeout' ] })
  try {
    const local = counter()
    const [ server, client ] = Remote.pair()
    const stop = Remote.serve(local, server)
    const remote = new Remote.RemoteActor<Counter, number>(client)
    assert.equal(await remote.ask({ type: 'get' }), 0)
    stop()
    const unanswered = remote.ask({ type: 'get' }, { timeout: 10 })
    await tick()
    mock.timers.tick(10)
    await assert.rejects(unanswered, (error: unknown) => error instanceof Actor.ActorError && error.code === 'timeout')
    await local.stop()
  } finally {
    mock.timers.reset()
  }
})

await test('sends and asks keep their order', async () => {
  const seen: number[] = []
  const local = Actor.of(() => null, (message: number) => {
    seen.push(message)
    return message
  })
  const [ server, client ] = Remote.pair()
  Remote.serve(local, server)
  const remote = new Remote.RemoteActor<number, number>(client)
  void remote.send(1)
  const two = remote.ask(2)
  void remote.send(3)
  const four = remote.ask(4)
  assert.deepEqual(await Promise.all([ two, four ]), [ 2, 4 ])
  await local.stop()
  assert.deepEqual(seen, [ 1, 2, 3, 4 ])
})

await test('malformed frames are ignored', async () => {
  const local = counter()
  const [ server, client ] = Remote.pair()
  Remote.serve(local, server)
  const remote = new Remote.RemoteActor<Counter, number>(client)
  for (const junk of [ null, 42, 'ask', { type: 'ask' }, { type: 'reply' }, { type: 'error', id: 1 }, { type: 'nope', id: 1 } ]) {
    await client.post(junk as unknown as Remote.Frame)
    await server.post(junk as unknown as Remote.Frame)
  }
  await tick()
  assert.equal(await remote.ask({ type: 'get' }), 0)
  await local.stop()
})

await test('a failing transport rejects the ask', async () => {
  const [ , client ] = Remote.pair()
  const broken: Remote.Transport = {
    post: () => Promise.reject(new Error('wire down')),
    subscribe: listener => client.subscribe(listener)
  }
  const remote = new Remote.RemoteActor<string, string>(broken)
  await assert.rejects(remote.ask('x'), /wire down/)
  await assert.rejects(remote.send('x'), /wire down/)
  assert.equal(remote.pending, 0)

  const throwing = new Remote.RemoteActor<string, string>({
    post: () => { throw new Error('sync down') },
    subscribe: listener => client.subscribe(listener)
  })
  await assert.rejects(throwing.ask('x'), /sync down/)
  await assert.rejects(throwing.send('x'), /sync down/)
  assert.equal(throwing.pending, 0)
})

await test('channel multiplexes several actors over one transport', async () => {
  const a = Actor.of(() => null, (message: string) => `a:${message}`)
  const b = Actor.of(() => null, (message: string) => `b:${message}`)
  const [ server, client ] = Remote.pair()
  Remote.serve(a, Remote.channel(server, 'a'))
  Remote.serve(b, Remote.channel(server, 'b'))
  const remoteA = new Remote.RemoteActor<string, string>(Remote.channel(client, 'a'))
  const remoteB = new Remote.RemoteActor<string, string>(Remote.channel(client, 'b'))

  assert.deepEqual(await Promise.all([ remoteA.ask('1'), remoteB.ask('1'), remoteA.ask('2') ]), [ 'a:1', 'b:1', 'a:2' ])
  await Promise.all([ a.stop(), b.stop() ])
})

await test('a RemoteActor is a Ref and can itself be served (two hops)', async () => {
  const local = counter()
  const [ s1, c1 ] = Remote.pair()
  const [ s2, c2 ] = Remote.pair()
  Remote.serve(local, s1)
  const hop = new Remote.RemoteActor<Counter, number>(c1)
  Remote.serve(hop, s2)
  const remote = new Remote.RemoteActor<Counter, number>(c2)

  assert.equal(await remote.ask({ type: 'inc', value: 3 }), 3)
  await assert.rejects(remote.ask({ type: 'boom' }), (error: unknown) =>
    error instanceof Remote.RemoteError && error.remote?.name === 'RemoteError' && error.message === 'kaboom')
  await local.stop()
})

await test('fromPort carries frames over a real MessageChannel with structured cloning', async () => {
  const local = counter()
  const { port1, port2 } = new MessageChannel()
  try {
    const stop = Remote.serve(local, Remote.fromPort(port1))
    const remote = new Remote.RemoteActor<Counter, number>(Remote.fromPort(port2))

    await remote.send({ type: 'inc', value: 4 })
    assert.equal(await remote.ask({ type: 'get' }), 4)
    await assert.rejects(remote.ask({ type: 'boom' }), (error: unknown) =>
      error instanceof Remote.RemoteError && error.remote?.code === 'invalid')

    remote.close()
    stop()
  } finally {
    port1.close()
    port2.close()
    await local.stop()
  }
})

await test('an undeliverable reply rejects the ask instead of hanging it', async () => {
  const local = Actor.of(() => null, (message: string) => {
    if (message === 'fn') {
      return () => 1 // not structured-cloneable
    }
    if (message === 'bad-error') {
      throw Object.assign(new Error('bad'), { code: () => 1 })
    }
    return message
  }, { onError: () => 'resume' })
  const { port1, port2 } = new MessageChannel()
  try {
    const stop = Remote.serve(local, Remote.fromPort(port1))
    const remote = new Remote.RemoteActor<string, unknown>(Remote.fromPort(port2))
    await assert.rejects(remote.ask('fn'), (error: unknown) =>
      error instanceof Remote.RemoteError && /DataCloneError|could not be cloned/.test(`${error.remote?.name} ${error.message}`))
    await assert.rejects(remote.ask('bad-error'), (error: unknown) => error instanceof Remote.RemoteError)
    assert.equal(await remote.ask('ok'), 'ok', 'the actor keeps serving afterwards')
    assert.equal(remote.pending, 0)
    remote.close()
    stop()
  } finally {
    port1.close()
    port2.close()
    await local.stop()
  }
})
