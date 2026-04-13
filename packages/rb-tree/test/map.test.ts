import * as Map_ from '../src/map.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', () => {
  const map = Map_.of<string, number>(Map_.Cmp.string)
  assert.equal(Map_.has(map, 'one'), false)
  assert.throws(() => Map_.get(map, 'one'), /Key 'one' not found\./)
  assert.equal(Map_.maybeGet(map, 'one'), undefined)
  Map_.set(map, 'one', 1)
  assert.equal(Map_.has(map, 'one'), true)
  assert.equal(Map_.get(map, 'one'), 1)
  assert.equal(Map_.maybeGet(map, 'one'), 1)
  Map_.set(map, 'two', 2)
  Map_.set(map, 'three', 3)
  Map_.set(map, 'four', 4)
  Map_.set(map, 'five', 5)
  Map_.set(map, 'six', 6)
  assert.deepEqual(Array.from(Map_.keys(map)), [
    'five',
    'four',
    'one',
    'six',
    'three',
    'two'
  ])
  assert.deepEqual(Array.from(Map_.values(map)), [
    5,
    4,
    1,
    6,
    3,
    2
  ])
  assert.deepEqual(Array.from(Map_.entries(map)), [
    [ 'five', 5 ],
    [ 'four', 4 ],
    [ 'one', 1 ],
    [ 'six', 6 ],
    [ 'three', 3 ],
    [ 'two', 2 ]
  ])
})
