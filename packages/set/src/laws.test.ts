import * as Sets from './index.js'
import * as Testing from '@prelude/testing'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Algebraic laws over small random sets, compared with a naive model built
// from arrays. Every law is checked for the same three sets.

const universe = 8

type Sets3 = [ number[], number[], number[] ]

const model = {
  union: (a: number[], b: number[]) => [ ...new Set([ ...a, ...b ]) ],
  intersection: (a: number[], b: number[]) => a.filter(x => b.includes(x)),
  difference: (a: number[], b: number[]) => a.filter(x => !b.includes(x))
}

const same =
  (set: Set<number>, values: number[]) =>
    assert.deepEqual([ ...set ].sort((a, b) => a - b), [ ...new Set(values) ].sort((a, b) => a - b))

await test('union, intersection, difference, equal and disjoint agree with a list model and satisfy the set laws', async () => {
  await Testing.checkTrace<Sets3>({
    seed: 0x5e75,
    trials: 300,
    length: 1,
    op: rng => [ 0, 1, 2 ].map(() => Array.from({ length: rng.int(6) }, () => rng.int(universe))) as Sets3,
    run: cases => { for (const [ xs, ys, zs ] of cases) {
      const [ a, b, c ] = [ xs, ys, zs ].map(values => Sets.of(values))
      const empty = Sets.of<number>([])

      // Model agreement.
      same(Sets.union(a, b), model.union(xs, ys))
      same(Sets.union(a, b, c), model.union(model.union(xs, ys), zs))
      same(Sets.intersection(a, b), model.intersection(xs, ys))
      same(Sets.intersection(a, b, c), model.intersection(model.intersection(xs, ys), zs))
      same(Sets.difference(a, b), model.difference(xs, ys))
      assert.equal(Sets.equal(a, b), model.difference(xs, ys).length === 0 && model.difference(ys, xs).length === 0)
      assert.equal(Sets.disjoint(a, b), model.intersection(xs, ys).length === 0)
      assert.equal(Sets.disjoint(a, b, c), model.intersection(xs, ys).length === 0 && model.intersection(xs, zs).length === 0 && model.intersection(ys, zs).length === 0)
      assert.equal(Sets.empty(a), xs.length === 0)
      assert.deepEqual(Sets.sorted(a, (x, y) => x < y ? -1 : x > y ? 1 : 0), [ ...new Set(xs) ].sort((x, y) => x - y))
      assert.deepEqual(Sets.array(a).length, new Set(xs).size)

      // Laws.
      assert.ok(Sets.equal(Sets.union(a, b), Sets.union(b, a)), 'union commutes')
      assert.ok(Sets.equal(Sets.intersection(a, b), Sets.intersection(b, a)), 'intersection commutes')
      assert.ok(Sets.equal(Sets.union(Sets.union(a, b), c), Sets.union(a, Sets.union(b, c))), 'union associates')
      assert.ok(Sets.equal(Sets.intersection(Sets.intersection(a, b), c), Sets.intersection(a, Sets.intersection(b, c))), 'intersection associates')
      assert.ok(Sets.equal(Sets.union(a, empty), a), 'empty is the union identity')
      assert.ok(Sets.equal(Sets.intersection(a, empty), empty), 'empty annihilates intersection')
      assert.ok(Sets.equal(Sets.union(a, a), a) && Sets.equal(Sets.intersection(a, a), a), 'idempotence')
      assert.ok(Sets.equal(Sets.difference(a, a), empty), 'a \\ a is empty')
      assert.ok(Sets.equal(Sets.difference(a, empty), a), 'a \\ empty is a')
      assert.ok(Sets.equal(Sets.union(Sets.difference(a, b), Sets.intersection(a, b)), a), 'a = (a \\ b) ∪ (a ∩ b)')
      assert.ok(Sets.disjoint(Sets.difference(a, b), b), 'a \\ b is disjoint from b')
      assert.ok(Sets.equal(Sets.intersection(a, Sets.union(b, c)), Sets.union(Sets.intersection(a, b), Sets.intersection(a, c))), 'distributivity')
      assert.ok(Sets.equal(Sets.difference(a, Sets.union(b, c)), Sets.intersection(Sets.difference(a, b), Sets.difference(a, c))), 'De Morgan')
      assert.equal(Sets.equal(a, b) && Sets.equal(b, c), Sets.equal(a, b, c), 'variadic equal')
      assert.ok(Sets.equal(a, a) && Sets.equal(a, Sets.of(xs)), 'equal is reflexive')

      // Inputs are never mutated by the pure operations.
      same(a, xs)
      same(b, ys)
      same(c, zs)
      // filter mutates in place, filtered does not.
      const copy = Sets.of(xs)
      const kept = Sets.filtered(copy, x => x % 2 === 0)
      same(copy, xs)
      Sets.filter(copy, x => x % 2 === 0)
      assert.ok(Sets.equal(copy, kept))
      same(copy, xs.filter(x => x % 2 === 0))
    } }
  })
})

await test('range and range1 agree with an explicit loop for random integer bounds and steps', async () => {
  await Testing.checkTrace<[ number, number, number ]>({
    seed: 0xa46e,
    trials: 300,
    length: 1,
    op: rng => [ rng.between(-20, 20), rng.between(-20, 20), rng.between(1, 5) ],
    run: cases => { for (const [ a, b, step ] of cases) {
      const min = Math.min(a, b)
      const max = Math.max(a, b)
      const halfOpen: number[] = []
      for (let value = min; value < max; value += step) halfOpen.push(value)
      const closed: number[] = []
      for (let value = min; value <= max; value += step) closed.push(value)
      same(Sets.range(a, b, step), halfOpen)
      same(Sets.range1(a, b, step), closed)
      // Argument order does not matter, and the sizes match the arithmetic.
      assert.ok(Sets.equal(Sets.range(a, b, step), Sets.range(b, a, step)))
      assert.equal(Sets.range(a, b, step).size, Math.ceil((max - min) / step))
      assert.equal(Sets.range1(a, b, step).size, Math.floor((max - min) / step) + 1)
    } }
  })
})
