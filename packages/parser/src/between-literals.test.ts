import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('betweenLiterals', () => {
  const p = P.betweenLiterals('<!--', '-->')
  assert.deepEqual(p(P.Reader.of('<!--abc-->')), P.Result.ok(P.Reader.of('<!--abc-->', 10), 'abc'))
})

await test('str', () => {
  const p = P.betweenLiterals('"', '"')
  assert.deepEqual(p(P.Reader.of('"abc"')), P.Result.ok(P.Reader.of('"abc"', 5), 'abc'))
})

await test('attr', () => {
  const id =
    P.join(P.star(P.charRange('09azAZ'), 1))

  const str =
    P.either(
      P.betweenLiterals('\'', '\''),
      P.betweenLiterals('"', '"')
    )

  const attr =
    P.map(P.seq(P.ws0, id, '=', str), _ => [ _[1], _[3] ])

  const p = P.parser(attr)

  assert.deepEqual(p('foo="bar"'), [ 'foo', 'bar' ])
})
