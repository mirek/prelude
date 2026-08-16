import * as Jsonrpc from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

class MockTransport implements Jsonrpc.EventTransport {
  readonly sent: string[] = []
  readonly listeners = new Map<string, Set<(value?: unknown) => void>>()
  sendError?: Error

  send(message: string, callback?: (error?: Error) => void) {
    this.sent.push(message)
    callback?.(this.sendError)
  }

  on(event: 'message' | 'close' | 'error', callback: (value?: unknown) => void) {
    const listeners = this.listeners.get(event) ?? new Set()
    listeners.add(callback)
    this.listeners.set(event, listeners)
  }

  removeListener(event: 'message' | 'close' | 'error', callback: (value?: unknown) => void) {
    this.listeners.get(event)?.delete(callback)
  }

  emit(event: 'message' | 'close' | 'error', value?: unknown) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(value)
    }
  }

  messages() {
    return this.sent.map(message => JSON.parse(message) as unknown)
  }
}

class MockAbortSignal implements Jsonrpc.AbortSignalLike {
  aborted = false
  reason?: unknown
  readonly listeners = new Set<() => void>()

  addEventListener(_event: 'abort', callback: () => void) {
    this.listeners.add(callback)
  }

  removeEventListener(_event: 'abort', callback: () => void) {
    this.listeners.delete(callback)
  }

  abort(reason: unknown) {
    this.aborted = true
    this.reason = reason
    for (const listener of this.listeners) {
      listener()
    }
  }
}

const methods: Jsonrpc.HandleOptions = {
  call(method, params) {
    switch (method) {
      case 'subtract': {
        if (Array.isArray(params)) {
          return Number(params[0]) - Number(params[1])
        }
        const named = params as Record<string, unknown>
        return Number(named.minuend) - Number(named.subtrahend)
      }
      case 'sum':
        return (params as readonly unknown[]).reduce<number>((total, value) => total + Number(value), 0)
      case 'get_data':
        return [ 'hello', 5 ]
      case 'invalid':
        throw new Jsonrpc.JsonRpcError(Jsonrpc.ErrorCode.invalidParams)
      default:
        throw new Jsonrpc.JsonRpcError(Jsonrpc.ErrorCode.methodNotFound)
    }
  }
}

await test('classifies requests without params and with string IDs', () => {
  assert.equal(Jsonrpc.kind({ jsonrpc: '2.0', id: 'request-1', method: 'get_data' }), 'call')
  assert.equal(Jsonrpc.kind({ jsonrpc: '2.0', method: 'update' }), 'notification')
  assert.equal(Jsonrpc.kind({ jsonrpc: '2.0', id: 'request-1', result: null }), 'result')
  assert.equal(Jsonrpc.kind({
    jsonrpc: '2.0',
    id: 'request-1',
    error: { code: -32600, message: 'Invalid Request' }
  }), 'error')
})

await test('a handler returning undefined produces a null result', async () => {
  const response = await Jsonrpc.processMessage(
    { jsonrpc: '2.0', id: 1, method: 'noop' },
    { call: () => undefined }
  )
  assert.deepEqual(response, { jsonrpc: '2.0', id: 1, result: null })
  assert.equal(Jsonrpc.isSuccessResponse(JSON.parse(JSON.stringify(response))), true)
})

