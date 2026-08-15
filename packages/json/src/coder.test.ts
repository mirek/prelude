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

await test('large Uint8Array values are encoded without overflowing the stack', () => {
  const bytes = new Uint8Array(200_000)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = i % 256
  }
  assert.deepEqual(Json.parse(Json.stringify(bytes)), bytes)
  assert.deepEqual(Json.parse(Json.stringify(new Uint8Array(0))), new Uint8Array(0))
})

await test('map keys keep their types while string-keyed maps keep the object encoding', () => {
  const map = new Map<unknown, unknown>([ [ 1, 'a' ], [ { x: 1 }, new Set([ 2 ]) ], [ new Date(0), 3n ] ])
  assert.deepEqual(Json.parse(Json.stringify(map)), map)
  assert.equal(Json.stringify(new Map([ [ 'k', 'v' ] ])), '{"^Map$":{"k":"v"}}')
  assert.equal(Json.stringify(new Map<unknown, string>([ [ 'k', 'v' ], [ 1, 'w' ] ])), '{"^Map$":[["k","v"],[1,"w"]]}')
  assert.deepEqual(Json.parse('{"^Map$":{"foo":"bar","n":{"^Set$":[1]}}}'), new Map<string, unknown>([ [ 'foo', 'bar' ], [ 'n', new Set([ 1 ]) ] ]))
  assert.deepEqual(Json.parse(Json.stringify(new Map([ [ 1, 'a' ] ]))), new Map([ [ 1, 'a' ] ]))
})

await test('invalid dates round-trip', () => {
  const decoded = Json.parse(Json.stringify({ d: new Date(NaN) })) as { d: Date }
  assert.ok(decoded.d instanceof Date)
  assert.ok(Number.isNaN(decoded.d.getTime()))
  assert.deepEqual(Json.parse(Json.stringify(new Date(0))), new Date(0))
})
