import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('trim', () => {
  const p = P.parser(P.trim()(P.star(P.either('a', 'b'))))
  assert.deepEqual(p('  aab \n'), [ 'a', 'a', 'b' ])
})
