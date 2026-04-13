import * as Emitter from './index.js'
import { test, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

afterEach(() => {
  mock.restoreAll()
})

await test('after should call callback after delay', async () => {
  const callback = mock.fn()
  Emitter.after(50, callback)
  assert.equal(callback.mock.callCount(), 0)
  await new Promise(resolve => setTimeout(resolve, 60))
  assert.equal(callback.mock.callCount(), 1)
})

await test('after should return cancellation function', async () => {
  const callback = mock.fn()
  const cancel = Emitter.after(50, callback)
  cancel()
  await new Promise(resolve => setTimeout(resolve, 60))
  assert.equal(callback.mock.callCount(), 0)
})

await test('calling cancel multiple times should log a warning', async () => {
  const callback = mock.fn()
  const cancel = Emitter.after(50, callback)
  const spy = mock.method(Emitter.afterLog, 'warn', () => {})
  cancel()
  cancel()
  await new Promise(resolve => setTimeout(resolve, 60))
  assert.equal(callback.mock.callCount(), 0)
  assert.equal(spy.mock.callCount(), 1)
})
