import * as Emitter from './index.js'
import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

type TestEvents = Emitter.Events & {
  message: [ message: string ]
  data: [ data: { id: number, value: string } ]
  empty: []
}

await test('eventNames should list all events with listeners', () => {
  const emitter = Emitter.of<TestEvents>()
  assert.deepEqual(emitter.eventNames(), [])

  const noop = () => {}
  emitter.on('message', noop)
  assert.deepEqual(emitter.eventNames(), ['message'])

  emitter.on('data', noop)
  assert.ok((emitter.eventNames()).includes('message'))
  assert.ok((emitter.eventNames()).includes('data'))
  assert.equal(emitter.eventNames().length, 2)

  emitter.off('message', noop)
  assert.deepEqual(emitter.eventNames(), ['data'])
})

await test('listeners should return all listeners for an event', () => {
  const emitter = Emitter.of<TestEvents>()
  const listener1 = mock.fn()
  const listener2 = mock.fn()

  assert.equal(emitter.listeners('message'), undefined)

  emitter.on('message', listener1)
  assert.equal(emitter.listeners('message')?.size, 1)
  assert.equal(emitter.listeners('message')?.has(listener1), true)

  emitter.on('message', listener2)
  assert.equal(emitter.listeners('message')?.size, 2)
  assert.equal(emitter.listeners('message')?.has(listener1), true)
  assert.equal(emitter.listeners('message')?.has(listener2), true)
})

await test('hasListener should correctly check for listeners', () => {
  const emitter = Emitter.of<TestEvents>()
  const listener = mock.fn()

  assert.equal(emitter.hasListener(), false)
  assert.equal(emitter.hasListener('message'), false)
  assert.equal(emitter.hasListener('message', listener), false)

  emitter.on('message', listener)
  assert.equal(emitter.hasListener(), true)
  assert.equal(emitter.hasListener('message'), true)
  assert.equal(emitter.hasListener('message', listener), true)
  assert.equal(emitter.hasListener('data'), false)

  emitter.off('message', listener)
  assert.equal(emitter.hasListener('message'), false)
  assert.equal(emitter.hasListener(), false)
})

await test('emit should call all registered listeners', () => {
  const emitter = Emitter.of<TestEvents>()
  const listener1 = mock.fn()
  const listener2 = mock.fn()

  emitter.on('message', listener1)
  emitter.on('message', listener2)

  emitter.emit('message', 'hello')

  assert.deepEqual((listener1).mock.calls.at(-1)?.arguments, ['hello'])
  assert.deepEqual((listener2).mock.calls.at(-1)?.arguments, ['hello'])
})

await test('emit should handle errors in listeners', () => {
  const emitter = Emitter.of<TestEvents>()
  const errorListener = mock.fn()
  const error = new Error('listener error')

  emitter.on('error', errorListener)

  emitter.on('message', () => {
    throw error
  })

  emitter.emit('message', 'hello')

  assert.deepEqual((errorListener).mock.calls.at(-1)?.arguments, [error])
})

await test('off should remove listeners', () => {
  const emitter = Emitter.of<TestEvents>()
  const messageListener1 = mock.fn()
  const messageListener2 = mock.fn()
  const dataListener = mock.fn()

  emitter.on('message', messageListener1)
  emitter.on('message', messageListener2)
  emitter.on('data', dataListener)

  const removed = emitter.off('message', messageListener1)
  assert.equal(removed, 1)
  emitter.emit('message', 'test')
  assert.equal((messageListener1).mock.callCount(), 0)
  assert.deepEqual((messageListener2).mock.calls.at(-1)?.arguments, ['test'])

  const removedAll = emitter.off('message')
  assert.equal(removedAll, 1)
  emitter.emit('message', 'test2')
  assert.equal((messageListener2).mock.callCount(), 1)

  emitter.on('message', messageListener1)
  const removedEverything = emitter.off()
  assert.equal(removedEverything, 2)
  assert.equal(emitter.hasListener(), false)
})

await test('on should register a listener and return unregister function', () => {
  const emitter = Emitter.of<TestEvents>()
  const listener = mock.fn()

  const off = emitter.on('message', listener)
  assert.equal(emitter.hasListener('message', listener), true)

  emitter.emit('message', 'test')
  assert.deepEqual((listener).mock.calls.at(-1)?.arguments, ['test'])

  off()
  assert.equal(emitter.hasListener('message', listener), false)
})

await test('on should emit newListener event', () => {
  const emitter = Emitter.of<TestEvents>()
  const newListenerSpy = mock.fn()
  const listener = mock.fn()
  emitter.on('newListener', newListenerSpy)
  emitter.on('message', listener)
  assert.deepEqual((newListenerSpy).mock.calls.at(-1)?.arguments, ['message', listener])
})

await test('on should throw if registering the same listener twice', () => {
  const emitter = Emitter.of<TestEvents>()
  const listener = mock.fn()

  emitter.on('message', listener)

  assert.throws(() => {
    emitter.on('message', listener)
  })
})

await test('once should call listener only once', async () => {
  const emitter = Emitter.of<TestEvents>()
  const listener = mock.fn()

  emitter.once('message', listener)

  emitter.emit('message', 'first')
  emitter.emit('message', 'second')

  assert.equal((listener).mock.callCount(), 1)
  assert.deepEqual((listener).mock.calls.at(-1)?.arguments, ['first'])
})

await test('onceIf should call listener only when predicate matches', () => {
  const emitter = Emitter.of<TestEvents>()
  const listener = mock.fn()

  emitter.onceIf('message',
    message => message.includes('world'),
    listener
  )

  emitter.emit('message', 'hello')
  assert.equal((listener).mock.callCount(), 0)

  emitter.emit('message', 'hello world')
  assert.deepEqual((listener).mock.calls.at(-1)?.arguments, ['hello world'])

  emitter.emit('message', 'hello world again')
  assert.equal((listener).mock.callCount(), 1)
})

await test('eventually should resolve when event is emitted', async () => {
  const emitter = Emitter.of<TestEvents>()

  Emitter.after(50, () => {
    emitter.emit('message', 'async response')
  })

  const [ result ] = await emitter.eventually('message', 1000)
  assert.equal(result, 'async response')
})

await test('eventually should reject on timeout', async () => {
  const emitter = Emitter.of<TestEvents>()

  await assert.rejects(emitter.eventually('message', 50), (e: { code?: string }) => e.code === 'timeout')
})

await test('eventuallyIf should resolve when predicate matches', async () => {
  const emitter = Emitter.of<TestEvents>()

  Emitter.after(50, () => {
    emitter.emit('data', { id: 1, value: 'first' })
  })

  Emitter.after(100, () => {
    emitter.emit('data', { id: 2, value: 'second' })
  })

  const result = await emitter.eventuallyIf('data', data => data.id === 2, 1000)

  assert.deepEqual(result, [ { id: 2, value: 'second' } ])
})

await test('off should emit removeListener event', () => {
  const emitter = Emitter.of<TestEvents>()
  const removeListenerSpy = mock.fn()
  const listener = mock.fn()
  emitter.on('removeListener', removeListenerSpy)
  const off = emitter.on('message', listener)
  off()
  assert.deepEqual((removeListenerSpy).mock.calls.at(-1)?.arguments, ['message', listener])
})

await test('meta events work with standard event types', () => {
  const emitter = Emitter.of<TestEvents>()
  const metaListener = mock.fn()
  const regularListener = mock.fn()
  emitter.on('newListener', metaListener)
  emitter.on('message', regularListener)
  assert.deepEqual((metaListener).mock.calls.at(-1)?.arguments, ['message', regularListener])
})
