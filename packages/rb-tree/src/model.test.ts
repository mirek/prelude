import * as RbTree from './rb-tree.js'
import * as Bag from './bag.js'
import * as Map_ from './map.js'
import * as Testing from '@prelude/testing'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Model-based checks: every operation is applied to the tree and to a plain
// multiset (Map<key, count>); after each one all invariants must hold and every
// query must agree with the model. Failures report the seed and a shrunk trace.

type Op =
  | { type: 'insert', key: number, n: number }
  | { type: 'delete', key: number, n: number }
  | { type: 'shift' }
  | { type: 'count', l?: number, le?: number, r?: number, re?: number }

const keys = 12

const op =
  (rng: Testing.Prng): Op => {
    const roll = rng.float()
    if (roll < 0.5) {
      return { type: 'insert', key: rng.int(keys), n: rng.between(1, 3) }
    }
    if (roll < 0.8) {
      return { type: 'delete', key: rng.int(keys), n: rng.between(1, 4) }
    }
    if (roll < 0.9) {
      return { type: 'shift' }
    }
    const query: Op = { type: 'count' }
    if (rng.bool()) {
      query[rng.bool() ? 'l' : 'le'] = rng.between(-1, keys)
    }
    if (rng.bool()) {
      query[rng.bool() ? 'r' : 're'] = rng.between(-1, keys)
    }
    return query
  }

const simplify =
  (op: Op): Op[] => {
    switch (op.type) {
      case 'insert':
      case 'delete':
        return [
          ...(op.n > 1 ? [ { ...op, n: op.n - 1 } ] : []),
          ...(op.key > 0 ? [ { ...op, key: op.key - 1 } ] : [])
        ]
      default:
        return []
    }
  }

const sortedKeys =
  (model: Map<number, number>) =>
    [ ...model.keys() ].sort((a, b) => a - b)

const total =
  (model: Map<number, number>) =>
    [ ...model.values() ].reduce((a, b) => a + b, 0)

/**
 * Number of occurrences in `model` selected by the same query the tree gets:
 * `$l`/`$le` keep keys less than (or equal to) the bound, `$r`/`$re` keep keys
 * greater than (or equal to) it.
 */
const modelCount =
  (model: Map<number, number>, query: Extract<Op, { type: 'count' }>) => {
    let n = 0
    for (const [ key, count ] of model) {
      if (query.l !== undefined && !(key < query.l)) continue
      if (query.le !== undefined && !(key <= query.le)) continue
      if (query.r !== undefined && !(key > query.r)) continue
      if (query.re !== undefined && !(key >= query.re)) continue
      n += count
    }
    return n
  }

const check =
  (tree: RbTree.t<number, number>, model: Map<number, number>) => {
    RbTree.assert(tree)
    assert.deepEqual([ ...RbTree.each(tree) ], sortedKeys(model))
    assert.equal(RbTree.length(tree), total(model))
    assert.equal(RbTree.count(tree), total(model))
    assert.equal(RbTree.empty(tree), model.size === 0)
    for (let key = -1; key <= keys; key++) {
      // getc returns -0 for a missing key.
      assert.equal(RbTree.getc(tree, key) || 0, model.get(key) ?? 0, `count of ${key}`)
      assert.equal(RbTree.has(tree, key), model.has(key), `has ${key}`)
    }
  }

const run =
  (ops: readonly Op[]) => {
    const tree = RbTree.of(RbTree.Cmp.number, (_: number) => _)
    const model = new Map<number, number>()
    for (const op of ops) {
      switch (op.type) {
        case 'insert': {
          RbTree.insert(tree, op.key, op.n)
          model.set(op.key, (model.get(op.key) ?? 0) + op.n)
          break
        }
        case 'delete': {
          const have = model.get(op.key) ?? 0
          const [ value, remaining ] = RbTree.delete(tree, op.key, op.n)
          assert.equal(remaining, have === 0 ? 0 : have - op.n, 'remaining count')
          assert.equal(value, have !== 0 && have <= op.n ? op.key : undefined, 'removed value')
          if (have <= op.n) {
            model.delete(op.key)
          } else {
            model.set(op.key, have - op.n)
          }
          break
        }
        case 'shift': {
          const [ value, count ] = RbTree.maybeShiftCount(tree)
          const min = sortedKeys(model)[0]
          assert.equal(value, min, 'shifted value')
          assert.equal(count, min === undefined ? 0 : model.get(min), 'shifted count')
          if (min !== undefined) {
            model.delete(min)
          }
          break
        }
        case 'count': {
          const query: RbTree.Query<number> = {
            ...(op.l !== undefined ? { $l: op.l } : {}),
            ...(op.le !== undefined ? { $le: op.le } : {}),
            ...(op.r !== undefined ? { $r: op.r } : {}),
            ...(op.re !== undefined ? { $re: op.re } : {})
          }
          assert.equal(RbTree.count(tree, query), modelCount(model, op), `count ${JSON.stringify(query)}`)
          break
        }
      }
      check(tree, model)
    }
    // Drain in order, then reuse.
    while (!RbTree.empty(tree)) {
      const [ min ] = RbTree.shiftCount(tree)
      assert.equal(min, sortedKeys(model)[0])
      model.delete(min)
      check(tree, model)
    }
    RbTree.insert(tree, 1)
    check(tree, new Map([ [ 1, 1 ] ]))
  }

