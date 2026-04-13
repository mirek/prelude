import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('groupObject', () => {
  assert.deepEqual(G.pipe(G.range(1, 10), G.groupObject(_ => _ % 2 === 0 ? 'even' : 'odd')), {
    even: [ 2, 4, 6, 8, 10 ],
    odd: [ 1, 3, 5, 7, 9 ]
  })
})
