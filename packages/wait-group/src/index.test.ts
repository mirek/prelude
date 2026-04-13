import WaitGroup from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', async () => {
  const wg = new WaitGroup(3)
  setTimeout(() => {
    wg.done(3)
  }, 100)
  assert.equal(await wg.wait(), undefined)
})

await test('rejects', () => {
  const wg = new WaitGroup(3)
  assert.throws(() => wg.done(4), /negative counter/)
})
