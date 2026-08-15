import * as Json from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const custom = Json.of({
  ...Json.global,
  legacyDecoder: true
})
Json.register(custom, Json.Codecs.Undefined)
Json.register(custom, Json.Codecs.Number)

const t =
  (value: unknown) =>
    assert.deepEqual(custom.parse(custom.stringify(value)), value)

await test('basic', () => {
  t(1)
  t('foo')
  t(true)
  t(false)
  t(null)
  t([])
  t({})
  t([ 1, 'foo', true, false, null, [], {} ])
})

await test('non json serializable', () => {
  t(new Date())
  t(new Error('foo'))
  t(/foo/)
  t(new Set([ 1, 2, 3 ]))
  t(new Map([ [ 'foo', 'bar' ], [ 'baz', 'qux' ] ]))
  t(new Set([ new Map([ [ 'foo', 'bar' ], [ 'baz', 'qux' ] ]) ]))
  t(new Map([ [ 'foo', new Set([ 1, 2, 3 ]) ] ]))
  t(new Uint8Array([ 1, 2, 3 ]))
  t([ undefined, null, NaN, Infinity, -Infinity, -0, 0 ])
})

await test('bigint round-trips through the global coder', () => {
  assert.equal(Json.parse(Json.stringify(1n)), 1n)
  assert.deepEqual(Json.parse(Json.stringify({ a: 123456789012345678901234567890n })), { a: 123456789012345678901234567890n })
  assert.deepEqual(Json.parse(Json.stringify([ -1n, 0n ])), [ -1n, 0n ])
})