await test('insert, delete, shift and range counts agree with a multiset model and keep every invariant', async () => {
  await Testing.checkTrace({ seed: 0x5eed_7ee, trials: 150, length: 60, op, run, simplify })
})

await test('a Bag agrees with a multiset model', async () => {
  await Testing.checkTrace({
    seed: 0xba9,
    trials: 60,
    length: 40,
    op: (rng): Op => rng.bool(0.6) ?
      { type: 'insert', key: rng.int(8), n: rng.between(1, 3) } :
      { type: 'delete', key: rng.int(8), n: rng.between(1, 3) },
    simplify,
    run: ops => {
      const bag = Bag.of(RbTree.Cmp.number)
      const model = new Map<number, number>()
      for (const op of ops) {
        if (op.type === 'insert') {
          Bag.add(bag, op.key, op.n)
          model.set(op.key, (model.get(op.key) ?? 0) + op.n)
        } else if (op.type === 'delete') {
          const have = model.get(op.key) ?? 0
          const remaining = Bag.remove(bag, op.key, op.n)
          assert.equal(remaining || 0, have === 0 ? 0 : have - op.n)
          if (have <= op.n) {
            model.delete(op.key)
          } else {
            model.set(op.key, have - op.n)
          }
        }
        RbTree.assert(bag.tree)
        assert.equal(Bag.length(bag), total(model))
        assert.equal(Bag.empty(bag), model.size === 0)
        for (let key = 0; key < 8; key++) {
          // Bag.get returns -0 for a missing key.
          assert.equal(Bag.get(bag, key) || 0, model.get(key) ?? 0)
        }
      }
      while (!Bag.empty(bag)) {
        const [ min, count ] = Bag.shift(bag)
        assert.equal(min, sortedKeys(model)[0])
        assert.equal(count, model.get(min))
        model.delete(min)
        RbTree.assert(bag.tree)
      }
    }
  })
})

type MapOp =
  | { type: 'set', key: number, value: string }
  | { type: 'shift' }

await test('a Map agrees with a native Map model', async () => {
  await Testing.checkTrace({
    seed: 0x3a9,
    trials: 60,
    length: 40,
    op: (rng, ops): MapOp => rng.bool(0.75) ?
      { type: 'set', key: rng.int(8), value: `v${ops.length}` } :
      { type: 'shift' },
    run: ops => {
      const map = Map_.of<number, string>(RbTree.Cmp.number)
      const model = new Map<number, string>()
      for (const op of ops) {
        if (op.type === 'set') {
          Map_.set(map, op.key, op.value)
          model.set(op.key, op.value)
        } else if (model.size > 0) {
          const min = sortedKeys(model as Map<number, unknown> as Map<number, number>)[0]
          assert.equal(Map_.shift(map), model.get(min))
          model.delete(min)
        } else {
          assert.throws(() => Map_.shift(map))
        }
        RbTree.assert(map.tree)
        // Every key is stored once whatever the number of sets.
        assert.equal(RbTree.length(map.tree), model.size)
        const expected = [ ...model.entries() ].sort(([ a ], [ b ]) => a - b)
        assert.deepEqual([ ...Map_.entries(map) ], expected)
        assert.deepEqual([ ...Map_.keys(map) ], expected.map(([ key ]) => key))
        assert.deepEqual([ ...Map_.values(map) ], expected.map(([ , value ]) => value))
        for (let key = 0; key < 8; key++) {
          assert.equal(Map_.has(map, key), model.has(key))
          assert.equal(Map_.maybeGet(map, key), model.get(key))
        }
      }
    }
  })
})

await test('the invariant checkers reject corrupted trees', () => {
  const tree = RbTree.of(RbTree.Cmp.number, (_: number) => _)
  for (const key of [ 1, 2, 3, 4, 5 ]) {
    RbTree.insert(tree, key)
  }
  RbTree.assert(tree)
  const root = tree.root!
  const withSize = { ...tree, root: { ...root, s: root.s + 1 } }
  assert.throws(() => RbTree.assertSizes(withSize), /Size invariant/)
  const withCount = { ...tree, root: { ...root, n: 0 } }
  assert.throws(() => RbTree.assertSizes(withCount), /Size invariant/)
  const withDoubleBlack = { ...tree, root: { ...root, c: 3 as const } }
  assert.throws(() => RbTree.assertSettled(withDoubleBlack), /Settled invariant/)
  const withDoubleBlackLeaf = { ...tree, root: { ...root, l: null } }
  assert.throws(() => RbTree.assertSettled(withDoubleBlackLeaf), /Settled invariant/)
})
