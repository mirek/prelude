import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('lift', () => {
  const parser = P.parser(P.seq(
    '<',
    /\w+/,
    '>'
  ))
  const parsed = parser('<abc>')
  const a: '<' = parsed[0]
  const b: string = parsed[1]
  const c: '>' = parsed[2]
  assert.equal(a, '<')
  assert.equal(b, 'abc')
  assert.equal(c, '>')
})
