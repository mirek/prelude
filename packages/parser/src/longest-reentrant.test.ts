import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('reentry', () => {
  type Node =
    | number
    | { type: 'Eq', lhs: Node, rhs: Node }
  const p_ =
    (reader: P.Reader.t) =>

      // eslint-disable-next-line no-use-before-define
      P.map(P.seq(p, '=', p), _ => ({ type: 'Eq' as const, lhs: _[0], rhs: _[2] }))(reader)

  const p: P.t<Node> =
    reader =>
      P.first(
        p_,
        P.map(P.charRange('09'), parseFloat)
      )(reader)
  assert.deepEqual(P.parser(p)('1=2=3'), {
    type: 'Eq',
    lhs: 1,
    rhs: {
      type: 'Eq',
      lhs: 2,
      rhs: 3
    }
  })
})

await test('longest', () => {
  const p = P.longestReentrant('a', 'aa')
  assert.deepEqual(P.parser(P.star(p))('aaaaa'), [
    'aa',
    'aa',
    'a'
  ])
})

await test('a throwing alternative does not poison later calls at the same reader', () => {
  const reader = P.Reader.of('ab')
  let boom = true
  const throwing: P.t<string> = () => {
    if (boom) {
      throw new Error('boom')
    }
    return P.Result.ok(reader, 'recovered', 1)
  }
  const viaFirst = P.first(throwing, P.lit('a'))
  assert.throws(() => viaFirst(reader), /boom/)
  boom = false
  assert.equal((viaFirst(reader) as P.Result.Ok<string>).value, 'recovered', 'first tries the alternative again')

  boom = true
  const viaLongest = P.longestReentrant(throwing, P.lit('a'))
  assert.throws(() => viaLongest(reader), /boom/)
  boom = false
  assert.equal((viaLongest(reader) as P.Result.Ok<string>).value, 'recovered')
})
