import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('extreme', () => {
  const values = [ 6, 3, 1, 8, 2, 4, 5, 7 ]
  const f = (a: number, b: number) => a - b
  assert.deepEqual(G.pipe(
    values,
    G.extreme(f)
  ), {
    min: values.slice().sort(f)[0],
    max: values.slice().sort(f).reverse()[0]
  })
})
