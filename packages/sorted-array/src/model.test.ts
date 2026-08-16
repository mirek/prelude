import * as A from './index.js'
import * as Testing from '@prelude/testing'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Model: a plain array kept sorted by a stable sort on the key. Values carry a
// tag so that duplicates (same key, different value) are distinguishable and
// the merge behaviour of upsert is observable.

type Value = { key: number, tag: number }

type Op =
  | { type: 'insert', key: number }
  | { type: 'insertIgnore', key: number }
  | { type: 'upsert', key: number }
  | { type: 'upsertBadMerge', key: number }

const keys = 10

const op =
  (rng: Testing.Prng): Op => {
    const key = rng.int(keys)
    const roll = rng.float()
    if (roll < 0.4) return { type: 'insert', key }
    if (roll < 0.7) return { type: 'insertIgnore', key }
    if (roll < 0.95) return { type: 'upsert', key }
    return { type: 'upsertBadMerge', key }
  }

const simplify =
  (op: Op): Op[] =>
    op.key > 0 ? [ { ...op, key: op.key - 1 } ] : []

/** Every invariant `values` must satisfy, checked independently of bsearch. */
const assertSorted =
  (self: A.SortedArray<Value, number>) => {
    for (let i = 1; i < self.values.length; i++) {
      assert.ok(self.cmp(self.keyOfValue(self.values[i - 1]), self.keyOfValue(self.values[i])) !== A.Cmp.dsc, `values out of order at ${i}`)
    }
  }

const linearIndex =
  (model: Value[], key: number) =>
    model.findIndex(value => value.key === key)

const linearInsertionPoint =
  (model: Value[], key: number) => {
    const i = model.findIndex(value => value.key > key)
    return i === -1 ? model.length : i
  }

const run =
  (ops: readonly Op[]) => {
    const self = A.of<Value, number>({ cmp: A.Cmp.number, keyOfValue: value => value.key })
    const model: Value[] = []
    let tag = 0
    for (const op of ops) {
      const value = { key: op.key, tag: tag++ }
      const found = linearIndex(model, op.key)
      switch (op.type) {
        case 'insert': {
          const result = A.insert(self, value)
          // Duplicates are allowed; the return value is bsearch's: an index when the key existed, else the encoded insertion point.
          if (found === -1) {
            assert.equal(result, -(linearInsertionPoint(model, op.key) + 1))
            model.splice(linearInsertionPoint(model, op.key), 0, value)
          } else {
            assert.ok(result >= 0 && model[result].key === op.key)
            model.splice(result, 0, value)
          }
          break
        }
        case 'insertIgnore': {
          const result = A.insertIgnore(self, value)
          if (found === -1) {
            assert.equal(result, -(linearInsertionPoint(model, op.key) + 1))
            model.splice(linearInsertionPoint(model, op.key), 0, value)
          } else {
            assert.ok(result >= 0 && model[result].key === op.key)
          }
          break
        }
        case 'upsert': {
          const merged: Value[] = []
          const result = A.upsert(self, value, (a, b) => { merged.push(a, b); return { key: a.key, tag: a.tag + b.tag } })
          if (found === -1) {
            assert.equal(result, -(linearInsertionPoint(model, op.key) + 1))
            assert.deepEqual(merged, [])
            model.splice(linearInsertionPoint(model, op.key), 0, value)
          } else {
            assert.ok(result >= 0 && model[result].key === op.key)
            assert.deepEqual(merged, [ model[result], value ])
            model[result] = { key: op.key, tag: model[result].tag + value.tag }
          }
          break
        }
        case 'upsertBadMerge': {
          // A merge that changes the key is rejected and leaves the array untouched.
          const before = self.values.slice()
          if (found === -1) {
            A.upsert(self, value, a => a)
            model.splice(linearInsertionPoint(model, op.key), 0, value)
          } else {
            assert.throws(() => A.upsert(self, value, a => ({ ...a, key: a.key + 1 })), /Key modification on merge/)
            assert.deepEqual(self.values, before)
          }
          break
        }
      }
      assertSorted(self)
      assert.deepEqual(self.values, model)
      for (let key = -1; key <= keys; key++) {
        const expected = linearIndex(model, key)
        assert.equal(A.hasKey(self, key), expected !== -1, `hasKey ${key}`)
        assert.equal(A.hasValue(self, { key, tag: -1 }), expected !== -1, `hasValue ${key}`)
        assert.equal(A.has(self, k => A.Cmp.number(k, key)), expected !== -1, `has ${key}`)
        const index = A.findIndex(self, k => A.Cmp.number(k, key))
        const bsearch = A.bsearch(self, k => A.Cmp.number(k, key))
        if (expected === -1) {
          assert.equal(index, -1, `findIndex ${key}`)
          assert.equal(bsearch, -(linearInsertionPoint(model, key) + 1), `bsearch ${key}`)
          assert.equal(A.find(self, k => A.Cmp.number(k, key)), undefined, `find ${key}`)
        } else {
          // With duplicates any matching index is a correct answer.
          assert.equal(model[index]?.key, key, `findIndex ${key}`)
          assert.equal(bsearch, index, `bsearch ${key}`)
          assert.equal(A.find(self, k => A.Cmp.number(k, key))?.key, key, `find ${key}`)
        }
      }
    }
  }

await test('insert, insertIgnore, upsert and every search agree with a sorted array model', async () => {
  await Testing.checkTrace({ seed: 0x50a7, trials: 150, length: 40, op, run, simplify })
})

await test('numbers and strings helpers stay sorted under random insertion in both directions', async () => {
  await Testing.checkTrace<number>({
    seed: 0x1234,
    trials: 50,
    length: 100,
    op: rng => rng.between(-50, 50),
    run: ops => {
      const asc = A.numbers()
      const dsc = A.numbers(false)
      const strings = A.strings()
      for (const value of ops) {
        A.insert(asc, value)
        A.insert(dsc, value)
        A.insert(strings, String(value))
      }
      const sorted = ops.slice().sort((a, b) => a - b)
      assert.deepEqual(asc.values, sorted)
      assert.deepEqual(dsc.values, sorted.slice().reverse())
      assert.deepEqual(strings.values, ops.map(String).sort())
    }
  })
})
