import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('interleave', () => {
  const g = G.interleave(
    G.cycle(G.range(0, 9)),
    G.cycle(G.charRange('a', 'z')),
    G.cycle(G.charRange('A', 'Z'))
  )
  assert.deepEqual(G.pipe(g, G.take(3 * 5), G.array), [
    0, 'a', 'A',
    1, 'b', 'B',
    2, 'c', 'C',
    3, 'd', 'D',
    4, 'e', 'E'
  ])
  assert.deepEqual(G.pipe(
    G.interleave(
      G.cycle([ 'A', 'B' ]),
      G.cycle([ 3, 5, 7 ])
    ),
    G.take(6),
    G.array
  ), [
    'A', 3, 'B', 5, 'A', 7
  ])
})
