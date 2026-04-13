import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('step', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 5),
    G.step(2),
    G.array
  ), [ 1, 3, 5 ])
  assert.throws(() => G.step(0), /Expected step to be greater than zero, got 0\./)
  assert.throws(() => G.step(1.5), /Expected step to be a safe integer, got 1\.5\./)
})
