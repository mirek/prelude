import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

function sequence(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

await test('numbers', () => {
  const values = A.numbers()
  const random = sequence(0x5eed)
  for (let index = 0; index < 1_000; index += 1) {
    A.insert(values, random())
  }
  assert.deepEqual(values.values, values.values.slice().sort((left, right) => left - right))
})

await test('strings', () => {
  const values = A.strings()
  assert.deepEqual(A.insert(values, 'foo'), -1)
  assert.deepEqual(A.insert(values, 'bar'), -1)
  assert.deepEqual(A.insert(values, 'baz'), -2)
  assert.deepEqual(values.values, [ 'bar', 'baz', 'foo' ])
  assert.equal(A.hasValue(values, 'foo'), true)
  assert.equal(A.hasKey(values, 'bar'), true)
  assert.equal(A.has(values, value => A.Cmp.string(value, 'baz')), true)
  assert.equal(A.hasValue(values, 'zig'), false)
})
