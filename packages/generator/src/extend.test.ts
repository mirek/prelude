import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('extend', () => {
  assert.deepEqual(G.pipe(
    G.range(1, 5),
    G.map(value => ({ value })),
    G.extend(_ => ({ double: _.value * 2 })),
    G.array
  ), [
    { value: 1, double: 2 },
    { value: 2, double: 4 },
    { value: 3, double: 6 },
    { value: 4, double: 8 },
    { value: 5, double: 10 }
  ])
})
