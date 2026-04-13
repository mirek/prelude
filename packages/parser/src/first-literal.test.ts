import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('firstLiteral', () => {
  assert.deepEqual(P.parser(P.star(P.firstLiteral(
    'a',
    'aa'
  )))('aaaaa'), [
    'a',
    'a',
    'a',
    'a',
    'a'
  ])
})
