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

await test('built-in error subclasses round-trip through the global coder', () => {
  for (const Ctor of [ EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError ]) {
    const decoded = Json.parse(Json.stringify(new Ctor('boom'))) as Error
    assert.ok(decoded instanceof Ctor, `${Ctor.name} instance`)
    assert.equal(decoded.message, 'boom')
    assert.equal(decoded.name, Ctor.name)
  }
  const aggregate = Json.parse(Json.stringify(new AggregateError([ new TypeError('inner') ], 'agg'))) as AggregateError
  assert.ok(aggregate instanceof AggregateError)
  assert.equal(aggregate.message, 'agg')
  assert.ok(aggregate.errors[0] instanceof TypeError)
  assert.equal((aggregate.errors[0] as Error).message, 'inner')
})

await test('error cause is encoded and decoded recursively', () => {
  const decoded = Json.parse(Json.stringify(new Error('outer', { cause: new RangeError('inner') }))) as Error
  assert.ok(decoded.cause instanceof RangeError)
  assert.equal((decoded.cause as Error).message, 'inner')
  const withBigint = Json.parse(Json.stringify(new Error('a', { cause: 1n }))) as Error
  assert.equal(withBigint.cause, 1n)
  const withMap = Json.parse(Json.stringify(new Error('a', { cause: new Map([ [ 'k', new Date(0) ] ]) }))) as Error
  assert.deepEqual(withMap.cause, new Map([ [ 'k', new Date(0) ] ]))
  const withoutCause = Json.parse(Json.stringify(new Error('plain'))) as Error
  assert.equal('cause' in withoutCause, false)
})