await test('a result JSON cannot serialise becomes an internal error instead of dropping the response', async () => {
  const transport = new MockTransport()
  const exceptions: unknown[] = []
  const options: Jsonrpc.HandleOptions = {
    call: (method: string) => {
      if (method === 'big') {
        return 10n
      }
      if (method === 'bad-data') {
        throw new Jsonrpc.JsonRpcError(Jsonrpc.ErrorCode.invalidParams, 'bad', { fn: () => 1, big: 1n })
      }
      return 'ok'
    },
    exception: error => exceptions.push(error)
  }
  await Jsonrpc.handlePayload(transport, '{"jsonrpc":"2.0","id":1,"method":"big"}', options)
  await Jsonrpc.handlePayload(transport, '[{"jsonrpc":"2.0","id":2,"method":"fine"},{"jsonrpc":"2.0","id":3,"method":"big"},{"jsonrpc":"2.0","id":4,"method":"bad-data"}]', options)
  assert.deepEqual(transport.messages(), [
    { jsonrpc: '2.0', id: 1, error: { code: -32603, message: 'Internal error' } },
    [
      { jsonrpc: '2.0', id: 2, result: 'ok' },
      { jsonrpc: '2.0', id: 3, error: { code: -32603, message: 'Internal error' } },
      { jsonrpc: '2.0', id: 4, error: { code: -32603, message: 'Internal error' } }
    ]
  ])
  assert.equal(exceptions.length, 3)
  assert.ok(exceptions.every(error => error instanceof TypeError))
})

await test('throwing result/error hooks are reported through exception and do not drop batch responses', async () => {
  const transport = new MockTransport()
  const exceptions: unknown[] = []
  await Jsonrpc.handlePayload(transport, '[{"jsonrpc":"2.0","id":1,"method":"x"},{"jsonrpc":"2.0","id":9,"result":1},{"jsonrpc":"2.0","id":8,"error":{"code":1,"message":"m"}}]', {
    call: () => 'ok',
    result: () => { throw new Error('result hook') },
    error: () => { throw new Error('error hook') },
    exception: error => exceptions.push(error)
  })
  assert.deepEqual(transport.messages(), [ [ { jsonrpc: '2.0', id: 1, result: 'ok' } ] ])
  assert.deepEqual(exceptions.map(error => (error as Error).message), [ 'result hook', 'error hook' ])
})

await test('payload bytes are decoded as WHATWG UTF-8', () => {
  const text = (bytes: number[]) => Jsonrpc.payloadText(new Uint8Array(bytes))
  assert.equal(text([ 0xc0, 0xa2 ]), '\ufffd\ufffd', 'overlong encodings are not accepted')
  assert.equal(text([ 0xc0, 0x80 ]), '\ufffd\ufffd', 'overlong NUL is not accepted')
  assert.equal(text([ 0xed, 0xa0, 0x80 ]), '\ufffd\ufffd\ufffd', 'encoded surrogates are not accepted')
  assert.equal(text([ 0xe2, 0x41 ]), '\ufffdA', 'bytes after a truncated sequence are still decoded')
  assert.equal(text(Array.from(new TextEncoder().encode('{"a":"é😀"}'))), '{"a":"é😀"}')
  assert.equal(Jsonrpc.payloadText(new TextEncoder().encode('[1]').buffer), '[1]')
})

await test('matches normative request and response examples', async () => {
  assert.deepEqual(await Jsonrpc.processMessage({
    jsonrpc: '2.0',
    method: 'subtract',
    params: [ 42, 23 ],
    id: 1
  }, methods), { jsonrpc: '2.0', id: 1, result: 19 })

  assert.deepEqual(await Jsonrpc.processMessage({
    jsonrpc: '2.0',
    method: 'subtract',
    params: { subtrahend: 23, minuend: 42 },
    id: 'named'
  }, methods), { jsonrpc: '2.0', id: 'named', result: 19 })

  assert.deepEqual(await Jsonrpc.processMessage({
    jsonrpc: '2.0',
    method: 'get_data',
    id: 9
  }, methods), { jsonrpc: '2.0', id: 9, result: [ 'hello', 5 ] })
})

await test('notifications never receive responses', async () => {
  const received: unknown[] = []
  const options: Jsonrpc.HandleOptions = {
    notification(method, params) {
      received.push([ method, params ])
    }
  }

  assert.equal(await Jsonrpc.processMessage({
    jsonrpc: '2.0',
    method: 'update',
    params: [ 1, 2, 3, 4, 5 ]
  }, options), undefined)
  assert.deepEqual(received, [ [ 'update', [ 1, 2, 3, 4, 5 ] ] ])
})

