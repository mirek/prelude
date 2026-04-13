import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('sep', () => {
  const number = P.map(P.whileChars('0123456789'), parseFloat)
  const p = P.parser(P.between('(', ')', P.sep0(P.ws1, number)))
  assert.deepEqual(p('(1 23  456)'), [ 1, 23, 456 ])
})
