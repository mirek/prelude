import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('firstExhaustive', () => {
  const q = P.firstExhaustive(
    P.Rfc8259.number,
    P.Rfc8259.null
  )
  const p = P.parser(q)
  assert.deepEqual(p('1234'), 1234)
  assert.deepEqual(p('null'), null)
  assert.throws(() => p('true'), /None of 2 alternatives matched at 0\./)
  assert.throws(() => p('1234null'), /None of 2 alternatives matched at 0\./)
  assert.throws(() => p('null '), /None of 2 alternatives matched at 0\./)
  assert.throws(() => p('null1'), /None of 2 alternatives matched at 0\./)
})