await test('returns standard invalid request, method, and parameter errors', async () => {
  assert.deepEqual(await Jsonrpc.processMessage({ jsonrpc: '2.0', method: 1, params: 'bar' }), {
    jsonrpc: '2.0',
    id: null,
    error: { code: -32600, message: 'Invalid Request' }
  })

  assert.deepEqual(await Jsonrpc.processMessage({
    jsonrpc: '2.0',
    method: 'missing',
    id: 1
  }), {
    jsonrpc: '2.0',
    id: 1,
    error: { code: -32601, message: 'Method not found' }
  })

  assert.deepEqual(await Jsonrpc.processMessage({
    jsonrpc: '2.0',
    method: 'invalid',
    id: 2
  }, methods), {
    jsonrpc: '2.0',
    id: 2,
    error: { code: -32602, message: 'Invalid params' }
  })
})

await test('processes mixed and notification-only batches', async () => {
  const notifications: string[] = []
  const options: Jsonrpc.HandleOptions = {
    ...methods,
    notification(method) {
      notifications.push(method)
    }
  }

  assert.deepEqual(await Jsonrpc.processMessage([
    { jsonrpc: '2.0', method: 'sum', params: [ 1, 2, 4 ], id: '1' },
    { jsonrpc: '2.0', method: 'notify_hello', params: [ 7 ] },
    { jsonrpc: '2.0', method: 'subtract', params: [ 42, 23 ], id: '2' },
    { foo: 'boo' },
    { jsonrpc: '2.0', method: 'missing', id: '5' }
  ], options), [
    { jsonrpc: '2.0', id: '1', result: 7 },
    { jsonrpc: '2.0', id: '2', result: 19 },
    { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } },
    { jsonrpc: '2.0', id: '5', error: { code: -32601, message: 'Method not found' } }
  ])
  assert.deepEqual(notifications, [ 'notify_hello' ])

  assert.deepEqual(await Jsonrpc.processMessage([]), {
    jsonrpc: '2.0',
    id: null,
    error: { code: -32600, message: 'Invalid Request' }
  })
  assert.equal(await Jsonrpc.processMessage([
    { jsonrpc: '2.0', method: 'one' },
    { jsonrpc: '2.0', method: 'two' }
  ], { notification() {} }), undefined)
})

