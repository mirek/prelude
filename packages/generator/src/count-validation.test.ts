import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('batch, window and step reject non-positive or non-integer sizes', () => {
  for (const n of [ 0, -1, 1.5, NaN, Infinity ]) {
    assert.throws(() => G.batch(n), RangeError, `batch ${n}`)
    assert.throws(() => G.window(n), RangeError, `window ${n}`)
    assert.throws(() => G.step(n), RangeError, `step ${n}`)
  }
  assert.deepEqual([ ...G.batch(2)([ 1, 2, 3 ]) ], [ [ 1, 2 ], [ 3 ] ])
  assert.deepEqual([ ...G.window(2)([ 1, 2, 3 ]) ], [ [ 1, 2 ], [ 2, 3 ] ])
  assert.deepEqual([ ...G.step(2)([ 1, 2, 3 ]) ], [ 1, 3 ])
})

await test('skip rejects negative or non-integer counts but allows Infinity', () => {
  for (const n of [ -1, 1.5, NaN ]) {
    assert.throws(() => G.skip(n), RangeError, `skip ${n}`)
  }
  assert.deepEqual([ ...G.skip(0)([ 1, 2 ]) ], [ 1, 2 ])
  assert.deepEqual([ ...G.skip(Infinity)([ 1, 2 ]) ], [])
})
