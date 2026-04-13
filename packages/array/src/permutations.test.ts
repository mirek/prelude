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
