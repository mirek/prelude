import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('between', () => {
  const number = P.map(P.whileChars('0123456789'), parseFloat)
  const between = P.between('(', ')', number)
  const p = P.parser(P.trim()(between))
  assert.deepEqual(p(' (123)\n'), 123)
})
