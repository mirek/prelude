import * as Rfc4180 from './rfc4180.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('basic', () => {
  assert.deepEqual(Rfc4180.parse(`foo,bar,baz
1,2,"three"
`), [
    [ 'foo', 'bar', 'baz' ],
    [ '1', '2', 'three' ],
    [ '' ]
  ])
})

await test('quoted', () => {
  assert.deepEqual(Rfc4180.parse('"a""b\nc"'), [ [ 'a"b\nc' ] ])
})

await test('leading spaces are part of the first field', () => {
  assert.deepEqual(Rfc4180.parse(' a,b'), [ [ ' a', 'b' ] ])
  assert.deepEqual(Rfc4180.parse('a,b '), [ [ 'a', 'b ' ] ])
  assert.deepEqual(Rfc4180.parse('  x'), [ [ '  x' ] ])
})

await test('leading UTF-8 BOM is skipped', () => {
  assert.deepEqual(Rfc4180.parse('\ufeffa,b'), [ [ 'a', 'b' ] ])
  assert.deepEqual(Rfc4180.parse('\ufeff a,b'), [ [ ' a', 'b' ] ])
  assert.deepEqual(Rfc4180.parse('\ufeff"a",b\n1,2'), [ [ 'a', 'b' ], [ '1', '2' ] ])
})
