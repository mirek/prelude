import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('AssertionError shape', () => {
  const err = new $.AssertionError({ expected: 'a string', received: 1 })
  assert.equal(err.name, 'AssertionError')
  assert.equal(err.expected, 'a string')
  assert.equal(err.received, 1)
  assert.equal(err.key, undefined)
  assert.equal(err.cause, undefined)
  assert.equal(err.message, 'Expected a string, got 1.')
  assert.ok(err instanceof Error)
  assert.ok(err instanceof $.AssertionError)
})

await test('AssertionError key-path message', () => {
  const leaf = new $.AssertionError({ expected: 'a string', received: 1 })
  const l0 = new $.AssertionError({ expected: leaf.expected, received: leaf.received, key: 'baz', cause: leaf })
  const l1 = new $.AssertionError({ expected: l0.expected, received: l0.received, key: 0, cause: l0 })
  const l2 = new $.AssertionError({ expected: l1.expected, received: l1.received, key: 'bar', cause: l1 })
  const l3 = new $.AssertionError({ expected: l2.expected, received: l2.received, key: 'foo', cause: l2 })
  assert.equal(l3.message, 'Expected .foo.bar.0.baz to be a string, got 1.')
})

await test('fail / wrap helpers', () => {
  assert.throws(() => $.fail('a thing', 'x'), (err: unknown) => {
    assert.ok(err instanceof $.AssertionError)
    assert.equal(err.expected, 'a thing')
    assert.equal(err.received, 'x')
    return true
  })
})
