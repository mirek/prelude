import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('star', () => {
  const p = P.parser(P.star(P.either('a', 'b')))
  assert.deepEqual(p('aab'), [ 'a', 'a', 'b' ])
})

await test('break on non-advancing parser', () => {
  const blank = P.map(P.seq(/ */, P.eol), _ => _[0])
  const p = P.parser(P.star(blank))
  assert.deepEqual(p(' \n\n'), [ ' ', '', '' ])
})
