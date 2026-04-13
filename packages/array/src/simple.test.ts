import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('deleteSwapRandom', () => {
  const a = A.indices(1000)
  const b = A.clone(a)
  assert.deepEqual(a, b)
  const c: number[] = []
  while (b.length > 0) {
    c.push(A.deleteSwapRandom(b))
  }
  assert.equal((c).length, 1000)
  assert.deepEqual(A.sorted(c, A.Cmp.number), a)
})

await test('unique', () => {
  assert.deepEqual(A.unique([ 3, 5, 5, 7, 3, 7 ], _ => _), [ 3, 5, 7 ])
})

await test('groups', () => {
  assert.deepEqual(A.groups([ 3, 5, 4, 2, 5, 7, 2 ], _ => _ % 2), [
    [ 3, 5, 5, 7 ],
    [ 4, 2, 2 ]
  ])
})
