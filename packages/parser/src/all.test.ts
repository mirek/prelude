import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('all', () => {
  const p = P.parser(P.all(P.re(/\d+/)))
  assert.deepEqual(p('foo 123 bar 456 baz'), [ '123', '456' ])
})
