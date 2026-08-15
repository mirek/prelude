import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const p =
  (value: string) =>
    Array
      .from(A.permutations(value.split('')))
      .map(_ => _.join(''))

await test('permutations', () => {
  assert.deepEqual(p(''), [
    ''
  ])
  assert.deepEqual(p('a'), [
    'a'
  ])
  assert.deepEqual(p('ab'), [
    'ab',
    'ba'
  ])
  assert.deepEqual(p('abc'), [
    'abc',
    'bac',
    'cab',
    'acb',
    'bca',
    'cba'
  ])
  assert.deepEqual(p('abcd'), [
    'abcd',
    'bacd',
    'cabd',
    'acbd',
    'bcad',
    'cbad',
    'dbac',
    'bdac',
    'adbc',
    'dabc',
    'badc',
    'abdc',
    'acdb',
    'cadb',
    'dacb',
    'adcb',
    'cdab',
    'dcab',
    'dcba',
    'cdba',
    'bdca',
    'dbca',
    'cbda',
    'bcda'
  ])
})

await test('does not modify the input array', () => {
  const values = [ 1, 2, 3 ]
  const all = Array.from(A.permutations(values))
  assert.deepEqual(values, [ 1, 2, 3 ])
  assert.equal(all.length, 6)
  assert.deepEqual(all.map(p => p.join('')).toSorted(), [ '123', '132', '213', '231', '312', '321' ])
})
