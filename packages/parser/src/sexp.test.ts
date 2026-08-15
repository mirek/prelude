import * as Sexp from './sexp.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('basic', () => {
  assert.deepEqual(Sexp.parser('\n\t(foo  bar baz) '), [ 'foo', 'bar', 'baz' ])
})

await test('nested lists may be followed by further elements', () => {
  assert.deepEqual(Sexp.parser('(a (b c) d)'), [ 'a', [ 'b', 'c' ], 'd' ])
  assert.deepEqual(Sexp.parser('(a (b c))'), [ 'a', [ 'b', 'c' ] ])
  assert.deepEqual(Sexp.parser('((a) (b) c)'), [ [ 'a' ], [ 'b' ], 'c' ])
  assert.deepEqual(Sexp.parser('( a ( b ) "c d" )'), [ 'a', [ 'b' ], 'c d' ])
  assert.deepEqual(Sexp.parser('()'), [])
})
