import * as P from './index.js'
import * as $ from '@prelude/refute'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('refute', () => {
  const a = P.refute(P.Rfc8259.number, $.between(3, 5))
  const p = P.parser(a)
  assert.deepEqual(p('4'), 4)
  assert.throws(() => p('12'), /Invalid value expected number between 3 and 5, got 12\./)
  assert.deepEqual(a(P.Reader.of('24')), P.Result.fail(P.Reader.of('24'), 'Invalid value expected number between 3 and 5, got 24.'))
})
