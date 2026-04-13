import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('right', () => {
  const p = P.parser(P.right('=', P.re(/\d+/)))
  assert.deepEqual(p('=123'), '123')
})
