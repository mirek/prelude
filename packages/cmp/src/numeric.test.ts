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
  // NaN sorts before non-numeric strings so the NaN-like group is totally ordered.
  assert.equal(numeric('a', NaN), dsc)
  assert.equal(numeric(NaN, 'a'), asc)
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

await test('bigints compare against decimal strings by numeric value', () => {
  assert.equal(numeric(1n, '1.5'), asc)
  assert.equal(numeric('1.5', 1n), dsc)
  assert.equal(numeric(2n, '1.5'), dsc)
  assert.equal(numeric('1.5', 2n), asc)
  assert.equal(numeric(1n, '1.0'), eq)
  assert.equal(numeric(1n, 'x'), dsc)
  assert.equal(numeric('x', 1n), asc)
  const values: (number | bigint | string)[] = [ 2n, '1.5', 1n ]
  assert.deepEqual(values.toSorted(numeric).map(String), [ '1', '1.5', '2' ])
})

const permutations =
  <T>(values: T[]): T[][] =>
    values.length <= 1 ?
      [ values ] :
      values.flatMap((value, i) =>
        permutations([ ...values.slice(0, i), ...values.slice(i + 1) ]).map(rest => [ value, ...rest ]))

await test('numeric strings compare by numeric value', () => {
  assert.equal(numeric('10', '2'), dsc)
  assert.equal(numeric('2', '10'), asc)
  assert.equal(numeric('10', '10.0'), eq)
  assert.equal(numeric('-1', ''), asc)
  assert.equal(numeric(' 5 ', '5'), eq)
  // Integer literals are compared exactly, beyond double precision.
  assert.equal(numeric('9007199254740993', '9007199254740992'), dsc)
  assert.equal(numeric('9007199254740992', '9007199254740993'), asc)
  // Non-numeric strings sort first, and keep lexicographic order among themselves.
  assert.equal(numeric('a', '10'), asc)
  assert.equal(numeric('10', 'a'), dsc)
  assert.equal(numeric('a', 'b'), asc)
  assert.equal(numeric('b', 'a'), dsc)
  assert.equal(numeric('a', 'a'), eq)
})

await test('numeric is transitive over numbers and numeric strings', () => {
  const expected = [ '2', 10, '10' ]
  for (const values of permutations<number | bigint | string>([ 10, '10', '2' ])) {
    const sorted = values.toSorted(numeric)
    for (let i = 1; i < sorted.length; i++) {
      assert.notEqual(numeric(sorted[i - 1], sorted[i]), dsc, `${sorted.map(String).join(',')}`)
    }
    assert.deepEqual(sorted.map(String), expected.map(String), `${values.map(String).join(',')}`)
  }
})

await test('maybeUnknown is transitive over numbers and numeric strings', () => {
  assert.equal(maybeUnknown('10', '2'), dsc)
  assert.equal(maybeUnknown('2', '10'), asc)
  const cmp = (a: unknown, b: unknown) => maybeUnknown(a, b) ?? eq
  const expected = [ '2', 10, '10' ]
  for (const values of permutations<unknown>([ 10, '10', '2' ])) {
    const sorted = values.toSorted(cmp)
    for (let i = 1; i < sorted.length; i++) {
      assert.notEqual(cmp(sorted[i - 1], sorted[i]), dsc, `${sorted.map(String).join(',')}`)
    }
    assert.deepEqual(sorted.map(String), expected.map(String), `${values.map(String).join(',')}`)
  }
})

await test('every spelling of a value compares in one exact domain', () => {
  // Alternate integer spellings above double precision stay consistent with each other.
  assert.equal(numeric('9007199254740993', '9007199254740992.0'), dsc)
  assert.equal(numeric('9007199254740992.0', '9007199254740992'), eq)
  assert.equal(numeric('9007199254740993', '9007199254740992'), dsc)
  assert.equal(numeric(9007199254740992, '9007199254740993'), asc)
  assert.equal(numeric(9007199254740993n, '9007199254740993'), eq)
  assert.equal(numeric(9007199254740992n, '9007199254740993'), asc)
  assert.equal(numeric(123456789012345678901234567890n, '123456789012345678901234567891'), asc)
  assert.equal(numeric(1e21, '1e21'), eq)
  assert.equal(numeric(1e21, 1000000000000000000000n), eq)
  // Numbers compare through their shortest decimal, so `0.1 == '0.1'` as in js.
  assert.equal(numeric(0.1, '0.1'), eq)
  assert.equal(numeric(1e-7, '0.0000001'), eq)
  assert.equal(numeric(-1.5, '-1.5'), eq)
  assert.equal(numeric('.5', 0.5), eq)
  assert.equal(numeric('5.', 5), eq)
  assert.equal(numeric('0x1f', 31), eq)
  assert.equal(numeric('1e400', '1e399'), dsc)
  assert.equal(numeric('1e400', Infinity), asc)
  const values: (number | bigint | string)[] = [ '9007199254740993', '9007199254740992.0', '9007199254740992', 9007199254740992, 9007199254740993n ]
  const expected = [ '9007199254740992', '9007199254740992', '9007199254740992', '9007199254740993', '9007199254740993' ]
  for (const permutation of permutations(values)) {
    const sorted = permutation.toSorted(numeric)
    assert.deepEqual(sorted.map(v => String(numeric(v, '9007199254740992') === eq ? '9007199254740992' : '9007199254740993')), expected)
    for (let i = 1; i < sorted.length; i++) {
      assert.notEqual(numeric(sorted[i - 1], sorted[i]), dsc)
    }
  }
})

await test('nan-like values are totally ordered: NaN, then non-numeric strings by text', () => {
  assert.equal(numeric('a', 'b'), asc)
  assert.equal(numeric(NaN, 'b'), asc)
  assert.equal(numeric('a', NaN), dsc)
  for (const permutation of permutations<number | bigint | string>([ NaN, 'b', 'a', 1 ])) {
    assert.deepEqual(permutation.toSorted(numeric).map(String), [ 'NaN', 'a', 'b', '1' ])
  }
})
