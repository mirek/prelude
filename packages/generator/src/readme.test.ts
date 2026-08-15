import * as G from './index.js'
import * as Cmp from '@prelude/cmp'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('the Readme usage example runs as written', () => {
  assert.deepEqual(G.pipe(G.charRange('a', 'c'), G.cycle, G.take(10), G.array), [ 'a', 'b', 'c', 'a', 'b', 'c', 'a', 'b', 'c', 'a' ])
  assert.equal('pipe1' in G, false)
  assert.deepEqual([ ...G.diff([ 4, 5, 6 ], Cmp.number)([ 1, 2, 3 ]) ].length, 6)
})
