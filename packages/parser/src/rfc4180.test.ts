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
