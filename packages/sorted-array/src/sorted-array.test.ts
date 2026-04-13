import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('numbers', () => {
  const xs = A.numbers()
  for (let i = 0; i < 1000; i++) {
    A.insert(xs, Math.random())
  }
  assert.deepEqual(xs.values, xs.values.slice().sort((a, b) => a - b))
})

await test('strings', () => {
  const xs = A.strings()
  assert.deepEqual(A.insert(xs, 'foo'), -1)
  assert.deepEqual(A.insert(xs, 'bar'), -1)
  assert.deepEqual(A.insert(xs, 'baz'), -2)
  assert.deepEqual(xs.values, [ 'bar', 'baz', 'foo' ])
  assert.equal(A.hasValue(xs, 'foo'), true)
  assert.equal(A.hasKey(xs, 'bar'), true)
  assert.equal(A.has(xs, _ => A.Cmp.string(_, 'baz')), true)
  assert.equal(A.hasValue(xs, 'zig'), false)
})
