import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('single', () => {
  assert.deepEqual(P.parser(P.lit('a'))('a'), 'a')
  const p = P.parser(P.either('a', 'b'))
  assert.deepEqual(p('a'), 'a')
  assert.deepEqual(p('b'), 'b')
  assert.throws(() => p('c'), /Expected b\./)
})

await test('longest', () => {
  assert.deepEqual(P.parser(P.star(P.lit(
    'a',
    'aa'
  )))('aaaaa'), [
    'aa',
    'aa',
    'a'
  ])
})
