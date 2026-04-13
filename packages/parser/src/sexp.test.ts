import * as Sexp from './sexp.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('basic', () => {
  assert.deepEqual(Sexp.parser('\n\t(foo  bar baz) '), [ 'foo', 'bar', 'baz' ])
})
