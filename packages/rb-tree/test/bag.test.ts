import * as Bag from '../src/bag.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', () => {
  const bag = Bag.of(Bag.Cmp.string)
  Bag.add(bag, 'foo')
  Bag.add(bag, 'bar')
  Bag.add(bag, 'bar')
  Bag.add(bag, 'bar')
  assert.equal(Bag.get(bag, 'foo'), 1)
  assert.equal(Bag.get(bag, 'bar'), 3)
  assert.equal(Bag.get(bag, 'baz'), -0)
  Bag.add(bag, 'bar', 2)
  assert.equal(Bag.get(bag, 'bar'), 5)
  assert.equal(Bag.remove(bag, 'bar', 2), 3)
  assert.equal(Bag.get(bag, 'bar'), 3)
  assert.equal(Bag.remove(bag, 'bar', 4), -1)
  assert.equal(Bag.get(bag, 'bar'), -0)
})
