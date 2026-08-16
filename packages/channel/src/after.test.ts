import * as Ch from './index.js'
import { test, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

afterEach(() => {
  mock.timers.reset()
})

await test('after closes writing after the delay', async () => {
  const ch = Ch.after(1)
  assert.equal(ch.doneWriting, false)
  await ch.next()
  assert.equal(ch.doneWriting, true)
})

await test('after with a delay above the setTimeout maximum closes only after the full delay', () => {
  mock.timers.enable({ apis: [ 'setTimeout', 'Date' ] })
  const ch = Ch.after(2 ** 31)
  mock.timers.tick(2 ** 31 - 1)
  assert.equal(ch.doneWriting, false)
  mock.timers.tick(1)
  assert.equal(ch.doneWriting, true)
})

await test('a late chunk does not delay the close past its deadline', () => {
  mock.timers.enable({ apis: [ 'setTimeout', 'Date' ] })
  const max = 2_147_483_647
  const ch = Ch.after(2 * max + 10)
  // The process "resumes" 10ms past the deadline; the first chunk fires late.
  mock.timers.setTime(Date.now() + 2 * max + 20)
  mock.timers.tick(1)
  assert.equal(ch.doneWriting, true)
})

await test('after with a delay above the setTimeout maximum does not close immediately or warn', async () => {
  const warnings: string[] = []
  const onWarning = (warning: Error) => { warnings.push(warning.name) }
  process.on('warning', onWarning)
  const ch = Ch.after(2 ** 31)
  try {
    await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(ch.doneWriting, false)
    assert.ok(!warnings.includes('TimeoutOverflowWarning'), 'unexpected TimeoutOverflowWarning')
  } finally {
    ch.close()
    process.off('warning', onWarning)
  }
})
