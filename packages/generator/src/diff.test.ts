import * as Cmp from '@prelude/cmp'
import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('unsorted', () => {

  assert.deepEqual(G.pipe(
    [ 7, 4, 5 ],
    G.diff([ 4, 8, 1, 5 ], Cmp.number),
    G.array,
  ), [
    [ undefined, 1 ],
    [ 4, 4 ],
    [ 5, 5 ],
    [ 7, undefined ],
    [ undefined, 8 ]
  ])

  assert.deepEqual(G.pipe(
    [ 7, 4, 5 ],
    G.diff([ 4, 8, 1, 5 ], Cmp.number, { direction: Cmp.dsc }),
    G.array,
  ), [
    [ undefined, 8 ],
    [ 7, undefined ],
    [ 5, 5 ],
    [ 4, 4 ],
    [ undefined, 1 ]
  ])

  assert.deepEqual(G.pipe(
    [ 7, 4, 5 ],
    G.diff([ 4, 8, 1, 5 ], Cmp.reversed(Cmp.number)),
    G.array,
  ), [
    [ undefined, 8 ],
    [ 7, undefined ],
    [ 5, 5 ],
    [ 4, 4 ],
    [ undefined, 1 ]
  ])

})

await test('lhs, rhs having different type', () => {
  const xs =
    [ 2, 6, 4 ]
  const ys =
    [ '1', '7', '2', '5' ]
  const zs =
    G.pipe(
      xs,
      G.diff(ys, Cmp.number, { comparableRhs: parseFloat }),
      _ => _,
      G.array,
    )
  assert.deepEqual(zs, [
    [ undefined, '1' ],
    [ 2, '2' ],
    [ 4, undefined ],
    [ undefined, '5' ],
    [ 6, undefined ],
    [ undefined, '7' ]
  ])

})
