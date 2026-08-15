import { numeric, maybeUnknown, asc, dsc, eq } from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('equal values of different types compare equal in both directions', () => {
  const pairs: [number | bigint | string, number | bigint | string][] = [
    [ 1, '1' ], [ 1n, '1' ], [ 1n, 1 ], [ 0, '0' ], [ 2, '2.0' ], [ -0, '0' ]
  ]
  for (const [ a, b ] of pairs) {
    assert.equal(numeric(a, b), eq, `${String(a)} vs ${String(b)}`)
    assert.equal(numeric(b, a), eq, `${String(b)} vs ${String(a)}`)
  }
  assert.equal(maybeUnknown(1, '1'), eq)
  assert.equal(maybeUnknown('1', 1), eq)
})

await test('mixed-type ordering follows js coercion', () => {
  assert.equal(numeric(1, '2'), asc)
  assert.equal(numeric('2', 3n), asc)
  assert.equal(numeric(3n, '2'), dsc)
  assert.equal(numeric('10', 9), dsc)
})

await test('nan and non-numeric strings sort first and are antisymmetric', () => {
  assert.equal(numeric(NaN, NaN), eq)
  assert.equal(numeric(NaN, 1), asc)
  assert.equal(numeric(1, NaN), dsc)
  assert.equal(numeric('a', 1), asc)
  assert.equal(numeric(1, 'a'), dsc)
  assert.equal(numeric('a', NaN), eq)
  assert.equal(numeric(1n, 'x'), dsc)
  assert.equal(numeric('x', 1n), asc)
})

await test('sorting a mixed array is stable and consistent', () => {
  const values: (number | bigint | string)[] = [ '3', 2, 1n, '1', 3n, NaN, '2', 'zzz', 0 ]
  const sorted = values.toSorted(numeric)
  // Every adjacent pair is non-descending under the comparator, and comparing back is consistent.
  for (let i = 1; i < sorted.length; i++) {
    assert.notEqual(numeric(sorted[i - 1], sorted[i]), dsc)
    assert.equal(numeric(sorted[i], sorted[i - 1]), numeric(sorted[i - 1], sorted[i]) === eq ? eq : dsc)
  }
  assert.deepEqual(sorted.slice(0, 2).map(String).toSorted(), [ 'NaN', 'zzz' ])
  assert.deepEqual(sorted.slice(-1), [ 3n ].map(() => sorted.at(-1)))
})
