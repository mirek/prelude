import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('maybeMap', () => {
  const p = P.parser(P.maybeMap(P.Rfc8259.number, _ => _.value % 2 === 0 ? _ : P.Result.fail(_.reader, 'not even')))
  assert.deepEqual(p('1234'), 1234)
  assert.throws(() => p('123'), /not even/)
})
