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

await test('deletes agree with a multiset model', () => {
  // Deterministic LCG so the failing sequence is reproducible.
  let seed = 12345
  const random = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed % n
  }
  for (let trial = 0; trial < 200; trial++) {
    const tree = numbers()
    const model = new Map<number, number>()
    for (let step = 0; step < 60; step++) {
      const key = random(12)
      if (random(3) === 0) {
        const n = 1 + random(3)
        const have = model.get(key) ?? 0
        const [ value, count ] = RbTree.delete(tree, key, n)
        assert.equal(count, have === 0 ? 0 : have - n, `trial ${trial} step ${step}`)
        assert.equal(value, have !== 0 && have <= n ? key : undefined, `trial ${trial} step ${step}`)
        if (have <= n) {
          model.delete(key)
        } else {
          model.set(key, have - n)
        }
      } else {
        const n = 1 + random(3)
        RbTree.insert(tree, key, n)
        model.set(key, (model.get(key) ?? 0) + n)
      }
      RbTree.assert(tree)
      const expected = [ ...model.keys() ].sort((a, b) => a - b)
      assert.deepEqual([ ...RbTree.each(tree) ], expected, `trial ${trial} step ${step}`)
      assert.equal(RbTree.length(tree), [ ...model.values() ].reduce((a, b) => a + b, 0))
      for (const key_ of expected) {
        assert.equal(RbTree.getc(tree, key_), model.get(key_))
      }
    }
    while (!RbTree.empty(tree)) {
      const [ min ] = RbTree.shiftCount(tree)
      assert.equal(min, [ ...model.keys() ].sort((a, b) => a - b)[0])
      model.delete(min)
      RbTree.assert(tree)
    }
    RbTree.insert(tree, 1)
    assert.equal(RbTree.length(tree), 1)
  }
})
