import assert from 'node:assert/strict'
import test from 'node:test'
import WaitGroup from './index.js'

test('simple', async () => {
  const wg = new WaitGroup(3)
  setTimeout(() => {
    wg.done(3)
  }, 100)
  await assert.doesNotReject(() => wg.wait())
})

test('rejects', () => {
  const wg = new WaitGroup(3)
  assert.throws(() => wg.done(4), { message: 'negative counter' })
})
