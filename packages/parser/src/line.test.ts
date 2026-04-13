import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('line', () => {
  const parser = P.parser(P.star(P.line))
  assert.deepEqual(parser('hello\nworld\n'), [
    'hello',
    'world'
  ])
  assert.deepEqual(parser('hello\r\nworld\n'), [
    'hello',
    'world'
  ])
})
