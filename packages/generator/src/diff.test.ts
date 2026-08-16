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

await test('the returned function can be applied more than once', () => {
  const d = G.diff([ 4, 5, 6 ], Cmp.number)
  const first = [ ...d([ 1, 2, 3 ]) ]
  const second = [ ...d([ 1, 2, 3 ]) ]
  assert.deepEqual(first, second)
  assert.equal(first.filter(([ , rhs ]) => rhs !== undefined).length, 3, 'rhs values are still there on the second run')
  assert.deepEqual([ ...d([ 5 ]) ], [ [ undefined, 4 ], [ 5, 5 ], [ undefined, 6 ] ])
})

await test('rhs is not consumed until the returned generator is iterated', () => {
  let pulls = 0
  const rhs =
    function* () {
      for (const x of [ 6, 4, 5 ]) {
        pulls++
        yield x
      }
    }
  const d = G.diff(rhs(), Cmp.number)
  assert.equal(pulls, 0, 'constructing the operator must not drain rhs')
  const g = d([ 1, 5 ])
  assert.equal(pulls, 0, 'creating the generator must not drain rhs')
  assert.deepEqual([ ...g ], [ [ 1, undefined ], [ undefined, 4 ], [ 5, 5 ], [ undefined, 6 ] ])
  assert.equal(pulls, 3)
  // The sorted rhs is memoised, so a second application does not re-pull the (now exhausted) source.
  assert.deepEqual([ ...d([ 4 ]) ], [ [ 4, 4 ], [ undefined, 5 ], [ undefined, 6 ] ])
  assert.equal(pulls, 3)
})

await test('a throwing rhs does not throw at construction', () => {
  const rhs =
    function* (): Generator<number> {
      yield 1
      throw new Error('boom')
    }
  const d = G.diff(rhs(), Cmp.number)
  const g = d([ 1 ])
  assert.throws(() => [ ...g ], /boom/)
})
