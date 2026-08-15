import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('times', () => {
  const q = P.times(3, 'a')
  const p = P.parser(q)
  const r: 'a'[] = p('aaa')
  assert.deepEqual(r, [ 'a', 'a', 'a' ])
})

await test('the failure message reports how many repetitions matched', () => {
  const result = P.times(3, 'a')(P.Reader.of('aa'))
  assert.equal(P.Result.failed(result), true)
  assert.match(result.reason ?? '', /Expected 3 times, got 2 times only/)
})
