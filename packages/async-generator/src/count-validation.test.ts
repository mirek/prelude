import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('batch, window and skip reject invalid sizes', async () => {
  for (const n of [ 0, -1, 1.5, NaN, Infinity ]) {
    assert.throws(() => G.batch(n), RangeError, `batch ${n}`)
    assert.throws(() => G.window(n), RangeError, `window ${n}`)
  }
  for (const n of [ -1, 1.5, NaN ]) {
    assert.throws(() => G.skip(n), RangeError, `skip ${n}`)
  }
  assert.deepEqual(await G.pipe(G.ofIterable([ 1, 2, 3 ]), G.skip(Infinity), G.array), [])
  assert.deepEqual(await G.pipe(G.ofIterable([ 1, 2, 3 ]), G.window(2), G.array), [ [ 1, 2 ], [ 2, 3 ] ])
})
