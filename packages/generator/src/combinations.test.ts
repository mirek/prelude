import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('k defaults to the input length', () => {
  assert.deepEqual([ ...G.combinations()([ 1, 2, 3 ]) ], [ [ 1, 2, 3 ] ])
  assert.deepEqual([ ...G.combinations(2)([ 1, 2, 3 ]) ], [ [ 1, 2 ], [ 1, 3 ], [ 2, 3 ] ])
})
