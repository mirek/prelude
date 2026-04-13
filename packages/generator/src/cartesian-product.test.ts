import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('self cartesian product', () => {
  const xs = G.pipe(G.range(3, 5), G.cartesianProduct(), G.array)
  assert.deepEqual(xs, [
    [ 3, 3 ],
    [ 3, 4 ],
    [ 3, 5 ],
    [ 4, 3 ],
    [ 4, 4 ],
    [ 4, 5 ],
    [ 5, 3 ],
    [ 5, 4 ],
    [ 5, 5 ]
  ])
})

await test('cartesian product', () => {
  const xs = G.range(3, 5)
  const ys = G.charRange('a', 'c')
  const zs = G.pipe(xs, G.cartesianProduct(ys), G.array)
  assert.deepEqual(zs, [
    [ 3, 'a' ],
    [ 3, 'b' ],
    [ 3, 'c' ],
    [ 4, 'a' ],
    [ 4, 'b' ],
    [ 4, 'c' ],
    [ 5, 'a' ],
    [ 5, 'b' ],
    [ 5, 'c' ]
  ])
})
