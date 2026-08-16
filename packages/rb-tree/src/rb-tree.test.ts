import * as RbTree from './rb-tree.js'
import * as Bag from './bag.js'
import * as Map_ from './map.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const numbers = () => RbTree.of(RbTree.Cmp.number, (_: number) => _)

await test('tree stays usable after deleting its last element', () => {
  const tree = numbers()
  RbTree.insert(tree, 1)
  RbTree.insert(tree, 2)
  assert.deepEqual(RbTree.delete(tree, 1), [ 1, 0 ])
  assert.deepEqual(RbTree.delete(tree, 2), [ 2, 0 ])
  assert.equal(RbTree.empty(tree), true)
  assert.equal(RbTree.length(tree), 0)
  assert.deepEqual(RbTree.delete(tree, 3), [ undefined, 0 ])
  RbTree.insert(tree, 3)
  RbTree.assert(tree)
  assert.equal(RbTree.has(tree, 3), true)
  assert.deepEqual([ ...RbTree.each(tree) ], [ 3 ])
})

await test('tree stays usable after shifting its last element', () => {
  const tree = numbers()
  RbTree.insert(tree, 1)
  RbTree.insert(tree, 2)
  assert.equal(RbTree.shift(tree), 1)
  assert.equal(RbTree.shift(tree), 2)
  assert.equal(RbTree.empty(tree), true)
  assert.deepEqual(RbTree.maybeShiftCount(tree), [ undefined, 0 ])
  RbTree.insert(tree, 3)
  RbTree.assert(tree)
  assert.deepEqual([ ...RbTree.each(tree) ], [ 3 ])
})

await test('single element tree survives delete and shift round trips', () => {
  const tree = numbers()
  for (let i = 0; i < 5; i++) {
    RbTree.insert(tree, i)
    assert.deepEqual(RbTree.delete(tree, i), [ i, 0 ])
    assert.equal(RbTree.length(tree), 0)
    RbTree.insert(tree, i)
    assert.equal(RbTree.shift(tree), i)
    assert.equal(RbTree.length(tree), 0)
    RbTree.assert(tree)
  }
})

await test('bag can be emptied and refilled', () => {
  const bag = Bag.of(Bag.Cmp.string)
  Bag.add(bag, 'a')
  Bag.add(bag, 'b')
  assert.equal(Bag.remove(bag, 'a'), 0)
  assert.equal(Bag.remove(bag, 'b'), 0)
  assert.equal(Bag.empty(bag), true)
  Bag.add(bag, 'c')
  assert.equal(Bag.get(bag, 'c'), 1)
  assert.deepEqual(Bag.shift(bag), [ 'c', 1 ])
  Bag.add(bag, 'd')
  assert.equal(Bag.get(bag, 'd'), 1)
})

await test('map can be emptied by shift and refilled', () => {
  const map = Map_.of<string, number>(Map_.Cmp.string)
  Map_.set(map, 'a', 1)
  Map_.set(map, 'b', 2)
  assert.equal(Map_.shift(map), 1)
  assert.equal(Map_.shift(map), 2)
  Map_.set(map, 'c', 3)
  assert.equal(Map_.get(map, 'c'), 3)
})

await test('deleting an internal node returns its remaining count', () => {
  const tree = numbers()
  for (let k = 1; k <= 7; k++) {
    RbTree.insert(tree, k, 2)
  }
  assert.deepEqual(RbTree.delete(tree, 4, 1), [ undefined, 1 ])
  assert.equal(RbTree.getc(tree, 4), 1)
  assert.equal(RbTree.length(tree), 13)
  RbTree.assert(tree)
  assert.deepEqual(RbTree.delete(tree, 4, 1), [ 4, 0 ])
  assert.equal(RbTree.has(tree, 4), false)
  assert.equal(RbTree.length(tree), 12)
  RbTree.assert(tree)
  assert.deepEqual([ ...RbTree.each(tree) ], [ 1, 2, 3, 5, 6, 7 ])
  assert.deepEqual(RbTree.delete(tree, 2, 5), [ 2, -3 ])
  assert.equal(RbTree.length(tree), 10)
})

await test('bag partial removal from an internal node keeps remaining occurrences', () => {
  const bag = Bag.of(Bag.Cmp.number)
  for (const k of [ 1, 2, 3 ]) {
    Bag.add(bag, k, 5)
  }
  assert.equal(Bag.remove(bag, 2, 1), 4)
  assert.equal(Bag.get(bag, 2), 4)
  assert.equal(Bag.length(bag), 14)
})

await test('count with an inverted range query is zero', () => {
  const tree = numbers()
  for (let k = 1; k <= 5; k++) {
    RbTree.insert(tree, k)
  }
  assert.equal(RbTree.count(tree, { $r: 4, $l: 2 }), 0)
  assert.equal(RbTree.count(tree, { $re: 5, $le: 1 }), 0)
  assert.equal(RbTree.count(tree, { $r: 2, $l: 4 }), 1)
  assert.equal(RbTree.count(tree, { $re: 2, $le: 4 }), 3)
  assert.equal(RbTree.count(tree, { $r: 3, $l: 3 }), 0)
  assert.equal(RbTree.count(tree), 5)
})

await test('assertMonotonic detects a violation anywhere in the order', () => {
  const tree = numbers()
  RbTree.insert(tree, 1)
  RbTree.insert(tree, 2)
  RbTree.insert(tree, 3)
  RbTree.assertMonotonic(tree)
  // Corrupt the in-order sequence to 1, 3, 2 by swapping stored values.
  const nodes = [ ...RbTree.each(tree) ]
  assert.deepEqual(nodes, [ 1, 2, 3 ])
  const broken = RbTree.of<number, number>(RbTree.Cmp.number, _ => _)
  broken.root = { c: 2, l: { c: 1, l: undefined, v: 1, n: 1, r: undefined, s: 1 }, v: 3, n: 1, r: { c: 1, l: undefined, v: 2, n: 1, r: undefined, s: 1 }, s: 3 }
  assert.deepEqual([ ...RbTree.each(broken) ], [ 1, 3, 2 ])
  assert.throws(() => RbTree.assertMonotonic(broken), /Monotonic/)
})
