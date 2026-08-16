import * as F from './index.js'
import { test, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

afterEach(() => {
  mock.timers.reset()
})

await test('timeout', async () => {

  assert.equal(await F.timeout(0.1 * 1000, () => F.sleep(1000).then(() => true), F.noop), undefined)

  await assert.rejects(F.timeout(0.1 * 1000, () => F.sleep(1000).then(() => true), () => { throw new Error('Timeout.') }), /Timeout\./)

})

await test('special timeout', async () => {

  await assert.rejects(F.timeout(
      0.1 * 1000,
      () => F.sleep(0.2 * 1000).then(() => true),
      () => F.sleep(0.3 * 1000).then(() => { throw Error('Actually reject.') })
    ), /Actually reject\./)

})

await test('a synchronously throwing f rejects without firing g later', async () => {
  let fired = false
  await assert.rejects(F.timeout(20, () => { throw new Error('sync') }, () => { fired = true }), /sync/)
  await F.sleep(40)
  assert.equal(fired, false)
})

await test('a wait above the setTimeout maximum times out only after the full wait', async () => {
  mock.timers.enable({ apis: [ 'setTimeout', 'Date' ] })
  let settled = false
  const result = F.timeout(2 ** 31, () => new Promise<never>(() => {}), () => 'timed out')
  void result.then(() => { settled = true })
  mock.timers.tick(2 ** 31 - 1)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(settled, false)
  mock.timers.tick(1)
  assert.equal(await result, 'timed out')
})

await test('a late chunk does not delay the timeout past its deadline', async () => {
  mock.timers.enable({ apis: [ 'setTimeout', 'Date' ] })
  const max = 2_147_483_647
  const result = F.timeout(2 * max + 10, () => new Promise<never>(() => {}), () => 'timed out')
  // The process "resumes" 10ms past the deadline; the first chunk fires late.
  mock.timers.setTime(Date.now() + 2 * max + 20)
  mock.timers.tick(1)
  assert.equal(await result, 'timed out')
})

await test('a wait above the setTimeout maximum does not time out immediately or warn', async () => {
  const warnings: string[] = []
  const onWarning = (warning: Error) => { warnings.push(warning.name) }
  process.on('warning', onWarning)
  try {
    assert.equal(await F.timeout(2 ** 31, () => F.sleep(20).then(() => 'done'), () => 'timed out'), 'done')
    assert.ok(!warnings.includes('TimeoutOverflowWarning'), 'unexpected TimeoutOverflowWarning')
  } finally {
    process.off('warning', onWarning)
  }
})

await test('aborting the signal rejects with the reason, clears the timer and leaves f to settle on its own', async () => {
  const controller = new AbortController()
  let fired = false
  let fSettled = false
  const pending = F.timeout(50, () => F.sleep(20).then(() => { fSettled = true; return 'f' }), () => { fired = true; return 'g' }, { signal: controller.signal })
  controller.abort(new Error('stop'))
  await assert.rejects(pending, /stop/)
  await F.sleep(80)
  assert.equal(fired, false, 'g must not fire after abort')
  assert.equal(fSettled, true, 'f is not interrupted')
})

await test('an already aborted signal rejects timeout without calling f or g', async () => {
  const controller = new AbortController()
  controller.abort()
  let called = false
  await assert.rejects(F.timeout(10, () => { called = true; return Promise.resolve(1) }, () => 2, { signal: controller.signal }), (error: unknown) => error instanceof DOMException && error.name === 'AbortError')
  assert.equal(called, false)
})

await test('abort listeners are removed once timeout settles', async () => {
  const controller = new AbortController()
  assert.equal(await F.timeout(50, () => Promise.resolve('done'), () => 'late', { signal: controller.signal }), 'done')
  assert.equal(await F.timeout(1, () => F.sleep(50).then(() => 'late'), () => 'timed out', { signal: controller.signal }), 'timed out')
  // Aborting afterwards must not throw or reject anything.
  controller.abort()
})
