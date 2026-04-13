import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('type predicate', () => {
  const nonnullish =
    <T>(value: T): value is NonNullable<T> =>
      value != null
  const xs = G.pipe(
    [ 1, undefined ],
    G.filter(nonnullish),
    G.array
  )
  const ys: number[] = xs
  assert.deepEqual(ys, [ 1 ])
})