await test('handlePayload returns parse errors and accepts buffers and event objects', async () => {
  const transport = new MockTransport()

  await Jsonrpc.handlePayload(transport, '{', methods)
  await Jsonrpc.handlePayload(
    transport,
    { data: new TextEncoder().encode(JSON.stringify({ jsonrpc: '2.0', method: 'sum', params: [ 1, 2 ], id: 3 })) },
    methods
  )

  assert.deepEqual(transport.messages(), [
    { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
    { jsonrpc: '2.0', id: 3, result: 3 }
  ])
})

await test('send helpers omit absent params and use standard error objects', async () => {
  const transport = new MockTransport()

  await Jsonrpc.sendCall(transport, 'id', 'read')
  await Jsonrpc.sendNotification(transport, 'changed')
  await Jsonrpc.sendResult(transport, 'id', undefined)
  await Jsonrpc.sendError(
    transport,
    'id',
    new Jsonrpc.JsonRpcError(Jsonrpc.ErrorCode.invalidParams, 'Bad input', { field: 'name' })
  )

  assert.deepEqual(transport.messages(), [
    { jsonrpc: '2.0', id: 'id', method: 'read' },
    { jsonrpc: '2.0', method: 'changed' },
    { jsonrpc: '2.0', id: 'id', result: null },
    {
      jsonrpc: '2.0',
      id: 'id',
      error: { code: -32602, message: 'Bad input', data: { field: 'name' } }
    }
  ])
})

await test('client correlates success and remote error responses', async () => {
  const transport = new MockTransport()
  const client = new Jsonrpc.Client(transport, { nextId: () => 'call-id' })

  const success = client.call<number>('sum', [ 1, 2 ])
  assert.equal(client.pendingCount, 1)
  transport.emit('message', JSON.stringify({ jsonrpc: '2.0', id: 'call-id', result: 3 }))
  assert.equal(await success, 3)
  assert.equal(client.pendingCount, 0)

  const failure = client.call('missing')
  transport.emit('message', JSON.stringify({
    jsonrpc: '2.0',
    id: 'call-id',
    error: { code: -32601, message: 'Method not found' }
  }))
  await assert.rejects(failure, error =>
    error instanceof Jsonrpc.RemoteError && error.code === -32601 && error.id === 'call-id')
  assert.equal(client.pendingCount, 0)

  client.dispose()
})

await test('client cleans pending calls on timeout, abort, close, and send failure', async () => {
  const timeoutTransport = new MockTransport()
  const timeoutClient = new Jsonrpc.Client(timeoutTransport)
  await assert.rejects(timeoutClient.call('slow', undefined, { timeout: 0 }), Jsonrpc.TimeoutError)
  assert.equal(timeoutClient.pendingCount, 0)
  timeoutClient.dispose()

  const abortTransport = new MockTransport()
  const abortClient = new Jsonrpc.Client(abortTransport)
  const signal = new MockAbortSignal()
  const aborted = abortClient.call('slow', undefined, { signal })
  const abortReason = new Error('stop')
  signal.abort(abortReason)
  await assert.rejects(aborted, error => error === abortReason)
  assert.equal(abortClient.pendingCount, 0)
  assert.equal(signal.listeners.size, 0)
  abortClient.dispose()

  const closeTransport = new MockTransport()
  const closeClient = new Jsonrpc.Client(closeTransport)
  const closed = closeClient.call('slow')
  closeTransport.emit('close')
  await assert.rejects(closed, Jsonrpc.TransportClosedError)
  assert.equal(closeClient.pendingCount, 0)

  const sendTransport = new MockTransport()
  sendTransport.sendError = new Error('send failed')
  const sendClient = new Jsonrpc.Client(sendTransport)
  await assert.rejects(sendClient.call('slow'), /send failed/)
  assert.equal(sendClient.pendingCount, 0)
  sendClient.dispose()
})

await test('a call timeout above the timer limit means no timeout', async () => {
  const warnings: string[] = []
  const onWarning = (warning: Error) => { warnings.push(warning.name) }
  process.on('warning', onWarning)
  try {
    const transport = new MockTransport()
    const client = new Jsonrpc.Client(transport, { nextId: () => 'call-id' })
    const slow = client.call<string>('slow', undefined, { timeout: 2 ** 31 })
    await new Promise(resolve => setTimeout(resolve, 20))
    transport.emit('message', JSON.stringify({ jsonrpc: '2.0', id: 'call-id', result: 'done' }))
    assert.equal(await slow, 'done')
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(warnings, [])
    assert.equal(client.pendingCount, 0)
    client.dispose()
  } finally {
    process.off('warning', onWarning)
  }
})

await test('duplicate and unknown responses do not create or retain pending calls', async () => {
  const transport = new MockTransport()
  const unknown: unknown[] = []
  const client = new Jsonrpc.Client(transport, {
    nextId: () => 1,
    onUnknownResponse(response) {
      unknown.push(response)
    }
  })

  const result = client.call('read')
  const response = { jsonrpc: '2.0', id: 1, result: 'ok' }
  await client.receive(JSON.stringify(response))
  assert.equal(await result, 'ok')
  assert.equal(client.pendingCount, 0)

  await client.receive(JSON.stringify(response))
  await client.receive(JSON.stringify({ jsonrpc: '2.0', id: 99, result: 'unknown' }))
  assert.equal(client.pendingCount, 0)
  assert.equal(unknown.length, 2)
  client.dispose()
})
