import * as Emitter from './index.js'
import { test, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

afterEach(() => {
  mock.restoreAll()
  mock.timers.reset()
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

await test('after with a delay above the setTimeout maximum fires only after the full delay', () => {
  mock.timers.enable({ apis: [ 'setTimeout', 'Date' ] })
  const callback = mock.fn()
  Emitter.after(2 ** 31, callback)
  mock.timers.tick(2 ** 31 - 1)
  assert.equal(callback.mock.callCount(), 0)
  mock.timers.tick(1)
  assert.equal(callback.mock.callCount(), 1)
})

await test('cancelling after with a delay above the setTimeout maximum clears the chained timer', () => {
  mock.timers.enable({ apis: [ 'setTimeout', 'Date' ] })
  const callback = mock.fn()
  const cancel = Emitter.after(3 * 2 ** 31, callback)
  mock.timers.tick(2 ** 31)
  cancel()
  mock.timers.tick(3 * 2 ** 31)
  assert.equal(callback.mock.callCount(), 0)
})

await test('a late chunk does not delay after past its deadline', () => {
  mock.timers.enable({ apis: [ 'setTimeout', 'Date' ] })
  const max = 2_147_483_647
  const callback = mock.fn()
  Emitter.after(2 * max + 10, callback)
  // The process "resumes" 10ms past the deadline; the first chunk fires late.
  mock.timers.setTime(Date.now() + 2 * max + 20)
  mock.timers.tick(1)
  assert.equal(callback.mock.callCount(), 1)
})

await test('after with a delay above the setTimeout maximum does not fire immediately or warn', async () => {
  const warnings: string[] = []
  const onWarning = (warning: Error) => { warnings.push(warning.name) }
  process.on('warning', onWarning)
  const callback = mock.fn()
  const cancel = Emitter.after(2 ** 31, callback)
  try {
    await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(callback.mock.callCount(), 0)
    assert.ok(!warnings.includes('TimeoutOverflowWarning'), 'unexpected TimeoutOverflowWarning')
  } finally {
    cancel()
    process.off('warning', onWarning)
  }
})
