import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('from-until', () => {
  const p = P.parser(P.fromUntil('BEGIN', 'END'))
  assert.deepEqual(p('BEGIN END'), { head: 'BEGIN', inner: ' ', tail: 'END' })
  assert.deepEqual(p('BEGIN foo END'), { head: 'BEGIN', inner: ' foo ', tail: 'END' })
})
