import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('left', () => {
  const p = P.parser(P.left(P.re(/\d+/), '='))
  assert.deepEqual(p('123='), '123')
})
