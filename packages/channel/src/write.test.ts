import * as Ch from './index.js'
import { afterRandom } from './test.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('write, read on semaphore', async () => {
  const ch = Ch.of<number>()
  ch.writeIgnore(3)
  assert.deepEqual(await ch.read(), 3)
})

await test('two delayed writes, two reads', async () => {
  const ch = Ch.of<number>()
  afterRandom(100, () => ch.write(3))
  afterRandom(100, () => ch.write(5))
  const a = await ch.read()
  const b = await ch.read()
  assert.deepEqual(a + b, 8)
})
