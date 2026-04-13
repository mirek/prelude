import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('next', () => {
  const p = P.next(P.re(/\d+/))
  const input = 'foo 123 bar 123 baz'
  const a = p(P.Reader.of(input))
  assert.deepEqual(a, { reader: { input, offset: 7 }, value: '123' })
  const b = p(a.reader)
  assert.deepEqual(b, { reader: { input, offset: 15 }, value: '123' })
})

await test('liftable next', () => {
  const p = P.next('[')
  const input = 'foo [123] bar [123] baz'
  const a = p(P.Reader.of(input))
  assert.deepEqual(a, { reader: { input, offset: 5 }, value: '[' })
  const b = p(a.reader)
  assert.deepEqual(b, { reader: { input, offset: 15 }, value: '[' })
})
