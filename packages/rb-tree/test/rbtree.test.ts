import * as RbTree from '../src/rb-tree.js'
import * as Arrays from '@prelude/array'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

const slow = process.env.SLOW_TESTS ? describe : describe.skip
const slowTest = process.env.SLOW_TESTS ? test : test.skip

await test('basic values', () => {
  const tree = RbTree.of(RbTree.Cmp.string, (_: string) => _)
  RbTree.insert(tree, 'foo')
  RbTree.insert(tree, 'bar')
  RbTree.insert(tree, 'baz')
  RbTree.assert(tree)
  assert.equal(RbTree.has(tree, 'foo'), true)
  assert.equal(RbTree.has(tree, 'bar'), true)
  assert.equal(RbTree.has(tree, 'baz'), true)
  assert.equal(RbTree.has(tree, 'bak'), false)
  RbTree.delete(tree, 'foo')
  RbTree.assert(tree)
  assert.equal(RbTree.has(tree, 'foo'), false)
  assert.equal(RbTree.has(tree, 'bar'), true)
  assert.equal(RbTree.has(tree, 'baz'), true)
})

await test('complex elements', () => {
  type E = { key: string, value: unknown }
  const tree = RbTree.of(RbTree.Cmp.string, (_: E) => _.key)
  RbTree.insert(tree, { key: 'foo', value: 'FOO' })
  assert.equal(RbTree.has(tree, 'foo'), true)
  assert.equal(RbTree.has(tree, 'bar'), false)
  RbTree.assert(tree)
})

await test('random numbers', () => {
  const rb = RbTree.of(RbTree.Cmp.number, (_: number) => _)
  for (let i = 0; i < 100; i++) {
    RbTree.insert(rb, Math.random())
  }
  let last = 0
  for (const _ of RbTree.each(rb)) {
    assert.ok((_) >= (last))
    last = _
  }
})

await slowTest('permutations', () => {
  const n = 9
  for (const values of Arrays.permutations(Arrays.indices(n))) {
    const rb = RbTree.of(RbTree.Cmp.number, (_: number) => _)
    for (const value of values) {
      RbTree.insert(rb, value)
    }
    RbTree.assert(rb)
    assert.equal(RbTree.count(rb), n)
  }
})

await slow('pop', async () => {

  const n = 1_000
  const rb = RbTree.of(RbTree.Cmp.number, (_: number) => _)
  const xs: number[] = []

  await test(`insert ${n}`, () => {
    for (let i = 0; i < n; i++) {
      RbTree.insert(rb, Math.random())
      RbTree.assert(rb)
      if (rb.root?.s !== i + 1) {
        throw new Error(`${rb.root?.s} != ${i + 1}`)
      }
    }
  })

  await test('pop all', () => {
    while (true) {
      const [ _ ] = RbTree.maybeShiftCount(rb)
      RbTree.assert(rb)
      if (_ === undefined) {
        break
      }
      xs.push(_)
    }
    assert.equal(xs.length, n)
  })

  await test('assert non descending', () => {
    for (let i = 1; i < xs.length; i++) {
      if (xs[i] <= xs[i - 1]) {
        throw new Error(`${xs[i]} <= ${xs[i - 1]}`)
      }
    }
  })
})

await slow('deletes', async () => {
  const n = 1_000
  const rb = RbTree.of(RbTree.Cmp.number, (_: number) => _)
  const xs: number[] = []

  await test(`insert ${n}`, () => {
    for (let i = 0; i < n; i++) {
      const value = Math.random()
      xs.push(value)
      RbTree.insert(rb, value)
      RbTree.assert(rb)
    }
  })

  await test('deletions', () => {
    assert.equal(RbTree.count(rb), n)
    for (let i = 0; i < n; i++) {
      const value = Arrays.deleteSwapRandom(xs)
      assert.equal(RbTree.has(rb, value), true)
      RbTree.delete(rb, value)
      RbTree.assert(rb)
      assert.equal(RbTree.has(rb, value), false)
      assert.equal(RbTree.count(rb), n - (i + 1))
    }
    assert.equal(RbTree.count(rb), 0)
  })

})

await slow('range count', async () => {

  const n = 10_000
  const rb = RbTree.of(RbTree.Cmp.number, (_: number) => _)
  const xs = Arrays.of(n, _ => _ + 1)

  await test('insert', () => {
    for (const x of xs) {
      RbTree.insert(rb, x)
    }
    RbTree.assert(rb)
    assert.deepEqual(Array.from(RbTree.each(rb)), Arrays.of(n, _ => _ + 1))
  })

  await test('range', () => {
    assert.equal(RbTree.count(rb, { $l: 2.9 }), 2)
    assert.equal(RbTree.count(rb, { $le: 3.1 }), 3)
    assert.equal(RbTree.count(rb, { $l: 3.1 }), 3)
    assert.equal(RbTree.count(rb, { $le: 0 }), 0)
    assert.equal(RbTree.count(rb, { $l: 0 }), 0)
    assert.equal(RbTree.count(rb, { $le: n + 1 }), n)
    assert.equal(RbTree.count(rb, { $l: n + 1 }), n)
    assert.equal(RbTree.count(rb, { $r: 0 }), n)
    assert.equal(RbTree.count(rb, { $r: 1 }), n - 1)
    assert.equal(RbTree.count(rb, { $re: 1 }), n)
    assert.equal(RbTree.count(rb, { $r: 1.5 }), n - 1)
    assert.equal(RbTree.count(rb, { $re: 1.5 }), n - 1)
    assert.equal(RbTree.count(rb, { $r: 3.5, $l: 7.1 }), 4)
    for (let i = 1; i < n; i++) {
      assert.equal(RbTree.count(rb, { $l: i }), i - 1)
      assert.equal(RbTree.count(rb, { $le: i }), i)
      assert.equal(RbTree.count(rb, { $r: i }), n - i)
      assert.equal(RbTree.count(rb, { $re: i }), n - (i - 1))
    }
  })

})
